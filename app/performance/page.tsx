import PerformanceTickerAutocomplete from '@/components/PerformanceTickerAutocomplete'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import AppShell from '@/components/shells/AppShell'
import MetricGrid from '@/components/page/MetricGrid'
import InsightCard from '@/components/page/InsightCard'
import { getStockQuote } from '@/lib/finance'
import { getSignalHistoryForTicker, getScreenerSignals } from '@/lib/signals'
import type { Signal } from '@/lib/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PerformanceSearchParams = {
  ticker?: string | string[]
}

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

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
  className: string
} {
  if (direction === 'bullish') {
    return {
      label: 'BULLISH',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    }
  }

  if (direction === 'bearish') {
    return {
      label: 'BEARISH',
      className: 'bg-red-50 text-red-700 border border-red-200',
    }
  }

  return {
    label: 'NEUTRAL',
    className: 'bg-slate-100 text-slate-700 border border-slate-300',
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
  searchParams,
}: {
  searchParams: Promise<PerformanceSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const ticker = normalizeTicker(singleParam(resolvedSearchParams.ticker))

  const [signals, quote, screener] = await Promise.all([
    getSignalHistoryForTicker(ticker, 365),
    getStockQuote(ticker),
    getScreenerSignals({ sortBy: 'conviction', limit: 20 }),
  ])

  const metrics = computeSignalMetrics(signals)
  const quickTickers = [...new Set(screener.rows.map((row) => row.ticker))].slice(0, 10)

  return (
    <AppShell active="performance" container="md">
      <PageHeader
        title={
          <>
            {ticker}
            {quote?.name ? <span className="text-[20px] text-muted-foreground ml-2">{quote.name}</span> : null}
          </>
        }
        meta="Signal Quality Dashboard"
        subtitle="Direction mix, signal flips, and conviction trend using latest historical model outputs."
      />

      <div>
        <div className="mb-5">
          <PerformanceTickerAutocomplete initialTicker={ticker} />
        </div>

        {quickTickers.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {quickTickers.map((symbol) => (
              <Link
                key={symbol}
                href={`/performance?ticker=${symbol}`}
                className={`px-2.5 py-1 rounded border text-[12px] ${
                  symbol === ticker
                    ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {symbol}
              </Link>
            ))}
          </div>
        )}

        {metrics.totalSignals === 0 ? (
          <div className="text-sm text-muted-foreground py-10">
            No signal history found for <span className="font-medium text-foreground">{ticker}</span>.
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
                    <span className="text-sm font-medium">
                      {formatDate(metrics.oldestDate ?? '')} to {formatDate(metrics.latestDate ?? '')}
                    </span>
                  ),
                },
              ]}
            />

            <InsightCard title="Signal Mix" className="mb-6">
              <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                <div className="rounded border border-emerald-200 bg-emerald-50 py-2">
                  <div className="text-emerald-700 font-semibold">{metrics.bullishDays}</div>
                  <div className="text-emerald-700/80">Bullish</div>
                </div>
                <div className="rounded border border-slate-300 bg-slate-100 py-2">
                  <div className="text-slate-700 font-semibold">{metrics.neutralDays}</div>
                  <div className="text-slate-700/80">Neutral</div>
                </div>
                <div className="rounded border border-red-200 bg-red-50 py-2">
                  <div className="text-red-700 font-semibold">{metrics.bearishDays}</div>
                  <div className="text-red-700/80">Bearish</div>
                </div>
              </div>
            </InsightCard>

            <Card padding="none" className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Signal Date</th>
                    <th className="px-4 py-3 font-medium">Direction</th>
                    <th className="px-4 py-3 font-medium">Conviction</th>
                    <th className="px-4 py-3 font-medium">Horizon</th>
                    <th className="px-4 py-3 font-medium">Flip Event</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.ordered.slice(0, 200).map((row, index) => {
                    const previous = metrics.ordered[index + 1]
                    const isFlip = Boolean(previous && previous.direction !== row.direction)
                    const previousLabel = previous ? directionTone(previous.direction).label : null
                    const tone = directionTone(row.direction)
                    return (
                      <tr key={`${row.signal_date}-${index}`} className="border-t border-border">
                        <td className="px-4 py-3">{formatDate(row.signal_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}>
                            {tone.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatConviction(row.prob_side)}</td>
                        <td className="px-4 py-3">{row.prediction_horizon}d</td>
                        <td className="px-4 py-3 text-[12px]">
                          {isFlip ? (
                            <span className="text-primary font-medium">
                              {previousLabel} → {tone.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No flip</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}

        <Card className="text-[11px] text-muted-foreground leading-6 mt-6 p-3">
          This page reports model output behavior only. It does not include trade execution, slippage, or fees and is not investment advice.
        </Card>
      </div>
    </AppShell>
  )
}
