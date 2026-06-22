import type { ScreenerSignal } from './signals'
import type { Scorecard } from './scorecard-types'

export type SearchSignalTone = 'bullish' | 'neutral' | 'bearish'

export type TickerIndexItem = {
  symbol: string
  name: string
  exchange: string | null
  hasSignals: boolean
}

export type TickerIndexPayload = {
  version: string | null
  generatedAt: string | null
  items: TickerIndexItem[]
}

export type CachedTickerIndex = TickerIndexPayload & {
  etag: string | null
}

export type TickerSearchResult = {
  symbol: string
  name: string
  exchange: string | null
  hasSignals: boolean
  convictionPct: number | null
  tone: SearchSignalTone | null
  signalDate: string | null
  scorecard: Scorecard | null
}

export type TickerSearchResponse = {
  featured: TickerSearchResult[]
  fallbackUsed: boolean
  query: string
  results: TickerSearchResult[]
  source: 'backend' | 'fallback'
}

export const FALLBACK_TICKER_SUGGESTIONS: TickerSearchResult[] = [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSEARCA',
    hasSignals: true,
    convictionPct: 71,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 69,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 76,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 74,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 79,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 64,
    tone: 'neutral',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 67,
    tone: 'bullish',
    signalDate: null,
    scorecard: null,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    hasSignals: true,
    convictionPct: 62,
    tone: 'neutral',
    signalDate: null,
    scorecard: null,
  },
]

export function normalizeTickerSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export function isTickerLikeQuery(raw: string): boolean {
  const normalized = raw.trim().toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,9}$/.test(normalized)) return false
  if (normalized.includes('.') || normalized.includes('-')) return true
  return normalized.length <= 5
}

export function dedupeTickerSearchResults(results: TickerSearchResult[]): TickerSearchResult[] {
  const map = new Map<string, TickerSearchResult>()

  for (const result of results) {
    const symbol = result.symbol.trim().toUpperCase()
    if (!symbol || map.has(symbol)) continue
    map.set(symbol, {
      ...result,
      symbol,
    })
  }

  return [...map.values()]
}

export function tickerIndexItemToSearchResult(item: TickerIndexItem): TickerSearchResult {
  return {
    symbol: item.symbol,
    name: item.name,
    exchange: item.exchange,
    hasSignals: item.hasSignals,
    convictionPct: null,
    tone: null,
    signalDate: null,
    scorecard: null,
  }
}

export function mapScreenerRowsToTickerSearchResults(rows: ScreenerSignal[]): TickerSearchResult[] {
  return dedupeTickerSearchResults(
    rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.ticker,
      exchange: null,
      hasSignals: true,
      convictionPct: row.conviction === null ? null : Math.round(row.conviction * 100),
      tone: row.direction,
      signalDate: row.signalDate,
      scorecard: null,
    }))
  )
}

function searchTier(item: TickerIndexItem, normalizedQuery: string): number {
  const symbol = item.symbol.toUpperCase()
  const name = item.name.toLowerCase()
  const upperQuery = normalizedQuery.toUpperCase()
  const lowerQuery = normalizedQuery.toLowerCase()

  if (symbol === upperQuery) return 5
  if (symbol.startsWith(upperQuery)) return 4
  if (symbol.includes(upperQuery)) return 3
  if (name.startsWith(lowerQuery)) return 2
  if (name.includes(lowerQuery)) return 1
  return 0
}

function scoreIndexItem(item: TickerIndexItem, normalizedQuery: string): number {
  const tier = searchTier(item, normalizedQuery)
  if (tier === 0) return 0

  let score = tier * 1000
  if (item.hasSignals) score += 80
  if (item.symbol.length <= normalizedQuery.length + 2) score += 20
  if (item.name.length <= normalizedQuery.length + 12) score += 10
  return score
}

export function filterTickerIndexItems(
  items: TickerIndexItem[],
  rawQuery: string,
  limit = 8
): TickerSearchResult[] {
  const normalizedQuery = normalizeTickerSearchQuery(rawQuery)
  if (!normalizedQuery) return []

  return items
    .map((item) => ({
      item,
      score: scoreIndexItem(item, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      if (a.item.hasSignals !== b.item.hasSignals) return a.item.hasSignals ? -1 : 1
      return a.item.symbol.localeCompare(b.item.symbol)
    })
    .slice(0, limit)
    .map((entry) => tickerIndexItemToSearchResult(entry.item))
}

export function getFeaturedTickerIndexResults(
  items: TickerIndexItem[],
  limit = 8
): TickerSearchResult[] {
  const preferred = items.filter((item) => item.hasSignals)
  const source = preferred.length > 0 ? preferred : items
  return source.slice(0, limit).map(tickerIndexItemToSearchResult)
}

function scoreTemplateResult(result: TickerSearchResult, normalizedQuery: string): number {
  const symbol = result.symbol.toUpperCase()
  const name = result.name.toLowerCase()
  const upperQuery = normalizedQuery.toUpperCase()
  const lowerQuery = normalizedQuery.toLowerCase()

  let score = 0
  if (symbol === upperQuery) score += 100
  else if (symbol.startsWith(upperQuery)) score += 70
  else if (symbol.includes(upperQuery)) score += 36

  if (name.startsWith(lowerQuery)) score += 22
  else if (name.includes(lowerQuery)) score += 12

  score += (result.convictionPct ?? 50) / 10
  return score
}

export function filterTemplateTickerResults(rawQuery: string, limit = 8): TickerSearchResult[] {
  const normalizedQuery = normalizeTickerSearchQuery(rawQuery)
  if (!normalizedQuery) return FALLBACK_TICKER_SUGGESTIONS.slice(0, limit)

  const upperQuery = normalizedQuery.toUpperCase()
  const lowerQuery = normalizedQuery.toLowerCase()

  return FALLBACK_TICKER_SUGGESTIONS.filter((result) => {
    return result.symbol.includes(upperQuery) || result.name.toLowerCase().includes(lowerQuery)
  })
    .sort((a, b) => scoreTemplateResult(b, normalizedQuery) - scoreTemplateResult(a, normalizedQuery))
    .slice(0, limit)
}

export function getTemplateFeaturedTickerResults(limit = 8): TickerSearchResult[] {
  return FALLBACK_TICKER_SUGGESTIONS.slice(0, limit)
}
