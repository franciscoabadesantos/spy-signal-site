import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import MetricGrid from '@/components/page/MetricGrid'
import StatRowCard from '@/components/ui/StatRowCard'
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
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Holdings & Dividends' },
        ]}
      />
      <div className="section-gap">
        <MetricGrid
          columns={4}
          items={[
            { label: 'Total Holdings', value: <span className="numeric-tabular">{holdingsRows.length.toString()}</span> },
            { label: 'Sectors', value: <span className="numeric-tabular">{sectorRows.length.toString()}</span> },
            { label: 'Dividend Yield', value: <span className="numeric-tabular">{fundamentals.dividendYield || '—'}</span> },
            { label: 'Payout Ratio', value: <span className="numeric-tabular">{fundamentals.payoutRatio || '—'}</span> },
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
            <h2 className="text-section-title text-content-primary">Top Holdings</h2>
            {holdingsRows.length === 0 ? (
              <p className="text-body">No holdings data is currently available for this ticker.</p>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-auto">
                {holdingsRows.map((holding) => {
                  const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingWeight)
                  return (
                    <div key={`${holding.symbol}-${holding.name}`} className="rounded-[var(--radius-lg)] border border-border p-3">
                      <div className="text-body-sm mb-1.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-label-lg text-content-primary">{holding.symbol}</span>
                          <span className="ml-2 text-content-muted">{holding.name}</span>
                        </div>
                        <span className="text-data-sm numeric-tabular text-content-secondary">
                          {formatWeight(holding.weightPercent)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="section-gap" padding="lg">
            <h2 className="text-section-title text-content-primary">Sector Exposure</h2>
            {sectorRows.length === 0 ? (
              <p className="text-body">No sector allocation data is currently available for this ticker.</p>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-auto">
                {sectorRows.map((sector) => {
                  const barWidth = calcWeightBarWidth(sector.weightPercent, maxSectorWeight)
                  return (
                    <div key={sector.sector} className="rounded-[var(--radius-lg)] border border-border p-3">
                      <div className="text-body-sm mb-1.5 flex items-center justify-between gap-4">
                        <span className="text-content-secondary">{sector.sector}</span>
                        <span className="text-data-sm numeric-tabular text-content-secondary">
                          {formatWeight(sector.weightPercent)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
                        <div className="h-full rounded-full bg-[var(--neutral-700)]" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="section-gap" padding="lg">
          <h3 className="text-card-title text-content-primary">Dividend Snapshot</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatRowCard label="Annual Dividend" value={fundamentals.dividendRate || '—'} />
            <StatRowCard label="Dividend Yield" value={fundamentals.dividendYield || '—'} />
            <StatRowCard label="Ex-Dividend Date" value={fundamentals.exDividendDate || '—'} />
            <StatRowCard label="Payout Ratio" value={fundamentals.payoutRatio || '—'} />
          </div>
          <p className="text-body">
            ETF holdings and dividend fields vary by instrument and provider coverage. Blank values indicate no published value from the source.
          </p>
        </Card>

        <Card>
          <h3 className="text-card-title text-content-primary">Snapshot Fields</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {snapshotRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2 text-body-sm">
                <span className="text-content-muted">{row.label}</span>
                <span className="text-data-sm numeric-tabular text-content-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
