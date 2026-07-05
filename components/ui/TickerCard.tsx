import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type TickerCardProps = {
  ticker: string
  name?: string | null
  /** Pre-formatted price string (caller owns currency formatting). */
  price?: string | null
  changePercent?: number | null
  sparkline?: number[] | null
  /** Interpretive sentence — only pass copy backed by real data logic. */
  sentence?: string | null
  badge?: string | null
  href?: string
  className?: string
}

function changeTone(changePercent: number | null | undefined): string {
  if (typeof changePercent !== 'number' || !Number.isFinite(changePercent)) return 'text-content-muted'
  if (changePercent > 0) return 'text-signal-bullish'
  if (changePercent < 0) return 'text-signal-bearish'
  return 'text-signal-neutral'
}

function formatChange(changePercent: number | null | undefined): string | null {
  if (typeof changePercent !== 'number' || !Number.isFinite(changePercent)) return null
  return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
}

function sparklinePoints(values: number[], width: number, height: number): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / Math.max(1, values.length - 1)
  return values
    .map((value, index) => `${(index * step).toFixed(1)},${(height - ((value - min) / span) * height).toFixed(1)}`)
    .join(' ')
}

/**
 * The per-ticker glass card (generalized market-posture card): identity,
 * price + signal-colored change, sparkline, one human sentence.
 */
export default function TickerCard({
  ticker,
  name,
  price,
  changePercent,
  sparkline,
  sentence,
  badge,
  href,
  className,
}: TickerCardProps) {
  const change = formatChange(changePercent)
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-label-lg tracking-wide text-content-primary">{ticker}</div>
          {name ? <div className="truncate text-caption text-content-muted">{name}</div> : null}
        </div>
        {badge ? <Badge>{badge}</Badge> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {price ? <span className="text-data-lg text-content-primary">{price}</span> : null}
        {change ? <span className={cn('text-data-sm', changeTone(changePercent))}>{change}</span> : null}
      </div>
      {sparkline && sparkline.length > 1 ? (
        <svg viewBox="0 0 120 32" className="mt-3 h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={sparklinePoints(sparkline, 120, 32)}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
      {sentence ? <p className="text-interpretive mt-3 text-[0.9375rem]">{sentence}</p> : null}
    </>
  )

  const cardClass = cn('material-glass block rounded-[var(--radius-xl)] p-4', className)

  if (href) {
    return (
      <Link href={href} className={cn(cardClass, 'state-interactive')}>
        {body}
      </Link>
    )
  }
  return <div className={cardClass}>{body}</div>
}
