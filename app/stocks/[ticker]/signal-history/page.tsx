import Nav from '@/components/Nav'
import { getRecentSignals } from '@/lib/signals'
import StockSubnav from '@/components/StockSubnav'

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

export default async function SignalHistoryPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  const hasLiveSignals = ticker === 'SPY'
  const signals = hasLiveSignals ? await getRecentSignals(250) : []

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
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3.5 border-b border-gray-200">Date</th>
                  <th className="px-6 py-3.5 border-b border-gray-200">Direction</th>
                  <th className="px-6 py-3.5 border-b border-gray-200">Conviction</th>
                  <th className="px-6 py-3.5 border-b border-gray-200">Horizon</th>
                  <th className="px-6 py-3.5 border-b border-gray-200">Episode Return</th>
                  <th className="px-6 py-3.5 border-b border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signals.map((signal) => {
                  const badge = signalBadge(signal.direction)
                  const episodeReturn =
                    signal.live_episode_return_to_date ?? signal.live_flat_episode_spy_move_to_date
                  const status =
                    signal.live_episode_status ?? signal.live_flat_episode_status ?? 'pending'

                  return (
                    <tr key={signal.id} className="hover:bg-gray-50/70">
                      <td className="px-6 py-4">{formatDate(signal.signal_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[12px] font-semibold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatConviction(signal.prob_side)}</td>
                      <td className="px-6 py-4 text-gray-600">{signal.prediction_horizon}d</td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          episodeReturn === null
                            ? 'text-gray-500'
                            : episodeReturn >= 0
                              ? 'text-green-700'
                              : 'text-red-700'
                        }`}
                      >
                        {formatEpisodeReturn(episodeReturn)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
