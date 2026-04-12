import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClass } from '@/components/ui/Button'
import ActionBar from '@/components/page/ActionBar'
import MetricGrid from '@/components/page/MetricGrid'
import StatRowCard from '@/components/ui/StatRowCard'
import SignalFlowStream from '@/components/SignalFlowStream'
import SignalDistributionBubbleCluster from '@/components/SignalDistributionBubbleCluster'
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
import { getStockQuote } from '@/lib/finance'
import { getSignalHistoryForTicker } from '@/lib/signals'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatConviction(prob: number | null) {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

function formatEpisodeReturn(value: number | null) {
  if (value === null) return '—'
  const pct = (value * 100).toFixed(2)
  return value >= 0 ? `+${pct}%` : `${pct}%`
}

function signalBadge(direction: 'bullish' | 'bearish' | 'neutral') {
  if (direction === 'bullish') {
    return { text: 'Bullish', variant: 'success' as const }
  }
  if (direction === 'bearish') {
    return { text: 'Bearish', variant: 'danger' as const }
  }
  return { text: 'Neutral', variant: 'neutral' as const }
}

function directionTextClass(direction: 'bullish' | 'bearish' | 'neutral'): string {
  if (direction === 'bullish') return 'signal-bullish'
  if (direction === 'bearish') return 'signal-bearish'
  return 'signal-neutral'
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

function buildSummary(signals: Awaited<ReturnType<typeof getSignalHistoryForTicker>>) {
  const latest = signals[0] ?? null

  const recentConvictions = signals
    .slice(0, 30)
    .map((row) => row.prob_side)
    .filter((value): value is number => value !== null && Number.isFinite(value))

  const avgConviction =
    recentConvictions.length > 0
      ? recentConvictions.reduce((sum, value) => sum + value, 0) / recentConvictions.length
      : null

  let lastFlipDate: string | null = null
  for (let index = 0; index < signals.length - 1; index += 1) {
    const current = signals[index]
    const previous = signals[index + 1]
    if (current && previous && current.direction !== previous.direction) {
      lastFlipDate = current.signal_date
      break
    }
  }

  const bullishCount = signals.filter((row) => row.direction === 'bullish').length
  const bearishCount = signals.filter((row) => row.direction === 'bearish').length
  const neutralCount = signals.filter((row) => row.direction === 'neutral').length
  const recentDirectionSequence = signals.slice(0, 30).reverse().map((row) => row.direction)

  return {
    latest,
    avgConviction,
    lastFlipDate,
    bullishCount,
    bearishCount,
    neutralCount,
    recentDirectionSequence,
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
    title: `${ticker} Signal History - SpySignal`,
    description: `Daily model stance and conviction history for ${name} (${ticker}) from the SpySignal predictive system.`,
  }
}

export default async function SignalHistoryPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const viewer = await getViewerAccess()
  const signals = await getSignalHistoryForTicker(ticker, 250, { allowSyntheticFallback: false })

  const canExport = viewer.isPro && signals.length > 0
  const upgradeUrl = getStripeUpgradeUrl(viewer.userId)
  const summary = buildSummary(signals)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Signal History' },
        ]}
      />
      <div className="section-gap">
        <PageHeader
          title="Signal History"
          subtitle="Inspect daily stance changes, conviction shifts, and realized episode progress over time."
        />

        <ActionBar
          className="rounded-[var(--radius-xl)] border border-border bg-surface-card p-3"
          align="between"
        >
          <p className="text-body">Showing up to the most recent 250 daily model outputs.</p>
          <div className="flex flex-wrap items-center gap-2">
            {canExport ? (
              <a href={`/api/export-signals?ticker=${ticker}`} className={buttonClass({ variant: 'secondary' })}>
                Download CSV
              </a>
            ) : viewer.isSignedIn && signals.length > 0 && upgradeUrl ? (
              <a
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ variant: 'secondary' })}
              >
                Upgrade to Pro for CSV Export
              </a>
            ) : (
              <span className="text-caption text-content-muted">
                {!viewer.isSignedIn
                  ? 'Sign in to export CSV.'
                  : signals.length === 0
                    ? 'CSV export is available when signal rows exist.'
                    : 'CSV export is a Pro feature.'}
              </span>
            )}
            <Link href={`/stocks/${ticker}/financials/fund-profile`} className={buttonClass({ variant: 'ghost' })}>
              View Financials
            </Link>
          </div>
        </ActionBar>

        <MetricGrid
          columns={4}
          items={[
            { label: 'Rows', value: signals.length.toString() },
            {
              label: 'Latest Stance',
              value: summary.latest ? (
                <Badge variant={signalBadge(summary.latest.direction).variant}>
                  {signalBadge(summary.latest.direction).text}
                </Badge>
              ) : (
                '—'
              ),
            },
            {
              label: 'Avg Conviction (30d)',
              value: summary.avgConviction === null ? '—' : <span className="numeric-tabular">{`${Math.round(summary.avgConviction * 100)}%`}</span>,
            },
            {
              label: 'Last Flip',
              value: summary.lastFlipDate ? <span className="numeric-tabular">{formatDate(summary.lastFlipDate)}</span> : 'No flips',
            },
          ]}
        />

        {signals.length > 0 ? (
          <Card className="section-gap" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-card-title text-content-primary">Signal Flow</h2>
              <span className="text-body">State evolution over time</span>
            </div>
            <SignalFlowStream
              signals={signals.map((signal) => ({
                signal_date: signal.signal_date,
                direction: signal.direction,
                prob_side: signal.prob_side,
              }))}
            />
          </Card>
        ) : null}

        {signals.length > 0 ? (
          <Card className="section-gap" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-card-title text-content-primary">Signal Distribution</h2>
              <span className="text-body">Last {signals.length} observations</span>
            </div>

            <SignalDistributionBubbleCluster
              bullishCount={summary.bullishCount}
              neutralCount={summary.neutralCount}
              bearishCount={summary.bearishCount}
            />

            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Bullish', count: summary.bullishCount, direction: 'bullish' as const },
                { label: 'Neutral', count: summary.neutralCount, direction: 'neutral' as const },
                { label: 'Bearish', count: summary.bearishCount, direction: 'bearish' as const },
              ]).map((item) => (
                <StatRowCard
                  key={item.label}
                  label={item.label}
                  value={`${item.count} (${Math.round(percent(item.count, signals.length))}%)`}
                  className={
                    item.direction === 'bullish'
                      ? 'signal-bg-bullish'
                      : item.direction === 'bearish'
                        ? 'signal-bg-bearish'
                        : 'signal-bg-neutral'
                  }
                  valueClassName={directionTextClass(item.direction)}
                />
              ))}
            </div>
          </Card>
        ) : null}

        <TableShell contentClassName="max-h-[680px]">
          <TableBase className="whitespace-nowrap text-body-sm">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Direction</TableHeaderCell>
                <TableHeaderCell>Conviction</TableHeaderCell>
                <TableHeaderCell>Horizon</TableHeaderCell>
                <TableHeaderCell>Episode Return</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {signals.length === 0 ? (
                <TableEmptyRow colSpan={6} title="No signal history is available for this ticker yet." />
              ) : (
                signals.map((signal, index) => {
                  const badge = signalBadge(signal.direction)
                  const episodeReturn =
                    signal.live_episode_return_to_date ?? signal.live_flat_episode_spy_move_to_date
                  const status =
                    signal.live_episode_status ?? signal.live_flat_episode_status ?? 'pending'

                  return (
                    <TableRow key={signal.id} index={index}>
                      <TableCell className="numeric-tabular">{formatDate(signal.signal_date)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </TableCell>
                      <TableCell className="numeric-tabular">{formatConviction(signal.prob_side)}</TableCell>
                      <TableCell muted className="numeric-tabular">{signal.prediction_horizon}d</TableCell>
                      <TableCell
                        className={
                          episodeReturn === null
                            ? 'text-content-muted'
                            : episodeReturn >= 0
                              ? 'signal-bullish'
                              : 'signal-bearish'
                        }
                      >
                        <span className="numeric-tabular">{formatEpisodeReturn(episodeReturn)}</span>
                      </TableCell>
                      <TableCell muted>{status}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </TableBase>
        </TableShell>

      </div>
    </>
  )
}
