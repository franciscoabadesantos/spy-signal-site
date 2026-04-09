import Link from 'next/link'
import AppShell from '@/components/shells/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import MetricGrid from '@/components/page/MetricGrid'
import { buttonClass } from '@/components/ui/Button'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from '@/components/ui/DataTable'
import { getViewerUserId } from '@/lib/auth'
import { getUserWatchlistTickers } from '@/lib/watchlist'
import { getLastFlipDatesByTicker, getScreenerSignals } from '@/lib/signals'
import { getRecentAiResearchRuns } from '@/lib/ai-research'
import RecentAiResearchRuns from '@/components/RecentAiResearchRuns'

export const dynamic = 'force-dynamic'

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(0)}%`
}

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function signalBadgeClass(signal: 'bullish' | 'neutral' | 'bearish' | null): 'neutral' | 'success' | 'danger' {
  if (signal === 'bullish') return 'success'
  if (signal === 'bearish') return 'danger'
  return 'neutral'
}

function signalLabel(signal: 'bullish' | 'neutral' | 'bearish' | null): string {
  if (signal === 'bullish') return 'Bullish'
  if (signal === 'bearish') return 'Bearish'
  if (signal === 'neutral') return 'Neutral'
  return 'No Signal'
}

function isWithinDays(value: string | null, days: number): boolean {
  if (!value) return false
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false
  return Date.now() - parsed <= days * 24 * 60 * 60 * 1000
}

export default async function DashboardPage() {
  const userId = await getViewerUserId()

  if (!userId) {
    return (
      <AppShell active="dashboard" container="md">
        <EmptyState
          title="Watchlist is for signed-in users"
          description="Sign in to create a personalized watchlist and track live model signals daily."
          action={
            <Link href="/" className={buttonClass({ variant: 'primary' })}>
              Return Home
            </Link>
          }
        />
      </AppShell>
    )
  }

  const tickers = await getUserWatchlistTickers(userId)
  const [{ rows }, lastFlipByTicker, recentAiRuns] = await Promise.all([
    getScreenerSignals({ tickers, limit: 500 }),
    getLastFlipDatesByTicker(tickers),
    getRecentAiResearchRuns({ userId, limit: 6 }),
  ])

  const rowByTicker = new Map(rows.map((row) => [row.ticker, row]))
  const watchlistRows = tickers.map((ticker) => {
    const row = rowByTicker.get(ticker)
    const direction = row?.direction ?? null
    const lastFlippedDate = lastFlipByTicker[ticker] ?? row?.signalDate ?? null

    return {
      ticker,
      row,
      direction,
      lastFlippedDate,
    }
  })

  const convictionRows = watchlistRows
    .map((entry) => entry.row?.conviction ?? null)
    .filter((value): value is number => value !== null && Number.isFinite(value))

  const avgConviction =
    convictionRows.length > 0
      ? convictionRows.reduce((sum, value) => sum + value, 0) / convictionRows.length
      : null

  const bullishCount = watchlistRows.filter((entry) => entry.direction === 'bullish').length
  const flipsLast30d = watchlistRows.filter((entry) => isWithinDays(entry.lastFlippedDate, 30)).length

  return (
    <AppShell active="dashboard" container="md">
      <div className="section-gap">
        <PageHeader
          title="Watchlist"
          subtitle="Track live model stance, conviction, and flip cadence for the assets you follow."
          action={
            <Link href="/screener" className={buttonClass({ variant: 'secondary' })}>
              Add More Assets
            </Link>
          }
        />

        {tickers.length === 0 ? (
          <Card>
            <h2 className="text-section-title mb-2 text-neutral-900 dark:text-neutral-100">Your watchlist is empty</h2>
            <p className="text-body mb-5">
              Visit any ticker page and click Add to Watchlist to start building your personalized workspace.
            </p>
            <Link href="/stocks/SPY" className={buttonClass({ variant: 'primary' })}>
              Explore SPY
            </Link>
          </Card>
        ) : (
          <>
            <MetricGrid
              columns={4}
              items={[
                { label: 'Tracked Assets', value: tickers.length.toString() },
                { label: 'Bullish Signals', value: bullishCount.toString() },
                {
                  label: 'Avg Conviction',
                  value: avgConviction === null ? '—' : `${Math.round(avgConviction * 100)}%`,
                },
                { label: 'Flips (30d)', value: flipsLast30d.toString() },
              ]}
            />

            <TableShell>
              <TableBase className="whitespace-nowrap">
                <TableHead sticky>
                  <tr>
                    <TableHeaderCell sortable sortDirection="asc">Ticker</TableHeaderCell>
                    <TableHeaderCell>Current Price</TableHeaderCell>
                    <TableHeaderCell>Live Signal</TableHeaderCell>
                    <TableHeaderCell>Conviction</TableHeaderCell>
                    <TableHeaderCell>Last Flipped Date</TableHeaderCell>
                    <TableHeaderCell>% Chg</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {watchlistRows.map(({ ticker, row, direction, lastFlippedDate }, index) => (
                    <TableRow key={ticker} index={index}>
                      <TableCell className="font-semibold">
                        <Link href={`/stocks/${ticker}`} className="text-primary hover:underline">
                          {ticker}
                        </Link>
                        {row?.name ? (
                          <div className="max-w-[220px] truncate text-[12px] font-normal text-muted-foreground">
                            {row.name}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(row?.price ?? null)}</TableCell>
                      <TableCell>
                        <Badge variant={signalBadgeClass(direction)}>{signalLabel(direction)}</Badge>
                      </TableCell>
                      <TableCell muted>{formatConviction(row?.conviction ?? null)}</TableCell>
                      <TableCell muted>{formatDate(lastFlippedDate)}</TableCell>
                      <TableCell
                        className={
                          (row?.changePercent ?? null) === null
                            ? 'text-muted-foreground'
                            : (row?.changePercent ?? 0) >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                        }
                      >
                        {formatPct(row?.changePercent ?? null)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableBase>
            </TableShell>

            <div className="section-gap">
              <div>
                <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Recent AI Research</h2>
                <p className="text-body mt-1">Secondary context from your latest AI runs.</p>
              </div>
              <RecentAiResearchRuns
                title="Saved Runs"
                runs={recentAiRuns}
                emptyMessage="No saved AI research runs yet."
                compact
                className="border-dashed bg-neutral-50/70 dark:bg-neutral-900/30"
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
