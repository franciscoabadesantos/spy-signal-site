import type { MetadataRoute } from 'next'
import { fetchBackendJson } from '@/lib/backend'

export const revalidate = 3600

type TickerSignal = {
  ticker: string
  signalDate: string | null
}

const SITEMAP_SOURCE_TIMEOUT_MS = 4000

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

async function readTickerSignalsFromBackend(): Promise<TickerSignal[]> {
  try {
    const data = await fetchBackendJson<unknown>('/screener/signals?limit=500', {
      context: 'backend.sitemap.screener_signals',
      timeoutMs: SITEMAP_SOURCE_TIMEOUT_MS,
    })
    if (!Array.isArray(data) || data.length === 0) return []

    return data
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const typedRow = row as Record<string, unknown>
        const ticker = readTicker(typedRow)
        if (!ticker) return null
        return {
          ticker,
          signalDate:
            readString(typedRow.signalDate) ??
            readString(typedRow.signal_date) ??
            readString(typedRow.as_of_date),
        }
      })
      .filter((row): row is TickerSignal => row !== null)
  } catch {
    return []
  }
}

async function readTickerSignals(): Promise<TickerSignal[]> {
  return readTickerSignalsFromBackend()
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
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/method`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
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
      url: `${baseUrl}/faq`,
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
