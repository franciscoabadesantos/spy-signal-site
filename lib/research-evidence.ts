import { formatCompactMoney } from '@/lib/currency'
import type { StockResearchData } from '@/lib/stock-research'

export type CurrentResearchSnapshot = {
  marketCap: number | null
  sharesOutstanding: number | null
  currency: string
  reportingPeriod: string | null
  trailingPe: number | null
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

export function currentResearchSnapshot(data: StockResearchData): CurrentResearchSnapshot {
  const fundamentals = data.summary.fundamentalsSummary
  const sharesRow = data.summary.latestFundamentals.find((row) => {
    const key = normalize(`${row.metric} ${row.metricLabel}`)
    return key.includes('shares_outstanding') || key.includes('shares') && key.includes('outstanding')
  })

  return {
    marketCap: fundamentals?.marketCap ?? null,
    sharesOutstanding: sharesRow?.valueNumber ?? null,
    currency: fundamentals?.currency || data.currency,
    reportingPeriod: fundamentals?.periodEnd ?? null,
    trailingPe: fundamentals?.trailingPe ?? null,
  }
}

export function formatResearchMoney(value: number | null, currency: string): string {
  return formatCompactMoney(value, currency)
}

export function formatResearchShares(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

export function formatResearchMultiple(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value.toFixed(2)}x`
}

export function formatResearchDate(value: string | null): string {
  if (!value) return '—'
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}
