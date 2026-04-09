import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

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

export default function ScreenerSignalCard({ row }: ScreenerSignalCardProps) {
  const signal = signalMeta(row.direction)

  return (
    <Link href={`/stocks/${row.ticker}`} className="block">
      <Card className="h-full transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{row.ticker}</div>
            <div className="text-body truncate max-w-[30ch]">{row.name ?? 'Tracked asset'}</div>
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
            <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">{formatConviction(row.conviction)}</div>
          </div>
          <div>
            <div className="text-filter-label">Horizon</div>
            <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">
              {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          Last signal: {formatSignalDate(row.signalDate)}
        </div>
      </Card>
    </Link>
  )
}
