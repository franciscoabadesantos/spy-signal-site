import TrackedLink from '@/components/analytics/TrackedLink'
import Card from '@/components/ui/Card'
import SignalBlock from '@/components/ui/SignalBlock'
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
  const shortHeadline = shortSignalHeadline(row.direction, row.conviction)
  const profileBars = miniProfileBars(row)

  return (
    <TrackedLink
      href={stockHref(row.ticker, shortHeadline)}
      className="state-interactive block"
      eventName="click_stock_from_screener"
      eventPayload={{
        ticker: row.ticker,
        direction: row.direction,
        entry_source: 'screener',
        source: 'screener_mobile_card',
      }}
    >
      <Card className="h-full hover:border-primary/40 hover:bg-surface-hover">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-heading-sm text-content-primary">{row.ticker}</div>
            <div className="text-body truncate max-w-[30ch]">{row.name ?? 'Tracked asset'}</div>
            <div className="text-label-md mt-1 text-content-primary">{shortHeadline}</div>
          </div>
          <SignalBlock
            direction={row.direction}
            conviction={row.conviction}
            compact
            showLabel={false}
            className="w-[220px] max-w-full"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 card-gap text-body-sm">
          <div>
            <div className="text-filter-label">Price</div>
            <div className="text-data-sm numeric-tabular mt-1 text-content-primary">{formatPrice(row.price)}</div>
          </div>
          <div>
            <div className="text-filter-label">Day Move</div>
            <div
              className={`text-data-sm numeric-tabular mt-1 ${
                row.changePercent === null
                  ? 'text-content-muted'
                  : row.changePercent >= 0
                    ? 'signal-bullish'
                    : 'signal-bearish'
              }`}
            >
              {formatPct(row.changePercent)}
            </div>
          </div>
          <div>
            <div className="text-filter-label">Conviction</div>
            <SignalBlock
              direction={row.direction}
              conviction={row.conviction}
              compact
              showLabel={false}
              className="mt-1"
            />
          </div>
          <div>
            <div className="text-filter-label">Horizon</div>
            <div className="text-data-sm numeric-tabular mt-1 text-content-primary">
              {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3">
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

        <div className="text-caption numeric-tabular mt-5 border-t border-border pt-3 text-content-muted">
          Last signal: {formatSignalDate(row.signalDate)}
        </div>
      </Card>
    </TrackedLink>
  )
}
