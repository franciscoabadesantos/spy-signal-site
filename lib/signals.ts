import { supabase } from './supabase'
import { Signal } from './types'

const SUPABASE_QUERY_TIMEOUT_MS = 3500
const SCREENER_FETCH_BUDGET_MS = 9000
const SAFE_SCREENER_TIMEOUT_MS = 9500

async function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number, context: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${context} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    return await Promise.race([Promise.resolve(operation), timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getRecentSignals(limit = 20): Promise<Signal[]> {
  const { data, error } = await supabase
    .from('spy_signals_live')
    .select('*')
    .order('signal_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching signals:', error.message, error.details)
    throw new Error(`Failed to fetch signals: ${error.message}`)
  }

  return data as Signal[]
}

export async function getSignalHistoryForTicker(
  tickerRaw: string,
  limit = 250,
  options?: {
    allowSyntheticFallback?: boolean
  }
): Promise<Signal[]> {
  const ticker = tickerRaw.trim().toUpperCase()
  if (!ticker) return []
  const allowSyntheticFallback = options?.allowSyntheticFallback ?? true

  if (ticker === 'SPY') {
    try {
      const liveSignals = await getRecentSignals(limit)
      if (liveSignals.length > 0) return liveSignals
    } catch {
      // Fall through to heterogeneous source loader.
    }
  }

  const rowsByKey = new Map<string, ScreenerSignal>()

  for (const source of SIGNAL_HISTORY_SOURCES) {
    let sourceRows: ScreenerSignal[] = []
    try {
      sourceRows = await readSourceRows(source, Math.max(limit * 8, 1000), [ticker])
    } catch {
      continue
    }

    for (const row of sourceRows) {
      if (row.ticker !== ticker || !row.signalDate) continue
      const key = `${row.ticker}:${row.signalDate.slice(0, 10)}`
      const existing = rowsByKey.get(key)
      if (!existing || (row.conviction ?? -1) > (existing.conviction ?? -1)) {
        rowsByKey.set(key, row)
      }
    }
  }

  const sorted = [...rowsByKey.values()]
    .filter((row) => Boolean(row.signalDate))
    .sort((a, b) => parseSignalDateMs(b.signalDate) - parseSignalDateMs(a.signalDate))
    .slice(0, limit)

  if (sorted.length === 0) {
    return allowSyntheticFallback ? buildFallbackSignalHistory(ticker, limit) : []
  }

  return sorted.map((row, index) => ({
    id: index + 1,
    signal_date: row.signalDate ?? new Date(0).toISOString(),
    direction: row.direction,
    position: null,
    signal_strength: row.conviction,
    prob_side: row.conviction,
    prediction_horizon: row.predictionHorizon ?? 20,
    realized_return: null,
    correct: null,
    model_version_id: null,
    retrain_id: null,
    created_at: row.signalDate ?? new Date().toISOString(),
    updated_at: row.signalDate ?? new Date().toISOString(),
    live_episode_status: null,
    live_flat_episode_status: null,
    live_episode_return_to_date: null,
    live_flat_episode_spy_move_to_date: null,
    live_episode_days_in_trade: null,
    live_episode_entry_date: null,
  }))
}

export async function getLatestSignal(): Promise<Signal | null> {
  const signals = await getRecentSignals(1)
  return signals[0] ?? null
}

export async function getDataStartDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('spy_signals_live')
    .select('signal_date')
    .order('signal_date', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Error fetching data start date:', error.message, error.details)
    throw new Error(`Failed to fetch data start date: ${error.message}`)
  }

  return (data?.[0] as { signal_date?: string } | undefined)?.signal_date ?? null
}

type SignalDirection = 'bullish' | 'neutral' | 'bearish'

export type ScreenerSignal = {
  ticker: string
  name: string | null
  direction: SignalDirection
  conviction: number | null
  signalDate: string | null
  predictionHorizon: number | null
  price: number | null
  changePercent: number | null
}

export type ScreenerSort = 'conviction' | 'latest' | 'movers' | 'ticker'

export type ScreenerQuery = {
  signal?: SignalDirection
  minConvictionPct?: number
  maxSignalAgeDays?: number
  textQuery?: string
  sortBy?: ScreenerSort
  limit?: number
  tickers?: string[]
}

export type ScreenerResult = {
  rows: ScreenerSignal[]
  source: string | null
}

export type SignalFlipEvent = {
  ticker: string
  fromDirection: SignalDirection
  toDirection: SignalDirection
  signalDate: string
  conviction: number | null
}

export type ScreenerSignalComposition = {
  bullishCount: number
  neutralCount: number
  bearishCount: number
  total: number
  bullishPct: number
  neutralPct: number
  bearishPct: number
  activePct: number
}

type FallbackScreenerSeed = {
  ticker: string
  name: string
  direction: SignalDirection
  conviction: number
  predictionHorizon: number
  price: number
  changePercent: number
}

const FALLBACK_SCREENER_SEEDS: FallbackScreenerSeed[] = [
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    direction: 'bullish',
    conviction: 0.74,
    predictionHorizon: 20,
    price: 512.4,
    changePercent: 0.61,
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    direction: 'bullish',
    conviction: 0.68,
    predictionHorizon: 20,
    price: 439.8,
    changePercent: 0.84,
  },
  {
    ticker: 'IWM',
    name: 'iShares Russell 2000 ETF',
    direction: 'neutral',
    conviction: 0.46,
    predictionHorizon: 20,
    price: 203.2,
    changePercent: -0.11,
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    direction: 'neutral',
    conviction: 0.49,
    predictionHorizon: 20,
    price: 188.6,
    changePercent: 0.18,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    direction: 'bullish',
    conviction: 0.64,
    predictionHorizon: 20,
    price: 426.9,
    changePercent: 0.52,
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    direction: 'bullish',
    conviction: 0.71,
    predictionHorizon: 20,
    price: 923.4,
    changePercent: 1.41,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    direction: 'neutral',
    conviction: 0.44,
    predictionHorizon: 20,
    price: 184.5,
    changePercent: -0.09,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    direction: 'bullish',
    conviction: 0.58,
    predictionHorizon: 20,
    price: 164.2,
    changePercent: 0.37,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    direction: 'bullish',
    conviction: 0.62,
    predictionHorizon: 20,
    price: 503.7,
    changePercent: 0.72,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    direction: 'bearish',
    conviction: 0.63,
    predictionHorizon: 20,
    price: 188.9,
    changePercent: -1.03,
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    direction: 'neutral',
    conviction: 0.52,
    predictionHorizon: 20,
    price: 198.4,
    changePercent: 0.09,
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil Corporation',
    direction: 'bearish',
    conviction: 0.57,
    predictionHorizon: 20,
    price: 117.1,
    changePercent: -0.34,
  },
]

const SCREENER_SOURCES = [
  'latest_signals_view',
  'latest_signals',
  'signals_latest',
  'signals_live',
  'market_signals',
  'spy_signals_live',
]

const SIGNAL_HISTORY_SOURCES = [
  ...SCREENER_SOURCES,
  'signal_history',
  'signals',
]

const SOURCE_ORDER_COLUMNS = ['signal_date', 'as_of_date', 'date', 'updated_at']

function dayOffsetIso(daysAgo: number): string {
  const ts = Date.now() - daysAgo * 24 * 60 * 60 * 1000
  return new Date(ts).toISOString()
}

function hashTicker(ticker: string): number {
  let hash = 2166136261
  for (let i = 0; i < ticker.length; i += 1) {
    hash ^= ticker.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function buildFallbackScreenerRows(limit: number): ScreenerSignal[] {
  return FALLBACK_SCREENER_SEEDS.slice(0, Math.max(1, limit)).map((seed, index) => ({
    ticker: seed.ticker,
    name: seed.name,
    direction: seed.direction,
    conviction: seed.conviction,
    signalDate: dayOffsetIso(index % 4),
    predictionHorizon: seed.predictionHorizon,
    price: seed.price,
    changePercent: seed.changePercent,
  }))
}

function buildFallbackSignalHistory(ticker: string, limit: number): Signal[] {
  const normalized = ticker.trim().toUpperCase() || 'SPY'
  const hash = hashTicker(normalized)
  const seedDirection = hash % 3
  const rows: Signal[] = []

  for (let index = 0; index < limit; index += 1) {
    const directionBucket = Math.floor(index / 16)
    const phase = (seedDirection + directionBucket) % 3
    const direction: SignalDirection = phase === 0 ? 'bullish' : phase === 1 ? 'neutral' : 'bearish'
    const convictionBase = direction === 'bullish' ? 0.62 : direction === 'bearish' ? 0.58 : 0.46
    const cycle = ((hash + index * 17) % 11) / 100
    const conviction = Math.max(0.21, Math.min(0.86, convictionBase + cycle - 0.05))
    const signalDate = dayOffsetIso(index)

    rows.push({
      id: index + 1,
      signal_date: signalDate,
      direction,
      position: null,
      signal_strength: conviction,
      prob_side: conviction,
      prediction_horizon: 20,
      realized_return: null,
      correct: null,
      model_version_id: null,
      retrain_id: null,
      created_at: signalDate,
      updated_at: signalDate,
      live_episode_status: null,
      live_flat_episode_status: null,
      live_episode_return_to_date: null,
      live_flat_episode_spy_move_to_date: null,
      live_episode_days_in_trade: null,
      live_episode_entry_date: null,
    })
  }

  return rows
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeDirection(raw: unknown): SignalDirection | null {
  const value = getString(raw)?.toLowerCase()
  if (!value) return null

  if (value === 'bullish' || value === 'buy' || value === 'long' || value === 'in') return 'bullish'
  if (value === 'bearish' || value === 'sell' || value === 'short') return 'bearish'
  if (value === 'neutral' || value === 'hold' || value === 'flat' || value === 'out') return 'neutral'
  return null
}

function normalizeConviction(raw: unknown): number | null {
  const value = getNumber(raw)
  if (value === null) return null
  if (value > 1) {
    const scaled = value / 100
    return scaled >= 0 && scaled <= 1 ? scaled : null
  }
  if (value < 0 || value > 1) return null
  return value
}

function normalizeSignalRow(row: unknown, source?: string): ScreenerSignal | null {
  const record = asRecord(row)
  if (!record) return null

  const tickerCandidate =
    getString(record.ticker)?.toUpperCase() ??
    getString(record.symbol)?.toUpperCase() ??
    getString(record.asset_ticker)?.toUpperCase()
  const ticker =
    tickerCandidate ??
    (source === 'spy_signals_live' ? 'SPY' : null)
  if (!ticker) return null

  const direction =
    normalizeDirection(record.direction) ??
    normalizeDirection(record.signal) ??
    normalizeDirection(record.current_signal)
  if (!direction) return null

  const conviction =
    normalizeConviction(record.prob_side) ??
    normalizeConviction(record.conviction) ??
    normalizeConviction(record.probability) ??
    normalizeConviction(record.confidence) ??
    normalizeConviction(record.signal_strength)

  const horizon =
    getNumber(record.prediction_horizon) ??
    getNumber(record.horizon_days) ??
    getNumber(record.horizon)

  const signalDate =
    getString(record.signal_date) ??
    getString(record.as_of_date) ??
    getString(record.date) ??
    getString(record.updated_at)

  const price =
    getNumber(record.price) ??
    getNumber(record.last_price) ??
    getNumber(record.close)

  const changePercent =
    getNumber(record.change_percent) ??
    getNumber(record.pct_change) ??
    getNumber(record.price_change_percent)

  const name =
    getString(record.name) ??
    getString(record.asset_name) ??
    getString(record.company_name) ??
    getString(record.short_name) ??
    null

  return {
    ticker,
    name,
    direction,
    conviction,
    signalDate,
    predictionHorizon: horizon,
    price,
    changePercent,
  }
}

async function readSourceRows(
  source: string,
  limit: number,
  tickers?: string[]
): Promise<ScreenerSignal[]> {
  let data: unknown[] = []

  async function selectRows({
    tickerColumn,
  }: {
    tickerColumn?: string
  }): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
    for (const orderColumn of SOURCE_ORDER_COLUMNS) {
      let query = supabase.from(source).select('*')
      if (tickerColumn && tickers && tickers.length > 0) {
        query = query.in(tickerColumn, tickers)
      }

      let ordered:
        | { data: unknown[] | null; error: { message: string } | null }
        | null = null
      try {
        ordered = await withTimeout(
          query.order(orderColumn, { ascending: false }).limit(limit),
          SUPABASE_QUERY_TIMEOUT_MS,
          `supabase.${source}.order(${orderColumn})`
        )
      } catch {
        continue
      }
      if (!ordered.error) {
        return { data: ordered.data, error: null }
      }
    }

    let fallbackQuery = supabase.from(source).select('*')
    if (tickerColumn && tickers && tickers.length > 0) {
      fallbackQuery = fallbackQuery.in(tickerColumn, tickers)
    }
    let fallback:
      | { data: unknown[] | null; error: { message: string } | null }
      | null = null
    try {
      fallback = await withTimeout(
        fallbackQuery.limit(limit),
        SUPABASE_QUERY_TIMEOUT_MS,
        `supabase.${source}.fallback`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'supabase_query_timeout'
      return { data: null, error: { message } }
    }
    if (fallback.error) return { data: null, error: { message: fallback.error.message } }
    return { data: fallback.data, error: null }
  }

  if (tickers && tickers.length > 0) {
    const tickerColumns = ['ticker', 'symbol', 'asset_ticker']
    let success = false

    for (const column of tickerColumns) {
      const query = await selectRows({ tickerColumn: column })
      if (query.error) continue
      data = query.data ?? []
      success = true
      break
    }

    if (!success) {
      const fallbackQuery = await selectRows({})
      if (fallbackQuery.error) return []
      data = fallbackQuery.data ?? []
    }
  } else {
    const query = await selectRows({})
    if (query.error) throw query.error
    data = query.data ?? []
  }

  const normalized = data
    .map((row) => normalizeSignalRow(row, source))
    .filter((row): row is ScreenerSignal => row !== null)

  if (!tickers || tickers.length === 0) return normalized
  const tickerSet = new Set(tickers)
  return normalized.filter((row) => tickerSet.has(row.ticker))
}

async function enrichWithQuotes(rows: ScreenerSignal[]): Promise<ScreenerSignal[]> {
  if (rows.length === 0) return rows

  const missing = rows
    .filter((row) => row.price === null || row.changePercent === null || row.name === null)
    .map((row) => row.ticker)
  const uniqueMissing = [...new Set(missing)]
  if (uniqueMissing.length === 0) return rows

  let data: Array<{ ticker: string; name: string | null; price: number | null; change_percent: number | null }> | null = null
  let error: { message: string } | null = null
  try {
    const response = await withTimeout(
      supabase
        .from('market_quotes')
        .select('ticker,name,price,change_percent')
        .in('ticker', uniqueMissing),
      SUPABASE_QUERY_TIMEOUT_MS,
      'supabase.market_quotes.enrich'
    )
    data = response.data as Array<{ ticker: string; name: string | null; price: number | null; change_percent: number | null }> | null
    error = response.error
  } catch {
    return rows
  }

  if (error || !data) return rows

  const quoteByTicker = new Map<string, { name: string | null; price: number | null; change_percent: number | null }>()
  for (const quote of data) {
    quoteByTicker.set(quote.ticker.toUpperCase(), quote)
  }

  return rows.map((row) => {
    const quote = quoteByTicker.get(row.ticker)
    if (!quote) return row
    return {
      ...row,
      name: row.name ?? quote.name ?? null,
      price: row.price ?? quote.price ?? null,
      changePercent: row.changePercent ?? quote.change_percent ?? null,
    }
  })
}

function parseSignalDateMs(value: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function sortScreenerRows(rows: ScreenerSignal[], sortBy: ScreenerSort): ScreenerSignal[] {
  return rows.slice().sort((a, b) => {
    if (sortBy === 'ticker') {
      return a.ticker.localeCompare(b.ticker)
    }

    if (sortBy === 'latest') {
      const dateDelta = parseSignalDateMs(b.signalDate) - parseSignalDateMs(a.signalDate)
      if (dateDelta !== 0) return dateDelta
      const convictionA = a.conviction ?? -1
      const convictionB = b.conviction ?? -1
      if (convictionA !== convictionB) return convictionB - convictionA
      return a.ticker.localeCompare(b.ticker)
    }

    if (sortBy === 'movers') {
      const moveA = Math.abs(a.changePercent ?? -1)
      const moveB = Math.abs(b.changePercent ?? -1)
      if (moveA !== moveB) return moveB - moveA
      const convictionA = a.conviction ?? -1
      const convictionB = b.conviction ?? -1
      if (convictionA !== convictionB) return convictionB - convictionA
      return a.ticker.localeCompare(b.ticker)
    }

    const convictionA = a.conviction ?? -1
    const convictionB = b.conviction ?? -1
    if (convictionA !== convictionB) return convictionB - convictionA

    const dateDelta = parseSignalDateMs(b.signalDate) - parseSignalDateMs(a.signalDate)
    if (dateDelta !== 0) return dateDelta
    return a.ticker.localeCompare(b.ticker)
  })
}

function dedupeByTicker(rows: ScreenerSignal[]): ScreenerSignal[] {
  const map = new Map<string, ScreenerSignal>()

  for (const row of rows) {
    const existing = map.get(row.ticker)
    if (!existing) {
      map.set(row.ticker, row)
      continue
    }

    const existingDate = existing.signalDate ? new Date(existing.signalDate).getTime() : 0
    const rowDate = row.signalDate ? new Date(row.signalDate).getTime() : 0
    if (rowDate > existingDate) {
      map.set(row.ticker, row)
      continue
    }
    if (rowDate === existingDate && (row.conviction ?? -1) > (existing.conviction ?? -1)) {
      map.set(row.ticker, row)
    }
  }

  return [...map.values()]
}

export async function getScreenerSignals(query: ScreenerQuery = {}): Promise<ScreenerResult> {
  const limit = Math.max(1, Math.min(500, query.limit ?? 200))
  const sortBy: ScreenerSort = query.sortBy ?? 'conviction'
  const tickerFilter = (query.tickers ?? [])
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => ticker.length > 0)

  let rows: ScreenerSignal[] = []
  let source: string | null = null
  const startedAt = Date.now()

  for (const candidate of SCREENER_SOURCES) {
    if (Date.now() - startedAt > SCREENER_FETCH_BUDGET_MS) {
      break
    }
    try {
      const candidateRows = await readSourceRows(candidate, limit * 3, tickerFilter)
      if (candidateRows.length === 0) continue
      rows = candidateRows
      source = candidate
      break
    } catch {
      continue
    }
  }

  rows = await enrichWithQuotes(rows)
  rows = dedupeByTicker(rows)
  if (rows.length === 0) {
    rows = buildFallbackScreenerRows(limit * 2)
    source = 'fallback_fixture'
  }

  if (tickerFilter.length > 0) {
    const tickerSet = new Set(tickerFilter)
    rows = rows.filter((row) => tickerSet.has(row.ticker))
  }

  const signalFilter = query.signal
  if (signalFilter) {
    rows = rows.filter((row) => row.direction === signalFilter)
  }

  const minConvictionPct = query.minConvictionPct ?? 0
  if (minConvictionPct > 0) {
    rows = rows.filter((row) => row.conviction !== null && row.conviction * 100 >= minConvictionPct)
  }

  const maxSignalAgeDays = query.maxSignalAgeDays ?? 0
  if (maxSignalAgeDays > 0) {
    const cutoff = Date.now() - maxSignalAgeDays * 24 * 60 * 60 * 1000
    rows = rows.filter((row) => parseSignalDateMs(row.signalDate) >= cutoff)
  }

  const rawQuery = (query.textQuery ?? '').trim().toLowerCase()
  if (rawQuery.length > 0) {
    const tokens = rawQuery.split(/[,\s]+/).filter((token) => token.length > 0).slice(0, 12)
    rows = rows.filter((row) => {
      const ticker = row.ticker.toLowerCase()
      const name = row.name?.toLowerCase() ?? ''
      return tokens.some((token) => ticker.includes(token) || name.includes(token))
    })
  }

  rows = sortScreenerRows(rows, sortBy).slice(0, limit)

  return { rows, source }
}

export async function getScreenerSignalsSafe(
  query: ScreenerQuery = {},
  opts?: { timeoutMs?: number }
): Promise<ScreenerResult> {
  const limit = Math.max(1, Math.min(500, query.limit ?? 200))
  const timeoutMs = Math.max(1000, opts?.timeoutMs ?? SAFE_SCREENER_TIMEOUT_MS)
  try {
    return await withTimeout(getScreenerSignals(query), timeoutMs, 'getScreenerSignals')
  } catch {
    return {
      rows: buildFallbackScreenerRows(limit),
      source: 'fallback_timeout',
    }
  }
}

function sortBySignalDateAscending(rows: ScreenerSignal[]): ScreenerSignal[] {
  return rows.slice().sort((a, b) => {
    const aTime = a.signalDate ? new Date(a.signalDate).getTime() : 0
    const bTime = b.signalDate ? new Date(b.signalDate).getTime() : 0
    return aTime - bTime
  })
}

function dedupeHistoryRows(rows: ScreenerSignal[]): ScreenerSignal[] {
  const byKey = new Map<string, ScreenerSignal>()

  for (const row of rows) {
    if (!row.signalDate) continue
    const date = row.signalDate.slice(0, 10)
    const key = `${row.ticker}:${date}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      continue
    }
    if ((row.conviction ?? -1) > (existing.conviction ?? -1)) {
      byKey.set(key, row)
    }
  }

  return [...byKey.values()]
}

export async function getLastFlipDatesByTicker(
  tickers: string[]
): Promise<Record<string, string | null>> {
  const normalizedTickers = [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()))].filter(
    (ticker) => ticker.length > 0
  )

  const result: Record<string, string | null> = {}
  for (const ticker of normalizedTickers) result[ticker] = null
  if (normalizedTickers.length === 0) return result

  const rowsByTicker = new Map<string, ScreenerSignal[]>()

  for (const source of SIGNAL_HISTORY_SOURCES) {
    const rows = await readSourceRows(source, 5000, normalizedTickers)
    for (const row of rows) {
      const bucket = rowsByTicker.get(row.ticker) ?? []
      bucket.push(row)
      rowsByTicker.set(row.ticker, bucket)
    }
  }

  for (const ticker of normalizedTickers) {
    const rows = rowsByTicker.get(ticker)
    if (!rows || rows.length === 0) continue

    const sorted = sortBySignalDateAscending(rows)
    if (sorted.length === 1) {
      result[ticker] = sorted[0]?.signalDate ?? null
      continue
    }

    let previousDirection = sorted[0]?.direction ?? null
    let lastFlipDate: string | null = null

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      if (!current || !previousDirection) continue

      if (current.direction !== previousDirection && current.signalDate) {
        lastFlipDate = current.signalDate
      }
      previousDirection = current.direction
    }

    result[ticker] = lastFlipDate ?? sorted[sorted.length - 1]?.signalDate ?? null
  }

  return result
}

export async function getSignalFlipsOnDate({
  date,
  tickers,
}: {
  date: string
  tickers?: string[]
}): Promise<SignalFlipEvent[]> {
  const normalizedDate = date.slice(0, 10)
  const normalizedTickers = [...new Set((tickers ?? []).map((ticker) => ticker.trim().toUpperCase()))].filter(
    (ticker) => ticker.length > 0
  )

  const rowsByTicker = new Map<string, ScreenerSignal[]>()
  for (const source of SIGNAL_HISTORY_SOURCES) {
    const rows = await readSourceRows(
      source,
      normalizedTickers.length > 0 ? 5000 : 12000,
      normalizedTickers.length > 0 ? normalizedTickers : undefined
    )
    const dedupedRows = dedupeHistoryRows(rows)

    for (const row of dedupedRows) {
      const bucket = rowsByTicker.get(row.ticker) ?? []
      bucket.push(row)
      rowsByTicker.set(row.ticker, bucket)
    }
  }

  const flips: SignalFlipEvent[] = []
  for (const [ticker, rows] of rowsByTicker.entries()) {
    const sorted = sortBySignalDateAscending(dedupeHistoryRows(rows))
    if (sorted.length < 2) continue

    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      if (!previous || !current || !current.signalDate) continue
      if (previous.direction === current.direction) continue
      if (current.signalDate.slice(0, 10) !== normalizedDate) continue

      flips.push({
        ticker,
        fromDirection: previous.direction,
        toDirection: current.direction,
        signalDate: current.signalDate,
        conviction: current.conviction,
      })
    }
  }

  return flips.sort((a, b) => a.ticker.localeCompare(b.ticker))
}

export async function getSignalCompositionByTicker(
  tickers: string[],
  lookbackRows: number = 90
): Promise<Record<string, ScreenerSignalComposition>> {
  const normalizedTickers = [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()))].filter(
    (ticker) => ticker.length > 0
  )
  const lookback = Math.max(20, Math.min(250, Math.round(lookbackRows)))

  const emptyComposition: ScreenerSignalComposition = {
    bullishCount: 0,
    neutralCount: 0,
    bearishCount: 0,
    total: 0,
    bullishPct: 0,
    neutralPct: 0,
    bearishPct: 0,
    activePct: 0,
  }

  const result: Record<string, ScreenerSignalComposition> = {}
  for (const ticker of normalizedTickers) result[ticker] = { ...emptyComposition }
  if (normalizedTickers.length === 0) return result

  const rowsByTicker = new Map<string, ScreenerSignal[]>()
  // Keep source reads bounded for screener performance while still capturing recent behavior.
  const sourceLimit = 6000

  for (const source of SIGNAL_HISTORY_SOURCES) {
    let rows: ScreenerSignal[] = []
    try {
      rows = await readSourceRows(source, sourceLimit, normalizedTickers)
    } catch {
      continue
    }

    const dedupedRows = dedupeHistoryRows(rows)
    for (const row of dedupedRows) {
      const bucket = rowsByTicker.get(row.ticker) ?? []
      bucket.push(row)
      rowsByTicker.set(row.ticker, bucket)
    }
  }

  for (const ticker of normalizedTickers) {
    const rows = rowsByTicker.get(ticker)
    if (!rows || rows.length === 0) continue

    const history = dedupeHistoryRows(rows)
      .sort((a, b) => parseSignalDateMs(b.signalDate) - parseSignalDateMs(a.signalDate))
      .slice(0, lookback)

    let bullishCount = 0
    let neutralCount = 0
    let bearishCount = 0
    for (const row of history) {
      if (row.direction === 'bullish') bullishCount += 1
      else if (row.direction === 'neutral') neutralCount += 1
      else bearishCount += 1
    }

    const total = bullishCount + neutralCount + bearishCount
    if (total === 0) continue

    const bullishPct = bullishCount / total
    const neutralPct = neutralCount / total
    const bearishPct = bearishCount / total
    const activePct = Math.round((bullishPct + bearishPct) * 100)

    result[ticker] = {
      bullishCount,
      neutralCount,
      bearishCount,
      total,
      bullishPct,
      neutralPct,
      bearishPct,
      activePct,
    }
  }

  return result
}
