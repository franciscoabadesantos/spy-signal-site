import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import MetricGrid from '@/components/page/MetricGrid'
import StatRowCard from '@/components/ui/StatRowCard'
import { getStockQuote } from '@/lib/finance'
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
  try {
    summary = await getTickerPageSummary(ticker)
  } catch {
    return (
      <EmptyState
        title="Summary data is temporarily unavailable"
        description="The frontend could not load canonical summary data from finance-backend for this ticker."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
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

        <EmptyState
          title="Canonical holdings and dividend data are not available yet"
          description="This page does not show synthetic holdings, sector weights, dividends, or distributions. It remains a status surface until finance-backend exposes a proven canonical dataset."
        />

        <Card className="section-gap" padding="lg">
          <h3 className="text-card-title text-content-primary">Summary metrics currently available</h3>
          <p className="mt-2 text-body text-content-secondary">
            These cards come from the ticker summary endpoint and do not imply live holdings, sector, or dividend datasets.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatRowCard
              label="Trailing P/E"
              value={
                summary.fundamentalsSummary?.trailingPe !== null &&
                summary.fundamentalsSummary?.trailingPe !== undefined
                  ? summary.fundamentalsSummary.trailingPe.toFixed(2)
                  : '—'
              }
            />
            <StatRowCard
              label="Revenue Growth YoY"
              value={
                summary.fundamentalsSummary?.revenueGrowthYoy !== null &&
                summary.fundamentalsSummary?.revenueGrowthYoy !== undefined
                  ? `${(summary.fundamentalsSummary.revenueGrowthYoy * 100).toFixed(2)}%`
                  : '—'
              }
            />
            <StatRowCard
              label="Earnings Growth YoY"
              value={
                summary.fundamentalsSummary?.earningsGrowthYoy !== null &&
                summary.fundamentalsSummary?.earningsGrowthYoy !== undefined
                  ? `${(summary.fundamentalsSummary.earningsGrowthYoy * 100).toFixed(2)}%`
                  : '—'
              }
            />
            <StatRowCard
              label="Latest Period End"
              value={formatCalendarDate(summary.fundamentalsSummary?.periodEnd ?? null)}
            />
          </div>
        </Card>
      </div>
    </>
  )
}
