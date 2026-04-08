import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

type TickerSignal = {
  ticker: string
  signalDate: string | null
}

const TICKER_SOURCES = [
  'latest_signals_view',
  'latest_signals',
  'signals_latest',
  'signals_live',
  'market_signals',
  'spy_signals_live',
]

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

async function readTickerSignalsFromSource(source: string): Promise<TickerSignal[]> {
  const { data, error } = await supabase.from(source).select('*').limit(1000)
  if (error || !data || data.length === 0) return []

  if (source === 'spy_signals_live') {
    let latest: string | null = null
    for (const row of data) {
      const typed = (row ?? {}) as Record<string, unknown>
      latest = newerDate(latest, readSignalDate(typed))
    }
    return [{ ticker: 'SPY', signalDate: latest }]
  }

  const byTicker = new Map<string, string | null>()
  for (const row of data) {
    const typed = (row ?? {}) as Record<string, unknown>
    const ticker = readTicker(typed)
    if (!ticker) continue
    const signalDate = readSignalDate(typed)
    byTicker.set(ticker, newerDate(byTicker.get(ticker) ?? null, signalDate))
  }

  return [...byTicker.entries()].map(([ticker, signalDate]) => ({ ticker, signalDate }))
}

async function readTickerSignals(): Promise<TickerSignal[]> {
  for (const source of TICKER_SOURCES) {
    try {
      const rows = await readTickerSignalsFromSource(source)
      if (rows.length > 0) return rows
    } catch {
      // Try next candidate source.
    }
  }

  return FALLBACK_TICKERS.map((ticker) => ({ ticker, signalDate: null }))
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
      url: `${baseUrl}/performance`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/methodology`,
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
