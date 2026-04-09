import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import ResearchShell from '@/components/shells/ResearchShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClass } from '@/components/ui/Button'
import ActionBar from '@/components/page/ActionBar'
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

function directionSwatchClass(direction: 'bullish' | 'bearish' | 'neutral'): string {
  if (direction === 'bullish') return 'bg-emerald-500/85'
  if (direction === 'bearish') return 'bg-rose-500/80'
  return 'bg-slate-400/75'
}

function directionTextClass(direction: 'bullish' | 'bearish' | 'neutral'): string {
  if (direction === 'bullish') return 'text-emerald-700 dark:text-emerald-400'
  if (direction === 'bearish') return 'text-rose-700 dark:text-rose-400'
  return 'text-slate-700 dark:text-slate-300'
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
  const [signals, quote] = await Promise.all([
    getSignalHistoryForTicker(ticker, 250),
    getStockQuote(ticker),
  ])

  const canExport = viewer.isPro && signals.length > 0
  const upgradeUrl = getStripeUpgradeUrl(viewer.userId)
  const summary = buildSummary(signals)

  return (
    <ResearchShell
      ticker={ticker}
      activeTab="signal-history"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker, href: `/stocks/${ticker}` },
            { label: 'Signal History' },
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
        signal: summary.latest
          ? {
              label: signalBadge(summary.latest.direction).text,
              tone:
                summary.latest.direction === 'bullish'
                  ? 'bullish'
                  : summary.latest.direction === 'bearish'
                    ? 'bearish'
                    : 'neutral',
            }
          : undefined,
        subtitle: 'Daily live model outputs for this asset.',
      }}
    >
      <div className="section-gap">
        <PageHeader
          title="Signal History"
          subtitle="Inspect daily stance changes, conviction shifts, and realized episode progress over time."
        />

        <ActionBar
          className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
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
              <span className="text-[12px] text-neutral-500">
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
              value: summary.avgConviction === null ? '—' : `${Math.round(summary.avgConviction * 100)}%`,
            },
            {
              label: 'Last Flip',
              value: summary.lastFlipDate ? formatDate(summary.lastFlipDate) : 'No flips',
            },
          ]}
        />

        {signals.length > 0 ? (
          <Card className="section-gap" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Signal Distribution</h2>
              <span className="text-body">Last {signals.length} observations</span>
            </div>

            <div className="overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 h-3 flex">
              <div
                className="h-full bg-emerald-500/85"
                style={{ width: `${percent(summary.bullishCount, signals.length)}%` }}
              />
              <div
                className="h-full bg-slate-400/75"
                style={{ width: `${percent(summary.neutralCount, signals.length)}%` }}
              />
              <div
                className="h-full bg-rose-500/80"
                style={{ width: `${percent(summary.bearishCount, signals.length)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {([
                { label: 'Bullish', count: summary.bullishCount, direction: 'bullish' as const },
                { label: 'Neutral', count: summary.neutralCount, direction: 'neutral' as const },
                { label: 'Bearish', count: summary.bearishCount, direction: 'bearish' as const },
              ]).map((item) => (
                <div key={item.label} className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                  <div className="text-filter-label">{item.label}</div>
                  <div className={`mt-1 font-semibold ${directionTextClass(item.direction)}`}>
                    {item.count} ({Math.round(percent(item.count, signals.length))}%)
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-filter-label mb-2">Recent Signal Sequence</div>
              <div className="flex items-center gap-1.5">
                {summary.recentDirectionSequence.map((direction, index) => (
                  <span
                    key={`${direction}-${index}`}
                    className={`h-2 flex-1 rounded-full ${directionSwatchClass(direction)}`}
                    title={direction}
                  />
                ))}
              </div>
              <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">Oldest to latest (30 signals)</p>
            </div>
          </Card>
        ) : null}

        <TableShell contentClassName="max-h-[680px]">
          <TableBase className="whitespace-nowrap text-[13px]">
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
                      <TableCell>{formatDate(signal.signal_date)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </TableCell>
                      <TableCell>{formatConviction(signal.prob_side)}</TableCell>
                      <TableCell muted>{signal.prediction_horizon}d</TableCell>
                      <TableCell
                        className={
                          episodeReturn === null
                            ? 'text-neutral-500'
                            : episodeReturn >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                        }
                      >
                        {formatEpisodeReturn(episodeReturn)}
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
    </ResearchShell>
  )
}
