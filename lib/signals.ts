import { BackendDataError, fetchBackendJson } from './backend'
import { Signal } from './types'

const SCREENER_FETCH_BUDGET_MS = 9000
const SAFE_SCREENER_TIMEOUT_MS = 9500

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

function normalizeSignalRow(row: unknown): ScreenerSignal | null {
  const record = asRecord(row)
  if (!record) return null

  const ticker =
    getString(record.ticker)?.toUpperCase() ??
    getString(record.symbol)?.toUpperCase() ??
    getString(record.asset_ticker)?.toUpperCase() ??
    null
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

function parseSignalDateMs(value: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
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

async function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number, context: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(
      () => reject(new BackendDataError(context, `${context} timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  })

  try {
    return await Promise.race([Promise.resolve(operation), timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getRecentSignals(limit = 20): Promise<Signal[]> {
  return getSignalHistoryForTicker('SPY', limit)
}

export async function getSignalHistoryForTicker(tickerRaw: string, limit = 250): Promise<Signal[]> {
  const ticker = tickerRaw.trim().toUpperCase()
  if (!ticker) return []

  const payload = await fetchBackendJson<unknown>(
    `/signals/history/${encodeURIComponent(ticker)}?limit=${Math.max(1, Math.min(limit, 2000))}`,
    {
      context: 'backend.signals.history',
      timeoutMs: SCREENER_FETCH_BUDGET_MS,
    }
  )
  if (!Array.isArray(payload)) {
    throw new BackendDataError('backend.signals.history', 'Invalid history payload shape')
  }
  return payload as Signal[]
}

export async function getLatestSignal(): Promise<Signal | null> {
  const signals = await getRecentSignals(1)
  return signals[0] ?? null
}

export async function getDataStartDate(): Promise<string | null> {
  const signals = await getSignalHistoryForTicker('SPY', 1000)
  return signals.length > 0 ? signals[signals.length - 1]?.signal_date ?? null : null
}

async function readLatestTickerSignalRows(limit: number, tickers?: string[]): Promise<ScreenerSignal[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (tickers && tickers.length > 0) {
    params.set('tickers', tickers.join(','))
  }

  const payload = await fetchBackendJson<unknown>(`/screener/signals?${params.toString()}`, {
    context: 'backend.screener.signals',
    timeoutMs: SCREENER_FETCH_BUDGET_MS,
  })
  if (!Array.isArray(payload)) {
    throw new BackendDataError('backend.screener.signals', 'Invalid screener payload shape')
  }

  return payload
    .map((row) => normalizeSignalRow(row))
    .filter((row): row is ScreenerSignal => row !== null)
}

export async function getScreenerSignals(query: ScreenerQuery = {}): Promise<ScreenerResult> {
  const limit = Math.max(1, Math.min(500, query.limit ?? 200))
  const sortBy: ScreenerSort = query.sortBy ?? 'conviction'
  const tickerFilter = (query.tickers ?? [])
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => ticker.length > 0)

  let rows = dedupeByTicker(await readLatestTickerSignalRows(limit, tickerFilter))

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
  return { rows, source: 'finance_backend_screener' }
}

export async function getScreenerSignalsSafe(
  query: ScreenerQuery = {},
  opts?: { timeoutMs?: number }
): Promise<ScreenerResult> {
  const timeoutMs = Math.max(1000, opts?.timeoutMs ?? SAFE_SCREENER_TIMEOUT_MS)
  return withTimeout(getScreenerSignals(query), timeoutMs, 'getScreenerSignals')
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

  const payload = await fetchBackendJson<unknown>(
    `/signals/last-flips?tickers=${encodeURIComponent(normalizedTickers.join(','))}`,
    {
      context: 'backend.signals.last_flips',
      timeoutMs: SCREENER_FETCH_BUDGET_MS,
    }
  )
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BackendDataError('backend.signals.last_flips', 'Invalid last flips payload shape')
  }

  for (const ticker of normalizedTickers) {
    const value = (payload as Record<string, unknown>)[ticker]
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

  const payload = await fetchBackendJson<unknown>(`/signals/flips?${params.toString()}`, {
    context: 'backend.signals.flips',
    timeoutMs: SCREENER_FETCH_BUDGET_MS,
  })
  if (!Array.isArray(payload)) {
    throw new BackendDataError('backend.signals.flips', 'Invalid flips payload shape')
  }
  return payload as SignalFlipEvent[]
}
