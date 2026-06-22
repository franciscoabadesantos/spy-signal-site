import { unstable_cache } from 'next/cache'
import { BackendDataError, fetchBackendJson } from './backend'
import { getCachedTickerSummary } from './ticker-data'

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com'
const YAHOO_HEADERS = {
  Accept: 'application/json,text/plain,*/*',
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}

const RETRY_DELAYS_MS = [250, 600, 1200]
const YAHOO_COOLDOWN_MS = 5 * 60 * 1000
const QUOTE_FRESH_MS = 60 * 1000
const HISTORICAL_FRESH_MS = 60 * 60 * 1000
const FUNDAMENTALS_FRESH_MS = 6 * 60 * 60 * 1000

let yahooHistoricalCooldownUntil = 0
let marketCacheAvailable: boolean | null = null
let missingSchemaLogged = false
const writeSupportLogged = false

const canWriteCache = false

export interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: string
}

export interface PricePoint {
  date: string
  close: number
}

export type OhlcPoint = {
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number
  volume: number | null
}

export interface TickerHolding {
  symbol: string
  name: string
  weightPercent: number | null
}

export interface TickerFinancialRow {
  label: string
  value: string
}

export interface TickerSectorWeight {
  sector: string
  weightPercent: number | null
}

export interface TickerFundamentals {
  about: string | null
  marketCap: string | null
  snapshot: TickerFinancialRow[]
  holdings: TickerHolding[]
  sectorWeights: TickerSectorWeight[]
  dividendRate: string | null
  dividendYield: string | null
  exDividendDate: string | null
  payoutRatio: string | null
  profile: TickerFinancialRow[]
  portfolio: TickerFinancialRow[]
  distributions: TickerFinancialRow[]
  risk: TickerFinancialRow[]
}

export interface TickerNewsItem {
  id: string
  title: string
  publisher: string
  url: string
  publishedAt: string | null
  imageUrl: string | null
  sourceUrl: string | null
}

interface ChartApiResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>
        }>
      }
    }>
  }
}

interface FormattedValue {
  raw?: number | string | null
  fmt?: string | null
  longFmt?: string | null
}

interface MarketQuoteRow {
  ticker: string
  name: string | null
  price: number | null
  change: number | null
  change_percent: number | null
  market_cap_text: string | null
  fetched_at: string
}

interface MarketPriceDailyRow {
  date: string
  close: number | string
  fetched_at: string
}

type FundamentalsSource = 'backend' | 'fallback_quote'

export interface RefreshTickerResult {
  ticker: string
  quoteSource: null
  quoteUpdated: boolean
  historicalUpdated: boolean
  fundamentalsSource: FundamentalsSource | null
  fundamentalsUpdated: boolean
  errors: string[]
}

class YahooHttpError extends Error {
  readonly status: number

  constructor(status: number, statusText: string, details?: string) {
    const suffix = details ? `: ${details}` : ''
    super(`Yahoo request failed (${status} ${statusText})${suffix}`)
    this.status = status
  }
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readFormattedValue(value: unknown): FormattedValue | null {
  if (!value || typeof value !== 'object') return null
  return value as FormattedValue
}

function getRawNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$%,]/g, '').trim())
    if (Number.isFinite(parsed)) return parsed
  }
  const formattedValue = readFormattedValue(value)
  if (!formattedValue) return null
  const raw = formattedValue.raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const parsed = Number(raw.replace(/[$%,]/g, '').trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function getDisplayValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString()
  const formattedValue = readFormattedValue(value)
  if (!formattedValue) return null
  if (typeof formattedValue.fmt === 'string' && formattedValue.fmt.trim()) return formattedValue.fmt.trim()
  if (typeof formattedValue.longFmt === 'string' && formattedValue.longFmt.trim()) {
    return formattedValue.longFmt.trim()
  }
  const raw = formattedValue.raw
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw.toLocaleString()
  return null
}

function formatPercent(raw: number | null): string | null {
  if (raw === null || !Number.isFinite(raw)) return null
  return `${(raw * 100).toFixed(2)}%`
}

function formatUnixDate(rawSeconds: number | null): string | null {
  if (rawSeconds === null || !Number.isFinite(rawSeconds)) return null
  return new Date(rawSeconds * 1000).toISOString().slice(0, 10)
}

function formatUnixDateDisplay(rawSeconds: number | null): string | null {
  if (rawSeconds === null || !Number.isFinite(rawSeconds)) return null
  return new Date(rawSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrencyCompact(raw: number | null): string | null {
  if (raw === null || !Number.isFinite(raw)) return null
  if (raw >= 1e12) return `${(raw / 1e12).toFixed(2)}T`
  if (raw >= 1e9) return `${(raw / 1e9).toFixed(2)}B`
  if (raw >= 1e6) return `${(raw / 1e6).toFixed(2)}M`
  return raw.toLocaleString()
}

function formatDollarCompact(raw: number | null): string | null {
  const compact = formatCurrencyCompact(raw)
  if (!compact) return null
  return compact.startsWith('$') ? compact : `$${compact}`
}

function formatNumberCompact(raw: number | null): string | null {
  if (raw === null || !Number.isFinite(raw)) return null
  if (raw >= 1e12) return `${(raw / 1e12).toFixed(2)}T`
  if (raw >= 1e9) return `${(raw / 1e9).toFixed(2)}B`
  if (raw >= 1e6) return `${(raw / 1e6).toFixed(2)}M`
  if (raw >= 1e3) return `${(raw / 1e3).toFixed(2)}K`
  return raw.toLocaleString()
}

function parseMaybeNumber(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase() + token.slice(1).toLowerCase())
    .join(' ')
}

function formatPercentFromValue(value: unknown): string | null {
  const fmt = getDisplayValue(value)
  if (fmt && fmt.includes('%')) return fmt
  const raw = getRawNumber(value)
  return formatPercent(raw)
}

function formatNumberFixed(value: unknown, digits: number = 2): string | null {
  const raw = getRawNumber(value)
  if (raw === null) return null
  return raw.toFixed(digits)
}

function formatRange(low: unknown, high: unknown): string | null {
  const lowFmt = getDisplayValue(low) ?? formatNumberFixed(low)
  const highFmt = getDisplayValue(high) ?? formatNumberFixed(high)
  if (!lowFmt || !highFmt) return null
  return `${lowFmt} - ${highFmt}`
}

function formatPayoutFrequency(value: unknown): string | null {
  const direct = getString(value)
  if (direct) return toTitleCase(direct)
  const raw = getRawNumber(value)
  if (raw === null) return null
  const freq = Math.round(raw)
  if (freq === 12) return 'Monthly'
  if (freq === 4) return 'Quarterly'
  if (freq === 2) return 'Semi-Annual'
  if (freq === 1) return 'Annual'
  return `${freq}x/year`
}

function isRetriableStatus(status: number): boolean {
  return status === 408 || status >= 500
}

function isRateLimitedYahooError(error: unknown): boolean {
  return error instanceof YahooHttpError && error.status === 429
}

function errorTreeMatches(
  error: unknown,
  predicate: (entry: { name?: string; message?: string; code?: string }) => boolean,
  seen = new Set<unknown>()
): boolean {
  if (!error || (typeof error !== 'object' && typeof error !== 'function')) return false
  if (seen.has(error)) return false
  seen.add(error)

  const entry = error as {
    name?: unknown
    message?: unknown
    code?: unknown
    cause?: unknown
    errors?: unknown[]
  }

  if (
    predicate({
      name: typeof entry.name === 'string' ? entry.name : undefined,
      message: typeof entry.message === 'string' ? entry.message : undefined,
      code: typeof entry.code === 'string' ? entry.code : undefined,
    })
  ) {
    return true
  }

  if (Array.isArray(entry.errors)) {
    for (const nested of entry.errors) {
      if (errorTreeMatches(nested, predicate, seen)) return true
    }
  }

  return errorTreeMatches(entry.cause, predicate, seen)
}

function isTransientNetworkError(error: unknown): boolean {
  return errorTreeMatches(error, ({ name, message, code }) => {
    const normalizedCode = code?.toUpperCase()
    const normalizedMessage = message?.toLowerCase() ?? ''
    if (name === 'AbortError') return true
    if (
      normalizedCode === 'ETIMEDOUT' ||
      normalizedCode === 'ECONNRESET' ||
      normalizedCode === 'ECONNREFUSED' ||
      normalizedCode === 'ENETUNREACH' ||
      normalizedCode === 'EHOSTUNREACH' ||
      normalizedCode === 'ENOTFOUND' ||
      normalizedCode === 'EAI_AGAIN' ||
      normalizedCode === 'UND_ERR_CONNECT_TIMEOUT'
    ) {
      return true
    }
    return (
      normalizedMessage.includes('timed out') ||
      normalizedMessage.includes('timeout') ||
      normalizedMessage.includes('operation was aborted') ||
      normalizedMessage.includes('fetch failed')
    )
  })
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; message?: string }
  if (err.code === '42P01' || err.code === 'PGRST205') return true
  if (typeof err.message !== 'string') return false
  return err.message.includes('does not exist') || err.message.includes('Could not find the table')
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'unknown_error'
  }
}

function markMissingSchema() {
  marketCacheAvailable = false
  if (!missingSchemaLogged) {
    console.warn(
      'Market cache tables are missing. Run the SQL migration in supabase/sql/market_cache.sql to enable Supabase-backed market caching.'
    )
    missingSchemaLogged = true
  }
}

function shouldUseCache(): boolean {
  return marketCacheAvailable !== false
}

function hasFreshTimestamp(fetchedAt: string, maxAgeMs: number): boolean {
  const ts = Date.parse(fetchedAt)
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts <= maxAgeMs
}

async function fetchYahooJson<T>(url: string): Promise<T> {
  if (Date.now() < yahooHistoricalCooldownUntil) {
    throw new YahooHttpError(
      429,
      'Too Many Requests',
      'Yahoo historical cooldown active'
    )
  }

  let lastError: unknown = new Error('Yahoo request failed')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(url, {
        headers: YAHOO_HEADERS,
        cache: 'no-store',
      })

      if (!res.ok) {
        const snippet = (await res.text().catch(() => '')).slice(0, 160)
        const error = new YahooHttpError(res.status, res.statusText, snippet || undefined)

        if (res.status === 429) {
          yahooHistoricalCooldownUntil = Date.now() + YAHOO_COOLDOWN_MS
          throw error
        }

        if (attempt < RETRY_DELAYS_MS.length && isRetriableStatus(res.status)) {
          await sleep(RETRY_DELAYS_MS[attempt])
          continue
        }

        throw error
      }

      return (await res.json()) as T
    } catch (error) {
      if (isRateLimitedYahooError(error)) throw error

      lastError = error
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt])
      }
    }
  }

  throw lastError
}

async function fetchYahooHistorical(ticker: string, periodDays: number): Promise<PricePoint[]> {
  const period2 = Math.floor(Date.now() / 1000)
  const period1 = period2 - periodDays * 24 * 60 * 60
  const url =
    `${YAHOO_API_BASE}/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${period1}&period2=${period2}&interval=1d&events=history&includePrePost=false`

  const data = await fetchYahooJson<ChartApiResponse>(url)
  const result = data.chart?.result?.[0]
  const timestamps = result?.timestamp || []
  const closes = result?.indicators?.quote?.[0]?.close || []
  const points: PricePoint[] = []

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i]
    const close = closes[i]
    if (typeof ts !== 'number' || typeof close !== 'number' || Number.isNaN(close)) continue

    points.push({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: Number(close.toFixed(2)),
    })
  }

  return points
}

function emptyFundamentals(): TickerFundamentals {
  return {
    about: null,
    marketCap: null,
    snapshot: [],
    holdings: [],
    sectorWeights: [],
    dividendRate: null,
    dividendYield: null,
    exDividendDate: null,
    payoutRatio: null,
    profile: [],
    portfolio: [],
    distributions: [],
    risk: [],
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function parseCachedFinancialRows(value: unknown): TickerFinancialRow[] {
  return asArray(value)
    .map((item): TickerFinancialRow | null => {
      const row = asRecord(item)
      if (!row) return null
      const label = getString(row.label)
      const rowValue = getString(row.value)
      if (!label || !rowValue) return null
      return { label, value: rowValue }
    })
    .filter((row): row is TickerFinancialRow => row !== null)
}

function parseCachedHoldings(value: unknown): TickerHolding[] {
  return asArray(value)
    .map((item): TickerHolding | null => {
      const row = asRecord(item)
      if (!row) return null
      const symbol = getString(row.symbol)
      const name = getString(row.name)
      if (!symbol || !name) return null
      const rawWeight =
        typeof row.weightPercent === 'number'
          ? row.weightPercent
          : typeof row.weightPercent === 'string'
            ? Number(row.weightPercent)
            : null
      return {
        symbol,
        name,
        weightPercent: rawWeight !== null && Number.isFinite(rawWeight) ? rawWeight : null,
      }
    })
    .filter((row): row is TickerHolding => row !== null)
}

function parseCachedSectorWeights(value: unknown): TickerSectorWeight[] {
  return asArray(value)
    .map((item): TickerSectorWeight | null => {
      const row = asRecord(item)
      if (!row) return null
      const sector = getString(row.sector)
      if (!sector) return null
      const rawWeight =
        typeof row.weightPercent === 'number'
          ? row.weightPercent
          : typeof row.weightPercent === 'string'
            ? Number(row.weightPercent)
            : null
      return {
        sector,
        weightPercent: rawWeight !== null && Number.isFinite(rawWeight) ? rawWeight : null,
      }
    })
    .filter((row): row is TickerSectorWeight => row !== null)
}

function parseCachedFundamentalsPayload(payload: unknown): TickerFundamentals | null {
  const record = asRecord(payload)
  if (!record) return null

  return {
    about: getString(record.about),
    marketCap: getString(record.marketCap),
    snapshot: parseCachedFinancialRows(record.snapshot),
    holdings: parseCachedHoldings(record.holdings),
    sectorWeights: parseCachedSectorWeights(record.sectorWeights),
    dividendRate: getString(record.dividendRate),
    dividendYield: getString(record.dividendYield),
    exDividendDate: getString(record.exDividendDate),
    payoutRatio: getString(record.payoutRatio),
    profile: parseCachedFinancialRows(record.profile),
    portfolio: parseCachedFinancialRows(record.portfolio),
    distributions: parseCachedFinancialRows(record.distributions),
    risk: parseCachedFinancialRows(record.risk),
  }
}

function hasMeaningfulFundamentalsData(fundamentals: TickerFundamentals): boolean {
  if (fundamentals.about || fundamentals.marketCap) return true
  if (fundamentals.holdings.length > 0 || fundamentals.sectorWeights.length > 0) return true
  if (
    fundamentals.dividendRate ||
    fundamentals.dividendYield ||
    fundamentals.exDividendDate ||
    fundamentals.payoutRatio
  ) {
    return true
  }
  if (
    fundamentals.profile.length > 0 ||
    fundamentals.portfolio.length > 0 ||
    fundamentals.distributions.length > 0 ||
    fundamentals.risk.length > 0
  ) {
    return true
  }
  return fundamentals.snapshot.some((row) => row.value !== '—')
}

function snapshotValue(fundamentals: TickerFundamentals, label: string): string | null {
  const row = fundamentals.snapshot.find((item) => item.label === label)
  return row?.value ?? null
}

function shouldTreatAsInsufficientFundamentals(
  ticker: string,
  fundamentals: TickerFundamentals
): boolean {
  if (!hasMeaningfulFundamentalsData(fundamentals)) return true

  // Historical fallback rows can look "meaningful" (symbol/name present) while still being blank.
  // For SPY, require at least one key snapshot metric or structured ETF breakdown rows.
  if (ticker === 'SPY') {
    const keySnapshotLabels = ['Assets', 'Expense Ratio', 'Dividend Yield', 'Inception Date', 'Holdings']
    const hasKeySnapshot = keySnapshotLabels.some((label) => {
      const value = snapshotValue(fundamentals, label)
      return Boolean(value && value !== '—')
    })

    const hasStructuredBreakdown =
      fundamentals.holdings.length > 0 ||
      fundamentals.sectorWeights.length > 0 ||
      fundamentals.portfolio.length > 0 ||
      fundamentals.distributions.length > 0 ||
      fundamentals.risk.length > 0

    if (!hasKeySnapshot && !hasStructuredBreakdown) return true
  }

  return false
}

function buildPortfolioRows(
  holdings: TickerHolding[],
  sectorWeights: TickerSectorWeight[]
): TickerFinancialRow[] {
  const rows: TickerFinancialRow[] = []
  rows.push({ label: 'Number of Holdings', value: holdings.length.toLocaleString() })

  const top10 = holdings
    .slice()
    .sort((a, b) => (b.weightPercent ?? -1) - (a.weightPercent ?? -1))
    .slice(0, 10)
  const top10Concentration = top10.reduce((acc, item) => acc + (item.weightPercent ?? 0), 0)
  if (top10.length > 0) {
    rows.push({ label: 'Top 10 Concentration', value: `${top10Concentration.toFixed(2)}%` })
    const topHolding = top10[0]
    if (topHolding && topHolding.weightPercent !== null) {
      rows.push({
        label: 'Largest Position',
        value: `${topHolding.symbol} (${topHolding.weightPercent.toFixed(2)}%)`,
      })
    }
  }

  if (sectorWeights.length > 0) {
    rows.push({ label: 'Sector Exposures Available', value: `${sectorWeights.length}` })
    const dominantSector = sectorWeights
      .slice()
      .sort((a, b) => (b.weightPercent ?? -1) - (a.weightPercent ?? -1))[0]
    if (dominantSector && dominantSector.weightPercent !== null) {
      rows.push({
        label: 'Largest Sector',
        value: `${dominantSector.sector} (${dominantSector.weightPercent.toFixed(2)}%)`,
      })
    }
  }
  return rows
}

function formatBackendPercent(raw: number | null): string | null {
  if (raw === null || !Number.isFinite(raw)) return null
  return `${raw.toFixed(2)}%`
}

function formatBackendMoney(raw: number | null): string | null {
  if (raw === null || !Number.isFinite(raw)) return null
  if (Math.abs(raw) < 1000) return `$${raw.toFixed(2)}`
  return formatDollarCompact(raw)
}

function formatBackendDate(value: unknown): string | null {
  const direct = getString(value)
  if (direct) {
    const parsed = Date.parse(direct)
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return direct
  }

  const numeric = getRawNumber(value)
  if (numeric === null) return null
  if (numeric > 10_000_000_000) return new Date(numeric).toISOString().slice(0, 10)
  return formatUnixDateDisplay(numeric)
}

function formatBackendRowValue(label: string, value: unknown): string | null {
  const display = getDisplayValue(value)
  const raw = getRawNumber(value)
  const normalized = label.toLowerCase()

  if (/date|inception/.test(normalized)) return formatBackendDate(value)
  if (/yield|ratio|return|distance|expense|turnover|percent|pct/.test(normalized)) {
    return display?.includes('%') ? display : formatBackendPercent(raw)
  }
  if (/market cap|assets|dividend rate|annual dividend/.test(normalized)) {
    return display?.startsWith('$') ? display : formatBackendMoney(raw)
  }
  if (/shares|holdings|exposures/.test(normalized)) {
    return raw !== null ? formatNumberCompact(raw) : display
  }
  if (/high|low|price|p\/e|pe|beta/.test(normalized)) {
    return raw !== null ? raw.toFixed(2) : display
  }

  return display
}

function parseBackendFinancialRows(value: unknown): TickerFinancialRow[] {
  return asArray(value)
    .map((item): TickerFinancialRow | null => {
      const row = asRecord(item)
      if (!row) return null
      const label = getString(row.label) ?? getString(row.key)
      if (!label) return null
      const rowValue = formatBackendRowValue(label, row.value)
      if (!rowValue) return null
      return { label, value: rowValue }
    })
    .filter((row): row is TickerFinancialRow => row !== null)
}

function parseBackendHoldings(value: unknown): TickerHolding[] {
  return asArray(value)
    .map((item): TickerHolding | null => {
      const row = asRecord(item)
      if (!row) return null
      const symbol = getString(row.symbol) ?? getString(row.ticker)
      const name = getString(row.name) ?? getString(row.companyName) ?? symbol
      if (!symbol && !name) return null
      const weight = getRawNumber(row.weightPercent ?? row.weight ?? row.weight_pct)
      return {
        symbol: symbol ?? name ?? 'Unknown',
        name: name ?? symbol ?? 'Unknown',
        weightPercent: weight !== null ? Number(weight.toFixed(4)) : null,
      }
    })
    .filter((row): row is TickerHolding => row !== null)
}

function parseBackendSectorWeights(value: unknown): TickerSectorWeight[] {
  return asArray(value)
    .map((item): TickerSectorWeight | null => {
      const row = asRecord(item)
      if (!row) return null
      const sector = getString(row.sector) ?? getString(row.name)
      if (!sector) return null
      const weight = getRawNumber(row.weightPercent ?? row.weight ?? row.weight_pct)
      return {
        sector,
        weightPercent: weight !== null ? Number(weight.toFixed(4)) : null,
      }
    })
    .filter((row): row is TickerSectorWeight => row !== null)
}

function firstBackendRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    const record = asRecord(value)
    if (record) return record
  }
  return null
}

function firstBackendValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key]
  }
  return null
}

function ensureProfileIdentityRows(
  profileRows: TickerFinancialRow[],
  ticker: string,
  name: string | null,
  marketCap: string | null
): TickerFinancialRow[] {
  const rows = [...profileRows]
  if (!rows.some((row) => row.label === 'Symbol')) rows.unshift({ label: 'Symbol', value: ticker })
  if (name && !rows.some((row) => row.label === 'Name')) rows.splice(1, 0, { label: 'Name', value: name })
  if (marketCap && !rows.some((row) => row.label === 'Market Cap')) {
    rows.push({ label: 'Market Cap', value: marketCap })
  }
  return rows
}

function buildFallbackFundamentalsFromBackendSummary(summary: Awaited<ReturnType<typeof getCachedTickerSummary>>): TickerFundamentals {
  const fallback = emptyFundamentals()
  if (!summary) return fallback

  const rows = Array.isArray(summary.latestFundamentals) ? summary.latestFundamentals : []
  fallback.snapshot = rows
    .map((row) => {
      const label = typeof row?.metricLabel === 'string' && row.metricLabel.trim() ? row.metricLabel : null
      const valueDisplay = typeof row?.valueDisplay === 'string' && row.valueDisplay.trim() ? row.valueDisplay : null
      const valueNumber = typeof row?.valueNumber === 'number' && Number.isFinite(row.valueNumber) ? row.valueNumber : null
      if (!label) return null
      return {
        label,
        value:
          formatBackendRowValue(label, valueDisplay ?? valueNumber) ??
          (valueNumber !== null ? String(valueNumber) : '—'),
      }
    })
    .filter((row): row is TickerFinancialRow => row !== null)
    .slice(0, 10)

  const marketCapNumber = summary.fundamentalsSummary?.marketCap ?? null
  const quoteMarketCapText =
    typeof summary.quote?.marketCapText === 'string' && summary.quote.marketCapText.trim()
      ? summary.quote.marketCapText
      : null
  fallback.marketCap =
    formatBackendMoney(getRawNumber(quoteMarketCapText)) ??
    quoteMarketCapText ??
    formatBackendMoney(marketCapNumber)
  fallback.profile = ensureProfileIdentityRows(
    [],
    summary.ticker,
    summary.quote?.name ?? null,
    fallback.marketCap
  )
  return fallback
}

function normalizeBackendProfilePayload(
  payload: unknown,
  summary: Awaited<ReturnType<typeof getCachedTickerSummary>>,
  ticker: string
): TickerFundamentals | null {
  const record = firstBackendRecord(
    payload,
    asRecord(payload)?.profilePayload,
    asRecord(payload)?.fundamentals,
    asRecord(payload)?.tickerProfile
  )
  if (!record) return null

  const holdings = parseBackendHoldings(record.holdings)
  const sectorWeights = parseBackendSectorWeights(record.sectorWeights ?? record.sector_weights)
  const marketCap = formatBackendMoney(getRawNumber(firstBackendValue(record, ['marketCap', 'market_cap'])))
  const dividendRate = formatBackendMoney(getRawNumber(firstBackendValue(record, ['dividendRate', 'dividend_rate'])))
  const dividendYield = formatBackendPercent(getRawNumber(firstBackendValue(record, ['dividendYield', 'dividend_yield'])))
  const exDividendDate = formatBackendDate(firstBackendValue(record, ['exDividendDate', 'ex_dividend_date']))
  const payoutRatio = formatBackendPercent(getRawNumber(firstBackendValue(record, ['payoutRatio', 'payout_ratio'])))
  const profileRows = parseBackendFinancialRows(record.profile)
  const portfolioRows = parseBackendFinancialRows(record.portfolio)
  const distributions = parseBackendFinancialRows(record.distributions)
  const risk = parseBackendFinancialRows(record.risk)

  const fundamentals: TickerFundamentals = {
    about:
      getString(record.about) ??
      getString(record.description) ??
      getString(record.longBusinessSummary) ??
      null,
    marketCap:
      marketCap ??
      (typeof summary?.quote?.marketCapText === 'string' && summary.quote.marketCapText.trim()
        ? summary.quote.marketCapText
        : null),
    snapshot: parseBackendFinancialRows(record.snapshot),
    holdings,
    sectorWeights,
    dividendRate,
    dividendYield,
    exDividendDate,
    payoutRatio,
    profile: ensureProfileIdentityRows(
      profileRows,
      ticker,
      summary?.quote?.name ?? null,
      marketCap
    ),
    portfolio: portfolioRows.length > 0 ? portfolioRows : buildPortfolioRows(holdings, sectorWeights),
    distributions,
    risk,
  }

  return fundamentals
}

async function fetchBackendTickerProfile(ticker: string): Promise<unknown | null> {
  try {
    return await fetchBackendJson<unknown>(`/tickers/${encodeURIComponent(ticker)}/profile`, {
      context: 'backend.tickers.profile',
      init: {
        cache: 'force-cache',
        next: {
          revalidate: FUNDAMENTALS_FRESH_MS / 1000,
          tags: [`ticker-profile:${ticker}`],
        },
      },
    })
  } catch (error) {
    if (error instanceof BackendDataError) {
      if (error.status !== 404 && error.status !== 422) {
        console.warn(`Backend profile unavailable for ${ticker}; using summary fundamentals only.`)
      }
      return null
    }
    throw error
  }
}

async function readCachedQuote(
  _ticker: string,
  _maxAgeMs?: number
): Promise<StockQuote | null> {
  return null
}

async function readCachedHistorical(
  _ticker: string,
  _periodDays: number,
  _maxAgeMs?: number
): Promise<PricePoint[]> {
  return []
}

async function readCachedFundamentals(
  _ticker: string,
  _maxAgeMs?: number
): Promise<TickerFundamentals | null> {
  return null
}

async function writeQuoteCache(
  _ticker: string,
  _quote: StockQuote,
  _source: 'backend'
): Promise<void> {
  return
}

async function writeHistoricalCache(
  _ticker: string,
  _points: PricePoint[],
  _source: 'yahoo'
): Promise<void> {
  return
}

async function writeFundamentalsCache(
  _ticker: string,
  _fundamentals: TickerFundamentals,
  _source: FundamentalsSource
): Promise<void> {
  return
}

async function loadQuote(tickerRaw: string): Promise<StockQuote | null> {
  const ticker = normalizeTicker(tickerRaw)
  const summary = await getCachedTickerSummary(ticker)
  const quote = summary?.quote
  if (!quote) return null
  const price = typeof quote.price === 'number' ? quote.price : null
  if (price === null) return null
  return {
    ticker,
    name: typeof quote.name === 'string' && quote.name.trim() ? quote.name : ticker,
    price,
    change: typeof quote.change === 'number' ? quote.change : 0,
    changePercent: typeof quote.changePercent === 'number' ? quote.changePercent : 0,
    marketCap: typeof quote.marketCapText === 'string' && quote.marketCapText.trim() ? quote.marketCapText : 'N/A',
  }
}

async function loadHistorical(tickerRaw: string, periodDays: number): Promise<PricePoint[]> {
  const ticker = normalizeTicker(tickerRaw)
  const safeDays = Number.isFinite(periodDays) && periodDays > 0 ? Math.max(30, Math.min(periodDays, 3650)) : 0
  const payload = await fetchBackendJson<Array<{ date?: string; close?: number }>>(
    `/tickers/${encodeURIComponent(ticker)}/history?period_days=${safeDays}`,
    { context: 'backend.tickers.history' }
  )
  if (!Array.isArray(payload)) return []
  return payload
    .map((row) => {
      const date = typeof row?.date === 'string' ? row.date : null
      const close = typeof row?.close === 'number' ? row.close : null
      if (!date || close === null || !Number.isFinite(close)) return null
      return { date, close: Number(close.toFixed(2)) }
    })
    .filter((point): point is PricePoint => point !== null)
}

async function loadOhlc(tickerRaw: string, periodDays: number): Promise<OhlcPoint[]> {
  const ticker = normalizeTicker(tickerRaw)
  const safeDays = Number.isFinite(periodDays) && periodDays > 0 ? Math.max(30, Math.min(periodDays, 3650)) : 0
  const payload = await fetchBackendJson<
    Array<{ date?: string; open?: number | null; high?: number | null; low?: number | null; close?: number; volume?: number | null }>
  >(`/tickers/${encodeURIComponent(ticker)}/ohlc?period_days=${safeDays}`, { context: 'backend.tickers.ohlc' })
  if (!Array.isArray(payload)) return []
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  return payload
    .map((row) => {
      const date = typeof row?.date === 'string' ? row.date : null
      const close = typeof row?.close === 'number' && Number.isFinite(row.close) ? row.close : null
      if (!date || close === null) return null
      return { date, open: num(row.open), high: num(row.high), low: num(row.low), close: Number(close.toFixed(4)), volume: num(row.volume) }
    })
    .filter((p): p is OhlcPoint => p !== null)
}

async function loadTickerFundamentals(tickerRaw: string): Promise<TickerFundamentals> {
  const ticker = normalizeTicker(tickerRaw)
  const summary = await getCachedTickerSummary(ticker)
  if (!summary) {
    return emptyFundamentals()
  }

  const embeddedProfile = normalizeBackendProfilePayload(summary.profile, summary, ticker)
  if (embeddedProfile && hasMeaningfulFundamentalsData(embeddedProfile)) {
    return embeddedProfile
  }

  const remoteProfilePayload = await fetchBackendTickerProfile(ticker)
  const remoteProfile = normalizeBackendProfilePayload(remoteProfilePayload, summary, ticker)
  if (remoteProfile && hasMeaningfulFundamentalsData(remoteProfile)) {
    return remoteProfile
  }

  return buildFallbackFundamentalsFromBackendSummary(summary)
}

export async function refreshTickerMarketData(
  tickerRaw: string,
  _periodDays: number = 120
): Promise<RefreshTickerResult> {
  const ticker = normalizeTicker(tickerRaw)
  const quote = await loadQuote(ticker)
  const historical = await loadHistorical(ticker, 120)
  const fundamentals = await loadTickerFundamentals(ticker)
  return {
    ticker,
    quoteSource: null,
    quoteUpdated: quote !== null,
    historicalUpdated: historical.length > 0,
    fundamentalsSource: hasMeaningfulFundamentalsData(fundamentals) ? 'backend' : null,
    fundamentalsUpdated: Boolean(fundamentals.snapshot.length || fundamentals.profile.length),
    errors: [],
  }
}

export const getStockQuote = unstable_cache(
  async (ticker: string): Promise<StockQuote | null> => loadQuote(ticker),
  ['stock-quote-cache-v2'],
  { revalidate: 60 }
)

export const getHistoricalData = unstable_cache(
  async (ticker: string, periodDays: number = 30): Promise<PricePoint[]> =>
    loadHistorical(ticker, periodDays),
  ['stock-historical-cache-v2'],
  { revalidate: 3600 }
)

export const getOhlcData = unstable_cache(
  async (ticker: string, periodDays: number = 1825): Promise<OhlcPoint[]> => loadOhlc(ticker, periodDays),
  ['stock-ohlc-cache-v1'],
  { revalidate: 3600 }
)

export const getTickerFundamentals = unstable_cache(
  async (ticker: string): Promise<TickerFundamentals> => loadTickerFundamentals(ticker),
  ['stock-fundamentals-cache-v6'],
  { revalidate: 21600 }
)

export async function getTickerNews(
  _ticker: string,
  _limit: number = 5
): Promise<TickerNewsItem[]> {
  return []
}
