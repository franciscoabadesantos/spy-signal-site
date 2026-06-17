import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import FilterChip from '@/components/ui/FilterChip'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string; statement: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const statementSlug = (LEGACY_SLUG_MAP[resolvedParams.statement] ?? resolvedParams.statement) as StatementSlug
  const sectionName = STATEMENT_META[statementSlug]?.title ?? 'Financial Data'
  const quote = await getStockQuote(ticker).catch(() => null)
  const name = quote?.name || ticker

  return {
    title: `${ticker} ${sectionName} - Longbrunch`,
    description: `${sectionName} for ${name} (${ticker}), using only summary-level canonical data currently available from finance-backend.`,
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

  const rows = summary.latestFundamentals.filter((row) => row.valueDisplay !== null || row.valueNumber !== null)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Markets', href: '/markets' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Financial Summary', href: `/stocks/${ticker}/financials/fund-profile` },
          { label: statementMeta.title },
        ]}
      />
      <div className="section-gap">
        <Card>
          <div className="text-filter-label mb-2">Summary View</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATEMENT_META).map(([slug, meta]) => (
              <FilterChip
                key={slug}
                label={meta.title}
                active={slug === statementSlug}
                href={`/stocks/${ticker}/financials/${slug}`}
              />
            ))}
          </div>
        </Card>

        <MetricGrid
          columns={4}
          items={[
            { label: 'Section', value: statementMeta.title },
            { label: 'Latest Metrics', value: rows.length.toString() },
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
          ]}
        />

        <Card className="section-gap" padding="lg">
          <h2 className="text-section-title text-content-primary">Canonical Summary Coverage</h2>
          <p className="mt-2 text-body text-content-secondary">
            These cards reflect summary-level fundamentals only. Full statements or section-specific ledgers are not currently exposed on the canonical backend route.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="surface-tertiary p-3">
              <div className="text-filter-label">Market Cap</div>
              <div className="mt-1 text-data-sm text-content-primary">
                {formatCompactNumber(summary.fundamentalsSummary?.marketCap ?? null, { currency: true })}
              </div>
            </div>
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
              <div className="text-filter-label">Latest Period End</div>
              <div className="mt-1 text-data-sm text-content-primary">
                {formatCalendarDate(summary.fundamentalsSummary?.periodEnd ?? null)}
              </div>
            </div>
          </div>
        </Card>

        <EmptyState
          title={`${statementMeta.title} is not available from canonical backend data yet`}
          description="This surface no longer shows pseudo-statements or synthetic section data. It will remain summary-only until finance-backend exposes a proven canonical dataset for this section."
        />

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
                    <TableCell>{row.metricLabel}</TableCell>
                    <TableCell className="text-data-sm numeric-tabular text-content-primary">
                      {row.valueDisplay ?? (row.valueNumber !== null ? row.valueNumber.toLocaleString() : '—')}
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
