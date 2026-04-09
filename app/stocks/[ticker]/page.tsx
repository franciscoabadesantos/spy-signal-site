import Link from 'next/link'
import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import ResearchShell from '@/components/shells/ResearchShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import MetricGrid from '@/components/page/MetricGrid'
import InsightCard from '@/components/page/InsightCard'
import PageSection from '@/components/page/PageSection'
import SystemProfileBlob, { type SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'
import StockChartPanel from '@/components/StockChartPanel'
import PremiumSignalWidget from '@/components/PremiumSignalWidget'
import AiAnalystPanel from '@/components/AiAnalystPanel'
import WatchlistButton from '@/components/WatchlistButton'
import { getViewerUserId } from '@/lib/auth'
import { isTickerInWatchlist } from '@/lib/watchlist'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import { getSignalHistoryForTicker } from '@/lib/signals'
import type { Signal } from '@/lib/types'
import {
  getStockQuote,
  getHistoricalData,
  getTickerFundamentals,
  getTickerNews,
  getRelatedTickers,
  type PricePoint,
  type TickerFundamentals,
} from '@/lib/finance'

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

function normalizeDate(date: string): string {
  return date.slice(0, 10)
}

type ChartSignalMarker = {
  date: string
  direction: Signal['direction']
  conviction: number | null
  horizon: number
  kind: 'flip' | 'latest'
}

function buildChartSignalMarkers(signals: Signal[]): ChartSignalMarker[] {
  if (signals.length === 0) return []
  const ascending = [...signals].sort((a, b) => a.signal_date.localeCompare(b.signal_date))
  const markers: ChartSignalMarker[] = []

  for (let i = 1; i < ascending.length; i++) {
    const previous = ascending[i - 1]
    const current = ascending[i]
    if (!previous || !current || current.direction === previous.direction) continue
    markers.push({
      date: normalizeDate(current.signal_date),
      direction: current.direction,
      conviction: current.prob_side,
      horizon: current.prediction_horizon,
      kind: 'flip',
    })
  }

  const latest = ascending[ascending.length - 1]
  if (latest) {
    const latestDate = normalizeDate(latest.signal_date)
    const hasLatestMarker = markers.some(
      (marker) => marker.date === latestDate && marker.direction === latest.direction
    )
    if (!hasLatestMarker) {
      markers.push({
        date: latestDate,
        direction: latest.direction,
        conviction: latest.prob_side,
        horizon: latest.prediction_horizon,
        kind: 'latest',
      })
    }
  }

  return markers
}

function formatTimeAgo(value: string | null): string {
  if (!value) return 'Recent'
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return 'Recent'

  const diffMs = Date.now() - ts
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${mins}m ago`
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)))
    return `${hours}h ago`
  }

  const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
  return `${days}d ago`
}

function getSourceIconUrl(articleUrl: string): string | null {
  try {
    const host = new URL(articleUrl).hostname
    if (!host) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
  } catch {
    return null
  }
}

function getNewsIconUrl(item: { sourceUrl: string | null; url: string }): string | null {
  return getSourceIconUrl(item.sourceUrl || item.url)
}

function calcWeightBarWidth(value: number | null, maxValue: number): number {
  if (value === null || !Number.isFinite(value) || maxValue <= 0) return 0
  return Math.max(0, Math.min(100, (value / maxValue) * 100))
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function computeInsightStats(signals: Signal[]) {
  const recent = signals.slice(0, 90)
  const convictionRows = recent
    .map((row) => row.prob_side)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const avgConviction =
    convictionRows.length > 0
      ? convictionRows.reduce((sum, value) => sum + value, 0) / convictionRows.length
      : null

  let flips = 0
  for (let i = 1; i < recent.length; i++) {
    const current = recent[i]
    const previous = recent[i - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }

  const bullishCount = recent.filter((row) => row.direction === 'bullish').length
  const bullishShare = recent.length > 0 ? bullishCount / recent.length : null

  return {
    avgConviction,
    flips,
    bullishShare,
  }
}

function computeSignalSummaryContext(signals: Signal[]) {
  const recent = signals.slice(0, 30)
  const latest = recent[0] ?? null
  if (!latest) {
    return {
      recentDirectionShare: null,
      recentFlipRate: null,
    }
  }

  const sameDirectionCount = recent.filter((row) => row.direction === latest.direction).length
  const recentDirectionShare = recent.length > 0 ? sameDirectionCount / recent.length : null

  let flips = 0
  for (let index = 1; index < recent.length; index += 1) {
    const current = recent[index]
    const previous = recent[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }

  const recentFlipRate = recent.length > 1 ? flips / (recent.length - 1) : null
  return {
    recentDirectionShare,
    recentFlipRate,
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function movingAverage(data: PricePoint[], windowSize: number): number | null {
  if (data.length < windowSize || windowSize <= 0) return null
  const slice = data.slice(-windowSize)
  const total = slice.reduce((sum, point) => sum + point.close, 0)
  return total / slice.length
}

function computeDailyReturns(data: PricePoint[]): number[] {
  const returns: number[] = []
  for (let index = 1; index < data.length; index += 1) {
    const current = data[index]
    const previous = data[index - 1]
    if (!current || !previous || previous.close <= 0) continue
    returns.push((current.close - previous.close) / previous.close)
  }
  return returns
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function parsePercentString(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

function buildScoreDimensions({
  historicalData,
  recentSignals,
  fundamentals,
}: {
  historicalData: PricePoint[]
  recentSignals: Signal[]
  fundamentals: TickerFundamentals
}): SystemProfileBlobDimension[] {
  const latestPoint = historicalData[historicalData.length - 1]
  const ma200 = movingAverage(historicalData, 200)
  const ma50 = movingAverage(historicalData, 50)
  const trendAnchor = ma200 ?? ma50
  const trendScore =
    latestPoint && trendAnchor
      ? clampScore(50 + ((latestPoint.close - trendAnchor) / trendAnchor) * 260)
      : 55

  const momentumBase = historicalData[Math.max(0, historicalData.length - 64)]?.close ?? null
  const momentumScore =
    latestPoint && momentumBase && momentumBase > 0
      ? clampScore(50 + ((latestPoint.close - momentumBase) / momentumBase) * 230)
      : 52

  const recentReturns = computeDailyReturns(historicalData).slice(-90)
  const annualizedVol =
    recentReturns.length > 10 ? stdDev(recentReturns) * Math.sqrt(252) : null
  const riskScore = annualizedVol === null ? 48 : clampScore(100 - annualizedVol * 240)

  const yieldPct = parsePercentString(fundamentals.dividendYield)
  // TODO(data): replace yield fallback with dedicated fundamentals feed when sparse ticker coverage is resolved.
  const yieldScore = yieldPct === null ? 42 : clampScore(yieldPct * 14)
  const yieldHint =
    yieldPct === null
      ? 'Placeholder-derived until yield feed is available for this ticker.'
      : `Forward yield ${yieldPct.toFixed(2)}%.`

  const stabilityWindow = recentSignals.slice(0, 90)
  let flips = 0
  for (let index = 1; index < stabilityWindow.length; index += 1) {
    const current = stabilityWindow[index]
    const previous = stabilityWindow[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }
  const flipRate =
    stabilityWindow.length > 1 ? flips / (stabilityWindow.length - 1) : 0
  const convictionValues = stabilityWindow
    .map((row) => row.prob_side)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .map((value) => value * 100)
  const convictionDispersion =
    convictionValues.length > 1 ? stdDev(convictionValues) : 18
  const stabilityScore = clampScore(100 - flipRate * 85 - convictionDispersion * 0.55)

  return [
    {
      label: 'Trend',
      score: trendScore,
      hint: 'Price trend versus long-window baseline.',
    },
    {
      label: 'Momentum',
      score: momentumScore,
      hint: 'Medium-horizon directional push from recent closes.',
    },
    {
      label: 'Risk',
      score: riskScore,
      hint: 'Higher means lower realized volatility.',
    },
    {
      label: 'Yield',
      score: yieldScore,
      hint: yieldHint,
    },
    {
      label: 'Stability',
      score: stabilityScore,
      hint: 'Signal consistency with lower flip frequency.',
    },
  ]
}

function phraseForDimension(label: string): string {
  if (label === 'Trend') return 'trend'
  if (label === 'Momentum') return 'momentum'
  if (label === 'Risk') return 'risk control'
  if (label === 'Yield') return 'income profile'
  return 'stability'
}

function buildSystemProfileInterpretation(dimensions: SystemProfileBlobDimension[]): string {
  if (dimensions.length < 3) return 'Profile dimensions are loading.'
  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const second = sorted[1]
  const weakest = sorted[sorted.length - 1]

  if (!strongest || !second || !weakest) return 'Profile dimensions are loading.'
  if (weakest.label === 'Yield') {
    return `Strong ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}, with minimal income contribution.`
  }
  if (weakest.label === 'Risk') {
    return `Elevated risk is offset by stronger ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}.`
  }
  return `Strong ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}, with softer ${phraseForDimension(weakest.label)}.`
}

function dimensionDescriptor(label: SystemProfileBlobDimension['label'], score: number): string {
  if (label === 'Trend') {
    if (score >= 78) return 'Very strong'
    if (score >= 60) return 'Strong'
    if (score >= 42) return 'Mixed'
    return 'Weak'
  }
  if (label === 'Momentum') {
    if (score >= 74) return 'Strong'
    if (score >= 52) return 'Mixed'
    return 'Soft'
  }
  if (label === 'Risk') {
    if (score >= 76) return 'Controlled'
    if (score >= 58) return 'Moderate'
    if (score >= 40) return 'Elevated'
    return 'High'
  }
  if (label === 'Yield') {
    if (score >= 74) return 'Strong'
    if (score >= 56) return 'Moderate'
    if (score >= 38) return 'Low'
    return 'Minimal'
  }
  if (score >= 72) return 'Strong'
  if (score >= 52) return 'Mixed'
  return 'Weak'
}

function dimensionDotClass(label: SystemProfileBlobDimension['label']): string {
  if (label === 'Trend') return 'bg-blue-500'
  if (label === 'Momentum') return 'bg-indigo-500'
  if (label === 'Risk') return 'bg-amber-500'
  if (label === 'Yield') return 'bg-violet-500'
  return 'bg-sky-500'
}

function profileStateBadge(overallScore: number): { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' } {
  if (overallScore >= 72) return { label: 'Constructive', variant: 'success' }
  if (overallScore >= 56) return { label: 'Mixed', variant: 'neutral' }
  if (overallScore >= 42) return { label: 'Fragile', variant: 'warning' }
  return { label: 'Stressed', variant: 'danger' }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Stock Price, Target, Signals & Overview - SpySignal`,
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
  const initialAiQuestion = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiQuestion))
  const initialAiPromptLabel = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiPromptLabel))
  const sourceContext = singleSearchParam(resolvedSearchParams.from)
  const screenerSignal = sanitizeScreenerSignal(singleSearchParam(resolvedSearchParams.screenerSignal))
  const modelName = sanitizeModelName(singleSearchParam(resolvedSearchParams.modelName))
  const modelTag = sourceContext === 'model' && modelName ? `From Model: ${modelName}` : null
  const screenerTag =
    sourceContext === 'screener' && screenerSignal ? `From Screener: ${screenerSignal}` : null
  const viewerAccess = await getViewerAccess()
  const viewerUserId = viewerAccess.userId ?? (await getViewerUserId())
  const aiAnalystEnabled = Boolean(process.env.PERPLEXITY_API_KEY?.trim())
  const upgradeHref = viewerAccess.isSignedIn
    ? getStripeUpgradeUrl(viewerAccess.userId)
    : '/sign-up?redirect_url=/stocks/' + ticker

  const relatedTickerSymbols = getRelatedTickers(ticker)
  const [quote, historicalData, recentSignals, fundamentals, newsItems, relatedQuotes] = await Promise.all([
    getStockQuote(ticker),
    getHistoricalData(ticker, 1825),
    getSignalHistoryForTicker(ticker, 180),
    getTickerFundamentals(ticker),
    getTickerNews(ticker, 5),
    Promise.all(relatedTickerSymbols.map((symbol) => getStockQuote(symbol))),
  ])

  const isInWatchlist = viewerUserId ? await isTickerInWatchlist(viewerUserId, ticker) : false
  const latest = recentSignals[0] ?? null
  const signalMarkers = recentSignals.length > 0 ? buildChartSignalMarkers(recentSignals) : []
  const holdingsPreview = (fundamentals.holdings ?? []).slice(0, 8)
  const maxHoldingPreviewWeight = holdingsPreview.reduce((max, holding) => {
    const weight = holding.weightPercent
    if (weight === null || !Number.isFinite(weight)) return max
    return Math.max(max, weight)
  }, 0)
  const insightStats = computeInsightStats(recentSignals)
  const signalSummaryContext = computeSignalSummaryContext(recentSignals)

  const relatedAssets = relatedTickerSymbols
    .map((symbol, index) => ({ symbol, quote: relatedQuotes[index] ?? null }))
    .filter((item) => item.quote !== null)

  const quickStats = [
    { label: 'Market Cap', value: fundamentals.marketCap ?? '—' },
    { label: 'Dividend Yield', value: fundamentals.dividendYield ?? '—' },
    { label: 'Holdings', value: (fundamentals.holdings?.length ?? 0).toString() },
    { label: 'Last Signal', value: latest?.signal_date?.slice(0, 10) ?? '—' },
  ]
  const scoreDimensions = buildScoreDimensions({
    historicalData,
    recentSignals,
    fundamentals,
  })
  const profileInterpretation = buildSystemProfileInterpretation(scoreDimensions)
  const overallSystemScore =
    scoreDimensions.length > 0
      ? Math.round(scoreDimensions.reduce((sum, dimension) => sum + dimension.score, 0) / scoreDimensions.length)
      : 0
  const profileBadge = profileStateBadge(overallSystemScore)

  return (
    <ResearchShell
      ticker={ticker}
      activeTab="overview"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker },
          ]}
        />
      }
      header={{
        ticker: quote?.ticker || ticker,
        companyName: quote?.name,
        price: quote?.price ?? null,
        dailyMove: {
          amount: quote?.change ?? null,
          percent: quote?.changePercent ?? null,
        },
        signal: latest
          ? {
              label: latest.direction.toUpperCase(),
              tone:
                latest.direction === 'bullish'
                  ? 'bullish'
                  : latest.direction === 'bearish'
                    ? 'bearish'
                    : 'neutral',
            }
          : undefined,
        subtitle: (
          <div className="flex flex-wrap items-center gap-2">
            {modelTag ? <Badge variant="neutral">{modelTag}</Badge> : null}
            {screenerTag ? <Badge variant="neutral">{screenerTag}</Badge> : null}
            <span>Research-ready snapshot with model context and supporting market data.</span>
          </div>
        ),
        watchlistAction: (
          <WatchlistButton
            ticker={ticker}
            initialInWatchlist={isInWatchlist}
            signedIn={Boolean(viewerUserId)}
          />
        ),
      }}
    >
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="section-gap">
          <Card className="h-[420px]" padding="lg">
            <StockChartPanel data={historicalData} signalMarkers={signalMarkers} />
          </Card>

          <MetricGrid
            columns={4}
            items={quickStats.map((stat) => ({
              label: stat.label,
              value: <span className="text-lg font-semibold">{stat.value}</span>,
            }))}
          />
        </div>

        <div className="section-gap">
          <Card className="border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_68%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_68%)]">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">System Profile</h3>
              <div className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/70">
                <div className="leading-none text-neutral-900 dark:text-neutral-100">
                  <span className="text-2xl font-semibold">{overallSystemScore}</span>
                  <span className="ml-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">/ 100</span>
                </div>
                <Badge variant={profileBadge.variant}>{profileBadge.label}</Badge>
              </div>
            </div>
            <p className="text-body mt-2 line-clamp-2">{profileInterpretation}</p>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[45%_55%] lg:items-stretch">
              <div className="mx-auto flex aspect-square w-full max-w-[400px] items-center justify-center rounded-2xl border border-neutral-200 bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,rgba(129,140,248,0.05)_42%,transparent_72%)] p-5 dark:border-neutral-800 dark:bg-[radial-gradient(circle,rgba(37,99,235,0.22)_0%,rgba(99,102,241,0.08)_40%,transparent_72%)]">
                <SystemProfileBlob dimensions={scoreDimensions} />
              </div>
              <div className="flex flex-col justify-center gap-2">
                {scoreDimensions.map((dimension) => (
                  <div
                    key={dimension.label}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                  >
                    <div className="inline-flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dimensionDotClass(dimension.label)}`} />
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {dimension.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {Math.round(dimension.score)}
                      </div>
                      <div className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                        {dimensionDescriptor(dimension.label, dimension.score)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {latest ? (
            <PremiumSignalWidget
              ticker={ticker}
              direction={latest.direction}
              conviction={latest.prob_side}
              horizon={latest.prediction_horizon}
              signalDate={latest.signal_date}
              recentDirectionShare={signalSummaryContext.recentDirectionShare}
              recentFlipRate={signalSummaryContext.recentFlipRate}
            />
          ) : (
            <Card className="section-gap border-primary/30 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_68%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_68%)]">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Signal Summary</h3>
              <p className="text-body mt-2">No recent model output is available for this ticker yet.</p>
            </Card>
          )}

          <Card className="section-gap">
            <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Use this in your model</h3>
            <p className="text-body">Save to watchlist, inspect financials, or compare nearby assets for validation.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/models/new?ticker=${encodeURIComponent(ticker)}`} className={buttonClass({ variant: 'primary' })}>
                Build model from this stock
              </Link>
              <Link href={`/stocks/${ticker}/financials/fund-profile`} className={buttonClass({ variant: 'secondary' })}>
                View Financials
              </Link>
              <Link href={`/stocks/${ticker}/signal-history`} className={buttonClass({ variant: 'ghost' })}>
                Signal History
              </Link>
            </div>
          </Card>

          <AiAnalystPanel
            ticker={ticker}
            signal={{
              direction: latest?.direction ?? 'neutral',
              conviction: latest?.prob_side ?? null,
              predictionHorizon: latest?.prediction_horizon ?? null,
              signalDate: latest?.signal_date ?? new Date().toISOString(),
            }}
            news={newsItems.map((item) => ({
              title: item.title,
              publisher: item.publisher,
              publishedAt: item.publishedAt,
              url: item.url,
            }))}
            isPro={viewerAccess.isPro}
            providerEnabled={aiAnalystEnabled}
            upgradeHref={upgradeHref}
            initialQuestion={initialAiQuestion}
            initialPromptLabel={initialAiPromptLabel}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard title="Average Conviction" description="Recent 90-signal average">
          <div className="text-metric text-neutral-900 dark:text-neutral-100">{formatConviction(insightStats.avgConviction)}</div>
        </InsightCard>
        <InsightCard title="Signal Flips" description="Direction changes in recent history">
          <div className="text-metric text-neutral-900 dark:text-neutral-100">{insightStats.flips}</div>
        </InsightCard>
        <InsightCard title="Bullish Share" description="Portion of recent signals that were bullish">
          <div className="text-metric text-neutral-900 dark:text-neutral-100">
            {insightStats.bullishShare === null ? '—' : `${Math.round(insightStats.bullishShare * 100)}%`}
          </div>
        </InsightCard>
      </section>

      <PageSection id="profile" title="About" description="Company / fund profile and strategy context.">
        <Card>
          <p className="text-body leading-7 text-base">
            {fundamentals.about ||
              `The ${quote?.name || ticker} provides exposure to highly liquid market segments. This page combines live model context with supporting fundamentals so you can evaluate stance changes in context.`}
          </p>
        </Card>
      </PageSection>

      <PageSection
        id="top-holdings"
        title="Top Holdings Preview"
        description="Largest disclosed positions by portfolio weight."
        action={
          <Link href={`/stocks/${ticker}/holdings-dividends`} className={buttonClass({ variant: 'secondary' })}>
            View full holdings
          </Link>
        }
      >
        <Card>
          {holdingsPreview.length === 0 ? (
            <p className="text-body">Holdings data is not currently available for this ticker.</p>
          ) : (
            <div className="space-y-2">
              {holdingsPreview.map((holding, i) => {
                const weightLabel = holding.weightPercent === null ? '—' : `${holding.weightPercent.toFixed(2)}%`
                const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingPreviewWeight)

                return (
                  <div key={`${holding.symbol}-${i}`} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {holding.symbol}
                        <span className="ml-2 text-neutral-500">{holding.name}</span>
                      </div>
                      <div className="font-semibold text-neutral-700 dark:text-neutral-200">{weightLabel}</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </PageSection>

      <PageSection id="latest-news" title="Latest News" description="Recent headlines for this asset.">
        <div className="grid grid-cols-1 gap-3">
          {newsItems.length === 0 ? (
            <Card>
              <p className="text-body">No recent news available for this ticker.</p>
            </Card>
          ) : (
            newsItems.map((item) => {
              const sourceIconUrl = getNewsIconUrl(item)
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="transition-colors hover:border-neutral-400 dark:hover:border-neutral-600" padding="md">
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="h-[64px] w-[88px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                        {item.imageUrl ? (
                          <div
                            className="h-full w-full bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                          />
                        ) : sourceIconUrl ? (
                          <div
                            className="h-full w-full bg-center bg-no-repeat bg-contain"
                            style={{ backgroundImage: `url(${sourceIconUrl})` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <Newspaper className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-body mt-1">{item.publisher} · {formatTimeAgo(item.publishedAt)}</div>
                      </div>
                    </div>
                  </Card>
                </a>
              )
            })
          )}
        </div>
      </PageSection>

      <PageSection title="Related Research Actions" description="Move from overview into detailed datasets and history.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              title: 'Financials',
              body: 'Explore profile, portfolio, distributions, and risk sections.',
              href: `/stocks/${ticker}/financials/fund-profile`,
            },
            {
              title: 'Signal History',
              body: 'Inspect daily stance changes, conviction, and episode outcomes.',
              href: `/stocks/${ticker}/signal-history`,
            },
            {
              title: 'Holdings & Dividends',
              body: 'Review allocations, sector exposure, and dividend fields.',
              href: `/stocks/${ticker}/holdings-dividends`,
            },
          ].map((item) => (
            <Card key={item.href} className="section-gap">
              <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">{item.title}</h3>
              <p className="text-body">{item.body}</p>
              <Link href={item.href} className={buttonClass({ variant: 'secondary' })}>
                Open
              </Link>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection title="Similar Assets" description="Peer tickers for adjacent research.">
        {relatedAssets.length === 0 ? (
          <Card>
            <p className="text-body">No peer assets available right now.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedAssets.map((asset) => {
              const peerQuote = asset.quote
              const changePercent = peerQuote?.changePercent ?? null
              const up = changePercent !== null && changePercent >= 0

              return (
                <Link key={asset.symbol} href={`/stocks/${asset.symbol}`} className="block">
                  <Card className="transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{asset.symbol}</div>
                    <div className="text-body mt-1 truncate">{peerQuote?.name ?? asset.symbol}</div>
                    <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
                      {peerQuote ? `$${peerQuote.price.toFixed(2)}` : '—'}
                    </div>
                    <div className={`mt-1 text-sm font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {changePercent === null ? '—' : `${up ? '+' : ''}${changePercent.toFixed(2)}%`}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </PageSection>
    </ResearchShell>
  )
}
