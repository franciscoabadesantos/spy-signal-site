import Nav from '@/components/Nav'
import StockSubnav from '@/components/StockSubnav'
import type { Metadata } from 'next'
import { getStockQuote, getTickerFundamentals } from '@/lib/finance'

export const dynamic = 'force-dynamic'

function formatWeight(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(2)}%`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Holdings, Dividends & Sector Weights - SpySignal`,
    description: `Explore top holdings, sector exposure, and dividend metrics for ${name} (${ticker}) on SpySignal.`,
  }
}

export default async function HoldingsAndDividendsPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const fundamentals = await getTickerFundamentals(ticker)
  const snapshotRows = fundamentals.snapshot ?? []
  const holdingsRows = fundamentals.holdings ?? []
  const sectorRows = fundamentals.sectorWeights ?? []

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">{ticker}</h1>
            <span className="text-xl text-gray-600 font-medium">Holdings & Dividends</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Constituents and distribution profile from market data providers.
          </div>
        </div>

        <StockSubnav ticker={ticker} active="holdings-dividends" />

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-bold text-gray-900">Snapshot</h2>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {snapshotRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <span className="text-[13px] text-gray-500">{row.label}</span>
                    <span className="text-[13px] font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-bold text-gray-900">Top Holdings</h2>
              </div>
              {holdingsRows.length === 0 ? (
                <div className="px-6 py-6 text-sm text-gray-600">
                  No holdings data is currently available for this ticker.
                </div>
              ) : (
                <div className="overflow-auto max-h-[560px]">
                  <table className="w-full text-left text-[13px] whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3 border-b border-gray-200">Symbol</th>
                        <th className="px-6 py-3 border-b border-gray-200">Name</th>
                        <th className="px-6 py-3 border-b border-gray-200">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsRows.map((holding) => (
                        <tr key={`${holding.symbol}-${holding.name}`} className="border-b border-gray-100 even:bg-gray-50/70">
                          <td className="px-6 py-3 font-semibold text-gray-900">{holding.symbol}</td>
                          <td className="px-6 py-3 text-gray-700">{holding.name}</td>
                          <td className="px-6 py-3 text-gray-700">{formatWeight(holding.weightPercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-bold text-gray-900">Sector Exposures</h2>
              </div>
              {sectorRows.length === 0 ? (
                <div className="px-6 py-6 text-sm text-gray-600">
                  No sector allocation data is currently available for this ticker.
                </div>
              ) : (
                <div className="overflow-auto max-h-[520px]">
                  <table className="w-full text-left text-[13px] whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3 border-b border-gray-200">Sector</th>
                        <th className="px-6 py-3 border-b border-gray-200">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorRows.map((sector) => (
                        <tr key={sector.sector} className="border-b border-gray-100 even:bg-gray-50/70">
                          <td className="px-6 py-3 text-gray-700">{sector.sector}</td>
                          <td className="px-6 py-3 text-gray-700">{formatWeight(sector.weightPercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="text-[16px] font-bold text-gray-900 mb-3">Dividend Snapshot</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Annual Dividend</span>
                  <span className="font-semibold text-gray-900">{fundamentals.dividendRate || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Dividend Yield</span>
                  <span className="font-semibold text-gray-900">{fundamentals.dividendYield || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Ex-Dividend Date</span>
                  <span className="font-semibold text-gray-900">{fundamentals.exDividendDate || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payout Ratio</span>
                  <span className="font-semibold text-gray-900">{fundamentals.payoutRatio || '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">Data Note</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ETF holdings and dividend fields vary by instrument and provider coverage. If a row
                is blank, the upstream source did not publish that field for the selected ticker.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
