import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PressureVerdict = 'buy' | 'sell' | 'neutral'

type PressureBarProps = {
  title: string
  buy: number
  neutral: number
  sell: number
  verdict: PressureVerdict
  /** Overrides the default verdict label (e.g. "Strong Buy"). */
  verdictLabel?: string
  /** Optional 0–100 pressure score shown next to the title. */
  pressure?: number | null
  className?: string
}

const verdictMeta: Record<PressureVerdict, { label: string; toneClass: string; Icon: typeof ArrowRight }> = {
  buy: { label: 'Buy', toneClass: 'text-signal-bullish', Icon: ArrowUpRight },
  sell: { label: 'Sell', toneClass: 'text-signal-bearish', Icon: ArrowDownRight },
  neutral: { label: 'Neutral', toneClass: 'text-signal-neutral', Icon: ArrowRight },
}

/**
 * Linear replacement for the old speedometer gauges: buy/neutral/sell
 * composition as a segmented bar, with the directional arrow as the summary
 * glyph. Colors come exclusively from signal tokens.
 */
export default function PressureBar({
  title,
  buy,
  neutral,
  sell,
  verdict,
  verdictLabel,
  pressure,
  className,
}: PressureBarProps) {
  const total = Math.max(1, buy + neutral + sell)
  const { label: defaultLabel, toneClass, Icon } = verdictMeta[verdict]
  const label = verdictLabel ?? defaultLabel

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('size-4', toneClass)} aria-hidden="true" />
          <span className="text-label-md text-content-primary">{title}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-label-md', toneClass)}>{label}</span>
          {typeof pressure === 'number' && Number.isFinite(pressure) ? (
            <span className="text-data-sm text-content-secondary">{Math.round(pressure)}</span>
          ) : null}
        </div>
      </div>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"
        role="img"
        aria-label={`${title}: ${sell} sell, ${neutral} neutral, ${buy} buy`}
      >
        <span className="h-full bg-signal-bearish" style={{ width: `${(sell / total) * 100}%` }} />
        <span className="h-full bg-signal-neutral opacity-60" style={{ width: `${(neutral / total) * 100}%` }} />
        <span className="h-full bg-signal-bullish" style={{ width: `${(buy / total) * 100}%` }} />
      </div>
      <div className="flex gap-3 text-micro text-content-muted">
        <span>Sell {sell}</span>
        <span>Neutral {neutral}</span>
        <span>Buy {buy}</span>
      </div>
    </div>
  )
}
