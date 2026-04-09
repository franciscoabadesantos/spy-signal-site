'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type ScoreRingTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export type ScoreRingDimension = {
  label: string
  score: number
  tone?: ScoreRingTone
  hint?: string
}

type ScoreRingsProps = {
  dimensions: ScoreRingDimension[]
  className?: string
  compact?: boolean
  showLegend?: boolean
  overallLabel?: string
  subtitle?: string
}

const TONE_STOPS: Record<ScoreRingTone, { start: string; end: string }> = {
  primary: { start: '#4f8ef7', end: '#2563eb' },
  success: { start: '#34d399', end: '#10b981' },
  warning: { start: '#f59e0b', end: '#d97706' },
  danger: { start: '#fb7185', end: '#ef4444' },
  neutral: { start: '#94a3b8', end: '#64748b' },
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function toneDotClass(tone: ScoreRingTone): string {
  if (tone === 'primary') return 'bg-blue-500'
  if (tone === 'success') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-500'
  if (tone === 'danger') return 'bg-rose-500'
  return 'bg-slate-500'
}

export default function ScoreRings({
  dimensions,
  className,
  compact = false,
  showLegend = true,
  overallLabel = 'Model Score',
  subtitle = 'Systems validation dimensions',
}: ScoreRingsProps) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const gradientSeed = useId()

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsAnimated(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const items = useMemo(
    () =>
      dimensions.slice(0, 5).map((dimension) => ({
        ...dimension,
        score: clampScore(dimension.score),
        tone: dimension.tone ?? 'primary',
      })),
    [dimensions]
  )

  const overallScore = useMemo(() => {
    if (items.length === 0) return 0
    const total = items.reduce((sum, item) => sum + item.score, 0)
    return Math.round(total / items.length)
  }, [items])

  const size = compact ? 164 : 230
  const stroke = compact ? 7 : 8
  const gap = compact ? 8 : 10
  const outerRadius = compact ? 66 : 90
  const center = size / 2

  const rings = items.map((item, index) => {
    const radius = outerRadius - index * (stroke + gap)
    const circumference = 2 * Math.PI * radius
    const animatedScore = isAnimated ? item.score : 0
    const dashOffset = circumference * (1 - animatedScore / 100)
    return {
      ...item,
      radius,
      circumference,
      dashOffset,
      gradientId: `${gradientSeed}-ring-${index}`,
      active: activeIndex === null || activeIndex === index,
    }
  })

  if (rings.length === 0) return null

  return (
    <div
      className={cn(
        'grid items-center gap-5',
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[minmax(220px,236px)_1fr]',
        className
      )}
      onMouseLeave={() => setActiveIndex(null)}
    >
      <div className="relative mx-auto">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            {rings.map((ring) => {
              const stops = TONE_STOPS[ring.tone]
              return (
                <linearGradient
                  key={ring.gradientId}
                  id={ring.gradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={stops.start} />
                  <stop offset="100%" stopColor={stops.end} />
                </linearGradient>
              )
            })}
          </defs>

          <g transform={`rotate(-90 ${center} ${center})`}>
            {rings.map((ring, index) => (
              <g
                key={`${ring.label}-${index}`}
                onMouseEnter={() => setActiveIndex(index)}
                style={{
                  opacity: ring.active ? 1 : 0.26,
                  transition: 'opacity 180ms ease',
                }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeWidth={stroke}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={`url(#${ring.gradientId})`}
                  strokeOpacity={0.2}
                  strokeWidth={stroke + 3}
                  strokeLinecap="round"
                  strokeDasharray={ring.circumference}
                  strokeDashoffset={ring.dashOffset}
                  style={{
                    transition: `stroke-dashoffset 950ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 70}ms`,
                  }}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={`url(#${ring.gradientId})`}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={ring.circumference}
                  strokeDashoffset={ring.dashOffset}
                  style={{
                    transition: `stroke-dashoffset 950ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 70}ms`,
                  }}
                />
              </g>
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className={cn(
                'font-semibold leading-none text-neutral-900 dark:text-neutral-100',
                compact ? 'text-[1.9rem]' : 'text-[2.4rem]'
              )}
            >
              {overallScore}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
              {overallLabel}
            </div>
            {!compact ? <div className="text-body mt-1">{subtitle}</div> : null}
          </div>
        </div>
      </div>

      {showLegend ? (
        <div className={cn(compact ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
          {rings.map((ring, index) => (
            <button
              key={`${ring.label}-${index}-legend`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'w-full rounded-lg border border-neutral-200 px-3 py-2 text-left transition-colors dark:border-neutral-800',
                activeIndex === index
                  ? 'bg-neutral-100/90 dark:bg-neutral-800/70'
                  : 'bg-white/70 dark:bg-neutral-900/50'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', toneDotClass(ring.tone))} />
                  <span className={cn('text-neutral-900 dark:text-neutral-100', compact ? 'text-xs font-medium' : 'text-sm font-medium')}>
                    {ring.label}
                  </span>
                </div>
                <span className={cn('font-semibold text-neutral-900 dark:text-neutral-100', compact ? 'text-xs' : 'text-sm')}>
                  {Math.round(ring.score)}
                </span>
              </div>
              {!compact && ring.hint && activeIndex === index ? (
                <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{ring.hint}</div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
