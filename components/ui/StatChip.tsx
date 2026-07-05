import { cn } from '@/lib/utils'

type StatChipProps = {
  label: string
  value: string | number
  /** Optional one-line plain-language context rendered in the brand voice. */
  sentence?: string
  tone?: 'default' | 'bullish' | 'bearish' | 'warn'
  className?: string
}

const toneClasses = {
  default: 'text-content-primary',
  bullish: 'text-signal-bullish',
  bearish: 'text-signal-bearish',
  warn: 'text-signal-warn',
} as const

/**
 * The single KPI presentation: label in the filter-label style, value in the
 * tabular data style. Absent values must be filtered by the caller
 * (lib/format presentMetrics) — this component never renders dashes.
 */
export default function StatChip({ label, value, sentence, tone = 'default', className }: StatChipProps) {
  return (
    <div className={cn('material-surface rounded-[var(--radius-lg)] px-4 py-3', className)}>
      <div className="text-filter-label">{label}</div>
      <div className={cn('mt-1 text-data-md', toneClasses[tone])}>{value}</div>
      {sentence ? <p className="text-interpretive mt-1.5 text-[0.9375rem]">{sentence}</p> : null}
    </div>
  )
}
