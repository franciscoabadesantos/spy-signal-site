import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import MetricGrid from '@/components/page/MetricGrid'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
  TableEmptyRow,
} from '@/components/ui/DataTable'
import { getStockQuote } from '@/lib/finance'
import { getTickerPageSummary } from '@/lib/ticker-data'

export const dynamic = 'force-dynamic'

const STATEMENT_META = {
  'fund-profile': { title: 'Summary Snapshot' },
  portfolio: { title: 'Valuation & Growth Summary' },
  distributions: { title: 'Income Coverage Status' },
  'risk-metrics': { title: 'Risk Context Summary' },
} as const

type StatementSlug = keyof typeof STATEMENT_META
const LEGACY_SLUG_MAP: Record<string, StatementSlug> = {
  'income-statement': 'fund-profile',
  'balance-sheet': 'portfolio',
  'cash-flow': 'distributions',
  ratios: 'risk-metrics',
}

function formatCalendarDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCompactNumber(value: number | null, options?: { currency?: boolean }): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  const formatted = formatter.format(value)
  return options?.currency ? `$${formatted}` : formatted
}

function formatSignedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const scaled = Math.abs(value) <= 1.5 ? value * 100 : value
  const sign = scaled > 0 ? '+' : ''
  return `${sign}${scaled.toFixed(2)}%`
}

function formatFinancialValue(raw: number | string): string {
  const value = typeof raw === 'string' ? Number.parseFloat(raw.replace(/,/g, '')) : raw
  if (!Number.isFinite(value)) return String(raw)
  const abs = Math.abs(value)
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
  return value.toFixed(2)
}

function normalizeMetricLabel(value: string): string {
  const words = value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  return words.join(' ')
}

function displayMetricLabel(label: string): string {
  const normalized = normalizeMetricLabel(label)
  if (/^Trailing Pe$/i.test(normalized)) return 'Trailing P/E'
  if (/^Ebitda$/i.test(normalized)) return 'EBITDA'
  if (/^Eps$/i.test(normalized)) return 'EPS'
  return normalized
}

function formatFinancialMetricValue(label: string, valueDisplay: string | null, valueNumber: number | null): string {
  const parsedDisplay =
    valueDisplay && /^-?\d[\d,]*(\.\d+)?$/.test(valueDisplay.trim())
      ? Number.parseFloat(valueDisplay.replace(/,/g, ''))
      : null
  const numericValue =
    valueNumber !== null && Number.isFinite(valueNumber)
      ? valueNumber
      : parsedDisplay !== null && Number.isFinite(parsedDisplay)
        ? parsedDisplay
        : null

  if (numericValue === null) return valueDisplay ?? '—'

  const normalized = label.toLowerCase()
  const isPercentMetric =
    /(yield|margin|growth|return|roe|roa|ratio|rate|percent|pct)/.test(normalized)
  const isCurrencyMetric =
    /(market cap|revenue|sales|ebitda|cash|debt|assets|equity|income|flow|fcf|book value|enterprise value|liabilit|profit)/.test(
      normalized
    )

  if (isPercentMetric) {
    const scaled = Math.abs(numericValue) <= 1.5 ? numericValue * 100 : numericValue
    return `${scaled.toFixed(2)}%`
  }

  if (isCurrencyMetric) {
    return Math.abs(numericValue) < 1000 ? `$${numericValue.toFixed(2)}` : formatFinancialValue(numericValue)
  }

  return numericValue.toFixed(2)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string; statement: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker).catch(() => null)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Financial Data - Longbrunch`,
    description: `Financial data for ${name} (${ticker}), using the summary-level canonical fundamentals currently available from finance-backend.`,
  }
}

export default async function FinancialStatementPage({
  params,
}: {
  params: Promise<{ ticker: string; statement: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const statementSlug = (LEGACY_SLUG_MAP[resolvedParams.statement] ?? resolvedParams.statement) as StatementSlug
  const statementMeta = STATEMENT_META[statementSlug]
  if (!statementMeta) notFound()

  let summary: Awaited<ReturnType<typeof getTickerPageSummary>>
  try {
    summary = await getTickerPageSummary(ticker)
  } catch {
    return (
      <EmptyState
        title="Financial summary is temporarily unavailable"
        description="The frontend could not load canonical summary data from finance-backend for this ticker."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  const rows = summary.latestFundamentals.filter(
    (row) =>
      row !== null &&
      typeof row.metric === 'string' &&
      row.metric.trim().length > 0 &&
      typeof row.metricLabel === 'string' &&
      row.metricLabel.trim().length > 0 &&
      (row.valueDisplay !== null || row.valueNumber !== null)
  )

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Markets', href: '/markets' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Financial Summary', href: `/stocks/${ticker}/financials/fund-profile` },
          { label: 'Financial Data' },
        ]}
      />
      <div className="section-gap">
        <MetricGrid
          columns={4}
          items={[
            {
              label: 'Market Cap',
              value: formatCompactNumber(summary.fundamentalsSummary?.marketCap ?? null, { currency: true }),
            },
            {
              label: 'Latest Revenue',
              value: formatCompactNumber(summary.fundamentalsSummary?.latestRevenue ?? null, { currency: true }),
            },
            {
              label: 'Latest EPS',
              value:
                summary.fundamentalsSummary?.latestEps !== null &&
                summary.fundamentalsSummary?.latestEps !== undefined
                  ? summary.fundamentalsSummary.latestEps.toFixed(2)
                  : '—',
            },
            { label: 'Latest Period End', value: formatCalendarDate(summary.fundamentalsSummary?.periodEnd ?? null) },
          ]}
        />

        <Card className="section-gap" padding="lg">
          <div className="text-filter-label">Financial Data</div>
          <p className="mt-2 text-caption text-content-muted">
            Full financial statements will be available as more data sources are connected.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="surface-tertiary p-3">
              <div className="text-filter-label">Trailing P/E</div>
              <div className="mt-1 text-data-sm text-content-primary">
                {summary.fundamentalsSummary?.trailingPe?.toFixed(2) ?? '—'}
              </div>
            </div>
            <div className="surface-tertiary p-3">
              <div className="text-filter-label">Revenue Growth YoY</div>
              <div className="mt-1 text-data-sm text-content-primary">
                {formatSignedPercent(summary.fundamentalsSummary?.revenueGrowthYoy ?? null)}
              </div>
            </div>
            <div className="surface-tertiary p-3">
              <div className="text-filter-label">Latest Metrics</div>
              <div className="mt-1 text-data-sm text-content-primary">{rows.length}</div>
            </div>
            <div className="surface-tertiary p-3">
              <div className="text-filter-label">Coverage View</div>
              <div className="mt-1 text-data-sm text-content-primary">{statementMeta.title}</div>
            </div>
          </div>
        </Card>

        <TableShell contentClassName="max-h-[640px]">
          <TableBase className="whitespace-nowrap text-body-sm">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Metric</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
                <TableHeaderCell>Period End</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  title="No canonical summary metrics are available for this ticker."
                  description="When summary rows exist, they appear here as summary metrics only, not as full statements."
                />
              ) : (
                rows.slice(0, 12).map((row, index) => (
                  <TableRow key={`${row.metric}-${index}`} index={index}>
                    <TableCell>{displayMetricLabel(row.metricLabel)}</TableCell>
                    <TableCell className="text-data-sm numeric-tabular text-content-primary">
                      {formatFinancialMetricValue(row.metricLabel, row.valueDisplay, row.valueNumber)}
                    </TableCell>
                    <TableCell muted className="numeric-tabular">
                      {formatCalendarDate(row.periodEnd)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableBase>
        </TableShell>
      </div>
    </>
  )
}
