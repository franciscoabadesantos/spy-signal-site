import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { buttonClass } from '@/components/ui/Button'
import {
  convictionBand,
  convictionPercent,
  signalHeadline,
  type ConvictionBand,
  type SignalDirection,
} from '@/lib/signalSummary'

function signalMeta(direction: SignalDirection): { label: string; variant: 'success' | 'danger' | 'neutral' } {
  if (direction === 'bullish') return { label: 'Bullish', variant: 'success' }
  if (direction === 'bearish') return { label: 'Bearish', variant: 'danger' }
  return { label: 'Neutral', variant: 'neutral' }
}

function convictionPct(value: number | null): string {
  const normalized = convictionPercent(value)
  if (normalized === null) return '—'
  return `${Math.round(normalized)}%`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function explanationForSignal({
  direction,
  band,
  recentDirectionShare,
  recentFlipRate,
}: {
  direction: SignalDirection
  band: ConvictionBand
  recentDirectionShare: number | null
  recentFlipRate: number | null
}): string {
  const directionWord = direction === 'bullish' ? 'bullish' : direction === 'bearish' ? 'bearish' : 'mixed'
  const instabilityWord =
    recentFlipRate === null
      ? 'moderate'
      : recentFlipRate >= 0.35
        ? 'high'
        : recentFlipRate >= 0.2
          ? 'moderate'
          : 'low'
  const momentumWord =
    recentDirectionShare === null
      ? 'steady'
      : recentDirectionShare >= 0.7
        ? 'strong'
        : recentDirectionShare >= 0.55
          ? 'building'
          : 'mixed'

  if (band === 'no-edge') return 'Low conviction and mixed direction offer no reliable edge.'
  if (band === 'weak') return `${momentumWord[0]!.toUpperCase()}${momentumWord.slice(1)} momentum, weak conviction, and ${instabilityWord} instability limit edge.`
  if (band === 'developing') return `${directionWord[0]!.toUpperCase()}${directionWord.slice(1)} momentum is building, but confirmation remains incomplete.`
  if (instabilityWord === 'high') return `High conviction with ${directionWord} direction, but volatility signals instability risk.`
  if (instabilityWord === 'moderate') return `High conviction with ${directionWord} direction and momentum, though volatility remains moderate.`
  return `High conviction with ${directionWord} direction, strong momentum, and low instability.`
}

function actionHintForSignal({
  direction,
  band,
  recentFlipRate,
}: {
  direction: SignalDirection
  band: ConvictionBand
  recentFlipRate: number | null
}): string {
  if (band === 'no-edge') return '→ Wait'
  if (recentFlipRate !== null && recentFlipRate >= 0.35) return '→ Reduce risk'
  if (band === 'weak') return '→ Wait'
  if (band === 'developing' && direction === 'bullish') return '→ Watch entry'
  if (band === 'developing' && direction === 'bearish') return '→ Monitor downside'
  if (band === 'developing') return '→ Monitor continuation'
  if (direction === 'bullish') return '→ Monitor continuation'
  if (direction === 'bearish') return '→ Reduce risk'
  return '→ Stay selective'
}

function styleMeta(direction: SignalDirection): {
  cardClass: string
  headlineClass: string
  hintClass: string
} {
  if (direction === 'bullish') {
    return {
      cardClass:
        'border-emerald-200/70 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.13),transparent_70%)] dark:border-emerald-900/60 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_70%)]',
      headlineClass: 'text-emerald-900 dark:text-emerald-100',
      hintClass: 'text-emerald-700 dark:text-emerald-300',
    }
  }
  if (direction === 'bearish') {
    return {
      cardClass:
        'border-rose-200/70 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_70%)] dark:border-rose-900/60 dark:bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.22),transparent_70%)]',
      headlineClass: 'text-rose-900 dark:text-rose-100',
      hintClass: 'text-rose-700 dark:text-rose-300',
    }
  }
  return {
    cardClass:
      'border-amber-200/70 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.13),transparent_70%)] dark:border-amber-900/55 dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.20),transparent_70%)]',
    headlineClass: 'text-neutral-900 dark:text-neutral-100',
    hintClass: 'text-amber-700 dark:text-amber-300',
  }
}

export default function PremiumSignalWidget({
  ticker,
  direction,
  conviction,
  horizon,
  signalDate,
  recentDirectionShare = null,
  recentFlipRate = null,
}: {
  ticker: string
  direction: SignalDirection
  conviction: number | null
  horizon: number
  signalDate: string
  recentDirectionShare?: number | null
  recentFlipRate?: number | null
}) {
  const signal = signalMeta(direction)
  const convictionNormalized = convictionPercent(conviction)
  const band = convictionBand(convictionNormalized)
  const headline = signalHeadline(direction, band)
  const explanation = explanationForSignal({
    direction,
    band,
    recentDirectionShare,
    recentFlipRate,
  })
  const actionHint = actionHintForSignal({
    direction,
    band,
    recentFlipRate,
  })
  const tone = styleMeta(direction)

  return (
    <Card className={`space-y-6 ${tone.cardClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-filter-label">Signal Summary</div>
          <h3 className={`mt-1 text-3xl font-semibold tracking-tight ${tone.headlineClass}`}>{headline}</h3>
          <p className="mt-3 max-w-[56ch] text-base leading-snug text-neutral-700 dark:text-neutral-300">{explanation}</p>
        </div>
        <Badge variant={signal.variant} className="px-3 py-1 text-[12px]">
          {signal.label}
        </Badge>
      </div>

      <div className="grid grid-cols-3 card-gap border-t border-neutral-200/80 pt-5 text-xs dark:border-neutral-800/80">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Conviction</div>
          <div className="mt-1 text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
            {convictionPct(conviction)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Horizon</div>
          <div className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{horizon}d</div>
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Updated</div>
          <div className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{formatDate(signalDate)}</div>
        </div>
      </div>

      <Link href={`/performance?ticker=${encodeURIComponent(ticker)}`} className={buttonClass({ variant: 'secondary' })}>
        View Backtest Performance
      </Link>

      <p className={`text-sm font-medium ${tone.hintClass}`}>{actionHint}</p>
    </Card>
  )
}
