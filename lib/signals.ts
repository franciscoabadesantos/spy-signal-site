import { supabase } from './supabase'
import { Signal } from './types'

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

export type ScreenerQuery = {
  signal?: SignalDirection
  minConvictionPct?: number
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

const SCREENER_SOURCES = [
  'latest_signals_view',
  'latest_signals',
  'signals_latest',
  'signals_live',
  'spy_signals_live',
]

const SIGNAL_HISTORY_SOURCES = [
  ...SCREENER_SOURCES,
  'signal_history',
  'signals',
]

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

  if (tickers && tickers.length > 0) {
    const tickerColumns = ['ticker', 'symbol', 'asset_ticker']
    let success = false

    for (const column of tickerColumns) {
      const query = await supabase.from(source).select('*').in(column, tickers).limit(limit)
      if (query.error) continue
      data = query.data ?? []
      success = true
      break
    }

    if (!success) {
      const fallbackQuery = await supabase.from(source).select('*').limit(limit)
      if (fallbackQuery.error) return []
      data = fallbackQuery.data ?? []
    }
  } else {
    const query = await supabase.from(source).select('*').limit(limit)
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

  const { data, error } = await supabase
    .from('market_quotes')
    .select('ticker,name,price,change_percent')
    .in('ticker', uniqueMissing)

  if (error || !data) return rows

  const quoteByTicker = new Map<string, { name: string | null; price: number | null; change_percent: number | null }>()
  for (const quote of data as Array<{ ticker: string; name: string | null; price: number | null; change_percent: number | null }>) {
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

function sortScreenerRows(rows: ScreenerSignal[]): ScreenerSignal[] {
  return rows.slice().sort((a, b) => {
    const convictionA = a.conviction ?? -1
    const convictionB = b.conviction ?? -1
    if (convictionA !== convictionB) return convictionB - convictionA

    const dateA = a.signalDate ? new Date(a.signalDate).getTime() : 0
    const dateB = b.signalDate ? new Date(b.signalDate).getTime() : 0
    return dateB - dateA
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
  const tickerFilter = (query.tickers ?? [])
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => ticker.length > 0)

  let rows: ScreenerSignal[] = []
  let source: string | null = null

  for (const candidate of SCREENER_SOURCES) {
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

  rows = sortScreenerRows(rows).slice(0, limit)

  return { rows, source }
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
