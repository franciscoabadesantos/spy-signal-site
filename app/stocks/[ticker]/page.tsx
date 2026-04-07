import { getRecentSignals } from '@/lib/signals'
import { getStockQuote, getHistoricalData, getTickerFundamentals } from '@/lib/finance'
import Nav from '@/components/Nav'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import StockChart from '@/components/StockChart'
import StockSubnav from '@/components/StockSubnav'
import type { Signal } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatProb(prob: number | null) {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

type ChartSignalMarker = {
  date: string
  direction: Signal['direction']
  conviction: number | null
  horizon: number
  kind: 'flip' | 'latest'
}

function normalizeDate(date: string): string {
  return date.slice(0, 10)
}

function buildChartSignalMarkers(signals: Signal[]): ChartSignalMarker[] {
  if (signals.length === 0) return []

  const ascending = [...signals].sort((a, b) => a.signal_date.localeCompare(b.signal_date))
  const markers: ChartSignalMarker[] = []

  for (let i = 1; i < ascending.length; i++) {
    const previous = ascending[i - 1]
    const current = ascending[i]
    if (current.direction === previous.direction) continue

    markers.push({
      date: normalizeDate(current.signal_date),
      direction: current.direction,
      conviction: current.prob_side,
      horizon: current.prediction_horizon,
      kind: 'flip',
    })
  }

  const latest = ascending[ascending.length - 1]
  if (latest) {
    const latestDate = normalizeDate(latest.signal_date)
    const hasLatestMarker = markers.some(
      (marker) => marker.date === latestDate && marker.direction === latest.direction
    )
    if (!hasLatestMarker) {
      markers.push({
        date: latestDate,
        direction: latest.direction,
        conviction: latest.prob_side,
        horizon: latest.prediction_horizon,
        kind: 'latest',
      })
    }
  }

  return markers
}

export default async function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  const hasSignals = ticker === 'SPY'
  const [quote, historicalData, recentSignals, fundamentals] = await Promise.all([
    getStockQuote(ticker),
    getHistoricalData(ticker, 60),
    hasSignals ? getRecentSignals(180) : Promise.resolve([]),
    getTickerFundamentals(ticker),
  ])
  const latest = hasSignals ? recentSignals[0] ?? null : null
  const signalMarkers = hasSignals ? buildChartSignalMarkers(recentSignals) : []

  const currentStance = latest
    ? (latest.direction === 'bullish' ? 'bullish' : 'neutral')
    : null

  const isGreen = quote && quote.change >= 0
  const aboutText =
    fundamentals.about ||
    `The ${quote?.name || ticker} provides investment exposure to highly liquid segments of the market. Our system runs daily quantitative analysis on this asset to determine optimal capital deployment and mitigate large drawdown risks.`
  const marketCapText = fundamentals.marketCap || quote?.marketCap || '—'

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav />

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        
        {/* Ticker Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">{quote?.ticker || ticker}</h1>
            <span className="text-xl text-gray-600 font-medium">
              {quote?.name}
            </span>
          </div>
          {quote && (
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-4xl font-bold">${quote.price.toFixed(2)}</span>
              <span className={`text-xl font-medium ${isGreen ? 'text-green-700' : 'text-red-700'}`}>
                {isGreen ? '+' : ''}{quote.change.toFixed(2)} ({isGreen ? '+' : ''}{quote.changePercent}% )
              </span>
              <span className="text-gray-500 text-sm ml-1 font-medium">At close</span>
            </div>
          )}
        </div>

        <StockSubnav ticker={ticker} active="overview" />

        {/* Content Grid */}
        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          
          {/* Main Left Column */}
          <div className="flex-1 space-y-10 min-w-0">
            
            {/* Chart Area with Signal Overlay */}
            <div>
               <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Chart Visualization</h2>
               <div className="relative bg-white border border-gray-200 rounded-lg h-[450px] w-full flex items-center justify-center text-sm shadow-sm p-4 pt-16">
                 
                 <div className="absolute inset-0 pt-16 pb-4 pr-6">
                    <StockChart data={historicalData} signalMarkers={signalMarkers} />
                 </div>

                 {/* Signal Overlay in the top-left of the chart plot */}
                 {hasSignals && latest ? (
                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur shadow-md border border-gray-200 rounded-md p-4 min-w-[200px]">
                       <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                         <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                         Live Model Stance
                       </div>
                       <div className={`text-2xl font-extrabold ${currentStance === 'bullish' ? 'text-green-700' : 'text-gray-700'}`}>
                         {currentStance === 'bullish' ? 'IN (BUY)' : 'OUT (FLAT)'}
                       </div>
                       <div className="text-sm font-medium text-gray-600 mt-1">
                         {formatProb(latest.prob_side)} Conviction
                       </div>
                    </div>
                 ) : (
                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur shadow-sm border border-gray-200 border-dashed rounded-md p-4 max-w-[260px]">
                       <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Model Status</div>
                       <div className="text-[15px] font-semibold text-gray-800">No predictions available</div>
                       <div className="text-[13px] text-gray-500 mt-1 leading-snug">System logic is currently scoped entirely to SPY.</div>
                    </div>
                 )}
               </div>
            </div>

            {/* About Section */}
            <div>
               <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">About {quote?.ticker || ticker}</h2>
               <p className="text-[15px] text-gray-700 leading-relaxed max-w-3xl">
                 {aboutText}
               </p>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 border-t border-gray-200 pt-6">
                 <div>
                   <span className="block text-sm text-gray-500 mb-1">Market Cap</span>
                   <span className="text-[15px] font-semibold text-gray-900">{marketCapText}</span>
                 </div>
                 <div>
                   <span className="block text-sm text-gray-500 mb-1">Status</span>
                   <span className="text-[15px] font-semibold text-primary">{hasSignals ? 'Active Coverage' : 'Watchlist'}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="w-full lg:w-[340px] space-y-8 flex-shrink-0">
             
             {/* Right Side Signal Summary Widget */}
             {hasSignals && latest && (
               <div>
                 <h2 className="text-[17px] font-bold text-gray-900 mb-3 tracking-tight">Algorithmic Summary</h2>
                 <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                   <div className="space-y-4">
                     <div className="flex justify-between border-b border-gray-100 pb-3">
                       <span className="text-sm font-medium text-gray-600">Action</span>
                       <span className={`text-sm font-bold ${currentStance === 'bullish' ? 'text-green-700' : 'text-gray-900'}`}>
                         {currentStance === 'bullish' ? 'Bullish (Allocated)' : 'Neutral (Hold Cash)'}
                       </span>
                     </div>
                     <div className="flex justify-between border-b border-gray-100 pb-3">
                       <span className="text-sm font-medium text-gray-600">Signal Date</span>
                       <span className="text-sm font-semibold text-gray-900">{formatDate(latest.signal_date)}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-100 pb-3">
                       <span className="text-sm font-medium text-gray-600">Horizon</span>
                       <span className="text-sm font-semibold text-gray-900">{latest.prediction_horizon} Days</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm font-medium text-gray-600">Conviction Check</span>
                       <span className="text-sm font-semibold text-gray-900">{formatProb(latest.prob_side)}</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Recent Financials / Links (Sidebar) */}
             <div>
                <h2 className="text-[17px] font-bold text-gray-900 mb-3 tracking-tight">Financials</h2>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  {[
                    { label: 'Fund Profile', slug: 'fund-profile' },
                    { label: 'Portfolio Metrics', slug: 'portfolio' },
                    { label: 'Distributions', slug: 'distributions' },
                    { label: 'Risk & Return', slug: 'risk-metrics' },
                  ].map((item, i, arr) => (
                    <Link
                      key={item.slug}
                      href={`/stocks/${ticker}/financials/${item.slug}`}
                      className={`block px-4 py-3 text-[15px] font-medium text-[#155e75] hover:underline ${i !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
             </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
