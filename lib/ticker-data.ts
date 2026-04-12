import { supabase } from './supabase'

type RowRecord = Record<string, unknown>

type PostgrestErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

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

function isMissingTableError(error: PostgrestErrorLike | null): boolean {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  const message = error.message ?? ''
  return message.includes('does not exist') || message.includes('Could not find the table')
}

function isMissingColumnError(error: PostgrestErrorLike | null, column: string): boolean {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const text = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase()
  return text.includes(`column '${column.toLowerCase()}'`) || text.includes(`column ${column.toLowerCase()}`)
}

async function fetchSingleByTicker(
  table: string,
  tickerRaw: string
): Promise<RowRecord | null> {
  const ticker = normalizeTicker(tickerRaw)

  for (const column of ['ticker', 'symbol']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(column, ticker)
      .maybeSingle()

    if (!error) return asRecord(data)
    if (isMissingTableError(error)) return null
    if (isMissingColumnError(error, column)) continue
    console.warn(`Failed reading ${table} for ${ticker}:`, error)
    return null
  }

  return null
}

async function fetchRowsByTicker(
  table: string,
  tickerRaw: string,
  options: {
    limit?: number
    orderColumns?: string[]
  } = {}
): Promise<RowRecord[]> {
  const ticker = normalizeTicker(tickerRaw)
  const limit = Math.max(1, Math.min(200, options.limit ?? 20))
  const orderColumns = options.orderColumns ?? []

  for (const column of ['ticker', 'symbol']) {
    for (const orderColumn of [...orderColumns, null]) {
      let query = supabase.from(table).select('*').eq(column, ticker).limit(limit)
      if (orderColumn) {
        query = query.order(orderColumn, { ascending: false })
      }

      const { data, error } = await query
      if (!error) {
        const rows = Array.isArray(data) ? data.map(asRecord).filter((row): row is RowRecord => row !== null) : []
        return rows
      }

      if (isMissingTableError(error)) return []
      if (isMissingColumnError(error, column) || (orderColumn && isMissingColumnError(error, orderColumn))) {
        continue
      }

      console.warn(`Failed reading ${table} for ${ticker}:`, error)
      return []
    }
  }

  return []
}

function parseCoverageFlag(
  row: RowRecord,
  explicitKeys: string[],
  countKeys: string[],
  statusKeys: string[]
): boolean {
  const explicit = pickBoolean(row, explicitKeys)
  if (explicit !== null) return explicit

  const count = pickNumber(row, countKeys)
  if (count !== null) return count > 0

  const status = pickString(row, statusKeys)?.toLowerCase()
  if (!status) return false
  return ['available', 'ready', 'active', 'covered', 'complete', 'present'].some((token) =>
    status.includes(token)
  )
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
  const ticker = normalizeTicker(tickerRaw)
  const row = await fetchSingleByTicker('symbol_data_coverage', ticker)
  if (!row) return null

  return {
    ticker: pickString(row, ['ticker', 'symbol']) ?? ticker,
    hasMarketData: parseCoverageFlag(
      row,
      ['market_data_available', 'has_market_data', 'market_available', 'market_covered'],
      ['market_rows', 'market_points', 'market_count'],
      ['market_status']
    ),
    hasFundamentals: parseCoverageFlag(
      row,
      ['fundamentals_available', 'has_fundamentals', 'fundamentals_covered'],
      ['fundamentals_rows', 'fundamentals_count'],
      ['fundamentals_status']
    ),
    hasEarnings: parseCoverageFlag(
      row,
      ['earnings_available', 'has_earnings', 'earnings_covered'],
      ['earnings_rows', 'earnings_count'],
      ['earnings_status']
    ),
    hasSignals: parseCoverageFlag(
      row,
      ['signal_available', 'has_signals', 'signals_available', 'signals_covered'],
      ['signals_rows', 'signals_count'],
      ['signals_status']
    ),
    marketDataLastDate: pickString(row, ['market_data_last_date']),
    fundamentalsLastDate: pickString(row, ['fundamentals_last_date']),
    nextEarningsDate: pickString(row, ['next_earnings_date']),
    source: 'coverage_table',
    updatedAt: pickString(row, ['updated_at', 'as_of']),
  }
}

export async function getTickerFundamentalsSummary(
  tickerRaw: string
): Promise<TickerFundamentalsSummary | null> {
  const ticker = normalizeTicker(tickerRaw)
  const row = await fetchSingleByTicker('ticker_fundamental_summary', ticker)
  return parseFundamentalsSummary(row, ticker)
}

export async function getTickerLatestFundamentals(tickerRaw: string): Promise<LatestFundamentalsRow[]> {
  const ticker = normalizeTicker(tickerRaw)
  const rows = await fetchRowsByTicker('mv_latest_fundamentals', ticker, {
    limit: 64,
    orderColumns: ['as_of', 'period_end', 'updated_at'],
  })
  return parseLatestFundamentals(rows, ticker)
}

export async function getTickerNextEarnings(tickerRaw: string): Promise<NextEarningsRow | null> {
  const ticker = normalizeTicker(tickerRaw)
  const row = await fetchSingleByTicker('mv_next_earnings', ticker)
  return parseNextEarnings(row, ticker)
}

export async function getTickerEarningsHistory(tickerRaw: string): Promise<EarningsHistoryRow[]> {
  const ticker = normalizeTicker(tickerRaw)
  const rows = await fetchRowsByTicker('market_earnings_history', ticker, {
    limit: 8,
    orderColumns: ['earnings_date', 'report_date', 'fiscal_date', 'updated_at'],
  })
  return parseEarningsHistory(rows, ticker)
}

async function getTickerMarketQuoteSnapshot(tickerRaw: string): Promise<MarketQuoteSnapshot | null> {
  const ticker = normalizeTicker(tickerRaw)
  const row = await fetchSingleByTicker('market_quotes', ticker)
  return parseMarketQuote(row, ticker)
}

async function getTickerMarketStatsSnapshot(tickerRaw: string): Promise<MarketStatsSnapshot | null> {
  const ticker = normalizeTicker(tickerRaw)
  const row = await fetchSingleByTicker('ticker_market_stats_snapshot', ticker)
  return parseMarketStats(row, ticker)
}

export async function getTickerPageSummary(tickerRaw: string): Promise<TickerPageSummary> {
  const ticker = normalizeTicker(tickerRaw)
  const [quote, marketStats, coverageRow, fundamentalsSummary, latestFundamentals, nextEarnings, earningsHistory] =
    await Promise.all([
      getTickerMarketQuoteSnapshot(ticker),
      getTickerMarketStatsSnapshot(ticker),
      getTickerCoverage(ticker),
      getTickerFundamentalsSummary(ticker),
      getTickerLatestFundamentals(ticker),
      getTickerNextEarnings(ticker),
      getTickerEarningsHistory(ticker),
    ])

  const inferredCoverage: SymbolCoverageRow = {
    ticker,
    hasMarketData: Boolean(quote?.price !== null || marketStats !== null),
    hasFundamentals: Boolean(fundamentalsSummary !== null || latestFundamentals.length > 0),
    hasEarnings: Boolean(nextEarnings !== null || earningsHistory.length > 0),
    hasSignals: coverageRow?.hasSignals ?? false,
    marketDataLastDate: null,
    fundamentalsLastDate: null,
    nextEarningsDate: null,
    source: 'inferred',
    updatedAt: null,
  }
  const coverage: SymbolCoverageRow = coverageRow
    ? {
        ...coverageRow,
        hasMarketData: coverageRow.hasMarketData || inferredCoverage.hasMarketData,
        hasFundamentals: coverageRow.hasFundamentals || inferredCoverage.hasFundamentals,
        hasEarnings: coverageRow.hasEarnings || inferredCoverage.hasEarnings,
      }
    : inferredCoverage

  return {
    ticker,
    quote,
    marketStats,
    coverage,
    fundamentalsSummary,
    latestFundamentals,
    nextEarnings,
    earningsHistory,
  }
}
