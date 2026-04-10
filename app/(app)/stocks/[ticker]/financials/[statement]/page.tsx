import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import FilterChip from '@/components/ui/FilterChip'
import MetricGrid from '@/components/page/MetricGrid'
import FinancialStatementBarChart, {
  type FinancialChartDatum,
} from '@/components/FinancialStatementBarChart'
import AllocationMiniBars, {
  type AllocationMiniBarDatum,
} from '@/components/AllocationMiniBars'
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
import { getStockQuote, getTickerFundamentals, type TickerFinancialRow } from '@/lib/finance'

export const dynamic = 'force-dynamic'

const STATEMENT_META = {
  'fund-profile': { title: 'Fund Profile', key: 'profile' },
  portfolio: { title: 'Portfolio Metrics', key: 'portfolio' },
  distributions: { title: 'Distributions', key: 'distributions' },
  'risk-metrics': { title: 'Risk & Return', key: 'risk' },
} as const

type StatementSlug = keyof typeof STATEMENT_META
const LEGACY_SLUG_MAP: Record<string, StatementSlug> = {
  'income-statement': 'fund-profile',
  'balance-sheet': 'portfolio',
  'cash-flow': 'distributions',
  ratios: 'risk-metrics',
}

type MetricKind = 'currency' | 'percent' | 'plain'

type ParsedMetric = {
  label: string
  raw: string
  value: number
  kind: MetricKind
}

function normalizeMetricLabel(label: string): string {
  if (label.length <= 20) return label
  return `${label.slice(0, 19)}…`
}

function parseFinancialMetric(label: string, valueRaw: string): ParsedMetric | null {
  const value = valueRaw.trim()
  if (!value || value === '—') return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  if (value.includes(' - ')) return null
  if (/[A-Za-z]/.test(value) && !value.includes('%') && !value.includes('$') && !/[TMBK]$/.test(value)) {
    return null
  }

  const match = value.match(/[-+]?\d*\.?\d+/)
  if (!match) return null
  const numeric = Number(match[0])
  if (!Number.isFinite(numeric)) return null

  const suffixToken = value.toUpperCase().match(/[TMBK](?![A-Za-z])/)
  const multiplier =
    suffixToken?.[0] === 'T'
      ? 1e12
      : suffixToken?.[0] === 'B'
        ? 1e9
        : suffixToken?.[0] === 'M'
          ? 1e6
          : suffixToken?.[0] === 'K'
            ? 1e3
            : 1

  const kind: MetricKind = value.includes('%') ? 'percent' : value.includes('$') ? 'currency' : 'plain'

  return {
    label,
    raw: value,
    value: numeric * multiplier,
    kind,
  }
}

function chooseBestMetricKind(metrics: ParsedMetric[]): MetricKind | null {
  const counts: Record<MetricKind, number> = {
    currency: 0,
    percent: 0,
    plain: 0,
  }

  for (const metric of metrics) counts[metric.kind] += 1
  const sortedKinds = (Object.entries(counts) as Array<[MetricKind, number]>).sort((a, b) => b[1] - a[1])
  const [bestKind, count] = sortedKinds[0] ?? [null, 0]
  if (!bestKind || count < 2) return null
  return bestKind
}

function buildChartData(rows: TickerFinancialRow[]): {
  data: FinancialChartDatum[]
  valueSuffix: string
  decimals: number
} | null {
  const parsed = rows
    .map((row) => parseFinancialMetric(row.label, row.value))
    .filter((metric): metric is ParsedMetric => metric !== null)

  if (parsed.length < 2) return null
  const chosenKind = chooseBestMetricKind(parsed)
  if (!chosenKind) return null

  const chosen = parsed
    .filter((metric) => metric.kind === chosenKind)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 7)

  if (chosen.length < 2) return null

  const maxAbs = Math.max(...chosen.map((item) => Math.abs(item.value)))

  let divisor = 1
  let suffix = ''
  let decimals = 2

  if (chosenKind === 'percent') {
    suffix = '%'
    decimals = 1
  } else if (maxAbs >= 1e12) {
    divisor = 1e12
    suffix = 'T'
    decimals = 2
  } else if (maxAbs >= 1e9) {
    divisor = 1e9
    suffix = 'B'
    decimals = 2
  } else if (maxAbs >= 1e6) {
    divisor = 1e6
    suffix = 'M'
    decimals = 2
  } else if (maxAbs >= 1e3) {
    divisor = 1e3
    suffix = 'K'
    decimals = 1
  } else {
    decimals = maxAbs >= 100 ? 0 : 2
  }

  const data: FinancialChartDatum[] = chosen.map((item) => ({
    label: normalizeMetricLabel(item.label),
    value: item.value / divisor,
    formatted: item.raw,
  }))

  return {
    data,
    valueSuffix: chosenKind === 'currency' ? `${suffix}` : suffix,
    decimals,
  }
}

function shortLabel(label: string, max = 14): string {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

function buildAllocationCharts(fundamentals: Awaited<ReturnType<typeof getTickerFundamentals>>): {
  holdings: AllocationMiniBarDatum[]
  sectors: AllocationMiniBarDatum[]
} {
  const holdings = (fundamentals.holdings ?? [])
    .filter((item) => typeof item.weightPercent === 'number' && Number.isFinite(item.weightPercent))
    .sort((a, b) => (b.weightPercent ?? 0) - (a.weightPercent ?? 0))
    .slice(0, 6)
    .map((item) => ({
      label: shortLabel(item.symbol),
      value: item.weightPercent as number,
    }))

  const sectors = (fundamentals.sectorWeights ?? [])
    .filter((item) => typeof item.weightPercent === 'number' && Number.isFinite(item.weightPercent))
    .sort((a, b) => (b.weightPercent ?? 0) - (a.weightPercent ?? 0))
    .slice(0, 6)
    .map((item) => ({
      label: shortLabel(item.sector, 18),
      value: item.weightPercent as number,
    }))

  return { holdings, sectors }
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
  const quote = await getStockQuote(ticker)
  const name = quote?.name || ticker

  return {
    title: `${ticker} ${sectionName} - SpySignal`,
    description: `${sectionName} for ${name} (${ticker}), including ETF profile, portfolio metrics, distributions, and risk data.`,
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

  const fundamentals = await getTickerFundamentals(ticker)

  const rows = fundamentals[statementMeta.key] as TickerFinancialRow[]
  const chart = buildChartData(rows)
  const allocationCharts = buildAllocationCharts(fundamentals)
  const hasAllocationCharts =
    allocationCharts.holdings.length > 0 || allocationCharts.sectors.length > 0

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Financials', href: `/stocks/${ticker}/financials/fund-profile` },
          { label: statementMeta.title },
        ]}
      />
      <div className="section-gap">
        <Card>
          <div className="text-filter-label mb-2">Statement</div>
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
            { label: 'Rows', value: <span className="numeric-tabular">{rows.length.toString()}</span> },
            { label: 'Holdings', value: <span className="numeric-tabular">{(fundamentals.holdings?.length ?? 0).toString()}</span> },
            { label: 'Dividend Yield', value: <span className="numeric-tabular">{fundamentals.dividendYield ?? '—'}</span> },
          ]}
        />

        <Card padding="lg" className="section-gap">
          <h2 className="text-section-title text-content-primary">Visual Highlights</h2>
          {chart ? (
            <FinancialStatementBarChart
              data={chart.data}
              valueSuffix={chart.valueSuffix}
              decimals={chart.decimals}
            />
          ) : (
            <div className="section-gap">
              <EmptyState
                title="No chart available for this dataset"
                description="This section contains structured data only"
              />
              {rows.length > 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-border p-3">
                  <div className="text-filter-label mb-2">Preview</div>
                  <div className="space-y-2">
                    {rows.slice(0, 3).map((row) => (
                      <div
                        key={`preview-${row.label}`}
                        className="text-body-sm flex items-center justify-between gap-3"
                      >
                        <span className="text-content-muted">{row.label}</span>
                        <span className="text-data-sm numeric-tabular text-content-primary">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-body">Review the detailed table below for field-level values.</p>
              )}
            </div>
          )}
        </Card>

        {hasAllocationCharts ? (
          <Card padding="lg" className="section-gap">
            <h3 className="text-card-title text-content-primary">Allocation Snapshot</h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {allocationCharts.holdings.length > 0 ? (
                <AllocationMiniBars
                  title="Top Holdings Weights"
                  data={allocationCharts.holdings}
                  tone="primary"
                />
              ) : null}
              {allocationCharts.sectors.length > 0 ? (
                <AllocationMiniBars
                  title="Top Sector Weights"
                  data={allocationCharts.sectors}
                  tone="secondary"
                />
              ) : null}
            </div>
          </Card>
        ) : null}

        <TableShell contentClassName="max-h-[640px]">
          <TableBase className="whitespace-nowrap text-body-sm">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Metric</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={2} title={`No ${statementMeta.title.toLowerCase()} data is available for this ticker.`} />
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.label} index={index}>
                    <TableCell muted>{row.label}</TableCell>
                    <TableCell className="text-data-sm numeric-tabular text-content-primary">{row.value}</TableCell>
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
