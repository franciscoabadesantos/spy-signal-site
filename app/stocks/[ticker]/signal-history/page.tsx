import Nav from '@/components/Nav'
import { getSignalHistoryForTicker } from '@/lib/signals'
import type { Metadata } from 'next'
import StockSubnav from '@/components/StockSubnav'
import { getStockQuote } from '@/lib/finance'
import { getViewerUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatConviction(prob: number | null) {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

function formatEpisodeReturn(value: number | null) {
  if (value === null) return '—'
  const pct = (value * 100).toFixed(2)
  return value >= 0 ? `+${pct}%` : `${pct}%`
}

function signalBadge(direction: 'bullish' | 'bearish' | 'neutral') {
  if (direction === 'bullish') {
    return { text: 'Bullish', className: 'bg-green-50 text-green-700 border border-green-200' }
  }
  if (direction === 'bearish') {
    return { text: 'Bearish', className: 'bg-red-50 text-red-700 border border-red-200' }
  }
  return { text: 'Neutral', className: 'bg-gray-100 text-gray-700 border border-gray-200' }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const quote = await getStockQuote(ticker)
  const name = quote?.name || ticker

  return {
    title: `${ticker} Signal History - SpySignal`,
    description: `Daily model stance and conviction history for ${name} (${ticker}) from the SpySignal predictive system.`,
  }
}

export default async function SignalHistoryPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const viewerUserId = await getViewerUserId()
  const hasLiveSignals = ticker === 'SPY'
  const signals = await getSignalHistoryForTicker(ticker, 250)
  const canExport = Boolean(viewerUserId) && hasLiveSignals && signals.length > 0

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">{ticker}</h1>
            <span className="text-xl text-gray-600 font-medium">Signal History</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Daily live model outputs for this asset.
          </div>
        </div>

        <StockSubnav ticker={ticker} active="signal-history" />

        <div className="mt-5 flex items-center justify-end">
          {canExport ? (
            <a
              href={`/api/export-signals?ticker=${ticker}`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Download CSV
            </a>
          ) : (
            <div className="text-[12px] text-gray-500">
              {viewerUserId
                ? 'CSV export is available when live signal history exists.'
                : 'Sign in to download signal history as CSV.'}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {!hasLiveSignals ? (
            <div className="p-6 text-sm text-gray-600">
              Signal history is currently available for SPY only.
            </div>
          ) : signals.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No live signals available yet.
            </div>
          ) : (
            <div className="overflow-auto max-h-[680px]">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-200">Date</th>
                    <th className="px-6 py-3 border-b border-gray-200">Direction</th>
                    <th className="px-6 py-3 border-b border-gray-200">Conviction</th>
                    <th className="px-6 py-3 border-b border-gray-200">Horizon</th>
                    <th className="px-6 py-3 border-b border-gray-200">Episode Return</th>
                    <th className="px-6 py-3 border-b border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal) => {
                    const badge = signalBadge(signal.direction)
                    const episodeReturn =
                      signal.live_episode_return_to_date ?? signal.live_flat_episode_spy_move_to_date
                    const status =
                      signal.live_episode_status ?? signal.live_flat_episode_status ?? 'pending'

                    return (
                      <tr key={signal.id} className="border-b border-gray-100 even:bg-gray-50/70 hover:bg-gray-50/90">
                        <td className="px-6 py-3">{formatDate(signal.signal_date)}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 rounded text-[12px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium">{formatConviction(signal.prob_side)}</td>
                        <td className="px-6 py-3 text-gray-600">{signal.prediction_horizon}d</td>
                        <td
                          className={`px-6 py-3 font-medium ${
                            episodeReturn === null
                              ? 'text-gray-500'
                              : episodeReturn >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                          }`}
                        >
                          {formatEpisodeReturn(episodeReturn)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
