import { formatCompactMoney } from '@/lib/currency'

/**
 * Display formatting for fundamentals/metrics. Backend and cached payloads mix
 * pre-formatted strings ("$1.43T"), percent-scaled numbers (0.38 meaning 0.38%)
 * and raw ratios (0.003816447 meaning 0.38%), so formatting is defensive:
 * strings that don't parse as a plain number pass through untouched.
 */

const EMPTY_VALUES = new Set(['', '—', '-', 'N/A', 'n/a', 'null', 'None'])

export function isAbsentDisplayValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return !Number.isFinite(value)
  return EMPTY_VALUES.has(value.trim())
}

export function parseNumericString(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/,/g, '')
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** 0.0038 → "0.38%" (ratio input). Values ≥ 1 are assumed percent-scaled already. */
export function formatRatioAsPercent(value: string | number | null | undefined, decimals = 2): string | null {
  const numeric = parseNumericString(value)
  if (numeric === null) return null
  const scaled = Math.abs(numeric) < 1 ? numeric * 100 : numeric
  return `${scaled.toFixed(decimals)}%`
}

/** 2196045588 → "2.20B" */
export function formatCompactNumber(value: string | number | null | undefined, decimals = 2): string | null {
  const numeric = parseNumericString(value)
  if (numeric === null) return null
  const abs = Math.abs(numeric)
  const sign = numeric < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`
  if (abs >= 1e4) return `${sign}${(abs / 1e3).toFixed(decimals)}K`
  return trimNumber(numeric)
}

function trimNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')
  return value.toFixed(2)
}

const PERCENT_METRIC = /yield|payout|margin|growth|expense ratio|turnover|return/i
const MONEY_METRIC = /market cap|revenue|income|cash flow|free cash|assets|liabilit|profit|ebitda|debt|enterprise|aum/i
const COUNT_METRIC = /shares|volume|float|holdings count|employees/i
const DATE_METRIC = /date/i

/**
 * Formats a fundamentals row by metric label. Returns null when the value is
 * absent — callers should drop the row instead of rendering a dash.
 */
export function formatFundamentalValue(
  label: string,
  display: string | null | undefined,
  numeric?: number | null,
  currency?: string | null
): string | null {
  const raw = !isAbsentDisplayValue(display) ? (display as string) : null
  const value = parseNumericString(raw) ?? (typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : null)

  if (value === null) {
    // Non-numeric display strings (dates, pre-formatted "$1.43T") pass through.
    return raw
  }
  if (DATE_METRIC.test(label) && raw) return raw
  if (PERCENT_METRIC.test(label)) return formatRatioAsPercent(value)
  if (MONEY_METRIC.test(label)) return formatCompactMoney(value, currency ?? null)
  if (COUNT_METRIC.test(label)) return formatCompactNumber(value)
  if (Math.abs(value) >= 1e6) return formatCompactNumber(value)
  return trimNumber(value)
}

/** Drops entries whose value is absent — empty means absent, not a dash. */
export function presentMetrics<T extends { value: string | number | null | undefined }>(
  items: T[]
): Array<T & { value: NonNullable<T['value']> }> {
  return items.filter((item) => !isAbsentDisplayValue(item.value)) as Array<T & { value: NonNullable<T['value']> }>
}
