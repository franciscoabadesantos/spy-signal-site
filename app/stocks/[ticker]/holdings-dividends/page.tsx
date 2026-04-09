import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import ResearchShell from '@/components/shells/ResearchShell'
import Card from '@/components/ui/Card'
import MetricGrid from '@/components/page/MetricGrid'
import PortfolioFlowSankey, {
  type PortfolioFlowLinkDatum,
  type PortfolioFlowNodeDatum,
} from '@/components/PortfolioFlowSankey'
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
  const [fundamentals, quote] = await Promise.all([
    getTickerFundamentals(ticker),
    getStockQuote(ticker),
  ])

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
    <ResearchShell
      ticker={ticker}
      activeTab="holdings-dividends"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker, href: `/stocks/${ticker}` },
            { label: 'Holdings & Dividends' },
          ]}
        />
      }
      header={{
        ticker,
        companyName: quote?.name ?? null,
        price: quote?.price ?? null,
        dailyMove: {
          amount: quote?.change ?? null,
          percent: quote?.changePercent ?? null,
        },
        subtitle: 'Constituents and distribution profile from market data providers.',
      }}
    >
      <div className="section-gap">
        <MetricGrid
          columns={4}
          items={[
            { label: 'Total Holdings', value: holdingsRows.length.toString() },
            { label: 'Sectors', value: sectorRows.length.toString() },
            { label: 'Dividend Yield', value: fundamentals.dividendYield || '—' },
            { label: 'Payout Ratio', value: fundamentals.payoutRatio || '—' },
          ]}
        />

        {portfolioFlow ? (
          <PortfolioFlowSankey
            title="Portfolio Flow Map"
            subtitle="Sector exposure flowing into total allocation and then into largest disclosed holdings."
            totalWeight={portfolioFlow.totalWeight}
            topHoldingsWeight={portfolioFlow.topHoldingsWeight}
            data={portfolioFlow.data}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="section-gap" padding="lg">
            <h2 className="text-section-title text-neutral-900 dark:text-neutral-100">Top Holdings</h2>
            {holdingsRows.length === 0 ? (
              <p className="text-body">No holdings data is currently available for this ticker.</p>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-auto">
                {holdingsRows.map((holding) => {
                  const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingWeight)
                  return (
                    <div key={`${holding.symbol}-${holding.name}`} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{holding.symbol}</span>
                          <span className="ml-2 text-neutral-500">{holding.name}</span>
                        </div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {formatWeight(holding.weightPercent)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="section-gap" padding="lg">
            <h2 className="text-section-title text-neutral-900 dark:text-neutral-100">Sector Exposure</h2>
            {sectorRows.length === 0 ? (
              <p className="text-body">No sector allocation data is currently available for this ticker.</p>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-auto">
                {sectorRows.map((sector) => {
                  const barWidth = calcWeightBarWidth(sector.weightPercent, maxSectorWeight)
                  return (
                    <div key={sector.sector} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <span className="text-neutral-700 dark:text-neutral-300">{sector.sector}</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {formatWeight(sector.weightPercent)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full rounded-full bg-neutral-700 dark:bg-neutral-300" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="section-gap" padding="lg">
          <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Dividend Snapshot</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-filter-label">Annual Dividend</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{fundamentals.dividendRate || '—'}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-filter-label">Dividend Yield</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{fundamentals.dividendYield || '—'}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-filter-label">Ex-Dividend Date</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{fundamentals.exDividendDate || '—'}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-filter-label">Payout Ratio</div>
              <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{fundamentals.payoutRatio || '—'}</div>
            </div>
          </div>
          <p className="text-body">
            ETF holdings and dividend fields vary by instrument and provider coverage. Blank values indicate no published value from the source.
          </p>
        </Card>

        <Card>
          <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Snapshot Fields</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {snapshotRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">{row.label}</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ResearchShell>
  )
}
