import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { buttonClass } from '@/components/ui/Button'

type SignalDirection = 'bullish' | 'bearish' | 'neutral'

function signalMeta(direction: SignalDirection): { label: string; variant: 'success' | 'danger' | 'neutral' } {
  if (direction === 'bullish') return { label: 'Bullish', variant: 'success' }
  if (direction === 'bearish') return { label: 'Bearish', variant: 'danger' }
  return { label: 'Neutral', variant: 'neutral' }
}

function convictionPct(value: number | null): string {
  if (value === null) return '—'
  const scaled = value > 1 ? value : value * 100
  if (!Number.isFinite(scaled)) return '—'
  return `${Math.round(Math.max(0, Math.min(100, scaled)))}%`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PremiumSignalWidget({
  ticker,
  direction,
  conviction,
  horizon,
  signalDate,
}: {
  ticker: string
  direction: SignalDirection
  conviction: number | null
  horizon: number
  signalDate: string
}) {
  const signal = signalMeta(direction)

  return (
    <Card className="section-gap border-primary/30 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_68%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_68%)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-filter-label">Signal Summary</div>
          <h3 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{ticker} model stance</h3>
        </div>
        <Badge variant={signal.variant} className="px-3 py-1 text-[12px]">
          {signal.label}
        </Badge>
      </div>

      <div className="grid grid-cols-3 card-gap text-sm">
        <div>
          <div className="text-filter-label">Conviction</div>
          <div className="mt-1 text-2xl font-semibold leading-none text-neutral-900 dark:text-neutral-100">
            {convictionPct(conviction)}
          </div>
        </div>
        <div>
          <div className="text-filter-label">Horizon</div>
          <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{horizon}d</div>
        </div>
        <div>
          <div className="text-filter-label">Updated</div>
          <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{formatDate(signalDate)}</div>
        </div>
      </div>

      <Link href={`/performance?ticker=${encodeURIComponent(ticker)}`} className={buttonClass({ variant: 'secondary' })}>
        View Backtest Performance
      </Link>
    </Card>
  )
}
