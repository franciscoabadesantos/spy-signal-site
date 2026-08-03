import 'server-only'

import { getViewerUserId } from '@/lib/auth'
import { currencyForTicker } from '@/lib/currency'
import { getTickerRelationships, rankTickerRelationshipCandidates } from '@/lib/relationships'
import { getCachedLatestScreenerRow, getCachedSignalHistoryForTicker } from '@/lib/signals'
import { stockAssetKind } from '@/lib/stock-asset-kind'
import { getTickerPageSummary } from '@/lib/ticker-data'
import { isTickerInWatchlist } from '@/lib/watchlist'

export type StockTickerChromeData = {
  ticker: string
  displayName: string
  assetBadgeLabel: 'ETF' | 'Equity'
  currency: string
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  tone: 'bullish' | 'neutral' | 'bearish' | 'brand'
  signal: {
    direction: 'bullish' | 'neutral' | 'bearish'
    signalDate: string | null
  } | null
  watchlist: {
    signedIn: boolean
    initialInWatchlist: boolean
  }
  relationships: Array<{
    symbol: string
    strength: number | null
    confidence: number | null
  }>
}

export async function getStockTickerChromeData(tickerRaw: string): Promise<StockTickerChromeData> {
  const ticker = tickerRaw.trim().toUpperCase()
  const viewerUserIdPromise = getViewerUserId()
  const watchlistPromise = viewerUserIdPromise.then((userId) =>
    userId ? isTickerInWatchlist(userId, ticker).catch(() => false) : false
  )
  const [summary, relationships, screenerRows, historyRows, viewerUserId, initialInWatchlist] = await Promise.all([
    getTickerPageSummary(ticker).catch(() => null),
    getTickerRelationships(ticker, { window: 252, topK: 50 }).catch(() => null),
    getCachedLatestScreenerRow(ticker).catch(() => []),
    getCachedSignalHistoryForTicker(ticker, 180).catch(() => []),
    viewerUserIdPromise,
    watchlistPromise,
  ])

  const quote = summary?.quote
  const displayName = quote?.name?.trim() || ticker
  const kind = summary
    ? stockAssetKind({ ticker, name: displayName, latestFundamentals: summary.latestFundamentals })
    : 'equity'
  const latestScreenerSignal = screenerRows[0] ?? null
  const latestHistorySignal = historyRows[0] ?? null
  const direction = latestScreenerSignal?.direction ?? latestHistorySignal?.direction ?? null
  const signalDate = latestScreenerSignal?.signalDate ?? latestHistorySignal?.signal_date ?? null
  const fieldNodes = relationships
    ? rankTickerRelationshipCandidates(relationships, ticker).map(({ symbol, strength, confidence }) => ({
        symbol,
        strength,
        confidence,
      }))
    : []

  return {
    ticker,
    displayName,
    assetBadgeLabel: kind === 'fund' ? 'ETF' : 'Equity',
    currency: summary?.fundamentalsSummary?.currency || currencyForTicker(ticker),
    price: quote?.price ?? summary?.marketStats?.lastPrice ?? null,
    dailyMoveAmount: quote?.change ?? null,
    dailyMovePercent: quote?.changePercent ?? null,
    tone: direction ?? 'brand',
    signal: direction ? { direction, signalDate } : null,
    watchlist: {
      signedIn: Boolean(viewerUserId),
      initialInWatchlist,
    },
    relationships: fieldNodes,
  }
}
