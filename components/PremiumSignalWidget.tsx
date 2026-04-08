import Link from 'next/link'
import { Activity, Clock, Minus, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'

type SignalDirection = 'bullish' | 'bearish' | 'neutral'

function clampPercent(value: number | null): number {
  if (value === null) return 0
  const scaled = value > 1 ? value : value * 100
  if (!Number.isFinite(scaled)) return 0
  return Math.max(0, Math.min(100, scaled))
}

function signalLabel(direction: SignalDirection): string {
  if (direction === 'bullish') return 'BULLISH'
  if (direction === 'bearish') return 'BEARISH'
  return 'NEUTRAL'
}

function signalTone(direction: SignalDirection): {
  text: string
  glow: string
  accent: string
  icon: typeof TrendingUp
} {
  if (direction === 'bullish') {
    return {
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_34px_-10px_rgba(16,185,129,0.55)]',
      accent: 'from-emerald-500/15',
      icon: TrendingUp,
    }
  }
  if (direction === 'bearish') {
    return {
      text: 'text-rose-400',
      glow: 'shadow-[0_0_34px_-10px_rgba(244,63,94,0.5)]',
      accent: 'from-rose-500/15',
      icon: TrendingDown,
    }
  }

  return {
    text: 'text-slate-300',
    glow: 'shadow-[0_0_28px_-12px_rgba(148,163,184,0.45)]',
    accent: 'from-slate-500/14',
    icon: Minus,
  }
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
  const tone = signalTone(direction)
  const convictionPct = clampPercent(conviction)
  const radius = 39
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (convictionPct / 100) * circumference
  const DirectionIcon = tone.icon

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f1b] ${tone.glow}`}
    >
      <div
        className={`pointer-events-none absolute right-[-66px] top-[-68px] h-64 w-64 rounded-full bg-gradient-to-br ${tone.accent} to-transparent blur-3xl`}
      />

      <div className="relative z-10 p-5">
        <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Algorithmic Signal
          </div>
          <span className="text-xs font-medium text-slate-500">{formatDate(signalDate)}</span>
        </div>

        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 text-sm text-slate-400">Current Stance</div>
            <div className={`flex items-center gap-2 text-4xl font-extrabold tracking-tight ${tone.text}`}>
              <DirectionIcon className="h-8 w-8" />
              {signalLabel(direction)}
            </div>
          </div>

          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="h-24 w-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`${tone.text} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center leading-none">
              <span className="text-xl font-bold text-white">{Math.round(convictionPct)}%</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Conviction
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4">
          <div className="rounded-lg bg-slate-900/55 px-3 py-2.5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Target Horizon
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              <Clock className="h-4 w-4 text-slate-400" />
              {horizon} Days
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/55 px-3 py-2.5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Model Status
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live & Active
            </div>
          </div>
        </div>

        <Link
          href={`/performance?ticker=${encodeURIComponent(ticker)}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <Activity className="h-4 w-4 text-slate-300" />
          View Backtest Performance
        </Link>
      </div>
    </div>
  )
}
