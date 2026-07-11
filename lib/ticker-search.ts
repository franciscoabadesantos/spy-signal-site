import type { ScreenerSignal } from './signals'
import type { Scorecard } from './scorecard-types'
import { tickerReadinessBadge, type TickerReadinessBadge } from './ticker-readiness'

export type SearchSignalTone = 'bullish' | 'neutral' | 'bearish'

export type TickerIndexItem = {
  symbol: string
  name: string
  exchange: string | null
  hasSignals: boolean
  readiness: TickerReadinessBadge | null
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
  readiness: TickerReadinessBadge | null
}

type NormalizedSearchText = {
  compact: string
  spaced: string
  tokens: string[]
}

export function normalizeTickerSearchQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
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
    readiness: item.readiness,
    convictionPct: null,
    tone: null,
    signalDate: null,
    scorecard: null,
  }
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true
      if (['false', '0', 'no', 'n'].includes(normalized)) return false
    }
  }
  return null
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return null
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function readinessFromRecord(record: Record<string, unknown>): TickerReadinessBadge | null {
  const readiness = tickerReadinessBadge({
    isTracked: readBoolean(record, ['isTracked', 'is_tracked', 'tracked']),
    coverageState: readString(record, ['coverageState', 'coverage_state', 'readiness', 'readiness_state']),
    hasPrices: readBoolean(record, ['hasPrices', 'has_prices', 'pricesReady', 'prices_ready']),
    hasTechnicals: readBoolean(record, ['hasTechnicals', 'has_technicals', 'technicalsReady', 'technicals_ready']),
    hasScorecard: readBoolean(record, ['hasScorecard', 'has_scorecard', 'scorecardReady', 'scorecard_ready']),
    missingInputs: readStringList(record.missingInputs ?? record.missing_inputs),
    registryStatus: readString(record, ['registryStatus', 'registry_status', 'status']),
    validationStatus: readString(record, ['validationStatus', 'validation_status']),
    promotionStatus: readString(record, ['promotionStatus', 'promotion_status']),
    scorecardReadiness: readString(record, ['scorecardReadiness', 'scorecard_readiness', 'buildStatus', 'build_status']),
  })
  return readiness.label === 'Tracked' ? null : readiness
}

export function normalizeTickerIndexItem(value: unknown): TickerIndexItem | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const symbol =
    typeof row.symbol === 'string' && /^[A-Z0-9][A-Z0-9.\-]{0,9}$/.test(row.symbol.trim().toUpperCase())
      ? row.symbol.trim().toUpperCase()
      : null
  if (!symbol) return null

  const name =
    typeof row.name === 'string' && row.name.trim()
      ? row.name.trim()
      : symbol

  const exchange =
    typeof row.exchange === 'string' && row.exchange.trim()
      ? row.exchange.trim()
      : null

  return {
    symbol,
    name,
    exchange,
    hasSignals: row.hasSignals === true,
    readiness: readinessFromRecord(row),
  }
}

export function normalizeTickerIndexPayload(payload: unknown, etag: string | null): CachedTickerIndex | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => normalizeTickerIndexItem(item))
        .filter((item): item is TickerIndexItem => item !== null)
    : []

  return {
    etag,
    version: typeof record.version === 'string' && record.version.trim() ? record.version.trim() : null,
    generatedAt:
      typeof record.generatedAt === 'string' && record.generatedAt.trim() ? record.generatedAt.trim() : null,
    items,
  }
}

export function mapScreenerRowsToTickerSearchResults(rows: ScreenerSignal[]): TickerSearchResult[] {
  return dedupeTickerSearchResults(
    rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.ticker,
      exchange: null,
      hasSignals: true,
      readiness: null,
      convictionPct: row.conviction === null ? null : Math.round(row.conviction * 100),
      tone: row.direction,
      signalDate: row.signalDate,
      scorecard: null,
    }))
  )
}

function normalizeSearchText(raw: string): NormalizedSearchText {
  const spaced = raw
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  return {
    compact: spaced.replace(/\s/g, ''),
    spaced,
    tokens: spaced ? spaced.split(' ') : [],
  }
}

function tokensMatchQuery(name: NormalizedSearchText, query: NormalizedSearchText): boolean {
  if (query.tokens.length === 0) return false
  return query.tokens.every((queryToken) =>
    name.tokens.some((nameToken) => nameToken.startsWith(queryToken) || nameToken.includes(queryToken))
  )
}

function searchTier(item: TickerIndexItem, normalizedQuery: string): number {
  const query = normalizeSearchText(normalizedQuery)
  if (!query.compact) return 0

  const symbol = normalizeSearchText(item.symbol)
  const name = normalizeSearchText(item.name)
  const exchange = normalizeSearchText(item.exchange ?? '')

  if (symbol.compact === query.compact) return 6
  if (symbol.compact.startsWith(query.compact)) return 5
  if (symbol.compact.includes(query.compact)) return 4
  if (name.compact === query.compact) return 3.5
  if (name.spaced.startsWith(query.spaced) || name.compact.startsWith(query.compact)) return 3
  if (name.spaced.includes(query.spaced) || name.compact.includes(query.compact)) return 2
  if (tokensMatchQuery(name, query)) return 1
  if (exchange.compact && (exchange.compact.startsWith(query.compact) || exchange.compact.includes(query.compact))) return 0.75
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
