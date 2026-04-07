import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import StockSubnav from '@/components/StockSubnav'
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

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
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
