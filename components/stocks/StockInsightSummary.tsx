import Badge from '@/components/ui/Badge'
import SignalBlock from '@/components/ui/SignalBlock'
import type { SignalDirection } from '@/lib/signalSummary'

type StockInsightSummaryProps = {
  ticker: string
  direction: SignalDirection | null
  conviction: number | null
  horizonDays: number | null
  biasLabel: string
  overviewSummary: string
  flipRatePct: number
  activeSignalsPct: number
  profileState: {
    label: string
    variant: 'success' | 'neutral' | 'warning' | 'danger'
  }
}

function directionHeadline(direction: SignalDirection | null): string {
  if (!direction) return 'Signal regime is still forming'
  if (direction === 'bullish') return 'Bullish regime is currently active'
  if (direction === 'bearish') return 'Bearish regime is currently active'
  return 'Neutral regime is currently active'
}

export default function StockInsightSummary({
  ticker,
  direction,
  conviction,
  horizonDays,
  biasLabel,
  overviewSummary,
  flipRatePct,
  activeSignalsPct,
  profileState,
}: StockInsightSummaryProps) {
  const normalizedDirection = direction ?? 'neutral'
  const conciseReasoning = `${biasLabel}. ${horizonDays === null ? 'Horizon unknown' : `${horizonDays}d horizon`}. Flips ${flipRatePct}% with ${activeSignalsPct}% active directional share.`

  return (
    <div className="rounded-[var(--radius-xl)] border border-border/45 bg-surface-card p-8 shadow-[var(--shadow-lg)] md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="text-filter-label">Stock Insight Summary</div>
          <h3 className="mt-1 text-heading-lg text-content-primary">
            {directionHeadline(direction)} for {ticker}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-[80ch] text-body-lg text-content-secondary">{overviewSummary}</p>
        </div>
        <Badge variant={profileState.variant}>{profileState.label}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
        <SignalBlock
          direction={normalizedDirection}
          conviction={conviction}
          label="Direction · Confidence · Strength"
          className="scale-[1.01]"
        />
        <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-elevated px-5 py-4">
          <div className="text-filter-label">Key Reasoning</div>
          <p className="mt-2 line-clamp-2 text-body-md text-content-secondary">{conciseReasoning}</p>
        </div>
      </div>
    </div>
  )
}
