import type { Metadata } from 'next'
import Link from 'next/link'
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
import { getStockQuote, getTickerFundamentals } from '@/lib/finance'
import { getTickerNetwork } from '@/lib/network'
import { getTickerPageSummary } from '@/lib/ticker-data'

export const dynamic = 'force-dynamic'

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

function formatPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `$${value.toFixed(2)}`
}

function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatWeight(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value.toFixed(2)}%`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker).catch(() => null)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Holdings / Dividend Status - Longbrunch`,
    description: `Coverage status for holdings and dividend data for ${name} (${ticker}), with only summary-level fundamentals shown when available.`,
  }
}

export default async function HoldingsAndDividendsPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  let summary: Awaited<ReturnType<typeof getTickerPageSummary>>
  let fundamentals: Awaited<ReturnType<typeof getTickerFundamentals>>
  try {
    ;[summary, fundamentals] = await Promise.all([
      getTickerPageSummary(ticker),
      getTickerFundamentals(ticker),
    ])
  } catch {
    return (
      <EmptyState
        title="Summary data is temporarily unavailable"
        description="The frontend could not load canonical summary data from finance-backend for this ticker."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  const relatedTickerSymbols = await getTickerNetwork(ticker, { hops: 1 })
    .then((network) =>
      network.edges
        .filter((edge) => edge.source === ticker || edge.target === ticker)
        .sort((a, b) => b.absCorrelation - a.absCorrelation)
        .map((edge) => (edge.source === ticker ? edge.target : edge.source))
        .filter((symbol, index, array) => symbol !== ticker && array.indexOf(symbol) === index)
        .slice(0, 8)
    )
    .catch(() => [])
  const relatedQuotes = await Promise.allSettled(relatedTickerSymbols.map((symbol) => getStockQuote(symbol)))
  const relatedAssets = relatedTickerSymbols
    .map((symbol, index) => {
      const result = relatedQuotes[index]
      if (!result || result.status !== 'fulfilled' || !result.value) return null
      return {
        ticker: symbol,
        price: result.value.price ?? null,
        changePercent: result.value.changePercent ?? null,
      }
    })
    .filter((asset) => asset !== null)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Markets', href: '/markets' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Holdings / Dividend Status' },
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
            {
              label: 'Next Earnings',
              value: formatCalendarDate(summary.nextEarnings?.earningsDate ?? null),
            },
          ]}
        />

        <Card className="section-gap" padding="lg">
          <div className="text-filter-label">Coverage Status</div>
          <p className="mt-2 text-caption text-content-muted">
            {fundamentals.holdings.length > 0 || fundamentals.sectorWeights.length > 0
              ? 'Backend holdings and allocation data is available for this ticker.'
              : 'Holdings coverage is not available for this ticker yet.'}
          </p>
        </Card>

        <MetricGrid
          columns={4}
          items={[
            { label: 'Dividend Rate', value: fundamentals.dividendRate ?? '—' },
            { label: 'Dividend Yield', value: fundamentals.dividendYield ?? '—' },
            { label: 'Ex-Dividend Date', value: fundamentals.exDividendDate ?? '—' },
            { label: 'Payout Ratio', value: fundamentals.payoutRatio ?? '—' },
          ]}
        />

        <TableShell contentClassName="max-h-[520px]">
          <TableBase className="whitespace-nowrap text-body-sm">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Holding</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Weight</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {fundamentals.holdings.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  title="No holdings are available for this ticker."
                  description="Equities and funds without backend holdings data render gracefully without Yahoo fallback."
                />
              ) : (
                fundamentals.holdings.slice(0, 25).map((holding, index) => (
                  <TableRow key={`${holding.symbol}-${holding.name}-${index}`} index={index}>
                    <TableCell className="font-semibold text-content-primary">{holding.symbol}</TableCell>
                    <TableCell>{holding.name}</TableCell>
                    <TableCell className="numeric-tabular text-content-primary">
                      {formatWeight(holding.weightPercent)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableBase>
        </TableShell>

        <TableShell contentClassName="max-h-[420px]">
          <TableBase className="whitespace-nowrap text-body-sm">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Sector</TableHeaderCell>
                <TableHeaderCell>Weight</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {fundamentals.sectorWeights.length === 0 ? (
                <TableEmptyRow
                  colSpan={2}
                  title="No sector weights are available for this ticker."
                  description="The backend can return null/empty allocations independently of other fundamentals."
                />
              ) : (
                fundamentals.sectorWeights.map((sector, index) => (
                  <TableRow key={`${sector.sector}-${index}`} index={index}>
                    <TableCell>{sector.sector}</TableCell>
                    <TableCell className="numeric-tabular text-content-primary">
                      {formatWeight(sector.weightPercent)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableBase>
        </TableShell>

        <Card className="section-gap" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-card-title text-content-primary">Related assets</h3>
            <span className="text-caption text-content-muted">Quick context while holdings coverage is incomplete</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedAssets.length > 0 ? (
              relatedAssets.map((asset) => (
                <Link
                  key={asset.ticker}
                  href={`/stocks/${asset.ticker}`}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-body-sm text-content-primary transition hover:bg-surface-hover"
                >
                  <span className="font-semibold">{asset.ticker}</span>
                  <span className="numeric-tabular text-content-secondary">{formatPrice(asset.price)}</span>
                  <span
                    className={`numeric-tabular ${
                      asset.changePercent === null
                        ? 'text-content-muted'
                        : asset.changePercent >= 0
                          ? 'signal-bullish'
                          : 'signal-bearish'
                    }`}
                  >
                    {formatPct(asset.changePercent)}
                  </span>
                </Link>
              ))
            ) : (
              <span className="text-body-sm text-content-muted">
                Related assets are not available for this ticker yet.
              </span>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
