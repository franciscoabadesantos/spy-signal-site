import TrackedLink from '@/components/analytics/TrackedLink'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { convictionPercent, shortSignalHeadline } from '@/lib/signalSummary'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'

type ScreenerSignalCardProps = {
  row: {
    ticker: string
    name: string | null
    direction: SignalDirection
    conviction: number | null
    signalDate: string | null
    predictionHorizon: number | null
    price: number | null
    changePercent: number | null
  }
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
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

function formatSignalDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function signalMeta(direction: SignalDirection): { label: string; variant: 'success' | 'danger' | 'neutral' } {
  if (direction === 'bullish') return { label: 'Bullish', variant: 'success' }
  if (direction === 'bearish') return { label: 'Bearish', variant: 'danger' }
  return { label: 'Neutral', variant: 'neutral' }
}

function convictionToneClass(direction: SignalDirection): string {
  if (direction === 'bullish') return 'bg-emerald-500'
  if (direction === 'bearish') return 'bg-rose-500'
  return 'bg-amber-500'
}

function stockHref(ticker: string, signal: string): string {
  const params = new URLSearchParams({
    from: 'screener',
    screenerSignal: signal,
  })
  return `/stocks/${ticker}?${params.toString()}`
}

function miniProfileBars(row: ScreenerSignalCardProps['row']): number[] {
  const conviction = convictionPercent(row.conviction) ?? 38
  const moveMag = Math.min(8, Math.abs(row.changePercent ?? 0))
  const horizonTarget = row.predictionHorizon ?? 20
  const horizonScore = Math.max(28, 100 - Math.abs(horizonTarget - 20) * 2.1)
  const trendBase = row.direction === 'bullish' ? 58 : row.direction === 'bearish' ? 44 : 50
  const trend = Math.max(22, Math.min(96, trendBase + conviction * 0.32))
  const momentum = Math.max(22, Math.min(96, conviction * 0.88 + moveMag * 4.4))
  const risk = Math.max(22, Math.min(96, 68 - moveMag * 4.6))
  const yieldScore = Math.max(22, Math.min(96, 34 + conviction * 0.26))
  const stability = Math.max(22, Math.min(96, conviction * 0.8 - moveMag * 3.7 + horizonScore * 0.08))
  return [trend, momentum, risk, yieldScore, stability].map((value) => Math.round(value))
}

export default function ScreenerSignalCard({ row }: ScreenerSignalCardProps) {
  const signal = signalMeta(row.direction)
  const shortHeadline = shortSignalHeadline(row.direction, row.conviction)
  const profileBars = miniProfileBars(row)
  const convictionWidth = convictionPercent(row.conviction) ?? 0

  return (
    <TrackedLink
      href={stockHref(row.ticker, shortHeadline)}
      className="block"
      eventName="click_stock_from_screener"
      eventPayload={{
        ticker: row.ticker,
        direction: row.direction,
        entry_source: 'screener',
        source: 'screener_mobile_card',
      }}
    >
      <Card className="h-full transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{row.ticker}</div>
            <div className="text-body truncate max-w-[30ch]">{row.name ?? 'Tracked asset'}</div>
            <div className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{shortHeadline}</div>
          </div>
          <Badge variant={signal.variant}>{signal.label}</Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 card-gap text-sm">
          <div>
            <div className="text-filter-label">Price</div>
            <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">{formatPrice(row.price)}</div>
          </div>
          <div>
            <div className="text-filter-label">Day Move</div>
            <div
              className={`mt-1 font-medium ${
                row.changePercent === null
                  ? 'text-neutral-500'
                  : row.changePercent >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}
            >
              {formatPct(row.changePercent)}
            </div>
          </div>
          <div>
            <div className="text-filter-label">Conviction</div>
            <div className="mt-1 space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className={`h-full rounded-full ${convictionToneClass(row.direction)}`}
                  style={{ width: `${Math.max(6, convictionWidth)}%` }}
                />
              </div>
              <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">{formatConviction(row.conviction)}</div>
            </div>
          </div>
          <div>
            <div className="text-filter-label">Horizon</div>
            <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">
              {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <div className="text-filter-label">System Profile</div>
          <div className="mt-2 flex h-8 items-end gap-1">
            {profileBars.map((score, index) => (
              <span
                key={`${row.ticker}-profile-${index}`}
                className="w-1.5 rounded-t-sm bg-primary/75"
                style={{ height: `${Math.max(4, Math.round(score * 0.3))}px` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          Last signal: {formatSignalDate(row.signalDate)}
        </div>
      </Card>
    </TrackedLink>
  )
}
