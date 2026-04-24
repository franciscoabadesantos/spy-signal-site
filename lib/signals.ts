import { Signal } from './types'

const SCREENER_FETCH_BUDGET_MS = 9000
const SAFE_SCREENER_TIMEOUT_MS = 9500

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    accept: 'application/json',
  }
  const secret = (
    process.env.BACKEND_SHARED_SECRET ||
    process.env.FINANCE_BACKEND_SHARED_SECRET ||
    ''
  ).trim()
  if (secret) headers['x-backend-shared-secret'] = secret
  return headers
}

async function backendJson<T>(path: string, context: string): Promise<T | null> {
  const base = backendBaseUrl()
  if (!base) return null
  const response = await withTimeout(
    fetch(`${base}${path}`, {
      cache: 'no-store',
      headers: backendHeaders(),
    }),
    SCREENER_FETCH_BUDGET_MS,
    context
  ).catch(() => null)
  if (!response || !response.ok) return null
  return (await response.json().catch(() => null)) as T | null
}

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
  return getSignalHistoryForTicker('SPY', limit, { allowSyntheticFallback: false })
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

  const payload = await backendJson<Signal[]>(`/signals/history/${encodeURIComponent(ticker)}?limit=${Math.max(1, Math.min(limit, 2000))}`, 'backend.signals.history')
  const rows = Array.isArray(payload) ? payload : []
  if (rows.length > 0) return rows
  return allowSyntheticFallback ? buildFallbackSignalHistory(ticker, limit) : []
}

export async function getLatestSignal(): Promise<Signal | null> {
  const signals = await getRecentSignals(1)
  return signals[0] ?? null
}

export async function getDataStartDate(): Promise<string | null> {
  const signals = await getSignalHistoryForTicker('SPY', 1000, { allowSyntheticFallback: false })
  return signals.length > 0 ? signals[signals.length - 1]?.signal_date ?? null : null
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

function normalizeTickerSignalLabel(raw: unknown): SignalDirection | null {
  const value = getString(raw)?.toLowerCase()
  if (!value) return null
  if (value === 'positive') return 'bullish'
  if (value === 'caution') return 'bearish'
  if (value === 'watch' || value === 'neutral') return 'neutral'
  return null
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

type AnalysisJobRecord = {
  job_id: string
  ticker: string
  finished_at: string | null
}

function normalizeAnalysisJobRecord(row: unknown): AnalysisJobRecord | null {
  const record = asRecord(row)
  if (!record) return null
  const jobId = getString(record.job_id)
  const ticker = getString(record.ticker)?.toUpperCase()
  if (!jobId || !ticker) return null
  return {
    job_id: jobId,
    ticker,
    finished_at: getString(record.finished_at),
  }
}

function normalizeTickerSignalAnalysisRow(
  job: AnalysisJobRecord,
  resultRow: unknown
): ScreenerSignal | null {
  const record = asRecord(resultRow)
  if (!record) return null
  const resultJson = asRecord(record.result_json)
  if (!resultJson) return null

  const summary = asRecord(resultJson.summary)
  const signal = asRecord(resultJson.signal)
  const market = asRecord(resultJson.market)

  const direction =
    normalizeTickerSignalLabel(summary?.signal_label) ??
    normalizeTickerSignalLabel(signal?.label)
  if (!direction) return null

  const conviction =
    normalizeConviction(summary?.confidence) ??
    normalizeConviction(signal?.confidence)

  const signalDate =
    getString(summary?.generated_at) ??
    getString(record.created_at) ??
    job.finished_at

  const lastPrice = getNumber(market?.last_price)
  const return1d = getNumber(market?.return_1d_pct)

  return {
    ticker: job.ticker,
    name: null,
    direction,
    conviction,
    signalDate,
    predictionHorizon: null,
    price: lastPrice,
    changePercent: return1d === null ? null : return1d * 100,
  }
}

function normalizeBackendScreenerRow(row: unknown): ScreenerSignal | null {
  return normalizeSignalRow(row)
}

async function readSourceRows(
  _source: string,
  _limit: number,
  _tickers?: string[]
): Promise<ScreenerSignal[]> {
  return []
}

async function readLatestTickerSignalRows(
  limit: number,
  tickers?: string[]
): Promise<ScreenerSignal[]> {
  const backendBase = (
    process.env.FINANCE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL ||
    ''
  ).trim().replace(/\/+$/, '')
  if (!backendBase) {
    throw new Error('FINANCE_BACKEND_URL is not configured')
  }

  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (tickers && tickers.length > 0) {
    params.set('tickers', tickers.join(','))
  }

  const response = await withTimeout(
    fetch(`${backendBase}/screener/signals?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    }),
    SCREENER_FETCH_BUDGET_MS,
    'backend.screener.signals'
  )

  if (!response.ok) {
    throw new Error(`backend_screener_http_${response.status}`)
  }

  const payload = await response.json().catch(() => [])
  if (!Array.isArray(payload)) return []

  return payload
    .map((row) => normalizeBackendScreenerRow(row))
    .filter((row): row is ScreenerSignal => row !== null)
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

  try {
    rows = await readLatestTickerSignalRows(limit, tickerFilter)
    if (rows.length > 0) {
      source = 'finance_backend_screener'
    }
  } catch {
    rows = []
  }

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

  const payload = await backendJson<Record<string, string | null>>(
    `/signals/last-flips?tickers=${encodeURIComponent(normalizedTickers.join(','))}`,
    'backend.signals.last_flips'
  )
  if (!payload || typeof payload !== 'object') return result

  for (const ticker of normalizedTickers) {
    const value = payload[ticker]
    result[ticker] = typeof value === 'string' ? value : null
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

  const params = new URLSearchParams()
  params.set('date', normalizedDate)
  if (normalizedTickers.length > 0) params.set('tickers', normalizedTickers.join(','))

  const payload = await backendJson<SignalFlipEvent[]>(`/signals/flips?${params.toString()}`, 'backend.signals.flips')
  return Array.isArray(payload) ? payload : []
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

  const payload = await backendJson<Record<string, ScreenerSignalComposition>>(
    `/signals/composition?tickers=${encodeURIComponent(normalizedTickers.join(','))}&lookback_rows=${lookback}`,
    'backend.signals.composition'
  )
  if (!payload || typeof payload !== 'object') return result

  for (const ticker of normalizedTickers) {
    const row = payload[ticker]
    if (!row || typeof row !== 'object') continue
    result[ticker] = {
      bullishCount: typeof row.bullishCount === 'number' ? row.bullishCount : 0,
      neutralCount: typeof row.neutralCount === 'number' ? row.neutralCount : 0,
      bearishCount: typeof row.bearishCount === 'number' ? row.bearishCount : 0,
      total: typeof row.total === 'number' ? row.total : 0,
      bullishPct: typeof row.bullishPct === 'number' ? row.bullishPct : 0,
      neutralPct: typeof row.neutralPct === 'number' ? row.neutralPct : 0,
      bearishPct: typeof row.bearishPct === 'number' ? row.bearishPct : 0,
      activePct: typeof row.activePct === 'number' ? row.activePct : 0,
    }
  }

  return result
}
