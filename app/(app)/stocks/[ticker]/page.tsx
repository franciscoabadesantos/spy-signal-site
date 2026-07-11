import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import WatchlistButton from '@/components/WatchlistButton'
import StockOverviewClient from '@/components/stocks/StockOverviewClient'
import { getViewerUserId } from '@/lib/auth'
import {
  backendErrorDetails,
  runWithBackendRequestLogContext,
  type BackendRequestLogContext,
} from '@/lib/backend-request-log'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import { currencyForTicker, formatCompactMoney, formatMoney } from '@/lib/currency'
import {
  getOhlcData,
  getStockQuote,
} from '@/lib/finance'
import { getTickerRelationships, type TickerRelationships } from '@/lib/relationships'
import { getCachedLatestScreenerRow, getCachedSignalHistoryForTicker } from '@/lib/signals'
import {
  getTickerPageSummary,
  type LatestFundamentalsRow,
} from '@/lib/ticker-data'
import { getTickerScorecard } from '@/lib/scorecard'
import { buildUnavailableScorecard } from '@/lib/scorecard-types'
import { isTickerInWatchlist } from '@/lib/watchlist'

export const dynamic = 'force-dynamic'

function singleSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

function sanitizeAiQuestion(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 240) : null
}

function sanitizeScreenerSignal(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.slice(0, 48)
}

function sanitizeModelName(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.slice(0, 72)
}

function stockEntrySourceFromContext(
  value: string | null
): 'homepage_sample' | 'models_hub' | 'stock_page' | 'screener' | 'compare' | 'direct' {
  if (value === 'screener') return 'screener'
  if (value === 'model' || value === 'stock_page') return 'stock_page'
  if (value === 'homepage_sample') return 'homepage_sample'
  if (value === 'models_hub') return 'models_hub'
  if (value === 'compare') return 'compare'
  if (value === 'direct') return 'direct'
  return 'direct'
}

function parseCompactCurrencyNumber(value: string | null): number | null {
  if (!value) return null
  const normalized = value
    .replace(/[$€£₹¥]/g, '')
    .replace(/\b(?:USD|EUR|GBP|GBp|GBX|AUD|HKD|INR|JPY|DKK|SEK|NOK|kr)\b/gi, '')
    .replace(/,/g, '')
    .trim()
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)([KMBT])?$/i)
  if (!match) return null

  const numeric = Number(match[1])
  if (!Number.isFinite(numeric)) return null

  const suffix = match[2]?.toUpperCase()
  if (suffix === 'T') return numeric * 1_000_000_000_000
  if (suffix === 'B') return numeric * 1_000_000_000
  if (suffix === 'M') return numeric * 1_000_000
  if (suffix === 'K') return numeric * 1_000
  return numeric
}

function findLatestFundamentalValue(
  rows: LatestFundamentalsRow[],
  matcher: (metric: string) => boolean
): string | null {
  const row = rows.find((item) => matcher(`${item.metric.toLowerCase()} ${item.metricLabel.toLowerCase()}`))
  if (!row) return null
  return row.valueDisplay ?? (row.valueNumber !== null ? row.valueNumber.toLocaleString() : null)
}

function looksLikeEtfAsset({
  ticker,
  displayName,
  latestFundamentals,
}: {
  ticker: string
  displayName: string
  latestFundamentals: LatestFundamentalsRow[]
}): boolean {
  const etfTickers = new Set(['SPY', 'QQQ', 'DIA', 'IWM', 'VOO', 'IVV', 'VTI', 'XLK', 'XLF', 'XLE'])
  if (etfTickers.has(ticker)) return true

  if (
    /\b(etf|trust|fund|portfolio|index|spdr|ishares|vanguard|invesco|proshares|direxion|ark)\b/i.test(
      displayName
    )
  ) {
    return true
  }

  return latestFundamentals.some((row) =>
    /(expense|holdings|assets|inception|turnover|distribution|fund family|portfolio p\/e)/i.test(
      `${row.metricLabel} ${row.metric}`
    )
  )
}

function normalizeFundDetailLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function dedupeFundRows(rows: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = normalizeFundDetailLabel(row.label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return row.value !== '—'
  })
}

function emptyRelationships(ticker: string, window: number): TickerRelationships {
  return {
    asOf: null,
    ticker,
    window,
    node: null,
    nodes: [],
    marketCoMovers: [],
    residualCoMovers: [],
    leadLag: {
      followers: [],
      leaders: [],
    },
    probableSpurious: [],
    themePeers: [],
  }
}

function detectNavigationMode(requestHeaders: Headers): string {
  if (requestHeaders.get('next-router-prefetch')) return 'soft-prefetch'
  if (requestHeaders.get('rsc') === '1' || requestHeaders.has('next-router-state-tree')) {
    return 'soft-navigation'
  }
  if ((requestHeaders.get('accept') || '').includes('text/html')) return 'full-request'
  return 'unknown'
}

function logStockPageEvent(
  level: 'info' | 'error',
  message: string,
  context: BackendRequestLogContext,
  details: Record<string, unknown> = {}
): void {
  const payload = {
    ticker: context.ticker,
    requestId: context.requestId,
    navigationMode: context.navigationMode,
    ...details,
  }
  if (level === 'error') {
    console.error(`[stock-page] ${message}`, payload)
    return
  }
  console.info(`[stock-page] ${message}`, payload)
}

async function loadOptionalStockDataset<T>(
  context: BackendRequestLogContext,
  endpoint: string,
  fallback: T,
  loader: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now()
  try {
    return await loader()
  } catch (error) {
    const details = backendErrorDetails(error)
    logStockPageEvent('error', 'optional dataset unavailable', context, {
      endpoint,
      durationMs: Date.now() - startedAt,
      error: details.message,
      aborted: details.aborted,
      timeout: details.timeout,
    })
    return fallback
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker).catch(() => null)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Markets Signal, Research & Overview - Longbrunch`,
    description: `Real-time price, algorithmic trading signals, and predictive data for ${name} (${ticker}). View conviction scores, performance, and key statistics.`,
  }
}

export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{
    aiQuestion?: string | string[]
    aiPromptLabel?: string | string[]
    from?: string | string[]
    screenerSignal?: string | string[]
    modelName?: string | string[]
  }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const ticker = resolvedParams.ticker.toUpperCase()
  const requestHeaders = await headers()
  const requestLogContext: BackendRequestLogContext = {
    ticker,
    requestId: crypto.randomUUID(),
    navigationMode: detectNavigationMode(requestHeaders),
  }
  logStockPageEvent('info', 'render start', requestLogContext)

  const currency = currencyForTicker(ticker)
  const initialAiQuestion = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiQuestion))
  const initialAiPromptLabel = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiPromptLabel))
  const sourceContext = singleSearchParam(resolvedSearchParams.from)
  const screenerSignal = sanitizeScreenerSignal(singleSearchParam(resolvedSearchParams.screenerSignal))
  const modelName = sanitizeModelName(singleSearchParam(resolvedSearchParams.modelName))
  const stockEntrySource = stockEntrySourceFromContext(sourceContext)
  const modelTag = sourceContext === 'model' && modelName ? `From Model: ${modelName}` : null
  const screenerTag =
    sourceContext === 'screener' && screenerSignal ? `From Signals: ${screenerSignal}` : null

  const viewerAccess = await getViewerAccess()
  const viewerUserId = viewerAccess.userId ?? (await getViewerUserId())
  const aiAnalystEnabled = Boolean(process.env.PERPLEXITY_API_KEY?.trim())
  const upgradeHref = viewerAccess.isSignedIn
    ? getStripeUpgradeUrl(viewerAccess.userId)
    : '/sign-up?redirect_url=/stocks/' + ticker

  let tickerSummary: Awaited<ReturnType<typeof getTickerPageSummary>>

  try {
    tickerSummary = await runWithBackendRequestLogContext(requestLogContext, () => getTickerPageSummary(ticker))
  } catch (error) {
    const details = backendErrorDetails(error)
    logStockPageEvent('error', 'required summary unavailable', requestLogContext, {
      endpoint: `/tickers/${ticker}/summary`,
      error: details.message,
      aborted: details.aborted,
      timeout: details.timeout,
    })
    return (
      <EmptyState
        title="Ticker data is temporarily unavailable"
        description="The frontend could not load the canonical summary from finance-backend for this ticker."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  const [ohlcData, recentSignals, latestScreenerRows, scorecard] = await runWithBackendRequestLogContext(
    requestLogContext,
    () =>
      Promise.all([
        loadOptionalStockDataset(
          requestLogContext,
          `/tickers/${ticker}/ohlc`,
          [],
          () => getOhlcData(ticker, 3650)
        ),
        loadOptionalStockDataset(
          requestLogContext,
          `/signals/history/${ticker}`,
          [],
          () => getCachedSignalHistoryForTicker(ticker, 180)
        ),
        loadOptionalStockDataset(
          requestLogContext,
          `/screener/signals?tickers=${ticker}`,
          [],
          () => getCachedLatestScreenerRow(ticker)
        ),
        loadOptionalStockDataset(
          requestLogContext,
          `/tickers/${ticker}/scorecard`,
          buildUnavailableScorecard('Temporarily unavailable'),
          () => getTickerScorecard(ticker)
        ),
      ])
  )

  logStockPageEvent('info', 'render data ready', requestLogContext, {
    hasOhlc: ohlcData.length > 0,
    signalRows: recentSignals.length,
    screenerRows: latestScreenerRows.length,
    scorecardReadiness: scorecard.readiness,
  })
  const historicalData = ohlcData.map((point) => ({ date: point.date, close: point.close }))

  const relationship126Promise = runWithBackendRequestLogContext(requestLogContext, () =>
    getTickerRelationships(ticker, { window: 126, topK: 50 }).catch((error) => {
      const details = backendErrorDetails(error)
      logStockPageEvent('error', 'relationship dataset unavailable', requestLogContext, {
        endpoint: `/relationships/${ticker}?window=126`,
        error: details.message,
        aborted: details.aborted,
        timeout: details.timeout,
      })
      return emptyRelationships(ticker, 126)
    })
  )
  const relationship252Promise = runWithBackendRequestLogContext(requestLogContext, () =>
    getTickerRelationships(ticker, { window: 252, topK: 50 }).catch((error) => {
      const details = backendErrorDetails(error)
      logStockPageEvent('error', 'relationship dataset unavailable', requestLogContext, {
        endpoint: `/relationships/${ticker}?window=252`,
        error: details.message,
        aborted: details.aborted,
        timeout: details.timeout,
      })
      return emptyRelationships(ticker, 252)
    })
  )

  const relatedAssetsPromise: Promise<
    Array<{ symbol: string; name: string | null; price: number | null; changePercent: number | null }>
  > = runWithBackendRequestLogContext(requestLogContext, () => relationship252Promise
    .then((relationships) => {
      const candidates = [
        ...relationships.residualCoMovers,
        ...relationships.leadLag.followers,
        ...relationships.leadLag.leaders,
        ...relationships.marketCoMovers,
        ...relationships.probableSpurious,
      ]
      return candidates
        .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol))
        .map((neighbor) => neighbor.symbol)
        .filter((symbol, index, array) => symbol !== ticker && array.indexOf(symbol) === index)
        .slice(0, 8)
    })
    .then((relatedTickerSymbols) =>
      Promise.all(relatedTickerSymbols.map((symbol) => getStockQuote(symbol).catch(() => null))).then((quotes) =>
        relatedTickerSymbols
        .map((symbol, index) => ({ symbol, quote: quotes[index] ?? null }))
        .filter((item) => item.quote !== null)
        .map((item) => ({
          symbol: item.symbol,
          name: item.quote?.name ?? null,
          price: item.quote?.price ?? null,
          changePercent: item.quote?.changePercent ?? null,
        }))
      )
    )
    .catch((error) => {
      const details = backendErrorDetails(error)
      logStockPageEvent('error', 'related assets unavailable', requestLogContext, {
        endpoint: `/stocks/${ticker}/related-assets`,
        error: details.message,
        aborted: details.aborted,
        timeout: details.timeout,
      })
      return []
    }))

  const marketQuote = tickerSummary.quote
  const marketStats = tickerSummary.marketStats
  const fundamentalsSummary = tickerSummary.fundamentalsSummary
  const latestFundamentals = tickerSummary.latestFundamentals
  const quote = tickerSummary.quote
  const displayName = marketQuote?.name ?? quote?.name ?? ticker
  const isEtf = looksLikeEtfAsset({
    ticker,
    displayName,
    latestFundamentals,
  })

  const isInWatchlist = viewerUserId ? await isTickerInWatchlist(viewerUserId, ticker).catch(() => false) : false

  const latestHistorySignal = recentSignals[0] ?? null
  const latestScreenerSignal = latestScreenerRows[0] ?? null
  const latestSignal =
    latestScreenerSignal && latestScreenerSignal.signalDate
      ? {
          direction: latestScreenerSignal.direction,
          conviction: latestScreenerSignal.conviction,
          horizon: latestScreenerSignal.predictionHorizon ?? 20,
          signalDate: latestScreenerSignal.signalDate,
        }
      : latestHistorySignal
        ? {
            direction: latestHistorySignal.direction,
            conviction: latestHistorySignal.prob_side,
            horizon: latestHistorySignal.prediction_horizon,
            signalDate: latestHistorySignal.signal_date,
          }
        : null

  const marketCapNumeric = fundamentalsSummary?.marketCap ?? parseCompactCurrencyNumber(marketQuote?.marketCapText ?? null)
  const marketCapValue =
    marketCapNumeric !== null
      ? formatCompactMoney(marketCapNumeric, currency)
      : marketQuote?.marketCapText ?? '—'
  const previousClose =
    marketQuote?.price !== null &&
    marketQuote?.price !== undefined &&
    marketQuote?.change !== null &&
    marketQuote?.change !== undefined
      ? marketQuote.price - marketQuote.change
      : null

  const trailingPe =
    fundamentalsSummary?.trailingPe !== null && fundamentalsSummary?.trailingPe !== undefined
      ? fundamentalsSummary.trailingPe.toFixed(2)
      : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('pe')) ?? '—')
  const dividendYield =
    findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('yield')) ?? '—'
  const volumeValue =
    findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('volume')) ?? '—'
  const latestRevenueValue =
    fundamentalsSummary?.latestRevenue !== null && fundamentalsSummary?.latestRevenue !== undefined
      ? formatCompactMoney(fundamentalsSummary.latestRevenue, currency)
      : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('revenue')) ?? '—')
  const latestEpsValue =
    fundamentalsSummary?.latestEps !== null && fundamentalsSummary?.latestEps !== undefined
      ? fundamentalsSummary.latestEps.toFixed(2)
      : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('eps')) ?? '—')

  const keyStats = [
    { label: 'Market Cap', value: marketCapValue },
    { label: 'Prev. Close', value: formatMoney(previousClose, currency) },
    { label: 'P/E', value: trailingPe },
    { label: 'Revenue', value: latestRevenueValue },
    { label: 'EPS', value: latestEpsValue },
    { label: 'Dividend Yield', value: dividendYield },
    { label: '52W High', value: formatMoney(marketStats?.week52High ?? null, currency) },
    { label: '52W Low', value: formatMoney(marketStats?.week52Low ?? null, currency) },
    { label: 'Volume', value: volumeValue },
  ]

  const duplicateLabels = new Set(
    keyStats.map((item) => normalizeFundDetailLabel(item.label)).concat([
      '52 week high',
      '52 week low',
      'week 52 high',
      'week 52 low',
      'trailing pe',
    ])
  )

  const fundDetails = dedupeFundRows(
    latestFundamentals
      .map((row) => ({
        label: row.metricLabel,
        value: row.valueDisplay ?? (row.valueNumber !== null ? row.valueNumber.toLocaleString() : '—'),
      }))
      .filter((row) => !duplicateLabels.has(normalizeFundDetailLabel(row.label)))
  ).slice(0, 18)

  return (
    <div className="space-y-4 md:space-y-5">
      <TrackEventOnMount
        eventName="view_stock"
        payload={{
          ticker,
          entry_source: stockEntrySource,
          has_screener_context: Boolean(screenerTag),
          has_model_context: Boolean(modelTag),
        }}
      />

      {modelTag || screenerTag ? (
        <div className="flex flex-wrap items-center gap-2">
          {modelTag ? <Badge variant="neutral">{modelTag}</Badge> : null}
          {screenerTag ? <Badge variant="neutral">{screenerTag}</Badge> : null}
        </div>
      ) : null}

      <StockOverviewClient
        ticker={ticker}
        currency={currency}
        displayName={displayName}
        assetBadgeLabel={isEtf ? 'ETF' : 'Equity'}
        price={marketQuote?.price ?? quote?.price ?? null}
        dailyMoveAmount={marketQuote?.change ?? quote?.change ?? null}
        dailyMovePercent={marketQuote?.changePercent ?? quote?.changePercent ?? null}
        latestSignal={latestSignal}
        historicalData={historicalData}
        ohlcData={ohlcData}
        keyStats={keyStats}
        relationship126={relationship126Promise}
        relationship252={relationship252Promise}
        fundDetails={fundDetails}
        relatedAssets={relatedAssetsPromise}
        regimeSignals={recentSignals.map((signal) => ({
          signal_date: signal.signal_date,
          direction: signal.direction,
          prob_side: signal.prob_side,
        }))}
        scorecard={scorecard}
        watchlistSlot={
          <WatchlistButton
            ticker={ticker}
            initialInWatchlist={isInWatchlist}
            signedIn={Boolean(viewerUserId)}
          />
        }
        showCopilot
        copilot={{
          isPro: viewerAccess.isPro,
          providerEnabled: aiAnalystEnabled,
          upgradeHref,
          initialQuestion: initialAiQuestion,
          initialPromptLabel: initialAiPromptLabel,
        }}
      />
    </div>
  )
}
