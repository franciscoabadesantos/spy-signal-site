import TrackedLink from '@/components/analytics/TrackedLink'
import OrbitMini from '@/components/stocks/OrbitMini'
import Card from '@/components/ui/Card'
import SignalBlock from '@/components/ui/SignalBlock'
import type { Scorecard } from '@/lib/scorecard-types'
import { shortSignalHeadline } from '@/lib/signalSummary'

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
    scorecard: Scorecard
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

export default function ScreenerSignalCard({ row }: ScreenerSignalCardProps) {
  const shortHeadline = shortSignalHeadline(row.direction, row.conviction)

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-filter-label">System Profile</div>
              <div className="text-caption mt-1 text-content-muted">Backend scorecard</div>
            </div>
            <div className="shrink-0">
              <OrbitMini scorecard={row.scorecard} size={80} />
            </div>
          </div>
        </div>

        <div className="text-caption numeric-tabular mt-5 border-t border-border pt-3 text-content-muted">
          Last signal: {formatSignalDate(row.signalDate)}
        </div>
      </Card>
    </TrackedLink>
  )
}
