import PerformanceTickerAutocomplete from '@/components/PerformanceTickerAutocomplete'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import MetricGrid from '@/components/page/MetricGrid'
import InsightCard from '@/components/page/InsightCard'
import FilterChip from '@/components/ui/FilterChip'
import StatRowCard from '@/components/ui/StatRowCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Badge from '@/components/ui/Badge'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from '@/components/ui/DataTable'
import { getStockQuote } from '@/lib/finance'
import { getSignalHistoryForTicker, getScreenerSignals } from '@/lib/signals'
import type { Signal } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeTicker(raw: string | undefined): string {
  const value = raw?.trim().toUpperCase() ?? ''
  if (!value) return 'SPY'
  if (!/^[A-Z0-9.\-]{1,10}$/.test(value)) return 'SPY'
  return value
}

function formatDate(dateStr: string): string {
  const parsed = Date.parse(dateStr)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function directionTone(direction: Signal['direction']): {
  label: string
  variant: 'success' | 'danger' | 'neutral'
} {
  if (direction === 'bullish') {
    return {
      label: 'BULLISH',
      variant: 'success',
    }
  }

  if (direction === 'bearish') {
    return {
      label: 'BEARISH',
      variant: 'danger',
    }
  }

  return {
    label: 'NEUTRAL',
    variant: 'neutral',
  }
}

function parseSignalTime(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function computeSignalMetrics(signals: Signal[]) {
  const ordered = [...signals].sort((a, b) => parseSignalTime(b.signal_date) - parseSignalTime(a.signal_date))
  const chronological = [...ordered].reverse()

  let flips = 0
  for (let i = 1; i < chronological.length; i++) {
    if (chronological[i] && chronological[i - 1] && chronological[i].direction !== chronological[i - 1].direction) {
      flips += 1
    }
  }

  const bullishDays = ordered.filter((row) => row.direction === 'bullish').length
  const neutralDays = ordered.filter((row) => row.direction === 'neutral').length
  const bearishDays = ordered.filter((row) => row.direction === 'bearish').length

  const convictionRows = ordered
    .map((row) => row.prob_side)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const avgConviction =
    convictionRows.length > 0
      ? convictionRows.reduce((acc, value) => acc + value, 0) / convictionRows.length
      : null

  return {
    totalSignals: ordered.length,
    flips,
    bullishDays,
    neutralDays,
    bearishDays,
    avgConviction,
    latestDate: ordered[0]?.signal_date ?? null,
    oldestDate: ordered[ordered.length - 1]?.signal_date ?? null,
    ordered,
  }
}

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = normalizeTicker(resolvedParams.ticker)

  const [signals, quote, screener] = await Promise.all([
    getSignalHistoryForTicker(ticker, 365, { allowSyntheticFallback: false }),
    getStockQuote(ticker),
    getScreenerSignals({ sortBy: 'conviction', limit: 20 }),
  ])

  const metrics = computeSignalMetrics(signals)
  const quickTickers = [...new Set(screener.rows.map((row) => row.ticker))].slice(0, 10)

  return (
    <div className="section-gap">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
          { label: ticker, href: `/stocks/${ticker}` },
          { label: 'Performance' },
        ]}
      />
      <PageHeader
        title="Performance"
        meta={quote?.name ? `${ticker} · ${quote.name}` : ticker}
        subtitle="Direction mix, signal flips, and conviction trend using latest historical model outputs."
      />

      <div>
        <div className="mb-5">
          <PerformanceTickerAutocomplete initialTicker={ticker} />
        </div>

        {quickTickers.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {quickTickers.map((symbol) => (
              <FilterChip
                key={symbol}
                label={symbol}
                active={symbol === ticker}
                href={`/stocks/${symbol}/performance`}
              />
            ))}
          </div>
        )}

        {metrics.totalSignals === 0 ? (
          <div className="text-body-sm py-10 text-content-muted">
            No signal history found for <span className="text-label-md text-content-primary">{ticker}</span>.
          </div>
        ) : (
          <>
            <MetricGrid
              items={[
                { label: 'Total Signals', value: metrics.totalSignals },
                { label: 'Direction Flips', value: metrics.flips },
                { label: 'Average Conviction', value: formatConviction(metrics.avgConviction) },
                {
                  label: 'Coverage Window',
                  value: (
                    <span className="text-data-sm numeric-tabular">
                      {formatDate(metrics.oldestDate ?? '')} to {formatDate(metrics.latestDate ?? '')}
                    </span>
                  ),
                },
              ]}
            />

            <InsightCard title="Signal Mix" className="mb-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatRowCard
                  label="Bullish"
                  value={`${metrics.bullishDays} (${Math.round((metrics.bullishDays / Math.max(1, metrics.totalSignals)) * 100)}%)`}
                  className="signal-bg-bullish"
                  valueClassName="signal-bullish"
                />
                <StatRowCard
                  label="Neutral"
                  value={`${metrics.neutralDays} (${Math.round((metrics.neutralDays / Math.max(1, metrics.totalSignals)) * 100)}%)`}
                  className="signal-bg-neutral"
                  valueClassName="signal-neutral"
                />
                <StatRowCard
                  label="Bearish"
                  value={`${metrics.bearishDays} (${Math.round((metrics.bearishDays / Math.max(1, metrics.totalSignals)) * 100)}%)`}
                  className="signal-bg-bearish"
                  valueClassName="signal-bearish"
                />
              </div>
            </InsightCard>

            <TableShell>
              <TableBase className="whitespace-nowrap">
                <TableHead sticky>
                  <tr>
                    <TableHeaderCell>Signal Date</TableHeaderCell>
                    <TableHeaderCell>Direction</TableHeaderCell>
                    <TableHeaderCell>Conviction</TableHeaderCell>
                    <TableHeaderCell>Horizon</TableHeaderCell>
                    <TableHeaderCell>Flip Event</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {metrics.ordered.slice(0, 200).map((row, index) => {
                    const previous = metrics.ordered[index + 1]
                    const isFlip = Boolean(previous && previous.direction !== row.direction)
                    const previousLabel = previous ? directionTone(previous.direction).label : null
                    const tone = directionTone(row.direction)
                    return (
                      <TableRow key={`${row.signal_date}-${index}`} index={index}>
                        <TableCell className="numeric-tabular">{formatDate(row.signal_date)}</TableCell>
                        <TableCell>
                          <Badge variant={tone.variant}>{tone.label}</Badge>
                        </TableCell>
                        <TableCell className="numeric-tabular">{formatConviction(row.prob_side)}</TableCell>
                        <TableCell className="numeric-tabular">{row.prediction_horizon}d</TableCell>
                        <TableCell className="numeric-tabular">
                          {isFlip ? (
                            <span className="text-label-sm text-primary">
                              {previousLabel} → {tone.label}
                            </span>
                          ) : (
                            <span className="text-caption text-content-muted">No flip</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </TableBase>
            </TableShell>
          </>
        )}

        <Card className="text-micro mt-6 p-3 leading-6 text-content-muted">
          This page reports model output behavior only. It does not include trade execution, slippage, or fees and is not investment advice.
        </Card>
      </div>
    </div>
  )
}
