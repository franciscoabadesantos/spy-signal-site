import type { MetadataRoute } from 'next'

export const revalidate = 3600

type TickerSignal = {
  ticker: string
  signalDate: string | null
}

const SITEMAP_SOURCE_TIMEOUT_MS = 4000
const SITEMAP_TOTAL_TIMEOUT_MS = 10000

const FALLBACK_TICKERS = ['SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'NVDA', 'TSLA']

function normalizeBaseUrl(value: string | undefined): string {
  const fallback = 'https://spy-signal-site.vercel.app'
  if (!value) return fallback

  const trimmed = value.trim()
  if (!trimmed) return fallback

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`
  } catch {
    return fallback
  }
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readTicker(row: Record<string, unknown>): string | null {
  const candidate =
    readString(row.ticker)?.toUpperCase() ??
    readString(row.symbol)?.toUpperCase() ??
    readString(row.asset_ticker)?.toUpperCase()
  return candidate ?? null
}

function readSignalDate(row: Record<string, unknown>): string | null {
  return (
    readString(row.signal_date) ??
    readString(row.as_of_date) ??
    readString(row.date) ??
    readString(row.updated_at)
  )
}

function newerDate(current: string | null, incoming: string | null): string | null {
  if (!incoming) return current
  if (!current) return incoming
  const currentMs = Date.parse(current)
  const incomingMs = Date.parse(incoming)
  if (!Number.isFinite(incomingMs)) return current
  if (!Number.isFinite(currentMs)) return incoming
  return incomingMs > currentMs ? incoming : current
}

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

async function readTickerSignalsFromBackend(): Promise<TickerSignal[]> {
  const base = backendBaseUrl()
  if (!base) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SITEMAP_SOURCE_TIMEOUT_MS)
  const response = await fetch(`${base}/screener/signals?limit=500`, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
    signal: controller.signal,
  }).catch(() => null)
  clearTimeout(timeout)
  if (!response || !response.ok) return []

  const data = (await response.json().catch(() => [])) as Array<Record<string, unknown>>
  if (!Array.isArray(data) || data.length === 0) return []

  return data
    .map((row) => {
      const ticker = readTicker(row)
      if (!ticker) return null
      return {
        ticker,
        signalDate: readString(row.signalDate),
      }
    })
    .filter((row): row is TickerSignal => row !== null)
}

async function readTickerSignals(): Promise<TickerSignal[]> {
  const fallbackRows = FALLBACK_TICKERS.map((ticker) => ({ ticker, signalDate: null }))

  const read = (async (): Promise<TickerSignal[]> => {
    const rows = await readTickerSignalsFromBackend()
    if (rows.length > 0) return rows
    return fallbackRows
  })()

  const timeout = new Promise<TickerSignal[]>((resolve) =>
    setTimeout(() => resolve(fallbackRows), SITEMAP_TOTAL_TIMEOUT_MS)
  )

  return Promise.race([read, timeout])
}

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return undefined
  return new Date(parsed)
}

function tickerEntries(baseUrl: string, row: TickerSignal): MetadataRoute.Sitemap {
  const ticker = encodeURIComponent(row.ticker)
  const lastModified = toDate(row.signalDate) ?? new Date()

  return [
    {
      url: `${baseUrl}/stocks/${ticker}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/signal-history`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/performance`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/holdings-dividends`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/methodology`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/financials/fund-profile`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/financials/portfolio`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/financials/distributions`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/stocks/${ticker}/financials/risk-metrics`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
  const now = new Date()
  const rows = await readTickerSignals()

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/screener`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stocks/SPY/performance`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/performance`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const uniqueTickers = new Map<string, TickerSignal>()
  for (const row of rows) {
    uniqueTickers.set(row.ticker, row)
  }

  for (const row of uniqueTickers.values()) {
    entries.push(...tickerEntries(baseUrl, row))
  }

  return entries
}
