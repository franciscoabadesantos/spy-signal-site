import Nav from '@/components/Nav'
import StockSubnav from '@/components/StockSubnav'
import Breadcrumbs from '@/components/Breadcrumbs'
import PortfolioFlowSankey, {
  type PortfolioFlowLinkDatum,
  type PortfolioFlowNodeDatum,
} from '@/components/PortfolioFlowSankey'
import type { Metadata } from 'next'
import { getStockQuote, getTickerFundamentals } from '@/lib/finance'

export const dynamic = 'force-dynamic'

function formatWeight(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(2)}%`
}

function calcWeightBarWidth(value: number | null, maxValue: number): number {
  if (value === null || !Number.isFinite(value) || maxValue <= 0) return 0
  return Math.max(0, Math.min(100, (value / maxValue) * 100))
}

type PortfolioFlowData = {
  totalWeight: number
  topHoldingsWeight: number
  data: {
    nodes: PortfolioFlowNodeDatum[]
    links: PortfolioFlowLinkDatum[]
  }
}

function roundWeight(value: number): number {
  return Number(value.toFixed(2))
}

function buildPortfolioFlowData(
  sectorRows: Awaited<ReturnType<typeof getTickerFundamentals>>['sectorWeights'],
  holdingsRows: Awaited<ReturnType<typeof getTickerFundamentals>>['holdings']
): PortfolioFlowData | null {
  const validSectors = sectorRows
    .filter((row) => row.weightPercent !== null && Number.isFinite(row.weightPercent))
    .map((row) => ({
      name: row.sector,
      value: row.weightPercent as number,
    }))
    .sort((a, b) => b.value - a.value)

  const validHoldings = holdingsRows
    .filter((row) => row.weightPercent !== null && Number.isFinite(row.weightPercent))
    .map((row) => ({
      name: row.symbol,
      value: row.weightPercent as number,
    }))
    .sort((a, b) => b.value - a.value)

  if (validSectors.length < 2 || validHoldings.length === 0) return null

  const totalWeight = roundWeight(validSectors.reduce((sum, row) => sum + row.value, 0))
  if (totalWeight <= 0) return null

  const sectorBuckets = validSectors.slice(0, 5)
  const sectorShownWeight = sectorBuckets.reduce((sum, row) => sum + row.value, 0)
  const residualSectorWeight = roundWeight(Math.max(0, totalWeight - sectorShownWeight))
  if (residualSectorWeight >= 0.5) {
    sectorBuckets.push({
      name: 'Other Sectors',
      value: residualSectorWeight,
    })
  }

  const holdingBuckets = validHoldings.slice(0, 6)
  const topHoldingsWeight = roundWeight(holdingBuckets.reduce((sum, row) => sum + row.value, 0))
  const residualHoldingsWeight = roundWeight(Math.max(0, totalWeight - topHoldingsWeight))
  if (residualHoldingsWeight >= 0.5) {
    holdingBuckets.push({
      name: 'Other Holdings',
      value: residualHoldingsWeight,
    })
  }

  const nodes: PortfolioFlowNodeDatum[] = []
  const links: PortfolioFlowLinkDatum[] = []

  for (const sector of sectorBuckets) {
    nodes.push({
      name: sector.name,
      value: sector.value,
      valueLabel: `${sector.value.toFixed(2)}%`,
      tone: sector.name === 'Other Sectors' ? 'other' : 'sector',
    })
  }

  const portfolioIndex = nodes.length
  nodes.push({
    name: 'Portfolio',
    value: totalWeight,
    valueLabel: `${totalWeight.toFixed(2)}% allocated`,
    tone: 'portfolio',
  })

  for (let index = 0; index < sectorBuckets.length; index += 1) {
    links.push({
      source: index,
      target: portfolioIndex,
      value: roundWeight(sectorBuckets[index].value),
    })
  }

  for (const holding of holdingBuckets) {
    const holdingIndex = nodes.length
    nodes.push({
      name: holding.name,
      value: holding.value,
      valueLabel: `${holding.value.toFixed(2)}%`,
      tone: holding.name === 'Other Holdings' ? 'other' : 'holding',
    })
    links.push({
      source: portfolioIndex,
      target: holdingIndex,
      value: roundWeight(holding.value),
    })
  }

  return {
    totalWeight,
    topHoldingsWeight,
    data: {
      nodes,
      links,
    },
  }
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
  const portfolioFlow = buildPortfolioFlowData(sectorRows, holdingsRows)
  const maxHoldingWeight = holdingsRows.reduce((max, row) => {
    if (row.weightPercent === null || !Number.isFinite(row.weightPercent)) return max
    return Math.max(max, row.weightPercent)
  }, 0)
  const maxSectorWeight = sectorRows.reduce((max, row) => {
    if (row.weightPercent === null || !Number.isFinite(row.weightPercent)) return max
    return Math.max(max, row.weightPercent)
  }, 0)

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker, href: `/stocks/${ticker}` },
            { label: 'Holdings & Dividends' },
          ]}
        />

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

            {portfolioFlow ? (
              <PortfolioFlowSankey
                title="How this portfolio is allocated right now"
                subtitle="This view adapts the Sankey-style financial map to the ETF data you actually have: sector exposure flows into total portfolio allocation, then out into the largest disclosed holdings."
                totalWeight={portfolioFlow.totalWeight}
                topHoldingsWeight={portfolioFlow.topHoldingsWeight}
                data={portfolioFlow.data}
              />
            ) : null}

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-bold text-gray-900">Top Holdings</h2>
              </div>
              {holdingsRows.length === 0 ? (
                <div className="px-6 py-6 text-sm text-gray-600">
                  No holdings data is currently available for this ticker.
                </div>
              ) : (
                <div className="max-h-[560px] space-y-1 overflow-auto px-4 py-3">
                  {holdingsRows.map((holding) => {
                    const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingWeight)
                    return (
                      <div
                        key={`${holding.symbol}-${holding.name}`}
                        className="group rounded-lg border border-transparent px-2 py-2 hover:border-gray-200 hover:bg-gray-50"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="text-[13px] font-semibold text-gray-900">{holding.symbol}</span>
                            <span className="ml-2 text-[12px] text-gray-500">{holding.name}</span>
                          </div>
                          <span className="shrink-0 text-[13px] font-medium text-gray-700">
                            {formatWeight(holding.weightPercent)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
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
                <div className="max-h-[520px] space-y-1 overflow-auto px-4 py-3">
                  {sectorRows.map((sector) => {
                    const barWidth = calcWeightBarWidth(sector.weightPercent, maxSectorWeight)
                    return (
                      <div
                        key={sector.sector}
                        className="group rounded-lg border border-transparent px-2 py-2 hover:border-gray-200 hover:bg-gray-50"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-4 text-[13px]">
                          <span className="text-gray-700">{sector.sector}</span>
                          <span className="font-medium text-gray-700">{formatWeight(sector.weightPercent)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
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
