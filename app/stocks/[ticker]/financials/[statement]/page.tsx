import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import StockSubnav from '@/components/StockSubnav'
import Breadcrumbs from '@/components/Breadcrumbs'
import FinancialStatementBarChart, {
  type FinancialChartDatum,
} from '@/components/FinancialStatementBarChart'
import AllocationMiniBars, {
  type AllocationMiniBarDatum,
} from '@/components/AllocationMiniBars'
import type { Metadata } from 'next'
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

  // Exclude obvious date/range/string-only rows.
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
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker, href: `/stocks/${ticker}` },
            { label: 'Financials', href: `/stocks/${ticker}/financials/fund-profile` },
            { label: statementMeta.title },
          ]}
        />

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">{ticker}</h1>
            <span className="text-xl text-gray-600 font-medium">{statementMeta.title}</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            ETF-focused metrics and exposures refreshed from market data providers.
          </div>
        </div>

        <StockSubnav ticker={ticker} />

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[18px] font-bold text-gray-900">{statementMeta.title}</h2>
            </div>
            {chart && (
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="text-[13px] font-medium text-gray-700 mb-3">
                  Visual Highlights
                </div>
                <FinancialStatementBarChart
                  data={chart.data}
                  valueSuffix={chart.valueSuffix}
                  decimals={chart.decimals}
                />
              </div>
            )}
            {hasAllocationCharts && (
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="text-[13px] font-medium text-gray-700 mb-3">
                  Allocation Snapshot
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {allocationCharts.holdings.length > 0 && (
                    <AllocationMiniBars
                      title="Top Holdings Weights"
                      data={allocationCharts.holdings}
                      color="#2563eb"
                    />
                  )}
                  {allocationCharts.sectors.length > 0 && (
                    <AllocationMiniBars
                      title="Top Sector Weights"
                      data={allocationCharts.sectors}
                      color="#0f766e"
                    />
                  )}
                </div>
              </div>
            )}
            {rows.length === 0 ? (
              <div className="px-6 py-6 text-sm text-gray-600">
                No {statementMeta.title.toLowerCase()} data is available for this ticker.
              </div>
            ) : (
              <div className="overflow-auto max-h-[640px]">
                <table className="w-full text-left text-[13px] whitespace-nowrap">
                  <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3 border-b border-gray-200">Metric</th>
                      <th className="px-6 py-3 border-b border-gray-200">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.label} className="border-b border-gray-100 even:bg-gray-50/70">
                        <td className="px-6 py-3 text-gray-700">{row.label}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">Financial Sections</h3>
            <div className="divide-y divide-gray-100">
              {Object.entries(STATEMENT_META).map(([slug, meta]) => {
                const isActive = slug === statementSlug
                return (
                  <Link
                    key={slug}
                    href={`/stocks/${ticker}/financials/${slug}`}
                    className={`block py-3 text-sm ${isActive ? 'font-semibold text-primary' : 'text-[#155e75] hover:underline'}`}
                  >
                    {meta.title}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
