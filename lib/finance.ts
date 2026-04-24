import { unstable_cache } from 'next/cache'

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com'
const YAHOO_SUMMARY_API_BASE = 'https://query2.finance.yahoo.com'
const YAHOO_HEADERS = {
  Accept: 'application/json,text/plain,*/*',
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}

const RETRY_DELAYS_MS = [250, 600, 1200]
const YAHOO_COOLDOWN_MS = 5 * 60 * 1000
const STOOQ_TIMEOUT_MS = 1200
const STOOQ_COOLDOWN_MS = 10 * 60 * 1000
const QUOTE_FRESH_MS = 60 * 1000
const HISTORICAL_FRESH_MS = 60 * 60 * 1000
const FUNDAMENTALS_FRESH_MS = 6 * 60 * 60 * 1000
const YAHOO_CRUMB_TTL_MS = 6 * 60 * 60 * 1000
const YAHOO_SUMMARY_AUTH_COOLDOWN_MS = 30 * 60 * 1000

let yahooQuoteCooldownUntil = 0
let yahooHistoricalCooldownUntil = 0
let yahooNewsCooldownUntil = 0
let stooqQuoteCooldownUntil = 0
let marketCacheAvailable: boolean | null = null
let missingSchemaLogged = false
let writeSupportLogged = false
let yahooSummaryAuthCooldownUntil = 0
let yahooSummaryAuthBlockedLogged = false
let stooqCooldownLogged = false
let yahooSummaryAuth:
  | {
      crumb: string
      cookieHeader: string
      expiresAt: number
    }
  | null = null

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

export interface CorrelationNetworkPeer {
  ticker: string
  name: string | null
  correlation: number
  absCorrelation: number
  sector: string | null
}

export interface CorrelationNetworkResult {
  ticker: string
  name: string | null
  asOf: string | null
  sampleSize: number
  peers: CorrelationNetworkPeer[]
}

interface QuoteApiResult {
  symbol?: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  marketCap?: number
}

interface QuoteApiResponse {
  quoteResponse?: {
    result?: QuoteApiResult[]
  }
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

interface YahooNewsResponse {
  news?: Array<{
    uuid?: string
    title?: string
    publisher?: string
    providerPublishTime?: number
    link?: string
    clickThroughUrl?: {
      url?: string
    }
    canonicalUrl?: {
      url?: string
    }
    thumbnail?: {
      resolutions?: Array<{
        url?: string
        width?: number
        height?: number
      }>
    }
  }>
}

interface YahooValue {
  raw?: number | string | null
  fmt?: string | null
  longFmt?: string | null
}

interface QuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<Record<string, unknown>>
  }
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

interface MarketFundamentalsRow {
  payload: unknown
  fetched_at: string
}

interface QuoteFetchResult {
  quote: StockQuote
  source: 'yahoo' | 'stooq'
}

type FundamentalsSource = 'yahoo' | 'fallback_quote'

interface FundamentalsFetchResult {
  fundamentals: TickerFundamentals
  source: FundamentalsSource
}

export interface RefreshTickerResult {
  ticker: string
  quoteSource: 'yahoo' | 'stooq' | null
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

class YahooAuthError extends Error {
  readonly kind: 'auth_blocked' | 'invalid_crumb_payload'

  constructor(kind: 'auth_blocked' | 'invalid_crumb_payload', message: string) {
    super(message)
    this.kind = kind
  }
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

const RELATED_TICKER_MAP: Record<string, string[]> = {
  SPY: ['QQQ', 'DIA', 'IWM', 'VOO', 'IVV', 'VTI', 'XLF', 'XLK'],
  QQQ: ['SPY', 'XLK', 'VGT', 'SOXX', 'DIA', 'IWM', 'AAPL', 'MSFT'],
  DIA: ['SPY', 'QQQ', 'IWM', 'VOO', 'XLF', 'VTI', 'JPM', 'UNH'],
  IWM: ['SPY', 'DIA', 'QQQ', 'VTWO', 'VTI', 'XLF', 'XLI', 'XLY'],
  VOO: ['SPY', 'IVV', 'SCHX', 'QQQ', 'VTI', 'DIA', 'IWM', 'XLK'],
  IVV: ['SPY', 'VOO', 'SCHX', 'VTI', 'QQQ', 'DIA', 'IWM', 'XLF'],
  VTI: ['SPY', 'VOO', 'IVV', 'SCHB', 'QQQ', 'DIA', 'IWM', 'XLF'],
  XLK: ['QQQ', 'VGT', 'SPY', 'SOXX', 'AAPL', 'MSFT', 'NVDA', 'GOOGL'],
  XLF: ['SPY', 'VFH', 'IYF', 'DIA', 'JPM', 'BAC', 'GS', 'MS'],
  XLE: ['SPY', 'VDE', 'IYE', 'OIH', 'XOM', 'CVX', 'SLB', 'COP'],
  AAPL: ['MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'QQQ', 'XLK', 'SPY'],
  MSFT: ['AAPL', 'NVDA', 'GOOGL', 'META', 'AMZN', 'QQQ', 'XLK', 'SPY'],
  NVDA: ['AAPL', 'MSFT', 'AMD', 'AVGO', 'SOXX', 'QQQ', 'XLK', 'SPY'],
  AMZN: ['GOOGL', 'META', 'AAPL', 'MSFT', 'QQQ', 'XLY', 'SPY', 'IWM'],
  GOOGL: ['META', 'AMZN', 'AAPL', 'MSFT', 'QQQ', 'XLC', 'SPY', 'XLK'],
  META: ['GOOGL', 'AMZN', 'AAPL', 'MSFT', 'QQQ', 'XLC', 'SPY', 'XLK'],
  TSLA: ['NIO', 'RIVN', 'GM', 'F', 'QQQ', 'XLY', 'SPY', 'IWM'],
  JPM: ['BAC', 'WFC', 'GS', 'MS', 'XLF', 'DIA', 'SPY', 'VFH'],
  XOM: ['CVX', 'COP', 'OXY', 'SLB', 'XLE', 'VDE', 'SPY', 'IYE'],
}

const CORRELATION_FALLBACK_POOL = [
  'SPY',
  'QQQ',
  'DIA',
  'IWM',
  'VOO',
  'IVV',
  'VTI',
  'XLK',
  'XLF',
  'XLE',
  'AAPL',
  'MSFT',
  'NVDA',
  'GOOGL',
  'META',
  'AMZN',
  'TSLA',
  'JPM',
  'XOM',
  'UNH',
]

const TICKER_SECTOR_HINTS: Record<string, string> = {
  SPY: 'Broad Market ETF',
  QQQ: 'Growth ETF',
  DIA: 'Dow ETF',
  IWM: 'Small Cap ETF',
  VOO: 'Broad Market ETF',
  IVV: 'Broad Market ETF',
  VTI: 'Total Market ETF',
  XLK: 'Technology ETF',
  XLF: 'Financials ETF',
  XLE: 'Energy ETF',
  AAPL: 'Technology',
  MSFT: 'Technology',
  NVDA: 'Semiconductors',
  AVGO: 'Semiconductors',
  AMD: 'Semiconductors',
  AMZN: 'Consumer Discretionary',
  GOOGL: 'Communication Services',
  META: 'Communication Services',
  TSLA: 'Consumer Discretionary',
  JPM: 'Financials',
  BAC: 'Financials',
  GS: 'Financials',
  MS: 'Financials',
  XOM: 'Energy',
  CVX: 'Energy',
  COP: 'Energy',
  OXY: 'Energy',
  SLB: 'Energy',
  UNH: 'Health Care',
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatMarketCap(num: number | undefined): string {
  if (!num) return 'N/A'
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  return num.toLocaleString()
}

function readYahooValue(value: unknown): YahooValue | null {
  if (!value || typeof value !== 'object') return null
  return value as YahooValue
}

function getYahooRawNumber(value: unknown): number | null {
  const yahooValue = readYahooValue(value)
  if (!yahooValue) return null
  const raw = yahooValue.raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function getYahooFmt(value: unknown): string | null {
  const yahooValue = readYahooValue(value)
  if (!yahooValue) return null
  if (typeof yahooValue.fmt === 'string' && yahooValue.fmt.trim()) return yahooValue.fmt.trim()
  if (typeof yahooValue.longFmt === 'string' && yahooValue.longFmt.trim()) {
    return yahooValue.longFmt.trim()
  }
  const raw = yahooValue.raw
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
  const fmt = getYahooFmt(value)
  if (fmt && fmt.includes('%')) return fmt
  const raw = getYahooRawNumber(value)
  return formatPercent(raw)
}

function formatNumberFixed(value: unknown, digits: number = 2): string | null {
  const raw = getYahooRawNumber(value)
  if (raw === null) return null
  return raw.toFixed(digits)
}

function formatRange(low: unknown, high: unknown): string | null {
  const lowFmt = getYahooFmt(low) ?? formatNumberFixed(low)
  const highFmt = getYahooFmt(high) ?? formatNumberFixed(high)
  if (!lowFmt || !highFmt) return null
  return `${lowFmt} - ${highFmt}`
}

function formatPayoutFrequency(value: unknown): string | null {
  const direct = getString(value)
  if (direct) return toTitleCase(direct)
  const raw = getYahooRawNumber(value)
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
  const requestKind = url.includes('/v8/finance/chart/')
    ? 'historical'
    : url.includes('/v1/finance/search')
      ? 'news'
      : 'quote'
  const cooldownUntil =
    requestKind === 'historical'
      ? yahooHistoricalCooldownUntil
      : requestKind === 'news'
        ? yahooNewsCooldownUntil
        : yahooQuoteCooldownUntil

  if (Date.now() < cooldownUntil) {
    throw new YahooHttpError(
      429,
      'Too Many Requests',
      `Yahoo ${requestKind} cooldown active`
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
          if (requestKind === 'historical') {
            yahooHistoricalCooldownUntil = Date.now() + YAHOO_COOLDOWN_MS
          } else if (requestKind === 'news') {
            yahooNewsCooldownUntil = Date.now() + YAHOO_COOLDOWN_MS
          } else {
            yahooQuoteCooldownUntil = Date.now() + YAHOO_COOLDOWN_MS
          }
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

async function fetchYahooQuote(ticker: string): Promise<StockQuote | null> {
  const url = `${YAHOO_API_BASE}/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`
  const data = await fetchYahooJson<QuoteApiResponse>(url)
  const quote = data.quoteResponse?.result?.[0]
  if (!quote) return null

  return {
    ticker: quote.symbol || ticker,
    name: quote.shortName || quote.longName || quote.symbol || ticker,
    price: quote.regularMarketPrice || 0,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    marketCap: formatMarketCap(quote.marketCap),
  }
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

function normalizeNewsUrl(item: {
  link?: string
  clickThroughUrl?: { url?: string }
  canonicalUrl?: { url?: string }
}): string | null {
  const candidate = item.clickThroughUrl?.url || item.link || item.canonicalUrl?.url || null
  if (!candidate) return null
  const trimmed = candidate.trim()
  if (!trimmed.startsWith('http')) return null
  return trimmed
}

function normalizePublishedAt(raw: number | undefined): string | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  return new Date(raw * 1000).toISOString()
}

function normalizeNewsImage(item: {
  thumbnail?: {
    resolutions?: Array<{
      url?: string
      width?: number
      height?: number
    }>
  }
}): string | null {
  const resolutions = item.thumbnail?.resolutions
  if (!Array.isArray(resolutions) || resolutions.length === 0) return null

  const sorted = resolutions
    .filter((entry) => typeof entry.url === 'string' && entry.url.trim().startsWith('http'))
    .slice()
    .sort((a, b) => {
      const areaA = (a.width ?? 0) * (a.height ?? 0)
      const areaB = (b.width ?? 0) * (b.height ?? 0)
      return areaB - areaA
    })

  const candidate = sorted[0]?.url?.trim()
  return candidate || null
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function readRssTag(block: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const cdataMatch = block.match(cdataRegex)
  if (cdataMatch?.[1]) return decodeXmlEntities(cdataMatch[1].trim())
  const plainMatch = block.match(plainRegex)
  if (plainMatch?.[1]) return decodeXmlEntities(plainMatch[1].trim())
  return null
}

function readRssSourceUrl(block: string): string | null {
  const sourceTagMatch = block.match(/<source[^>]*url="([^"]+)"[^>]*>/i)
  const url = sourceTagMatch?.[1]?.trim()
  if (!url || !url.startsWith('http')) return null
  return decodeXmlEntities(url)
}

async function fetchGoogleNewsRss(ticker: string, limit: number): Promise<TickerNewsItem[]> {
  const query = encodeURIComponent(`${ticker} ETF OR ${ticker} stock`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/rss+xml,application/xml,text/xml,*/*',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      cache: 'no-store',
    })
    if (!response.ok) return []

    const xml = await response.text()
    const itemBlocks = xml
      .split('<item>')
      .slice(1)
      .map((chunk) => chunk.split('</item>')[0] || '')
      .filter(Boolean)

    const items: TickerNewsItem[] = []
    for (let i = 0; i < itemBlocks.length; i++) {
      const block = itemBlocks[i]
      const title = readRssTag(block, 'title')
      const link = readRssTag(block, 'link')
      const publisher = readRssTag(block, 'source') ?? 'Google News'
      const sourceUrl = readRssSourceUrl(block)
      const pubDate = readRssTag(block, 'pubDate')
      const publishedAt =
        pubDate && Number.isFinite(Date.parse(pubDate))
          ? new Date(pubDate).toISOString()
          : null
      if (!title || !link || !link.startsWith('http')) continue

      items.push({
        id: `google:${ticker}:${i}:${title.slice(0, 40)}`,
        title,
        publisher,
        url: link,
        publishedAt,
        imageUrl: null,
        sourceUrl,
      })
      if (items.length >= limit) break
    }

    return items
  } catch {
    return []
  }
}

async function fetchYahooNews(ticker: string, limit: number): Promise<TickerNewsItem[]> {
  const desiredCount = Math.max(limit, 6)
  const queries = [ticker]
  const deduped = new Map<string, TickerNewsItem>()

  for (const q of queries) {
    const url = new URL(`${YAHOO_SUMMARY_API_BASE}/v1/finance/search`)
    url.searchParams.set('q', q)
    url.searchParams.set('quotesCount', '0')
    url.searchParams.set('newsCount', String(desiredCount))
    url.searchParams.set('enableFuzzyQuery', 'true')
    url.searchParams.set('lang', 'en-US')
    url.searchParams.set('region', 'US')

    try {
      const data = await fetchYahooJson<YahooNewsResponse>(url.toString())
      const rawNews = Array.isArray(data.news) ? data.news : []

      for (const item of rawNews) {
        const title = getString(item.title)
        const publisher = getString(item.publisher) ?? 'Market News'
        const newsUrl = normalizeNewsUrl(item)
        if (!title || !newsUrl) continue
        const id = getString(item.uuid) ?? `${ticker}:${title.slice(0, 48)}`
        const key = id || newsUrl
        if (deduped.has(key)) continue
        deduped.set(key, {
          id,
          title,
          publisher,
          url: newsUrl,
          publishedAt: normalizePublishedAt(item.providerPublishTime),
          imageUrl: normalizeNewsImage(item),
          sourceUrl: null,
        })
      }

      if (deduped.size >= limit) break
    } catch {
      continue
    }
  }

  if (deduped.size < limit) {
    const googleFallback = await fetchGoogleNewsRss(ticker, limit)
    for (const item of googleFallback) {
      const key = `${item.url}:${item.title}`
      if (!deduped.has(key)) deduped.set(key, item)
      if (deduped.size >= limit) break
    }
  }

  const items = [...deduped.values()].slice(0, limit)
  return items
}

const QUOTE_SUMMARY_MODULES = [
  'price',
  'fundProfile',
  'fundPerformance',
  'assetProfile',
  'summaryProfile',
  'summaryDetail',
  'topHoldings',
  'defaultKeyStatistics',
]

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

function staticSpyFundamentals(ticker: string, quote: StockQuote | null): TickerFundamentals {
  const symbol = quote?.ticker || ticker
  const name = quote?.name || 'SPDR S&P 500 ETF Trust'
  const marketCapText =
    quote?.marketCap && quote.marketCap !== 'N/A' ? quote.marketCap : '$653.25B'

  return {
    about:
      'SPY is an exchange-traded fund designed to track the S&P 500 Index, providing diversified large-cap U.S. equity exposure.',
    marketCap: marketCapText,
    snapshot: [
      { label: 'Assets', value: '$653.25B' },
      { label: 'Expense Ratio', value: '0.09%' },
      { label: 'PE Ratio', value: '25.80' },
      { label: 'Shares Out', value: '994.48M' },
      { label: 'Dividend (ttm)', value: '$7.38' },
      { label: 'Dividend Yield', value: '1.13%' },
      { label: 'Ex-Dividend Date', value: 'Mar 20, 2026' },
      { label: 'Payout Frequency', value: 'Quarterly' },
      { label: 'Payout Ratio', value: '29.01%' },
      { label: 'Volume', value: '24,185,466' },
      { label: 'Open', value: '656.65' },
      { label: 'Previous Close', value: '658.93' },
      { label: "Day's Range", value: '651.06 - 657.58' },
      { label: '52-Week Low', value: '481.80' },
      { label: '52-Week High', value: '697.84' },
      { label: 'Beta', value: '1.01' },
      { label: 'Holdings', value: '504' },
      { label: 'Inception Date', value: 'Jan 22, 1993' },
    ],
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weightPercent: 6.6 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weightPercent: 6.2 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weightPercent: 5.7 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weightPercent: 3.8 },
      { symbol: 'META', name: 'Meta Platforms Inc.', weightPercent: 2.5 },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weightPercent: 1.9 },
      { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weightPercent: 1.8 },
      { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weightPercent: 1.6 },
      { symbol: 'AVGO', name: 'Broadcom Inc.', weightPercent: 1.5 },
      { symbol: 'TSLA', name: 'Tesla Inc.', weightPercent: 1.4 },
    ],
    sectorWeights: [
      { sector: 'Information Technology', weightPercent: 31.2 },
      { sector: 'Financials', weightPercent: 12.7 },
      { sector: 'Health Care', weightPercent: 11.3 },
      { sector: 'Consumer Discretionary', weightPercent: 10.2 },
      { sector: 'Communication Services', weightPercent: 8.7 },
      { sector: 'Industrials', weightPercent: 8.6 },
      { sector: 'Consumer Staples', weightPercent: 5.9 },
      { sector: 'Energy', weightPercent: 3.9 },
      { sector: 'Utilities', weightPercent: 2.5 },
      { sector: 'Real Estate', weightPercent: 2.2 },
      { sector: 'Materials', weightPercent: 1.8 },
    ],
    dividendRate: '$7.38',
    dividendYield: '1.13%',
    exDividendDate: 'Mar 20, 2026',
    payoutRatio: '29.01%',
    profile: [
      { label: 'Symbol', value: symbol },
      { label: 'Name', value: name },
      { label: 'Fund Family', value: 'State Street Global Advisors' },
      { label: 'Category', value: 'Large Blend' },
      { label: 'Fund Inception', value: '1993-01-22' },
      { label: 'Market Cap', value: marketCapText },
    ],
    portfolio: [
      { label: 'Number of Holdings', value: '504' },
      { label: 'Top 10 Concentration', value: '33.00%' },
      { label: 'Largest Position', value: 'AAPL (6.60%)' },
      { label: 'Largest Sector', value: 'Information Technology (31.20%)' },
    ],
    distributions: [
      { label: 'Annual Dividend', value: '$7.38' },
      { label: 'Dividend Yield', value: '1.13%' },
      { label: 'Ex-Dividend Date', value: '2026-03-20' },
      { label: 'Payout Ratio', value: '29.01%' },
      { label: 'Expense Ratio', value: '0.09%' },
    ],
    risk: [
      { label: 'Beta (3Y)', value: '1.01' },
      { label: 'Portfolio P/E', value: '25.80' },
    ],
  }
}

function staticFundamentalsFallback(ticker: string, quote: StockQuote | null): TickerFundamentals | null {
  if (ticker === 'SPY') return staticSpyFundamentals(ticker, quote)
  return null
}

function fallbackFundamentalsFromQuote(ticker: string, quote: StockQuote | null): TickerFundamentals {
  const staticFallback = staticFundamentalsFallback(ticker, quote)
  if (staticFallback) return staticFallback

  const fallback = emptyFundamentals()
  if (!quote) return fallback

  const safeMarketCap =
    quote.marketCap && quote.marketCap !== 'N/A' ? quote.marketCap : null
  fallback.marketCap = safeMarketCap
  fallback.profile = [
    { label: 'Symbol', value: quote.ticker || ticker },
    { label: 'Name', value: quote.name || ticker },
  ]
  if (safeMarketCap) {
    fallback.profile.push({ label: 'Market Cap', value: safeMarketCap })
  }
  fallback.snapshot = [
    { label: 'Assets', value: safeMarketCap ?? '—' },
    { label: 'Expense Ratio', value: '—' },
    { label: 'PE Ratio', value: '—' },
    { label: 'Shares Out', value: '—' },
    { label: 'Dividend (ttm)', value: '—' },
    { label: 'Dividend Yield', value: '—' },
    { label: 'Ex-Dividend Date', value: '—' },
    { label: 'Payout Frequency', value: '—' },
    { label: 'Payout Ratio', value: '—' },
    { label: 'Volume', value: '—' },
    { label: 'Open', value: '—' },
    { label: 'Previous Close', value: '—' },
    { label: "Day's Range", value: '—' },
    { label: '52-Week Low', value: '—' },
    { label: '52-Week High', value: '—' },
    { label: 'Beta', value: '—' },
    { label: 'Holdings', value: '—' },
    { label: 'Inception Date', value: '—' },
  ]

  return fallback
}

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=[^;,\s]+=)/g)
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractCookieHeader(res: Response): string | null {
  const extendedHeaders = res.headers as Headers & { getSetCookie?: () => string[] }
  const setCookies =
    typeof extendedHeaders.getSetCookie === 'function'
      ? extendedHeaders.getSetCookie()
      : splitSetCookieHeader(res.headers.get('set-cookie') || '')

  if (setCookies.length === 0) return null

  const cookies = setCookies
    .map((entry) => entry.split(';')[0]?.trim())
    .filter((entry): entry is string => Boolean(entry))
  if (cookies.length === 0) return null

  return cookies.join('; ')
}

async function getYahooSummaryAuth(
  ticker: string,
  forceRefresh: boolean = false
): Promise<{ crumb: string; cookieHeader: string }> {
  if (!forceRefresh && Date.now() < yahooSummaryAuthCooldownUntil) {
    throw new YahooAuthError('auth_blocked', 'Yahoo auth blocked by cooldown')
  }

  if (!forceRefresh && yahooSummaryAuth && Date.now() < yahooSummaryAuth.expiresAt) {
    return {
      crumb: yahooSummaryAuth.crumb,
      cookieHeader: yahooSummaryAuth.cookieHeader,
    }
  }

  const quoteUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`
  const pageRes = await fetch(quoteUrl, {
    headers: {
      ...YAHOO_HEADERS,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: 'https://finance.yahoo.com/',
    },
    cache: 'no-store',
  })
  if (!pageRes.ok) {
    const snippet = (await pageRes.text().catch(() => '')).slice(0, 160)
    throw new YahooHttpError(pageRes.status, pageRes.statusText, snippet || undefined)
  }

  const cookieHeader = extractCookieHeader(pageRes)
  if (!cookieHeader) {
    yahooSummaryAuthCooldownUntil = Date.now() + YAHOO_SUMMARY_AUTH_COOLDOWN_MS
    throw new YahooAuthError('auth_blocked', 'Yahoo auth failed: missing Set-Cookie header')
  }

  const crumbRes = await fetch(`${YAHOO_API_BASE}/v1/test/getcrumb`, {
    headers: {
      ...YAHOO_HEADERS,
      Cookie: cookieHeader,
      Referer: quoteUrl,
    },
    cache: 'no-store',
  })
  if (!crumbRes.ok) {
    const snippet = (await crumbRes.text().catch(() => '')).slice(0, 160)
    throw new YahooHttpError(crumbRes.status, crumbRes.statusText, snippet || undefined)
  }

  const crumb = (await crumbRes.text()).trim()
  if (!crumb || crumb.includes('<')) {
    throw new YahooAuthError(
      'invalid_crumb_payload',
      `Yahoo auth failed: invalid crumb payload (${crumb.slice(0, 64)})`
    )
  }

  yahooSummaryAuth = {
    crumb,
    cookieHeader,
    expiresAt: Date.now() + YAHOO_CRUMB_TTL_MS,
  }

  return { crumb, cookieHeader }
}

function isInvalidCrumbError(error: unknown): boolean {
  return (
    error instanceof YahooHttpError &&
    error.status === 401 &&
    error.message.toLowerCase().includes('crumb')
  )
}

function isYahooAuthError(error: unknown): error is YahooAuthError {
  return error instanceof YahooAuthError
}

async function fetchYahooQuoteSummary(
  ticker: string,
  modules: string[]
): Promise<Record<string, unknown> | null> {
  if (Date.now() < yahooSummaryAuthCooldownUntil) {
    throw new YahooAuthError('auth_blocked', 'Yahoo auth blocked by cooldown')
  }
  if (Date.now() < yahooQuoteCooldownUntil) {
    throw new YahooHttpError(429, 'Too Many Requests', 'Yahoo quote cooldown active')
  }

  const moduleQuery = encodeURIComponent(modules.join(','))
  let lastError: unknown = new Error('Yahoo summary request failed')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const forceRefreshAuth = attempt > 0 && isInvalidCrumbError(lastError)
      const auth = await getYahooSummaryAuth(ticker, forceRefreshAuth)
      const url =
        `${YAHOO_SUMMARY_API_BASE}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
        `?modules=${moduleQuery}&crumb=${encodeURIComponent(auth.crumb)}`

      const res = await fetch(url, {
        headers: {
          ...YAHOO_HEADERS,
          Cookie: auth.cookieHeader,
          Referer: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        const snippet = (await res.text().catch(() => '')).slice(0, 160)
        const error = new YahooHttpError(res.status, res.statusText, snippet || undefined)

        if (isInvalidCrumbError(error)) {
          yahooSummaryAuth = null
          if (attempt < RETRY_DELAYS_MS.length) {
            await sleep(RETRY_DELAYS_MS[attempt])
            lastError = error
            continue
          }
        }

        if (res.status === 429) {
          yahooQuoteCooldownUntil = Date.now() + YAHOO_COOLDOWN_MS
          throw error
        }

        if (attempt < RETRY_DELAYS_MS.length && isRetriableStatus(res.status)) {
          await sleep(RETRY_DELAYS_MS[attempt])
          lastError = error
          continue
        }

        throw error
      }

      const data = (await res.json()) as QuoteSummaryResponse
      return data.quoteSummary?.result?.[0] ?? null
    } catch (error) {
      if (isYahooAuthError(error)) throw error
      if (isRateLimitedYahooError(error)) throw error

      lastError = error
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt])
      }
    }
  }

  throw lastError
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

function parseHoldings(topHoldings: Record<string, unknown> | null): TickerHolding[] {
  const holdings = asArray(topHoldings?.holdings)
  if (holdings.length === 0) return []

  const parsed = holdings
    .map((item): TickerHolding | null => {
      const record = asRecord(item)
      if (!record) return null
      const symbol =
        getString(record.symbol) ??
        getString(readYahooValue(record.symbol)?.raw) ??
        getString(record.holdingName) ??
        'Unknown'
      const name = getString(record.holdingName) ?? symbol
      const weightRaw = getYahooRawNumber(record.holdingPercent)
      return {
        symbol,
        name,
        weightPercent: weightRaw !== null ? Number((weightRaw * 100).toFixed(4)) : null,
      }
    })
    .filter((item): item is TickerHolding => item !== null)

  return parsed
}

function parseSectorWeights(topHoldings: Record<string, unknown> | null): TickerSectorWeight[] {
  const sectorWeightings = asArray(topHoldings?.sectorWeightings)
  if (sectorWeightings.length === 0) return []

  const output: TickerSectorWeight[] = []
  for (const item of sectorWeightings) {
    const record = asRecord(item)
    if (!record) continue

    for (const [sectorKey, sectorValue] of Object.entries(record)) {
      const raw = getYahooRawNumber(sectorValue)
      output.push({
        sector: toTitleCase(sectorKey),
        weightPercent: raw !== null ? Number((raw * 100).toFixed(2)) : null,
      })
    }
  }

  return output
}

function pushIfPresent(rows: TickerFinancialRow[], label: string, value: string | null) {
  if (!value) return
  rows.push({ label, value })
}

function buildProfileRows(
  price: Record<string, unknown> | null,
  fundProfile: Record<string, unknown> | null,
  summaryDetail: Record<string, unknown> | null
): TickerFinancialRow[] {
  const rows: TickerFinancialRow[] = []
  pushIfPresent(rows, 'Fund Family', getString(fundProfile?.family))
  pushIfPresent(rows, 'Category', getString(fundProfile?.categoryName))
  pushIfPresent(rows, 'Legal Type', getString(fundProfile?.legalType))
  pushIfPresent(rows, 'Fund Inception', formatUnixDate(getYahooRawNumber(fundProfile?.fundInceptionDate)))
  pushIfPresent(
    rows,
    'Total Assets',
    getYahooFmt(summaryDetail?.totalAssets) ??
      formatCurrencyCompact(getYahooRawNumber(summaryDetail?.totalAssets))
  )
  pushIfPresent(
    rows,
    'Market Cap',
    getYahooFmt(price?.marketCap) ?? formatCurrencyCompact(getYahooRawNumber(price?.marketCap))
  )
  return rows
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

function buildDistributionRows(
  summaryDetail: Record<string, unknown> | null,
  fundProfile: Record<string, unknown> | null
): TickerFinancialRow[] {
  const rows: TickerFinancialRow[] = []
  pushIfPresent(rows, 'Annual Dividend', getYahooFmt(summaryDetail?.dividendRate))
  pushIfPresent(rows, 'Dividend Yield', formatPercentFromValue(summaryDetail?.dividendYield))
  pushIfPresent(rows, 'Trailing Yield', formatPercentFromValue(summaryDetail?.trailingAnnualDividendYield))
  pushIfPresent(rows, 'Ex-Dividend Date', formatUnixDate(getYahooRawNumber(summaryDetail?.exDividendDate)))
  pushIfPresent(rows, 'Payout Ratio', formatPercentFromValue(summaryDetail?.payoutRatio))

  const feesAndExpenses = asRecord(fundProfile?.feesExpensesInvestment)
  pushIfPresent(rows, 'Expense Ratio', formatPercentFromValue(feesAndExpenses?.annualReportExpenseRatio))
  pushIfPresent(rows, 'Annual Holdings Turnover', formatPercentFromValue(feesAndExpenses?.annualHoldingsTurnover))

  return rows
}

function buildRiskRows(
  summaryDetail: Record<string, unknown> | null,
  defaultKeyStatistics: Record<string, unknown> | null,
  fundPerformance: Record<string, unknown> | null,
  topHoldings: Record<string, unknown> | null
): TickerFinancialRow[] {
  const rows: TickerFinancialRow[] = []
  pushIfPresent(
    rows,
    'Beta (3Y)',
    getYahooFmt(defaultKeyStatistics?.beta3Year) ?? getYahooFmt(summaryDetail?.beta)
  )
  pushIfPresent(rows, 'YTD Return', formatPercentFromValue(summaryDetail?.ytdReturn))
  pushIfPresent(rows, '3Y Avg Return', formatPercentFromValue(defaultKeyStatistics?.threeYearAverageReturn))
  pushIfPresent(rows, '5Y Avg Return', formatPercentFromValue(defaultKeyStatistics?.fiveYearAverageReturn))

  const trailingReturns = asRecord(fundPerformance?.trailingReturns)
  if (trailingReturns) {
    pushIfPresent(rows, '1Y Return', formatPercentFromValue(trailingReturns.oneYear))
    pushIfPresent(rows, '3Y Return', formatPercentFromValue(trailingReturns.threeYear))
    pushIfPresent(rows, '5Y Return', formatPercentFromValue(trailingReturns.fiveYear))
  }

  const equityHoldings = asRecord(topHoldings?.equityHoldings)
  if (equityHoldings) {
    pushIfPresent(rows, 'Portfolio P/E', getYahooFmt(equityHoldings.priceToEarnings))
    pushIfPresent(rows, 'Portfolio P/B', getYahooFmt(equityHoldings.priceToBook))
    pushIfPresent(rows, 'Portfolio P/S', getYahooFmt(equityHoldings.priceToSales))
  }

  return rows
}

function buildSnapshotRows(
  price: Record<string, unknown> | null,
  summaryDetail: Record<string, unknown> | null,
  defaultKeyStatistics: Record<string, unknown> | null,
  fundProfile: Record<string, unknown> | null,
  topHoldings: Record<string, unknown> | null,
  holdings: TickerHolding[]
): TickerFinancialRow[] {
  const feesAndExpenses = asRecord(fundProfile?.feesExpensesInvestment)
  const fundOperations = asRecord(fundProfile?.fundOperations)

  const assets =
    getYahooFmt(summaryDetail?.totalAssets) ??
    formatDollarCompact(getYahooRawNumber(summaryDetail?.totalAssets))
  const expenseRatio =
    formatPercentFromValue(feesAndExpenses?.annualReportExpenseRatio) ??
    formatPercentFromValue(fundOperations?.annualReportExpenseRatio)
  const peRatio = getYahooFmt(summaryDetail?.trailingPE) ?? formatNumberFixed(summaryDetail?.trailingPE)
  const sharesOut =
    getYahooFmt(defaultKeyStatistics?.sharesOutstanding) ??
    formatNumberCompact(getYahooRawNumber(defaultKeyStatistics?.sharesOutstanding))
  const trailingDividendRaw = getYahooRawNumber(summaryDetail?.trailingAnnualDividendRate)
  const dividendTtm =
    getYahooFmt(summaryDetail?.trailingAnnualDividendRate) ??
    getYahooFmt(summaryDetail?.dividendRate) ??
    (trailingDividendRaw !== null ? `$${trailingDividendRaw.toFixed(2)}` : null)
  const dividendYield =
    formatPercentFromValue(summaryDetail?.trailingAnnualDividendYield) ??
    formatPercentFromValue(summaryDetail?.dividendYield)
  const exDividendDate = formatUnixDateDisplay(getYahooRawNumber(summaryDetail?.exDividendDate))
  const payoutFrequency = formatPayoutFrequency(summaryDetail?.payoutFrequency)
  const payoutRatio = formatPercentFromValue(summaryDetail?.payoutRatio)
  const volume =
    getYahooFmt(price?.regularMarketVolume) ??
    formatNumberCompact(getYahooRawNumber(price?.regularMarketVolume))
  const open = getYahooFmt(price?.regularMarketOpen) ?? formatNumberFixed(price?.regularMarketOpen)
  const previousClose =
    getYahooFmt(price?.regularMarketPreviousClose) ?? formatNumberFixed(price?.regularMarketPreviousClose)
  const dayRange =
    formatRange(price?.regularMarketDayLow, price?.regularMarketDayHigh) ??
    formatRange(summaryDetail?.dayLow, summaryDetail?.dayHigh)
  const fiftyTwoWeekLow =
    getYahooFmt(summaryDetail?.fiftyTwoWeekLow) ?? formatNumberFixed(summaryDetail?.fiftyTwoWeekLow)
  const fiftyTwoWeekHigh =
    getYahooFmt(summaryDetail?.fiftyTwoWeekHigh) ?? formatNumberFixed(summaryDetail?.fiftyTwoWeekHigh)
  const beta =
    getYahooFmt(defaultKeyStatistics?.beta3Year) ??
    getYahooFmt(summaryDetail?.beta) ??
    formatNumberFixed(defaultKeyStatistics?.beta3Year) ??
    formatNumberFixed(summaryDetail?.beta)
  const holdingsCount =
    holdings.length > 0
      ? holdings.length.toLocaleString()
      : getYahooFmt(topHoldings?.holdingsCount)
  const inceptionDate = formatUnixDateDisplay(getYahooRawNumber(fundProfile?.fundInceptionDate))

  return [
    { label: 'Assets', value: assets ?? '—' },
    { label: 'Expense Ratio', value: expenseRatio ?? '—' },
    { label: 'PE Ratio', value: peRatio ?? '—' },
    { label: 'Shares Out', value: sharesOut ?? '—' },
    { label: 'Dividend (ttm)', value: dividendTtm ?? '—' },
    { label: 'Dividend Yield', value: dividendYield ?? '—' },
    { label: 'Ex-Dividend Date', value: exDividendDate ?? '—' },
    { label: 'Payout Frequency', value: payoutFrequency ?? '—' },
    { label: 'Payout Ratio', value: payoutRatio ?? '—' },
    { label: 'Volume', value: volume ?? '—' },
    { label: 'Open', value: open ?? '—' },
    { label: 'Previous Close', value: previousClose ?? '—' },
    { label: "Day's Range", value: dayRange ?? '—' },
    { label: '52-Week Low', value: fiftyTwoWeekLow ?? '—' },
    { label: '52-Week High', value: fiftyTwoWeekHigh ?? '—' },
    { label: 'Beta', value: beta ?? '—' },
    { label: 'Holdings', value: holdingsCount ?? '—' },
    { label: 'Inception Date', value: inceptionDate ?? '—' },
  ]
}

function buildFundamentalsFromSummary(summary: Record<string, unknown>): TickerFundamentals {
  const assetProfile = asRecord(summary.assetProfile)
  const summaryProfile = asRecord(summary.summaryProfile)
  const summaryDetail = asRecord(summary.summaryDetail)
  const price = asRecord(summary.price)
  const fundProfile = asRecord(summary.fundProfile)
  const fundPerformance = asRecord(summary.fundPerformance)
  const topHoldings = asRecord(summary.topHoldings)
  const defaultKeyStatistics = asRecord(summary.defaultKeyStatistics)

  const about =
    getString(assetProfile?.longBusinessSummary) ??
    getString(fundProfile?.longBusinessSummary) ??
    getString(summaryProfile?.longBusinessSummary) ??
    getString(summaryProfile?.description) ??
    null

  const marketCapRaw = getYahooRawNumber(price?.marketCap)
  const marketCap =
    getYahooFmt(price?.marketCap) ??
    getYahooFmt(summaryDetail?.marketCap) ??
    (marketCapRaw !== null ? formatMarketCap(marketCapRaw) : null)

  const holdings = parseHoldings(topHoldings)
  const sectorWeights = parseSectorWeights(topHoldings)

  const dividendRate = getYahooFmt(summaryDetail?.dividendRate)
  const dividendYieldRaw = getYahooRawNumber(summaryDetail?.dividendYield)
  const dividendYield = formatPercent(dividendYieldRaw)
  const exDividendDate = formatUnixDate(getYahooRawNumber(summaryDetail?.exDividendDate))
  const payoutRatio = formatPercent(getYahooRawNumber(summaryDetail?.payoutRatio))
  const profile = buildProfileRows(price, fundProfile, summaryDetail)
  const portfolio = buildPortfolioRows(holdings, sectorWeights)
  const distributions = buildDistributionRows(summaryDetail, fundProfile)
  const risk = buildRiskRows(summaryDetail, defaultKeyStatistics, fundPerformance, topHoldings)
  const snapshot = buildSnapshotRows(
    price,
    summaryDetail,
    defaultKeyStatistics,
    fundProfile,
    topHoldings,
    holdings
  )
  const symbol = getString(price?.symbol)
  const displayName = getString(price?.shortName) ?? getString(price?.longName)

  if (profile.length === 0) {
    if (symbol) profile.push({ label: 'Symbol', value: symbol })
    if (displayName) profile.push({ label: 'Name', value: displayName })
  }
  if (marketCap && !profile.some((row) => row.label === 'Market Cap')) {
    profile.push({ label: 'Market Cap', value: marketCap })
  }

  return {
    about,
    marketCap: marketCap || null,
    snapshot,
    holdings,
    sectorWeights,
    dividendRate: dividendRate || null,
    dividendYield: dividendYield || null,
    exDividendDate: exDividendDate || null,
    payoutRatio: payoutRatio || null,
    profile,
    portfolio,
    distributions,
    risk,
  }
}

async function fetchStooqQuote(ticker: string): Promise<StockQuote | null> {
  if (Date.now() < stooqQuoteCooldownUntil) {
    if (!stooqCooldownLogged) {
      console.warn('Stooq quote fallback is temporarily disabled due to prior timeout/network errors.')
      stooqCooldownLogged = true
    }
    return null
  }

  const symbol = `${ticker.toLowerCase()}.us`
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&i=d`
  let res: Response
  try {
    res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(STOOQ_TIMEOUT_MS),
    })
  } catch (error) {
    stooqQuoteCooldownUntil = Date.now() + STOOQ_COOLDOWN_MS
    stooqCooldownLogged = false
    const wrappedError = new Error(`Stooq quote request failed: ${errorMessage(error)}`)
    ;(wrappedError as Error & { cause?: unknown }).cause = error
    throw wrappedError
  }

  if (!res.ok) throw new Error(`Stooq request failed (${res.status} ${res.statusText})`)

  const text = (await res.text()).trim()
  const fields = text.split(',')
  if (fields.length < 7) return null

  const open = parseMaybeNumber(fields[3])
  const close = parseMaybeNumber(fields[6])
  if (open === null || close === null) return null

  const change = close - open
  return {
    ticker,
    name: ticker,
    price: close,
    change,
    changePercent: open !== 0 ? (change / open) * 100 : 0,
    marketCap: 'N/A',
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
  _source: QuoteFetchResult['source']
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

async function fetchLiveQuoteWithFallback(ticker: string): Promise<QuoteFetchResult | null> {
  try {
    const yahooQuote = await fetchYahooQuote(ticker)
    if (yahooQuote) return { quote: yahooQuote, source: 'yahoo' }
  } catch (error) {
    if (!isRateLimitedYahooError(error)) {
      if (isTransientNetworkError(error)) {
        console.warn(`Yahoo quote fetch timed out for ${ticker}; using fallback or cached quote if available.`)
      } else {
        console.warn(`Failed to fetch Yahoo quote for ${ticker}:`, error)
      }
    }
  }

  try {
    const fallbackQuote = await fetchStooqQuote(ticker)
    if (fallbackQuote) return { quote: fallbackQuote, source: 'stooq' }
  } catch (error) {
    stooqQuoteCooldownUntil = Date.now() + STOOQ_COOLDOWN_MS
    stooqCooldownLogged = false
    if (isTransientNetworkError(error)) {
      console.warn(`Fallback quote provider timed out for ${ticker}; temporarily disabling Stooq fallback.`)
    } else {
      console.warn(`Failed to fetch fallback quote for ${ticker}; temporarily disabling Stooq fallback:`, error)
    }
  }

  return null
}

async function fetchLiveFundamentalsWithFallback(
  ticker: string,
  quoteHint?: StockQuote | null
): Promise<FundamentalsFetchResult | null> {
  try {
    const summary = await fetchYahooQuoteSummary(ticker, QUOTE_SUMMARY_MODULES)
    if (summary) {
      const fundamentals = buildFundamentalsFromSummary(summary)
      if (hasMeaningfulFundamentalsData(fundamentals)) {
        return { fundamentals, source: 'yahoo' }
      }
    }
  } catch (error) {
    if (isYahooAuthError(error)) {
      if (!yahooSummaryAuthBlockedLogged) {
        console.warn(
          `Yahoo fundamentals auth unavailable for ${ticker}; using cached/static fallback instead.`
        )
        yahooSummaryAuthBlockedLogged = true
      }
    } else if (!isRateLimitedYahooError(error)) {
      console.warn(`Failed to fetch Yahoo fundamentals for ${ticker}:`, error)
    }
  }

  const quote = quoteHint ?? (await loadQuote(ticker))
  const fallback = fallbackFundamentalsFromQuote(ticker, quote)
  if (!hasMeaningfulFundamentalsData(fallback)) return null
  return { fundamentals: fallback, source: 'fallback_quote' }
}

async function loadQuote(tickerRaw: string): Promise<StockQuote | null> {
  const ticker = normalizeTicker(tickerRaw)

  const freshCached = await readCachedQuote(ticker, QUOTE_FRESH_MS)
  if (freshCached) return freshCached

  const live = await fetchLiveQuoteWithFallback(ticker)
  if (live) {
    await writeQuoteCache(ticker, live.quote, live.source)
    return live.quote
  }

  return await readCachedQuote(ticker)
}

async function loadHistorical(tickerRaw: string, periodDays: number): Promise<PricePoint[]> {
  const ticker = normalizeTicker(tickerRaw)

  const freshCached = await readCachedHistorical(ticker, periodDays, HISTORICAL_FRESH_MS)
  if (freshCached.length > 0) return freshCached

  try {
    const live = await fetchYahooHistorical(ticker, periodDays)
    if (live.length > 0) {
      await writeHistoricalCache(ticker, live, 'yahoo')
      return live
    }
  } catch (error) {
    if (!isRateLimitedYahooError(error)) {
      if (isTransientNetworkError(error)) {
        console.warn(`Historical data fetch timed out for ${ticker}; using cached prices if available.`)
      } else {
        console.warn(`Failed to fetch historicals for ${ticker}:`, error)
      }
    }
  }

  return await readCachedHistorical(ticker, periodDays)
}

async function loadTickerFundamentals(tickerRaw: string): Promise<TickerFundamentals> {
  const ticker = normalizeTicker(tickerRaw)
  const freshCached = await readCachedFundamentals(ticker, FUNDAMENTALS_FRESH_MS)
  if (freshCached && !shouldTreatAsInsufficientFundamentals(ticker, freshCached)) {
    return freshCached
  }

  const staleCached = await readCachedFundamentals(ticker)
  const live = await fetchLiveFundamentalsWithFallback(ticker)
  if (live) {
    await writeFundamentalsCache(ticker, live.fundamentals, live.source)
    return live.fundamentals
  }

  if (staleCached && !shouldTreatAsInsufficientFundamentals(ticker, staleCached)) {
    return staleCached
  }

  const quote = await loadQuote(ticker)
  return fallbackFundamentalsFromQuote(ticker, quote)
}

export async function refreshTickerMarketData(
  tickerRaw: string,
  periodDays: number = 120
): Promise<RefreshTickerResult> {
  const ticker = normalizeTicker(tickerRaw)
  const result: RefreshTickerResult = {
    ticker,
    quoteSource: null,
    quoteUpdated: false,
    historicalUpdated: false,
    fundamentalsSource: null,
    fundamentalsUpdated: false,
    errors: [],
  }

  const liveQuote = await fetchLiveQuoteWithFallback(ticker)
  if (liveQuote) {
    result.quoteSource = liveQuote.source
    result.quoteUpdated = true
    await writeQuoteCache(ticker, liveQuote.quote, liveQuote.source)
  } else {
    result.errors.push('quote_fetch_failed')
  }

  try {
    const liveHistorical = await fetchYahooHistorical(ticker, periodDays)
    if (liveHistorical.length > 0) {
      result.historicalUpdated = true
      await writeHistoricalCache(ticker, liveHistorical, 'yahoo')
    } else {
      result.errors.push('historical_empty')
    }
  } catch (error) {
    result.errors.push(`historical_fetch_failed:${errorMessage(error)}`)
    if (!isRateLimitedYahooError(error)) {
      if (isTransientNetworkError(error)) {
        console.warn(`Historical refresh timed out for ${ticker}; keeping existing cached prices.`)
      } else {
        console.warn(`Historical refresh failed for ${ticker}:`, error)
      }
    }
  }

  const liveFundamentals = await fetchLiveFundamentalsWithFallback(
    ticker,
    liveQuote?.quote ?? null
  )
  if (liveFundamentals) {
    result.fundamentalsSource = liveFundamentals.source
    result.fundamentalsUpdated = true
    await writeFundamentalsCache(ticker, liveFundamentals.fundamentals, liveFundamentals.source)
  } else {
    result.errors.push('fundamentals_fetch_failed')
  }

  return result
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

export const getTickerFundamentals = unstable_cache(
  async (ticker: string): Promise<TickerFundamentals> => loadTickerFundamentals(ticker),
  ['stock-fundamentals-cache-v5'],
  { revalidate: 21600 }
)

export async function getTickerNews(
  ticker: string,
  limit: number = 5
): Promise<TickerNewsItem[]> {
  return fetchYahooNews(normalizeTicker(ticker), limit)
}

function getSectorHintForTicker(tickerRaw: string): string | null {
  const ticker = normalizeTicker(tickerRaw)
  return TICKER_SECTOR_HINTS[ticker] ?? null
}

function buildDailyReturnsByDate(points: PricePoint[]): Map<string, number> {
  const sorted = points
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((point) => Number.isFinite(point.close) && point.close > 0)

  const returnsByDate = new Map<string, number>()
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]
    const previous = sorted[index - 1]
    if (!current || !previous || previous.close <= 0) continue
    const ret = (current.close - previous.close) / previous.close
    if (!Number.isFinite(ret)) continue
    returnsByDate.set(current.date, ret)
  }
  return returnsByDate
}

function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null
  const n = x.length
  const meanX = x.reduce((sum, value) => sum + value, 0) / n
  const meanY = y.reduce((sum, value) => sum + value, 0) / n

  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  for (let index = 0; index < n; index += 1) {
    const dx = x[index] - meanX
    const dy = y[index] - meanY
    covariance += dx * dy
    varianceX += dx * dx
    varianceY += dy * dy
  }

  if (varianceX <= 0 || varianceY <= 0) return null
  const corr = covariance / Math.sqrt(varianceX * varianceY)
  if (!Number.isFinite(corr)) return null
  return Math.max(-1, Math.min(1, corr))
}

export function getRelatedTickers(tickerRaw: string): string[] {
  const ticker = normalizeTicker(tickerRaw)
  const mapped = RELATED_TICKER_MAP[ticker]
  if (mapped && mapped.length > 0) return mapped

  return CORRELATION_FALLBACK_POOL.filter((candidate) => candidate !== ticker).slice(0, 8)
}

export async function getTickerCorrelationNetwork(
  tickerRaw: string,
  options: {
    maxPeers?: number
    lookbackDays?: number
    minOverlapDays?: number
  } = {}
): Promise<CorrelationNetworkResult> {
  const ticker = normalizeTicker(tickerRaw)
  const maxPeers = Math.max(6, Math.min(12, options.maxPeers ?? 10))
  const lookbackDays = Math.max(180, Math.min(1825, options.lookbackDays ?? 365))
  const minOverlapDays = Math.max(30, Math.min(250, options.minOverlapDays ?? 90))

  const candidateTickers = [...new Set([...getRelatedTickers(ticker), ...CORRELATION_FALLBACK_POOL])]
    .filter((candidate) => candidate !== ticker)
    .slice(0, 18)

  const [centerQuote, centerHistory] = await Promise.all([
    getStockQuote(ticker),
    getHistoricalData(ticker, lookbackDays),
  ])
  const centerReturns = buildDailyReturnsByDate(centerHistory)
  const centerDates = new Set(centerReturns.keys())

  if (centerReturns.size < minOverlapDays) {
    return {
      ticker,
      name: centerQuote?.name ?? null,
      asOf: centerHistory[centerHistory.length - 1]?.date ?? null,
      sampleSize: centerReturns.size,
      peers: [],
    }
  }

  const peerRows = await Promise.all(
    candidateTickers.map(async (peerTicker): Promise<CorrelationNetworkPeer | null> => {
      const peerHistory = await getHistoricalData(peerTicker, lookbackDays)
      const peerReturns = buildDailyReturnsByDate(peerHistory)
      if (peerReturns.size < minOverlapDays) return null

      const alignedCenter: number[] = []
      const alignedPeer: number[] = []
      for (const date of centerDates) {
        const centerValue = centerReturns.get(date)
        const peerValue = peerReturns.get(date)
        if (centerValue === undefined || peerValue === undefined) continue
        alignedCenter.push(centerValue)
        alignedPeer.push(peerValue)
      }

      if (alignedCenter.length < minOverlapDays) return null
      const correlation = pearsonCorrelation(alignedCenter, alignedPeer)
      if (correlation === null) return null

      return {
        ticker: peerTicker,
        name: null,
        correlation: Number(correlation.toFixed(3)),
        absCorrelation: Number(Math.abs(correlation).toFixed(3)),
        sector: getSectorHintForTicker(peerTicker),
      } satisfies CorrelationNetworkPeer
    })
  )

  const peers = peerRows
    .filter((row): row is CorrelationNetworkPeer => row !== null)
    .sort((a, b) => b.absCorrelation - a.absCorrelation || a.ticker.localeCompare(b.ticker))
    .slice(0, maxPeers)

  return {
    ticker,
    name: centerQuote?.name ?? null,
    asOf: centerHistory[centerHistory.length - 1]?.date ?? null,
    sampleSize: centerReturns.size,
    peers,
  }
}
