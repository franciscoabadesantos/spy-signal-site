import type { ScreenerSignal } from './signals'

export type SearchSignalTone = 'bullish' | 'neutral' | 'bearish'

export type TickerSearchResult = {
  symbol: string
  name: string
  exchange: string | null
  convictionPct: number | null
  tone: SearchSignalTone | null
  signalDate: string | null
}

export type TickerSearchResponse = {
  featured: TickerSearchResult[]
  fallbackUsed: boolean
  query: string
  results: TickerSearchResult[]
  source: 'backend' | 'template'
}

export const TEMPLATE_TICKER_SUGGESTIONS: TickerSearchResult[] = [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSEARCA',
    convictionPct: 71,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    convictionPct: 69,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    convictionPct: 76,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    convictionPct: 74,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    convictionPct: 79,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    convictionPct: 64,
    tone: 'neutral',
    signalDate: null,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    convictionPct: 67,
    tone: 'bullish',
    signalDate: null,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    convictionPct: 62,
    tone: 'neutral',
    signalDate: null,
  },
]

export function normalizeTickerSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export function isTickerLikeQuery(raw: string): boolean {
  const normalized = raw.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(normalized)) return false
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

export function mapScreenerRowsToTickerSearchResults(rows: ScreenerSignal[]): TickerSearchResult[] {
  return dedupeTickerSearchResults(
    rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.ticker,
      exchange: null,
      convictionPct: row.conviction === null ? null : Math.round(row.conviction * 100),
      tone: row.direction,
      signalDate: row.signalDate,
    }))
  )
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
  if (!normalizedQuery) return TEMPLATE_TICKER_SUGGESTIONS.slice(0, limit)

  const upperQuery = normalizedQuery.toUpperCase()
  const lowerQuery = normalizedQuery.toLowerCase()

  return TEMPLATE_TICKER_SUGGESTIONS.filter((result) => {
    return result.symbol.includes(upperQuery) || result.name.toLowerCase().includes(lowerQuery)
  })
    .sort((a, b) => scoreTemplateResult(b, normalizedQuery) - scoreTemplateResult(a, normalizedQuery))
    .slice(0, limit)
}

export function getTemplateFeaturedTickerResults(limit = 8): TickerSearchResult[] {
  return TEMPLATE_TICKER_SUGGESTIONS.slice(0, limit)
}
