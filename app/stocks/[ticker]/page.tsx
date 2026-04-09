import { getSignalHistoryForTicker } from '@/lib/signals'
import {
  getStockQuote,
  getHistoricalData,
  getTickerFundamentals,
  getTickerNews,
  getRelatedTickers,
  type PricePoint,
  type StockQuote,
} from '@/lib/finance'
import { getViewerUserId } from '@/lib/auth'
import { isTickerInWatchlist } from '@/lib/watchlist'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import Nav from '@/components/Nav'
import { ShieldCheck, Newspaper } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import StockChartPanel from '@/components/StockChartPanel'
import StockSubnav from '@/components/StockSubnav'
import WatchlistButton from '@/components/WatchlistButton'
import AiAnalystPanel from '@/components/AiAnalystPanel'
import Breadcrumbs from '@/components/Breadcrumbs'
import PremiumSignalWidget from '@/components/PremiumSignalWidget'
import StickySectionNav from '@/components/StickySectionNav'
import RecentAiResearchRuns from '@/components/RecentAiResearchRuns'
import type { Signal } from '@/lib/types'
import { getRecentAiResearchRuns } from '@/lib/ai-research'

export const dynamic = 'force-dynamic'

function singleSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

function sanitizeAiQuestion(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 240) : null
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
    title: `${ticker} Stock Price, Target, Signals & Overview - SpySignal`,
    description: `Real-time price, algorithmic trading signals, and predictive data for ${name} (${ticker}). View conviction scores, performance, and key statistics.`,
  }
}

// --- HELPER FUNCTIONS ---

function normalizeDate(date: string): string {
  return date.slice(0, 10)
}

type ChartSignalMarker = {
  date: string
  direction: Signal['direction']
  conviction: number | null
  horizon: number
  kind: 'flip' | 'latest'
}

function buildChartSignalMarkers(signals: Signal[]): ChartSignalMarker[] {
  if (signals.length === 0) return []
  const ascending = [...signals].sort((a, b) => a.signal_date.localeCompare(b.signal_date))
  const markers: ChartSignalMarker[] = []

  for (let i = 1; i < ascending.length; i++) {
    const previous = ascending[i - 1]
    const current = ascending[i]
    if (current.direction === previous.direction) continue
    markers.push({ date: normalizeDate(current.signal_date), direction: current.direction, conviction: current.prob_side, horizon: current.prediction_horizon, kind: 'flip' })
  }

  const latest = ascending[ascending.length - 1]
  if (latest) {
    const latestDate = normalizeDate(latest.signal_date)
    const hasLatestMarker = markers.some((marker) => marker.date === latestDate && marker.direction === latest.direction)
    if (!hasLatestMarker) {
      markers.push({ date: latestDate, direction: latest.direction, conviction: latest.prob_side, horizon: latest.prediction_horizon, kind: 'latest' })
    }
  }
  return markers
}

type ModelProofMetrics = {
  winRate: number | null
  totalReturn: number | null
  maxDrawdownAvoided: number | null
}

function formatSignedPercent(value: number | null, digits = 1): string {
  if (value === null) return '—'
  const pct = (value * 100).toFixed(digits)
  return `${value >= 0 ? '+' : ''}${pct}%`
}

function formatPercent(value: number | null, digits = 0): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

function formatTimeAgo(value: string | null): string {
  if (!value) return 'Recent'
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return 'Recent'

  const diffMs = Date.now() - ts
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${mins}m ago`
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)))
    return `${hours}h ago`
  }

  const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
  return `${days}d ago`
}

function getSourceIconUrl(articleUrl: string): string | null {
  try {
    const host = new URL(articleUrl).hostname
    if (!host) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
  } catch {
    return null
  }
}

function getNewsIconUrl(item: { sourceUrl: string | null; url: string }): string | null {
  return getSourceIconUrl(item.sourceUrl || item.url)
}

function calcWeightBarWidth(value: number | null, maxValue: number): number {
  if (value === null || !Number.isFinite(value) || maxValue <= 0) return 0
  return Math.max(0, Math.min(100, (value / maxValue) * 100))
}

function computeMaxDrawdown(returns: number[]): number | null {
  if (returns.length === 0) return null

  let equity = 1
  let peak = 1
  let maxDrawdown = 0

  for (const dailyReturn of returns) {
    equity *= 1 + dailyReturn
    if (equity > peak) peak = equity
    const drawdown = equity / peak - 1
    if (drawdown < maxDrawdown) maxDrawdown = drawdown
  }

  return maxDrawdown
}

function computeModelProofMetrics(signals: Signal[], historical: PricePoint[]): ModelProofMetrics {
  if (signals.length < 2 || historical.length < 2) {
    return { winRate: null, totalReturn: null, maxDrawdownAvoided: null }
  }

  const priceByDate = new Map<string, number>()
  for (const point of historical) {
    priceByDate.set(point.date.slice(0, 10), point.close)
  }

  const ascendingSignals = [...signals].sort((a, b) => a.signal_date.localeCompare(b.signal_date))

  const strategyReturns: number[] = []
  const benchmarkReturns: number[] = []
  const hitFlags: boolean[] = []

  for (let i = 0; i < ascendingSignals.length - 1; i++) {
    const current = ascendingSignals[i]
    const next = ascendingSignals[i + 1]
    if (!current || !next) continue

    const currentDate = current.signal_date.slice(0, 10)
    const nextDate = next.signal_date.slice(0, 10)
    const currentPrice = priceByDate.get(currentDate)
    const nextPrice = priceByDate.get(nextDate)
    if (currentPrice === undefined || nextPrice === undefined || currentPrice <= 0) continue

    const assetReturn = nextPrice / currentPrice - 1
    const bullish = current.direction === 'bullish'
    const strategyReturn = bullish ? assetReturn : 0
    const hit = bullish ? assetReturn > 0 : assetReturn <= 0

    benchmarkReturns.push(assetReturn)
    strategyReturns.push(strategyReturn)
    hitFlags.push(hit)
  }

  if (strategyReturns.length === 0) {
    return { winRate: null, totalReturn: null, maxDrawdownAvoided: null }
  }

  const strategyTotal = strategyReturns.reduce((acc, value) => acc * (1 + value), 1) - 1
  const wins = hitFlags.filter(Boolean).length
  const winRate = wins / hitFlags.length

  const strategyDrawdown = computeMaxDrawdown(strategyReturns)
  const benchmarkDrawdown = computeMaxDrawdown(benchmarkReturns)
  const maxDrawdownAvoided =
    strategyDrawdown === null || benchmarkDrawdown === null
      ? null
      : strategyDrawdown - benchmarkDrawdown

  return {
    winRate,
    totalReturn: strategyTotal,
    maxDrawdownAvoided,
  }
}

// --- MAIN PAGE COMPONENT ---
export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ aiQuestion?: string | string[]; aiPromptLabel?: string | string[] }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const ticker = resolvedParams.ticker.toUpperCase()
  const initialAiQuestion = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiQuestion))
  const initialAiPromptLabel = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiPromptLabel))
  const viewerAccess = await getViewerAccess()
  const viewerUserId = viewerAccess.userId ?? (await getViewerUserId())
  const aiAnalystEnabled = Boolean(process.env.PERPLEXITY_API_KEY?.trim())
  const upgradeHref = viewerAccess.isSignedIn
    ? getStripeUpgradeUrl(viewerAccess.userId)
    : '/sign-up?redirect_url=/stocks/' + ticker
  const relatedTickerSymbols = getRelatedTickers(ticker)

  const [quote, historicalData, recentSignals, fundamentals, newsItems, relatedQuotes] = await Promise.all([
    getStockQuote(ticker),
    getHistoricalData(ticker, 1825),
    getSignalHistoryForTicker(ticker, 180),
    getTickerFundamentals(ticker),
    getTickerNews(ticker, 5),
    Promise.all(relatedTickerSymbols.map((symbol) => getStockQuote(symbol))),
  ])
  const recentAiRuns = await getRecentAiResearchRuns({
    userId: viewerAccess.userId,
    ticker,
    limit: 4,
  })
  const isInWatchlist = viewerUserId ? await isTickerInWatchlist(viewerUserId, ticker) : false
  
  const hasSignals = recentSignals.length > 0
  const latest = recentSignals[0] ?? null
  const signalMarkers = hasSignals ? buildChartSignalMarkers(recentSignals) : []
  const isGreen = quote && quote.change >= 0
  
  // Extract Snapshot stats for the Key Stats grid
  const keyStats = fundamentals.snapshot.slice(0, 16) // Limit to 16 for a clean grid
  const modelProof = hasSignals ? computeModelProofMetrics(recentSignals, historicalData) : null
  const holdingsPreview = (fundamentals.holdings ?? []).slice(0, 10)
  const maxHoldingPreviewWeight = holdingsPreview.reduce((max, holding) => {
    const weight = holding.weightPercent
    if (weight === null || !Number.isFinite(weight)) return max
    return Math.max(max, weight)
  }, 0)
  const sectionNavItems = [
    { id: 'chart-section', label: 'Price & Signal' },
    { id: 'key-stats', label: 'Key Statistics' },
    { id: 'profile', label: 'Company Profile' },
    { id: 'top-holdings', label: 'Top Holdings' },
    { id: 'latest-news', label: 'Latest News' },
  ]
  const relatedAssets = relatedTickerSymbols
    .map((symbol, index) => {
      const peerQuote = relatedQuotes[index] as StockQuote | null | undefined
      return { symbol, quote: peerQuote ?? null }
    })
    .filter((item) => item.quote !== null)

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Nav />

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-6 pb-20">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stocks', href: '/screener' },
            { label: ticker },
          ]}
        />
        
        {/* TOP HEADER: StockAnalysis Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">{quote?.ticker || ticker}</h1>
              <span className="text-xl text-muted-foreground font-medium">{quote?.name}</span>
            </div>
            {quote && (
              <div className="flex items-end gap-3 mt-2">
                <span className="text-5xl font-bold leading-none text-gray-900">${quote.price.toFixed(2)}</span>
                <span className={`text-xl font-semibold mb-1 ${isGreen ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isGreen ? '+' : ''}{quote.change.toFixed(2)} ({isGreen ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-1.5 font-medium flex items-center gap-2">
               <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
               Market Closed · Prices updated daily
            </div>
          </div>
          <WatchlistButton
            ticker={ticker}
            initialInWatchlist={isInWatchlist}
            signedIn={Boolean(viewerUserId)}
          />
        </div>

        {/* SUBNAV */}
        <StockSubnav ticker={ticker} active="overview" />

        {/* CONTENT LAYOUT */}
        <div className="mt-6 flex flex-col lg:flex-row gap-8">
          <StickySectionNav sections={sectionNavItems} />
          
          {/* LEFT COLUMN: Chart & Data */}
          <div className="flex-1 min-w-0 space-y-8">
            
            {/* Chart Area */}
            <div id="chart-section" className="bg-card border border-border rounded-xl shadow-sm h-[400px] p-4 relative overflow-hidden">
               <StockChartPanel data={historicalData} signalMarkers={signalMarkers} />
            </div>

            {/* KEY STATISTICS GRID (StockAnalysis Style) */}
            <div id="key-stats">
               <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-border pb-2">Key Statistics</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                 {keyStats.map((stat, i) => (
                   <div key={i} className="flex flex-col justify-between border-b border-muted py-2">
                     <span className="text-sm text-muted-foreground">{stat.label}</span>
                     <span className="text-[15px] font-semibold text-gray-900 mt-0.5">{stat.value}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* ABOUT SECTION */}
            <div id="profile">
               <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-border pb-2">Profile</h2>
               <p className="text-[15px] text-gray-700 leading-relaxed max-w-4xl">
                 {fundamentals.about || `The ${quote?.name || ticker} provides investment exposure to highly liquid segments of the market. Our system runs daily quantitative analysis on this asset to determine optimal capital deployment and mitigate large drawdown risks.`}
               </p>

               {/* TOP HOLDINGS PREVIEW */}
               <div id="top-holdings" className="mt-8">
                 <div className="flex justify-between items-end border-b border-border pb-2 mb-3">
                   <h2 className="text-xl font-bold text-gray-900">Top Holdings</h2>
                   <Link href={`/stocks/${ticker}/holdings-dividends`} className="text-sm font-medium text-primary hover:underline">
                     View All
                   </Link>
                 </div>
                 {holdingsPreview.length === 0 ? (
                   <div className="text-sm text-muted-foreground">
                     Holdings data is not currently available for this ticker.
                   </div>
                 ) : (
                   <div className="space-y-1.5">
                     {holdingsPreview.map((holding, i) => {
                       const weightLabel = holding.weightPercent === null ? '—' : `${holding.weightPercent.toFixed(2)}%`
                       const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingPreviewWeight)

                       return (
                         <div
                           key={`${holding.symbol}-${i}`}
                           className="group flex items-center gap-3 rounded-md border border-transparent px-2 py-2 text-[14px] transition-colors hover:border-border hover:bg-muted/20"
                         >
                           <div className="w-14 shrink-0 font-semibold text-gray-900">{holding.symbol}</div>
                           <div className="min-w-0 flex-1">
                             <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                               <div
                                 className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                                 style={{ width: `${barWidth}%` }}
                               />
                             </div>
                           </div>
                           <div className="w-16 shrink-0 text-right font-medium text-gray-600">{weightLabel}</div>
                         </div>
                       )
                     })}
                  </div>
                 )}
               </div>

              {/* NEWS FEED */}
              <div id="latest-news" className="mt-8">
                <div className="flex justify-between items-end border-b border-border pb-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
                </div>
                {newsItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent news available for this ticker.</div>
                ) : (
                  <div className="space-y-2.5">
                    {newsItems.map((item) => {
                      const sourceIconUrl = getNewsIconUrl(item)
                      return (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid grid-cols-[112px_1fr] gap-3 rounded-lg border border-border bg-card p-2 hover:bg-muted/20 hover:border-muted-foreground/20 transition-colors"
                        >
                          <div className="h-[76px] w-[112px] overflow-hidden rounded-md border border-border bg-muted/40">
                            {item.imageUrl ? (
                              <div
                                className="h-full w-full bg-center bg-cover bg-no-repeat"
                                style={{ backgroundImage: `url(${item.imageUrl})` }}
                              />
                            ) : sourceIconUrl ? (
                              <div
                                className="h-full w-full bg-white bg-center bg-no-repeat bg-contain"
                                style={{ backgroundImage: `url(${sourceIconUrl})` }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <Newspaper className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
                              {item.title}
                            </div>
                            <div className="text-[12px] text-muted-foreground mt-1.5 line-clamp-1">
                              {item.publisher} · {formatTimeAgo(item.publishedAt)}
                            </div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The USP (Signals) & Sidebars */}
          <div className="w-full lg:w-[340px] space-y-6 flex-shrink-0">
             
             {/* THE USP: Prominent Signal Widget */}
             {latest ? (
               <div className="space-y-4">
                 <PremiumSignalWidget
                   ticker={ticker}
                   direction={latest.direction}
                   conviction={latest.prob_side}
                   horizon={latest.prediction_horizon}
                   signalDate={latest.signal_date}
                 />

                 <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                   <div className="bg-muted/30 px-5 py-3 border-b border-border">
                     <h3 className="text-[15px] font-bold text-gray-900">Model Performance ({ticker})</h3>
                   </div>
                   <div className="px-5 py-2">
                     <div className="flex items-center justify-between py-3 border-b border-border text-[13px]">
                       <span className="text-muted-foreground">Win Rate (180d)</span>
                       <span className="font-semibold text-gray-900">{formatPercent(modelProof?.winRate ?? null, 0)}</span>
                     </div>
                     <div className="flex items-center justify-between py-3 border-b border-border text-[13px]">
                       <span className="text-muted-foreground">Total Strategy Return</span>
                       <span className="font-semibold text-gray-900">{formatSignedPercent(modelProof?.totalReturn ?? null, 1)}</span>
                     </div>
                     <div className="flex items-center justify-between py-3 text-[13px]">
                       <span className="text-muted-foreground">Max Drawdown Avoided</span>
                       <span className="font-semibold text-gray-900">{formatSignedPercent(modelProof?.maxDrawdownAvoided ?? null, 1)}</span>
                     </div>
                   </div>
                 </div>

                 <AiAnalystPanel
                   ticker={ticker}
                   signal={{
                     direction: latest.direction,
                     conviction: latest.prob_side,
                     predictionHorizon: latest.prediction_horizon,
                     signalDate: latest.signal_date,
                   }}
                   news={newsItems.map((item) => ({
                     title: item.title,
                     publisher: item.publisher,
                     publishedAt: item.publishedAt,
                     url: item.url,
                   }))}
                   isPro={viewerAccess.isPro}
                   providerEnabled={aiAnalystEnabled}
                   upgradeHref={upgradeHref}
                   initialQuestion={initialAiQuestion}
                   initialPromptLabel={initialAiPromptLabel}
                 />

                 {viewerAccess.isSignedIn && (
                   <RecentAiResearchRuns
                     title="Recent AI Research"
                     runs={recentAiRuns}
                     compact
                     emptyMessage="No saved AI research runs for this ticker yet."
                   />
                 )}
               </div>
             ) : (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                     <ShieldCheck className="w-5 h-5 text-muted-foreground" /> Signal Unavailable
                  </h3>
                  <p className="text-sm text-muted-foreground">No recent model output is available for this ticker yet.</p>
                </div>
             )}

             {/* Financials / Deep Links */}
             <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-muted/30 px-5 py-3 border-b border-border">
                  <h2 className="text-[15px] font-bold text-gray-900">Financial Data</h2>
                </div>
                <div className="flex flex-col">
                  {[
                    { label: 'Fund Profile', slug: 'fund-profile' },
                    { label: 'Portfolio Metrics', slug: 'portfolio' },
                    { label: 'Distributions', slug: 'distributions' },
                    { label: 'Risk & Return', slug: 'risk-metrics' },
                  ].map((item, i, arr) => (
                    <Link
                      key={item.slug}
                      href={`/stocks/${ticker}/financials/${item.slug}`}
                      className={`block px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-muted/50 hover:text-primary transition-colors ${i !== arr.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
             </div>

          </div>
        </div>

        {/* RELATED ASSETS */}
        <section className="mt-10">
          <div className="flex justify-between items-end border-b border-border pb-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Similar Assets</h2>
          </div>
          {relatedAssets.length === 0 ? (
            <div className="text-sm text-muted-foreground">No peer assets available right now.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedAssets.map((asset) => {
                const peerQuote = asset.quote
                const changePercent = peerQuote?.changePercent ?? null
                const up = changePercent !== null && changePercent >= 0

                return (
                  <Link
                    key={asset.symbol}
                    href={`/stocks/${asset.symbol}`}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 hover:bg-muted/10 transition-colors"
                  >
                    <div className="text-[16px] font-bold text-gray-900">{asset.symbol}</div>
                    <div className="text-[12px] text-muted-foreground truncate mt-0.5">{peerQuote?.name ?? asset.symbol}</div>
                    <div className="text-[20px] font-semibold text-gray-900 mt-2">
                      {peerQuote ? `$${peerQuote.price.toFixed(2)}` : '—'}
                    </div>
                    <div className={`text-[13px] font-medium mt-1 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
                      {changePercent === null ? '—' : `${up ? '+' : ''}${changePercent.toFixed(2)}%`}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
