import Link from 'next/link'
import Nav from '@/components/Nav'
import { getViewerUserId } from '@/lib/auth'
import { getUserWatchlistTickers } from '@/lib/watchlist'
import { getLastFlipDatesByTicker, getScreenerSignals } from '@/lib/signals'
import { getRecentAiResearchRuns } from '@/lib/ai-research'
import RecentAiResearchRuns from '@/components/RecentAiResearchRuns'

export const dynamic = 'force-dynamic'

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

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function signalBadgeClass(signal: 'bullish' | 'neutral' | 'bearish' | null): string {
  if (signal === 'bullish') return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
  if (signal === 'bearish') return 'bg-red-500/10 text-red-700 border border-red-500/30'
  if (signal === 'neutral') return 'bg-slate-500/10 text-slate-700 border border-slate-400/30'
  return 'bg-muted text-muted-foreground border border-border'
}

function signalLabel(signal: 'bullish' | 'neutral' | 'bearish' | null): string {
  if (signal === 'bullish') return 'BUY'
  if (signal === 'bearish') return 'SELL'
  if (signal === 'neutral') return 'HOLD'
  return 'NO SIGNAL'
}

export default async function DashboardPage() {
  const userId = await getViewerUserId()

  if (!userId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav active="dashboard" />
        <main className="max-w-[1000px] mx-auto px-6 py-10">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard is for signed-in users</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to create a personalized watchlist and track live model signals daily.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const tickers = await getUserWatchlistTickers(userId)
  const [{ rows }, lastFlipByTicker, recentAiRuns] = await Promise.all([
    getScreenerSignals({ tickers, limit: 500 }),
    getLastFlipDatesByTicker(tickers),
    getRecentAiResearchRuns({ userId, limit: 6 }),
  ])

  const rowByTicker = new Map(rows.map((row) => [row.ticker, row]))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active="dashboard" />

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pro Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your custom watchlist with live signal stance, conviction, and last flip context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            {tickers.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Visit any ticker page and click Add to Watchlist to start building your personalized dashboard.
                </p>
                <Link
                  href="/stocks/SPY"
                  className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                >
                  Explore SPY
                </Link>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full text-left text-[13px] whitespace-nowrap">
                    <thead className="bg-muted text-muted-foreground border-b border-border sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ticker</th>
                        <th className="px-4 py-3 font-medium">Current Price</th>
                        <th className="px-4 py-3 font-medium">Live Signal</th>
                        <th className="px-4 py-3 font-medium">Conviction</th>
                        <th className="px-4 py-3 font-medium">Last Flipped Date</th>
                        <th className="px-4 py-3 font-medium">% Chg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickers.map((ticker) => {
                        const row = rowByTicker.get(ticker)
                        const direction = row?.direction ?? null
                        const lastFlippedDate = lastFlipByTicker[ticker] ?? row?.signalDate ?? null

                        return (
                          <tr key={ticker} className="border-b border-border even:bg-muted/10">
                            <td className="px-4 py-3 font-semibold">
                              <Link href={`/stocks/${ticker}`} className="text-primary hover:underline">
                                {ticker}
                              </Link>
                              {row?.name && (
                                <div className="text-[12px] text-muted-foreground font-normal truncate max-w-[220px]">
                                  {row.name}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{formatPrice(row?.price ?? null)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${signalBadgeClass(direction)}`}>
                                {signalLabel(direction)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{formatConviction(row?.conviction ?? null)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(lastFlippedDate)}</td>
                            <td
                              className={`px-4 py-3 font-medium ${
                                (row?.changePercent ?? null) === null
                                  ? 'text-muted-foreground'
                                  : (row?.changePercent ?? 0) >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {formatPct(row?.changePercent ?? null)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <RecentAiResearchRuns
            title="Recent AI Research"
            runs={recentAiRuns}
            emptyMessage="No saved AI research runs yet."
          />
        </div>
      </main>
    </div>
  )
}
