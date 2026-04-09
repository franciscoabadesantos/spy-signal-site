import Link from 'next/link'
import { ArrowRight, Clock3, Gauge, Radar, TrendingDown, TrendingUp } from 'lucide-react'
import type { ScreenerSignal } from '@/lib/signals'

type ScreenerSignalCardProps = {
  row: ScreenerSignal
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

function getSignalAgeDays(value: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24)))
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function normalizeMoveWidth(value: number | null): number {
  if (value === null) return 0
  return clampPercent((Math.min(Math.abs(value), 8) / 8) * 100)
}

function normalizeAgeWidth(signalDate: string | null): number {
  const age = getSignalAgeDays(signalDate)
  if (age === null) return 0
  return clampPercent(100 - Math.min(age, 30) / 30 * 100)
}

function normalizeHorizonWidth(days: number | null): number {
  if (days === null) return 0
  return clampPercent((Math.min(days, 60) / 60) * 100)
}

function directionTheme(direction: ScreenerSignal['direction']) {
  if (direction === 'bullish') {
    return {
      shell:
        'border-emerald-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_rgba(7,14,12,0.98),_rgba(8,17,14,0.94))]',
      glow: 'shadow-[0_20px_50px_-24px_rgba(16,185,129,0.45)]',
      badge: 'bg-emerald-400/12 text-emerald-200 border border-emerald-400/20',
      accent: 'bg-emerald-400',
      accentSoft: 'bg-emerald-400/20',
      text: 'text-emerald-300',
      moveText: 'text-emerald-300',
      Icon: TrendingUp,
      label: 'Bullish',
    }
  }
  if (direction === 'bearish') {
    return {
      shell:
        'border-rose-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.18),_transparent_32%),linear-gradient(180deg,_rgba(18,11,14,0.98),_rgba(18,11,14,0.94))]',
      glow: 'shadow-[0_20px_50px_-24px_rgba(244,63,94,0.4)]',
      badge: 'bg-rose-400/12 text-rose-200 border border-rose-400/20',
      accent: 'bg-rose-400',
      accentSoft: 'bg-rose-400/20',
      text: 'text-rose-300',
      moveText: 'text-rose-300',
      Icon: TrendingDown,
      label: 'Bearish',
    }
  }
  return {
    shell:
      'border-sky-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_32%),linear-gradient(180deg,_rgba(11,15,24,0.98),_rgba(12,18,30,0.94))]',
    glow: 'shadow-[0_20px_50px_-24px_rgba(56,189,248,0.35)]',
    badge: 'bg-sky-400/12 text-sky-200 border border-sky-400/20',
    accent: 'bg-sky-400',
    accentSoft: 'bg-sky-400/20',
    text: 'text-sky-300',
    moveText: 'text-sky-300',
    Icon: Radar,
    label: 'Neutral',
  }
}

function buildSummary(row: ScreenerSignal): string {
  const stance = row.direction === 'bullish' ? 'risk-on' : row.direction === 'bearish' ? 'defensive' : 'balanced'
  const conviction = row.conviction === null ? 'unknown conviction' : `${Math.round(row.conviction * 100)}% conviction`
  const horizon =
    row.predictionHorizon === null ? 'unspecified horizon' : `${row.predictionHorizon}d horizon`
  const move = row.changePercent === null ? 'flat daily tape' : `${formatPct(row.changePercent)} today`
  return `${row.ticker} is screening ${stance} with ${conviction}, ${horizon}, and ${move}.`
}

function SignalRail({
  label,
  value,
  width,
  accentClass,
}: {
  label: string
  value: string
  width: number
  accentClass: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
        <span>{label}</span>
        <span className="tracking-normal text-slate-200">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
        <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function ScreenerSignalCard({ row }: ScreenerSignalCardProps) {
  const theme = directionTheme(row.direction)
  const ageDays = getSignalAgeDays(row.signalDate)
  const convictionWidth = clampPercent((row.conviction ?? 0) * 100)
  const freshnessWidth = normalizeAgeWidth(row.signalDate)
  const horizonWidth = normalizeHorizonWidth(row.predictionHorizon)
  const moveWidth = normalizeMoveWidth(row.changePercent)
  const Icon = theme.Icon

  return (
    <Link
      href={`/stocks/${row.ticker}`}
      className={`group relative block min-h-[360px] overflow-hidden rounded-[24px] border ${theme.shell} ${theme.glow} transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%,transparent)] opacity-70" />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
                <Icon className="h-3.5 w-3.5" />
                {theme.label}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <h3 className="text-[30px] font-bold leading-none tracking-tight text-white">{row.ticker}</h3>
              <span className="pb-0.5 text-[12px] font-medium text-slate-400">{formatPrice(row.price)}</span>
            </div>
            <div className="mt-2 max-w-[28ch] truncate text-sm font-medium text-slate-300">
              {row.name || 'Tracked market instrument'}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/5 p-2.5 text-slate-300 transition-colors group-hover:bg-white/8">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl border border-white/7 bg-black/20 px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Signal Date</div>
            <div className="mt-1 font-semibold text-slate-100">{formatSignalDate(row.signalDate)}</div>
          </div>
          <div className="rounded-2xl border border-white/7 bg-black/20 px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Move</div>
            <div className={`mt-1 font-semibold ${row.changePercent === null ? 'text-slate-100' : theme.moveText}`}>
              {formatPct(row.changePercent)}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <SignalRail
            label="Conviction"
            value={formatConviction(row.conviction)}
            width={convictionWidth}
            accentClass={theme.accent}
          />
          <SignalRail
            label="Freshness"
            value={ageDays === null ? '—' : `${ageDays}d`}
            width={freshnessWidth}
            accentClass={theme.accent}
          />
          <SignalRail
            label="Horizon"
            value={row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
            width={horizonWidth}
            accentClass={theme.accent}
          />
          <SignalRail
            label="Tape Move"
            value={formatPct(row.changePercent)}
            width={moveWidth}
            accentClass={theme.accent}
          />
        </div>

        <div className="mt-auto pt-6 text-xs font-medium text-slate-400">
          Hover for the expanded research view
        </div>
      </div>

      <div className="absolute inset-0 hidden translate-y-3 bg-[linear-gradient(180deg,rgba(12,18,30,0.96),rgba(8,12,20,0.98))] p-5 opacity-0 transition-all duration-300 md:block md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
                Expanded Signal View
              </div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">{row.ticker}</h3>
              <p className="mt-2 max-w-[32ch] text-sm leading-6 text-slate-300">{buildSummary(row)}</p>
            </div>
            <Gauge className={`h-5 w-5 ${theme.text}`} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Stance</div>
              <div className="mt-1 text-lg font-semibold text-white">{theme.label}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Conviction</div>
              <div className="mt-1 text-lg font-semibold text-white">{formatConviction(row.conviction)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Timing</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Signal Age</div>
              <div className="mt-1 text-lg font-semibold text-white">{ageDays === null ? '—' : `${ageDays}d`}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              Trade Context
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500">Last signal stamp</div>
                <div className="mt-1 font-semibold text-slate-100">{formatSignalDate(row.signalDate)}</div>
              </div>
              <div>
                <div className="text-slate-500">Current price</div>
                <div className="mt-1 font-semibold text-slate-100">{formatPrice(row.price)}</div>
              </div>
              <div>
                <div className="text-slate-500">Daily change</div>
                <div className={`mt-1 font-semibold ${row.changePercent === null ? 'text-slate-100' : theme.moveText}`}>
                  {formatPct(row.changePercent)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Underlying</div>
                <div className="mt-1 truncate font-semibold text-slate-100">
                  {row.name || 'Tracked market instrument'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-5 text-sm font-medium text-slate-300">
            Open full ticker report
          </div>
        </div>
      </div>
    </Link>
  )
}
