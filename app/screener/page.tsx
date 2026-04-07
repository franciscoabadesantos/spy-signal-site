import Nav from '@/components/Nav'
import { Filter, Lock } from 'lucide-react'
import Link from 'next/link'
import { getScreenerSignals, type ScreenerSort } from '@/lib/signals'

export const dynamic = 'force-dynamic'

type ScreenerSearchParams = {
  signal?: string | string[]
  minConviction?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  maxAgeDays?: string | string[]
}

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseSignalFilter(raw: string | undefined): 'all' | 'bullish' | 'neutral' | 'bearish' {
  if (raw === 'bullish' || raw === 'neutral' || raw === 'bearish') return raw
  return 'all'
}

function parseMinConviction(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, Math.round(parsed)))
}

function parseTextQuery(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim().slice(0, 80)
}

function parseSort(raw: string | undefined): ScreenerSort {
  if (raw === 'latest' || raw === 'movers' || raw === 'ticker') return raw
  return 'conviction'
}

function parseMaxAgeDays(raw: string | undefined): number {
  if (!raw || raw.trim().length === 0) return 0
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(3650, Math.round(parsed)))
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(0)}%`
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

function signalBadgeClass(signal: 'bullish' | 'neutral' | 'bearish'): string {
  if (signal === 'bullish') {
    return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
  }
  if (signal === 'bearish') {
    return 'bg-red-500/10 text-red-700 border border-red-500/30'
  }
  return 'bg-slate-500/10 text-slate-700 border border-slate-400/30'
}

function signalLabel(signal: 'bullish' | 'neutral' | 'bearish'): string {
  if (signal === 'bullish') return 'BUY'
  if (signal === 'bearish') return 'SELL'
  return 'HOLD'
}

async function resolveSignedInState(): Promise<boolean> {
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const state = await auth()
    return Boolean(state.userId)
  } catch {
    return false
  }
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<ScreenerSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const signal = parseSignalFilter(singleParam(resolvedSearchParams.signal))
  const minConviction = parseMinConviction(singleParam(resolvedSearchParams.minConviction))
  const textQuery = parseTextQuery(singleParam(resolvedSearchParams.q))
  const sortBy = parseSort(singleParam(resolvedSearchParams.sort))
  const maxAgeDays = parseMaxAgeDays(singleParam(resolvedSearchParams.maxAgeDays))

  const [{ rows, source }, isSignedIn] = await Promise.all([
    getScreenerSignals({
      signal: signal === 'all' ? undefined : signal,
      minConvictionPct: minConviction,
      textQuery: textQuery || undefined,
      maxSignalAgeDays: maxAgeDays > 0 ? maxAgeDays : undefined,
      sortBy,
      limit: 200,
    }),
    resolveSignedInState(),
  ])

  const previewLimit = 3
  const visibleRows = isSignedIn ? rows : rows.slice(0, previewLimit)
  const hiddenCount = Math.max(0, rows.length - visibleRows.length)
  const isSpyOnlySource = source === 'spy_signals_live'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active="screener" />

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Filter className="w-8 h-8 text-primary" />
              Signal Screener
            </h1>
            <p className="text-muted-foreground mt-2">Filter and discover proprietary signals across tracked assets.</p>
            {isSpyOnlySource && (
              <p className="text-xs text-amber-700 mt-2">
                Data source is currently SPY-only. Load a multi-ticker view (for example
                <code className="mx-1">latest_signals_view</code>) for full market screener coverage.
              </p>
            )}
          </div>
          
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-md shadow-md text-sm transition-colors flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Unlock Pro Screener
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg flex flex-col md:flex-row min-h-[500px]">
          
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 border-r border-border p-6 bg-muted/20">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-6 text-muted-foreground">Filters</h2>
            
            <form method="GET" className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Ticker or Name</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={textQuery}
                  placeholder="AAPL, QQQ, semiconductors..."
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Current Signal</label>
                <select
                  name="signal"
                  defaultValue={signal}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Signals</option>
                  <option value="bullish">Bullish (Buy)</option>
                  <option value="neutral">Neutral (Hold)</option>
                  <option value="bearish">Bearish (Sell)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Minimum Conviction</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  name="minConviction"
                  defaultValue={minConviction}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Filters rows below this conviction threshold (%). Default is 0 to avoid empty initial results.
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Max Signal Age (days)</label>
                <input
                  type="number"
                  min={0}
                  max={3650}
                  name="maxAgeDays"
                  defaultValue={maxAgeDays > 0 ? maxAgeDays : ''}
                  placeholder="Any"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Keep only rows updated within this many days
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Sort By</label>
                <select
                  name="sort"
                  defaultValue={sortBy}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="conviction">Conviction (High → Low)</option>
                  <option value="latest">Most Recent Signal</option>
                  <option value="movers">Biggest Daily Movers</option>
                  <option value="ticker">Ticker (A → Z)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 rounded-md transition-colors"
                >
                  Apply Filters
                </button>
                <Link
                  href="/screener"
                  className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground py-2 rounded-md border border-border"
                >
                  Reset
                </Link>
              </div>
            </form>
            
            <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-xs font-medium text-primary">Full Results Require Premium</div>
            </div>
          </div>

          {/* Table Results */}
          <div className="flex-1 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-muted-foreground">
                Showing {visibleRows.length} of {rows.length} matching tickers
              </span>
              {source && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Source: {source} · Sort: {sortBy}
                </span>
              )}
            </div>
            
            {rows.length === 0 ? (
              <div className="border border-border rounded-lg p-6 text-sm text-muted-foreground">
                No screener rows available with current filters. Confirm your Supabase source view
                (for example <code>latest_signals_view</code>) has cross-ticker signal rows.
                {minConviction > 0 ? (
                  <div className="mt-2">
                    Tip: your current <code>minConviction</code> is {minConviction}%. Try lowering it.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-[13px] text-left whitespace-nowrap">
                  <thead className="bg-muted text-muted-foreground border-b border-border sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-md">Ticker</th>
                      <th className="px-4 py-3 font-medium">Signal</th>
                      <th className="px-4 py-3 font-medium">Conviction</th>
                      <th className="px-4 py-3 font-medium">Signal Date</th>
                      <th className="px-4 py-3 font-medium">Horizon</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium rounded-tr-md">% Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={`${row.ticker}-${row.signalDate ?? ''}`} className="border-b border-border even:bg-muted/10 hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold">
                          <Link href={`/stocks/${row.ticker}`} className="text-primary hover:underline">
                            {row.ticker}
                          </Link>
                          {row.name && (
                            <div className="text-[12px] text-muted-foreground font-normal truncate max-w-[240px]">
                              {row.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${signalBadgeClass(row.direction)}`}>
                            {signalLabel(row.direction)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatConviction(row.conviction)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatSignalDate(row.signalDate)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
                        </td>
                        <td className="px-4 py-3 font-medium">{formatPrice(row.price)}</td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            row.changePercent === null
                              ? 'text-muted-foreground'
                              : row.changePercent >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                          }`}
                        >
                          {formatPct(row.changePercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {!isSignedIn && hiddenCount > 0 && (
              <div className="absolute inset-0 top-52 bg-gradient-to-t from-background via-background/92 to-transparent flex items-end justify-center pb-12">
               <div className="bg-card border border-border p-5 rounded-xl shadow-2xl text-center max-w-sm">
                 <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                 <h4 className="font-semibold text-foreground mb-1">See All Tickers</h4>
                 <p className="text-xs text-muted-foreground mb-4">
                   You are viewing {visibleRows.length} preview rows. Upgrade to unlock {hiddenCount} additional results.
                 </p>
                 <button className="w-full text-sm font-medium bg-primary text-primary-foreground py-2 rounded">Upgrade Now</button>
               </div>
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  )
}
