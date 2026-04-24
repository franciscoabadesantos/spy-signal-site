type RowRecord = Record<string, unknown>

export type MarketQuoteSnapshot = {
  ticker: string
  name: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  marketCapText: string | null
  asOf: string | null
}

export type MarketStatsSnapshot = {
  ticker: string
  return1d: number | null
  return1m: number | null
  return3m: number | null
  return1y: number | null
  vol30dPct: number | null
  week52High: number | null
  week52Low: number | null
  distanceFrom52wHighPct: number | null
  distanceFrom52wLowPct: number | null
  asOf: string | null
}

export type SymbolCoverageRow = {
  ticker: string
  hasMarketData: boolean
  hasFundamentals: boolean
  hasEarnings: boolean
  hasSignals: boolean
  marketDataLastDate: string | null
  fundamentalsLastDate: string | null
  nextEarningsDate: string | null
  source: 'coverage_table' | 'inferred'
  updatedAt: string | null
}

export type TickerFundamentalsSummary = {
  ticker: string
  latestRevenue: number | null
  latestEps: number | null
  trailingPe: number | null
  marketCap: number | null
  revenueGrowthYoy: number | null
  earningsGrowthYoy: number | null
  periodEnd: string | null
  currency: string | null
}

export type LatestFundamentalsRow = {
  ticker: string
  metric: string
  metricLabel: string
  valueNumber: number | null
  valueDisplay: string | null
  unit: string | null
  periodEnd: string | null
  asOf: string | null
}

export type NextEarningsRow = {
  ticker: string
  earningsDate: string | null
  earningsTime: string | null
  epsEstimate: number | null
  revenueEstimate: number | null
  fiscalPeriod: string | null
  asOf: string | null
}

export type EarningsHistoryRow = {
  ticker: string
  earningsDate: string | null
  fiscalPeriod: string | null
  epsActual: number | null
  epsEstimate: number | null
  epsSurprisePct: number | null
  revenueActual: number | null
  revenueEstimate: number | null
  revenueSurprisePct: number | null
}

export type TickerPageSummary = {
  ticker: string
  quote: MarketQuoteSnapshot | null
  marketStats: MarketStatsSnapshot | null
  coverage: SymbolCoverageRow
  fundamentalsSummary: TickerFundamentalsSummary | null
  latestFundamentals: LatestFundamentalsRow[]
  nextEarnings: NextEarningsRow | null
  earningsHistory: EarningsHistoryRow[]
}

function asRecord(value: unknown): RowRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as RowRecord
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/[$,%\s,]/g, '')
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function getBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (['true', 't', '1', 'yes', 'y', 'available', 'ready', 'covered'].includes(normalized)) {
    return true
  }
  if (['false', 'f', '0', 'no', 'n', 'missing', 'none', 'unavailable'].includes(normalized)) {
    return false
  }
  return null
}

function pickString(row: RowRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = getString(row[key])
    if (value !== null) return value
  }
  return null
}

function pickNumber(row: RowRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = getNumber(row[key])
    if (value !== null) return value
  }
  return null
}

function pickBoolean(row: RowRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = getBoolean(row[key])
    if (value !== null) return value
  }
  return null
}

function normalizeTicker(tickerRaw: string): string {
  return tickerRaw.trim().toUpperCase()
}

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

async function fetchTickerPageSummaryFromBackend(tickerRaw: string): Promise<TickerPageSummary | null> {
  const ticker = normalizeTicker(tickerRaw)
  const base = backendBaseUrl()
  if (!ticker || !base) return null

  const response = await fetch(`${base}/tickers/${encodeURIComponent(ticker)}/summary`, {
    headers: backendHeaders(),
    cache: 'no-store',
  }).catch(() => null)

  if (!response || !response.ok) return null
  const payload = (await response.json().catch(() => null)) as TickerPageSummary | null
  return payload && typeof payload === 'object' ? payload : null
}

function parseMarketQuote(row: RowRecord | null, ticker: string): MarketQuoteSnapshot | null {
  if (!row) return null

  return {
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    name: pickString(row, ['name', 'company_name', 'asset_name']),
    price: pickNumber(row, ['price', 'last_price', 'close']),
    change: pickNumber(row, ['change', 'price_change', 'change_amount']),
    changePercent: pickNumber(row, ['change_percent', 'pct_change', 'price_change_percent']),
    marketCapText: pickString(row, ['market_cap_text', 'market_cap_display', 'market_cap']),
    asOf: pickString(row, ['as_of', 'quote_time', 'fetched_at', 'updated_at']),
  }
}

function parseMarketStats(row: RowRecord | null, ticker: string): MarketStatsSnapshot | null {
  if (!row) return null

  const return1d =
    pickNumber(row, ['return_1d_pct']) ??
    pickNumber(row, ['return_1d', 'ret_1d', 'daily_return'])
  const return1m =
    pickNumber(row, ['return_1m_pct']) ??
    pickNumber(row, ['return_1m', 'ret_1m', 'monthly_return'])
  const return3m =
    pickNumber(row, ['return_3m_pct']) ??
    pickNumber(row, ['return_3m', 'ret_3m', 'quarterly_return'])
  const return1y =
    pickNumber(row, ['return_1y_pct']) ??
    pickNumber(row, ['return_1y', 'ret_1y', 'yearly_return'])
  const distanceFrom52wHighPct =
    pickNumber(row, [
      'distance_from_52w_high_pct',
      'dist_from_52w_high_pct',
      'dist_to_52w_high_pct',
      'pct_from_52w_high',
    ]) ?? null
  const distanceFrom52wLowPct =
    pickNumber(row, [
      'distance_from_52w_low_pct',
      'dist_from_52w_low_pct',
      'dist_to_52w_low_pct',
      'pct_from_52w_low',
    ]) ?? null

  return {
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    return1d,
    return1m,
    return3m,
    return1y,
    vol30dPct: pickNumber(row, ['vol_30d_pct']),
    week52High: pickNumber(row, ['week_52_high', 'high_52w', 'fifty_two_week_high']),
    week52Low: pickNumber(row, ['week_52_low', 'low_52w', 'fifty_two_week_low']),
    distanceFrom52wHighPct,
    distanceFrom52wLowPct,
    asOf: pickString(row, ['as_of', 'snapshot_at', 'updated_at']),
  }
}

function parseFundamentalsSummary(
  row: RowRecord | null,
  ticker: string
): TickerFundamentalsSummary | null {
  if (!row) return null

  return {
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    latestRevenue: pickNumber(row, ['latest_revenue', 'revenue', 'revenue_latest', 'total_revenue']),
    latestEps: pickNumber(row, ['latest_eps', 'eps', 'eps_diluted', 'diluted_eps']),
    trailingPe: pickNumber(row, ['trailing_pe', 'pe_trailing', 'price_to_earnings']),
    marketCap: pickNumber(row, ['market_cap', 'market_capitalization']),
    revenueGrowthYoy: pickNumber(row, ['revenue_growth_yoy', 'revenue_yoy', 'revenue_growth']),
    earningsGrowthYoy: pickNumber(row, ['earnings_growth_yoy', 'eps_growth_yoy', 'earnings_yoy']),
    periodEnd: pickString(row, ['period_end', 'latest_period_end', 'fiscal_period_end']),
    currency: pickString(row, ['currency', 'reporting_currency']),
  }
}

function formatMetricLabel(metric: string): string {
  return metric
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

function parseLatestFundamentals(rows: RowRecord[], ticker: string): LatestFundamentalsRow[] {
  return rows.map((row) => {
    const metric =
      pickString(row, ['metric', 'metric_name', 'field']) ??
      pickString(row, ['line_item', 'item']) ??
      'metric'
    const valueNumber = pickNumber(row, ['value', 'value_num', 'numeric_value', 'metric_value', 'raw_value'])
    const valueDisplay =
      pickString(row, ['value_display', 'display_value', 'value_text', 'formatted_value']) ??
      (valueNumber !== null ? valueNumber.toLocaleString() : null)

    return {
      ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
      metric,
      metricLabel:
        pickString(row, ['metric_label', 'label', 'display_name']) ?? formatMetricLabel(metric),
      valueNumber,
      valueDisplay,
      unit: pickString(row, ['unit', 'value_unit']),
      periodEnd: pickString(row, ['period_end', 'fiscal_period_end']),
      asOf: pickString(row, ['as_of', 'updated_at']),
    }
  })
}

function parseNextEarnings(row: RowRecord | null, ticker: string): NextEarningsRow | null {
  if (!row) return null

  return {
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    earningsDate: pickString(row, ['earnings_date', 'next_earnings_date', 'report_date']),
    earningsTime: pickString(row, ['earnings_time', 'time_of_day', 'session']),
    epsEstimate: pickNumber(row, ['eps_estimate', 'consensus_eps', 'estimated_eps']),
    revenueEstimate: pickNumber(row, ['revenue_estimate', 'consensus_revenue', 'estimated_revenue']),
    fiscalPeriod: pickString(row, ['fiscal_period', 'fiscal_quarter', 'quarter']),
    asOf: pickString(row, ['as_of', 'updated_at']),
  }
}

function parseEarningsHistory(rows: RowRecord[], ticker: string): EarningsHistoryRow[] {
  return rows.map((row) => ({
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    earningsDate: pickString(row, ['earnings_date', 'report_date', 'fiscal_date']),
    fiscalPeriod: pickString(row, ['fiscal_period', 'fiscal_quarter', 'quarter']),
    epsActual: pickNumber(row, ['eps_actual', 'actual_eps', 'eps']),
    epsEstimate: pickNumber(row, ['eps_estimate', 'estimated_eps', 'consensus_eps']),
    epsSurprisePct: pickNumber(row, ['eps_surprise_pct', 'eps_surprise_percent']),
    revenueActual: pickNumber(row, ['revenue_actual', 'actual_revenue', 'revenue']),
    revenueEstimate: pickNumber(row, ['revenue_estimate', 'estimated_revenue', 'consensus_revenue']),
    revenueSurprisePct: pickNumber(row, ['revenue_surprise_pct', 'revenue_surprise_percent']),
  }))
}

export async function getTickerCoverage(tickerRaw: string): Promise<SymbolCoverageRow | null> {
  const summary = await fetchTickerPageSummaryFromBackend(tickerRaw)
  return summary?.coverage ?? null
}

export async function getTickerFundamentalsSummary(
  tickerRaw: string
): Promise<TickerFundamentalsSummary | null> {
  const summary = await fetchTickerPageSummaryFromBackend(tickerRaw)
  return summary?.fundamentalsSummary ?? null
}

export async function getTickerLatestFundamentals(tickerRaw: string): Promise<LatestFundamentalsRow[]> {
  const summary = await fetchTickerPageSummaryFromBackend(tickerRaw)
  return summary?.latestFundamentals ?? []
}

export async function getTickerNextEarnings(tickerRaw: string): Promise<NextEarningsRow | null> {
  const summary = await fetchTickerPageSummaryFromBackend(tickerRaw)
  return summary?.nextEarnings ?? null
}

export async function getTickerEarningsHistory(tickerRaw: string): Promise<EarningsHistoryRow[]> {
  const summary = await fetchTickerPageSummaryFromBackend(tickerRaw)
  return summary?.earningsHistory ?? []
}

export async function getTickerPageSummary(tickerRaw: string): Promise<TickerPageSummary> {
  const ticker = normalizeTicker(tickerRaw)
  const summary = await fetchTickerPageSummaryFromBackend(ticker)
  if (summary) return summary

  return {
    ticker,
    quote: null,
    marketStats: null,
    coverage: {
      ticker,
      hasMarketData: false,
      hasFundamentals: false,
      hasEarnings: false,
      hasSignals: false,
      marketDataLastDate: null,
      fundamentalsLastDate: null,
      nextEarningsDate: null,
      source: 'inferred',
      updatedAt: null,
    },
    fundamentalsSummary: null,
    latestFundamentals: [],
    nextEarnings: null,
    earningsHistory: [],
  }
}
