import Link from 'next/link'
import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import StatRowCard from '@/components/ui/StatRowCard'
import InsightCard from '@/components/page/InsightCard'
import PageSection from '@/components/page/PageSection'
import SystemProfileBlob, { type SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'
import StockChartPanel from '@/components/StockChartPanel'
import PremiumSignalWidget from '@/components/PremiumSignalWidget'
import AiAnalystPanel from '@/components/AiAnalystPanel'
import WatchlistButton from '@/components/WatchlistButton'
import CorrelationNetwork from '@/components/CorrelationNetwork'
import SignalFlowStream from '@/components/SignalFlowStream'
import SignalDistributionBubbleCluster from '@/components/SignalDistributionBubbleCluster'
import StockInsightSummary from '@/components/stocks/StockInsightSummary'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
  TableEmptyRow,
} from '@/components/ui/DataTable'
import { getViewerUserId } from '@/lib/auth'
import { isTickerInWatchlist } from '@/lib/watchlist'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import { getSignalHistoryForTicker } from '@/lib/signals'
import type { Signal } from '@/lib/types'
import {
  getStockQuote,
  getHistoricalData,
  getTickerFundamentals,
  getTickerNews,
  getRelatedTickers,
  getTickerCorrelationNetwork,
  type PricePoint,
  type TickerFundamentals,
} from '@/lib/finance'
import {
  getTickerPageSummary,
  type LatestFundamentalsRow,
} from '@/lib/ticker-data'

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

function sanitizeScreenerSignal(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.slice(0, 48)
}

function sanitizeModelName(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.slice(0, 72)
}

function stockEntrySourceFromContext(
  value: string | null
): 'homepage_sample' | 'models_hub' | 'stock_page' | 'screener' | 'compare' | 'direct' {
  if (value === 'screener') return 'screener'
  if (value === 'model' || value === 'stock_page') return 'stock_page'
  if (value === 'homepage_sample') return 'homepage_sample'
  if (value === 'models_hub') return 'models_hub'
  if (value === 'compare') return 'compare'
  if (value === 'direct') return 'direct'
  return 'direct'
}

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
    if (!previous || !current || current.direction === previous.direction) continue
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

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function formatCompactNumber(value: number | null, options?: { currency?: boolean }): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  const formatted = formatter.format(value)
  return options?.currency ? `$${formatted}` : formatted
}

function asPercent(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null
  if (Math.abs(value) <= 1.5) return value * 100
  return value
}

function formatSignedPercent(value: number | null): string {
  const pct = asPercent(value)
  if (pct === null) return '—'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

function formatCalendarDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function coverageBadge(available: boolean): { text: string; variant: 'success' | 'warning' } {
  return available
    ? { text: 'Available', variant: 'success' }
    : { text: 'Unavailable', variant: 'warning' }
}

function findLatestFundamentalValue(
  rows: LatestFundamentalsRow[],
  matcher: (metric: string) => boolean
): string | null {
  const row = rows.find((item) => matcher(item.metric.toLowerCase()))
  if (!row) return null
  return row.valueDisplay ?? (row.valueNumber !== null ? row.valueNumber.toLocaleString() : null)
}

function computeInsightStats(signals: Signal[]) {
  const recent = signals.slice(0, 90)
  const convictionRows = recent
    .map((row) => row.prob_side)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const avgConviction =
    convictionRows.length > 0
      ? convictionRows.reduce((sum, value) => sum + value, 0) / convictionRows.length
      : null

  let flips = 0
  for (let i = 1; i < recent.length; i++) {
    const current = recent[i]
    const previous = recent[i - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }

  const bullishCount = recent.filter((row) => row.direction === 'bullish').length
  const bullishShare = recent.length > 0 ? bullishCount / recent.length : null

  return {
    avgConviction,
    flips,
    bullishShare,
  }
}

function computeSignalSummaryContext(signals: Signal[]) {
  const recent = signals.slice(0, 30)
  const latest = recent[0] ?? null
  if (!latest) {
    return {
      recentDirectionShare: null,
      recentFlipRate: null,
    }
  }

  const sameDirectionCount = recent.filter((row) => row.direction === latest.direction).length
  const recentDirectionShare = recent.length > 0 ? sameDirectionCount / recent.length : null

  let flips = 0
  for (let index = 1; index < recent.length; index += 1) {
    const current = recent[index]
    const previous = recent[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }

  const recentFlipRate = recent.length > 1 ? flips / (recent.length - 1) : null
  return {
    recentDirectionShare,
    recentFlipRate,
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function movingAverage(data: PricePoint[], windowSize: number): number | null {
  if (data.length < windowSize || windowSize <= 0) return null
  const slice = data.slice(-windowSize)
  const total = slice.reduce((sum, point) => sum + point.close, 0)
  return total / slice.length
}

function computeDailyReturns(data: PricePoint[]): number[] {
  const returns: number[] = []
  for (let index = 1; index < data.length; index += 1) {
    const current = data[index]
    const previous = data[index - 1]
    if (!current || !previous || previous.close <= 0) continue
    returns.push((current.close - previous.close) / previous.close)
  }
  return returns
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function parsePercentString(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

function buildScoreDimensions({
  historicalData,
  recentSignals,
  fundamentals,
  hasFundamentals,
}: {
  historicalData: PricePoint[]
  recentSignals: Signal[]
  fundamentals: TickerFundamentals
  hasFundamentals: boolean
}): SystemProfileBlobDimension[] {
  const latestPoint = historicalData[historicalData.length - 1]
  const ma200 = movingAverage(historicalData, 200)
  const ma50 = movingAverage(historicalData, 50)
  const trendAnchor = ma200 ?? ma50
  const trendScore =
    latestPoint && trendAnchor
      ? clampScore(50 + ((latestPoint.close - trendAnchor) / trendAnchor) * 260)
      : 55

  const momentumBase = historicalData[Math.max(0, historicalData.length - 64)]?.close ?? null
  const momentumScore =
    latestPoint && momentumBase && momentumBase > 0
      ? clampScore(50 + ((latestPoint.close - momentumBase) / momentumBase) * 230)
      : 52

  const recentReturns = computeDailyReturns(historicalData).slice(-90)
  const annualizedVol =
    recentReturns.length > 10 ? stdDev(recentReturns) * Math.sqrt(252) : null
  const riskScore = annualizedVol === null ? 48 : clampScore(100 - annualizedVol * 240)

  const yieldPct = parsePercentString(fundamentals.dividendYield)
  const yieldScore = !hasFundamentals ? 34 : yieldPct === null ? 42 : clampScore(yieldPct * 14)
  const yieldHint =
    !hasFundamentals
      ? 'Fundamentals coverage is not available for this ticker yet.'
      : yieldPct === null
      ? 'Placeholder-derived until yield feed is available for this ticker.'
      : `Forward yield ${yieldPct.toFixed(2)}%.`

  const stabilityWindow = recentSignals.slice(0, 90)
  let flips = 0
  for (let index = 1; index < stabilityWindow.length; index += 1) {
    const current = stabilityWindow[index]
    const previous = stabilityWindow[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }
  const flipRate =
    stabilityWindow.length > 1 ? flips / (stabilityWindow.length - 1) : 0
  const convictionValues = stabilityWindow
    .map((row) => row.prob_side)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .map((value) => value * 100)
  const convictionDispersion =
    convictionValues.length > 1 ? stdDev(convictionValues) : 18
  const stabilityScore = clampScore(100 - flipRate * 85 - convictionDispersion * 0.55)

  return [
    {
      label: 'Trend',
      score: trendScore,
      hint: 'Price trend versus long-window baseline.',
    },
    {
      label: 'Momentum',
      score: momentumScore,
      hint: 'Medium-horizon directional push from recent closes.',
    },
    {
      label: 'Risk',
      score: riskScore,
      hint: 'Higher means lower realized volatility.',
    },
    {
      label: 'Yield',
      score: yieldScore,
      hint: yieldHint,
    },
    {
      label: 'Stability',
      score: stabilityScore,
      hint: 'Signal consistency with lower flip frequency.',
    },
  ]
}

function phraseForDimension(label: string): string {
  if (label === 'Trend') return 'trend'
  if (label === 'Momentum') return 'momentum'
  if (label === 'Risk') return 'risk control'
  if (label === 'Yield') return 'income profile'
  return 'stability'
}

function buildSystemProfileInterpretation(dimensions: SystemProfileBlobDimension[]): string {
  if (dimensions.length < 3) return 'Profile dimensions are loading.'
  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const second = sorted[1]
  const weakest = sorted[sorted.length - 1]

  if (!strongest || !second || !weakest) return 'Profile dimensions are loading.'
  if (weakest.label === 'Yield') {
    return `Strong ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}, with minimal income contribution.`
  }
  if (weakest.label === 'Risk') {
    return `Elevated risk is offset by stronger ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}.`
  }
  return `Strong ${phraseForDimension(strongest.label)} and ${phraseForDimension(second.label)}, with softer ${phraseForDimension(weakest.label)}.`
}

function dimensionDescriptor(label: SystemProfileBlobDimension['label'], score: number): string {
  if (label === 'Trend') {
    if (score >= 78) return 'Very strong'
    if (score >= 60) return 'Strong'
    if (score >= 42) return 'Mixed'
    return 'Weak'
  }
  if (label === 'Momentum') {
    if (score >= 74) return 'Strong'
    if (score >= 52) return 'Mixed'
    return 'Soft'
  }
  if (label === 'Risk') {
    if (score >= 76) return 'Controlled'
    if (score >= 58) return 'Moderate'
    if (score >= 40) return 'Elevated'
    return 'High'
  }
  if (label === 'Yield') {
    if (score >= 74) return 'Strong'
    if (score >= 56) return 'Moderate'
    if (score >= 38) return 'Low'
    return 'Minimal'
  }
  if (score >= 72) return 'Strong'
  if (score >= 52) return 'Mixed'
  return 'Weak'
}

function dimensionDotClass(label: SystemProfileBlobDimension['label']): string {
  if (label === 'Trend') return 'bg-[var(--accent-500)]'
  if (label === 'Momentum') return 'bg-[var(--bull-400)]'
  if (label === 'Risk') return 'bg-[var(--warn-500)]'
  if (label === 'Yield') return 'bg-[var(--neutral-500)]'
  return 'bg-[var(--accent-300)]'
}

function profileStateBadge(overallScore: number): { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' } {
  if (overallScore >= 72) return { label: 'Constructive', variant: 'success' }
  if (overallScore >= 56) return { label: 'Mixed', variant: 'neutral' }
  if (overallScore >= 42) return { label: 'Fragile', variant: 'warning' }
  return { label: 'Stressed', variant: 'danger' }
}

function correlationSummaryLine(
  ticker: string,
  peers: Array<{ ticker: string; absCorrelation: number; sector: string | null }>
): string {
  if (peers.length === 0) {
    return `Correlation relationships for ${ticker} are still building from available history.`
  }

  const topPeers = peers.slice(0, 3)
  const topSector = topPeers
    .map((peer) => peer.sector)
    .find((sector): sector is string => Boolean(sector))
  const highCount = peers.filter((peer) => peer.absCorrelation >= 0.75).length
  const moderateCount = peers.filter((peer) => peer.absCorrelation >= 0.5).length

  if (highCount >= 3) {
    if (topSector) return `${ticker} clusters tightly with ${topSector.toLowerCase()} peers.`
    return `${ticker} clusters tightly with ${topPeers.map((peer) => peer.ticker).join(', ')}.`
  }

  if (highCount >= 1) {
    const primary = topPeers[0]?.ticker ?? 'peers'
    const secondary = topPeers[1]?.ticker ?? 'related names'
    return `${ticker} tracks ${primary} most closely, with moderate links to ${secondary}.`
  }

  if (moderateCount >= 2) {
    return `${ticker} shows moderate alignment across ${topPeers.map((peer) => peer.ticker).join(', ')}.`
  }

  return `${ticker} shows looser correlations, with no single dominant peer relationship.`
}

function recentFlipRate(signals: Signal[], window: number = 30): number {
  const slice = signals.slice(0, Math.max(2, window))
  if (slice.length <= 1) return 0
  let flips = 0
  for (let index = 1; index < slice.length; index += 1) {
    const current = slice[index]
    const previous = slice[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }
  return flips / Math.max(1, slice.length - 1)
}

function regimePhrase(direction: Signal['direction'] | null, flipRate: number): string {
  if (!direction) return 'Signal regime still forming'
  const directionLabel =
    direction === 'bullish' ? 'bullish regime' : direction === 'bearish' ? 'bearish regime' : 'neutral regime'
  if (flipRate <= 0.1) return `Stable ${directionLabel}`
  if (flipRate <= 0.2) return `Moderately stable ${directionLabel}`
  return `Unstable ${directionLabel}`
}

function compositionPhrase(biasLabel: string): string {
  if (biasLabel.includes('Bullish')) return 'bullish pressure dominates'
  if (biasLabel.includes('Bearish')) return 'downside pressure is elevated'
  if (biasLabel.includes('Neutral')) return 'neutral regimes absorb most observations'
  return 'signal pressure remains balanced'
}

function correlationPhrase(
  peers: Array<{ ticker: string; absCorrelation: number; sector: string | null }>
): string {
  if (peers.length === 0) return 'correlation clustering is still building'
  const high = peers.filter((peer) => peer.absCorrelation >= 0.75).length
  const topSector = peers
    .slice(0, 3)
    .map((peer) => peer.sector)
    .find((sector): sector is string => Boolean(sector))
  if (high >= 2 && topSector) {
    return `strong ${topSector.toLowerCase()} correlation`
  }
  if (high >= 1) {
    return `tightest link to ${peers[0]?.ticker ?? 'related peers'}`
  }
  return 'moderate cross-asset correlation'
}

function behaviorOverviewSummary({
  direction,
  flipRate,
  biasLabel,
  peers,
}: {
  direction: Signal['direction'] | null
  flipRate: number
  biasLabel: string
  peers: Array<{ ticker: string; absCorrelation: number; sector: string | null }>
}): string {
  return `${regimePhrase(direction, flipRate)} with ${correlationPhrase(peers)} and ${compositionPhrase(biasLabel)}.`
}

function deriveBehaviorCompositionInsights(values: {
  bullishCount: number
  neutralCount: number
  bearishCount: number
}): {
  biasLabel: string
  activePct: number
} {
  const total = values.bullishCount + values.neutralCount + values.bearishCount
  const bullishShare = total > 0 ? values.bullishCount / total : 0
  const neutralShare = total > 0 ? values.neutralCount / total : 0
  const bearishShare = total > 0 ? values.bearishCount / total : 0
  const activePct = Math.round((bullishShare + bearishShare) * 100)

  let biasLabel = 'Balanced system'
  if (neutralShare >= 0.5) {
    biasLabel = 'Neutral-heavy system'
  } else if (bullishShare >= 0.5 && bullishShare - bearishShare >= 0.14) {
    biasLabel = 'Bullish-biased system'
  } else if (bearishShare >= 0.5 && bearishShare - bullishShare >= 0.14) {
    biasLabel = 'Bearish-biased system'
  } else if (bullishShare > bearishShare + 0.08) {
    biasLabel = 'Bullish-leaning system'
  } else if (bearishShare > bullishShare + 0.08) {
    biasLabel = 'Bearish-leaning system'
  }

  return { biasLabel, activePct }
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

export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{
    aiQuestion?: string | string[]
    aiPromptLabel?: string | string[]
    from?: string | string[]
    screenerSignal?: string | string[]
    modelName?: string | string[]
  }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const ticker = resolvedParams.ticker.toUpperCase()
  const initialAiQuestion = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiQuestion))
  const initialAiPromptLabel = sanitizeAiQuestion(singleSearchParam(resolvedSearchParams.aiPromptLabel))
  const sourceContext = singleSearchParam(resolvedSearchParams.from)
  const screenerSignal = sanitizeScreenerSignal(singleSearchParam(resolvedSearchParams.screenerSignal))
  const modelName = sanitizeModelName(singleSearchParam(resolvedSearchParams.modelName))
  const stockEntrySource = stockEntrySourceFromContext(sourceContext)
  const modelTag = sourceContext === 'model' && modelName ? `From Model: ${modelName}` : null
  const screenerTag =
    sourceContext === 'screener' && screenerSignal ? `From Screener: ${screenerSignal}` : null
  const viewerAccess = await getViewerAccess()
  const viewerUserId = viewerAccess.userId ?? (await getViewerUserId())
  const aiAnalystEnabled = Boolean(process.env.PERPLEXITY_API_KEY?.trim())
  const upgradeHref = viewerAccess.isSignedIn
    ? getStripeUpgradeUrl(viewerAccess.userId)
    : '/sign-up?redirect_url=/stocks/' + ticker

  const relatedTickerSymbols = getRelatedTickers(ticker)
  const [
    tickerSummary,
    fallbackQuote,
    historicalData,
    recentSignals,
    fundamentals,
    newsItems,
    relatedQuotes,
    correlationNetwork,
  ] = await Promise.all([
    getTickerPageSummary(ticker),
    getStockQuote(ticker),
    getHistoricalData(ticker, 1825),
    getSignalHistoryForTicker(ticker, 180, { allowSyntheticFallback: false }),
    getTickerFundamentals(ticker),
    getTickerNews(ticker, 5),
    Promise.all(relatedTickerSymbols.map((symbol) => getStockQuote(symbol))),
    getTickerCorrelationNetwork(ticker, { maxPeers: 10, lookbackDays: 504, minOverlapDays: 90 }),
  ])

  const marketQuote = tickerSummary.quote
  const marketStats = tickerSummary.marketStats
  const coverage = tickerSummary.coverage
  const fundamentalsSummary = tickerSummary.fundamentalsSummary
  const latestFundamentals = tickerSummary.latestFundamentals
  const nextEarnings = tickerSummary.nextEarnings
  const earningsHistory = tickerSummary.earningsHistory
  const quote = fallbackQuote
  const displayName = marketQuote?.name ?? quote?.name ?? ticker

  const isInWatchlist = viewerUserId ? await isTickerInWatchlist(viewerUserId, ticker) : false
  const latest = recentSignals[0] ?? null
  const hasMarketData = coverage.hasMarketData
  const hasFundamentals = coverage.hasFundamentals
  const hasEarnings = coverage.hasEarnings
  const hasSignals = coverage.hasSignals || recentSignals.length > 0
  const signalMarkers = recentSignals.length > 0 ? buildChartSignalMarkers(recentSignals) : []
  const holdingsPreview = hasFundamentals ? (fundamentals.holdings ?? []).slice(0, 8) : []
  const maxHoldingPreviewWeight = holdingsPreview.reduce((max, holding) => {
    const weight = holding.weightPercent
    if (weight === null || !Number.isFinite(weight)) return max
    return Math.max(max, weight)
  }, 0)
  const insightStats = computeInsightStats(recentSignals)
  const signalSummaryContext = computeSignalSummaryContext(recentSignals)

  const relatedAssets = relatedTickerSymbols
    .map((symbol, index) => ({ symbol, quote: relatedQuotes[index] ?? null }))
    .filter((item) => item.quote !== null)
  const correlationSummary = correlationSummaryLine(ticker, correlationNetwork.peers)
  const compositionCounts = recentSignals.reduce(
    (acc, signal) => {
      if (signal.direction === 'bullish') acc.bullish += 1
      else if (signal.direction === 'bearish') acc.bearish += 1
      else acc.neutral += 1
      return acc
    },
    { bullish: 0, neutral: 0, bearish: 0 }
  )
  const compositionInsights = deriveBehaviorCompositionInsights({
    bullishCount: compositionCounts.bullish,
    neutralCount: compositionCounts.neutral,
    bearishCount: compositionCounts.bearish,
  })
  const overviewSummary = behaviorOverviewSummary({
    direction: latest?.direction ?? null,
    flipRate: recentFlipRate(recentSignals, 30),
    biasLabel: compositionInsights.biasLabel,
    peers: correlationNetwork.peers,
  })

  const marketCapValue =
    fundamentalsSummary?.marketCap !== null && fundamentalsSummary?.marketCap !== undefined
      ? formatCompactNumber(fundamentalsSummary.marketCap, { currency: true })
      : marketQuote?.marketCapText ?? '—'
  const quickStats = [
    { label: 'Market Cap', value: hasFundamentals ? marketCapValue : 'Not available' },
    {
      label: '1M Return',
      value: hasMarketData ? formatSignedPercent(marketStats?.return1m ?? null) : 'Not available',
    },
    {
      label: '1Y Return',
      value: hasMarketData ? formatSignedPercent(marketStats?.return1y ?? null) : 'Not available',
    },
    {
      label: 'Next Earnings',
      value: hasEarnings
        ? formatCalendarDate(nextEarnings?.earningsDate ?? earningsHistory[0]?.earningsDate ?? null)
        : 'Not available',
    },
  ]
  const fundamentalsSummaryRows = [
    {
      label: 'Latest Revenue',
      value:
        fundamentalsSummary?.latestRevenue !== null && fundamentalsSummary?.latestRevenue !== undefined
          ? formatCompactNumber(fundamentalsSummary.latestRevenue, { currency: true })
          : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('revenue')) ?? '—'),
    },
    {
      label: 'Latest EPS',
      value:
        fundamentalsSummary?.latestEps !== null && fundamentalsSummary?.latestEps !== undefined
          ? fundamentalsSummary.latestEps.toFixed(2)
          : (findLatestFundamentalValue(
              latestFundamentals,
              (metric) => metric === 'eps' || metric.includes('diluted_eps')
            ) ?? '—'),
    },
    {
      label: 'Trailing P/E',
      value:
        fundamentalsSummary?.trailingPe !== null && fundamentalsSummary?.trailingPe !== undefined
          ? fundamentalsSummary.trailingPe.toFixed(2)
          : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('pe')) ?? '—'),
    },
    {
      label: 'Revenue Growth YoY',
      value:
        fundamentalsSummary?.revenueGrowthYoy !== null && fundamentalsSummary?.revenueGrowthYoy !== undefined
          ? formatSignedPercent(fundamentalsSummary.revenueGrowthYoy)
          : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('revenue_growth')) ??
            '—'),
    },
    {
      label: 'Earnings Growth YoY',
      value:
        fundamentalsSummary?.earningsGrowthYoy !== null &&
        fundamentalsSummary?.earningsGrowthYoy !== undefined
          ? formatSignedPercent(fundamentalsSummary.earningsGrowthYoy)
          : (findLatestFundamentalValue(latestFundamentals, (metric) => metric.includes('earnings_growth')) ??
            '—'),
    },
    {
      label: 'Latest Period End',
      value: formatCalendarDate(fundamentalsSummary?.periodEnd ?? null),
    },
  ]
  const latestFundamentalsRows = latestFundamentals.filter(
    (row) => row.valueDisplay !== null || row.valueNumber !== null
  )
  const earningsHistoryRows = earningsHistory.slice(0, 6)
  const marketCoverageBadge = coverageBadge(hasMarketData)
  const fundamentalsCoverageBadge = coverageBadge(hasFundamentals)
  const earningsCoverageBadge = coverageBadge(hasEarnings)
  const signalsCoverageBadge = coverageBadge(hasSignals)
  const scoreDimensions = buildScoreDimensions({
    historicalData,
    recentSignals,
    fundamentals,
    hasFundamentals,
  })
  const profileInterpretation = buildSystemProfileInterpretation(scoreDimensions)
  const overallSystemScore =
    scoreDimensions.length > 0
      ? Math.round(scoreDimensions.reduce((sum, dimension) => sum + dimension.score, 0) / scoreDimensions.length)
      : 0
  const profileBadge = profileStateBadge(overallSystemScore)
  const recentFlipRatePct = Math.round(recentFlipRate(recentSignals, 30) * 100)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stocks', href: '/screener' },
          { label: ticker },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {modelTag ? <Badge variant="neutral">{modelTag}</Badge> : null}
          {screenerTag ? <Badge variant="neutral">{screenerTag}</Badge> : null}
          <Badge variant={marketCoverageBadge.variant}>
            Market {marketCoverageBadge.text}
          </Badge>
          <Badge variant={fundamentalsCoverageBadge.variant}>
            Fundamentals {fundamentalsCoverageBadge.text}
          </Badge>
          <Badge variant={earningsCoverageBadge.variant}>
            Earnings {earningsCoverageBadge.text}
          </Badge>
          <Badge variant={signalsCoverageBadge.variant}>
            Signals {signalsCoverageBadge.text}
          </Badge>
        </div>
        <WatchlistButton
          ticker={ticker}
          initialInWatchlist={isInWatchlist}
          signedIn={Boolean(viewerUserId)}
        />
      </div>
      <TrackEventOnMount
        eventName="view_stock"
        payload={{
          ticker,
          entry_source: stockEntrySource,
          has_screener_context: Boolean(screenerTag),
          has_model_context: Boolean(modelTag),
        }}
      />
      <PageSection
        title="Market Snapshot"
        description="Latest quote and market stats sourced from Data Ops coverage-aware surfaces."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Card className="section-gap" padding="lg">
            <h3 className="text-card-title text-content-primary">Quote</h3>
            {hasMarketData && marketQuote && marketQuote.price !== null ? (
              <div>
                <div className="text-body text-content-secondary">{displayName}</div>
                <div className="mt-2 text-display-md numeric-tabular leading-none text-content-primary">
                  ${marketQuote.price.toFixed(2)}
                </div>
                <div
                  className={`mt-2 text-data-sm numeric-tabular ${
                    (marketQuote.change ?? 0) >= 0 ? 'signal-bullish' : 'signal-bearish'
                  }`}
                >
                  {(marketQuote.change ?? 0) >= 0 ? '+' : ''}
                  {(marketQuote.change ?? 0).toFixed(2)} ({formatSignedPercent(marketQuote.changePercent)})
                </div>
                <div className="mt-2 text-caption text-content-muted">
                  {marketQuote.asOf ? `Updated ${formatTimeAgo(marketQuote.asOf)}` : 'Latest available quote'}
                </div>
              </div>
            ) : (
              <p className="text-body">Market data is not available for this ticker yet.</p>
            )}
          </Card>
          <Card className="section-gap" padding="lg">
            <h3 className="text-card-title text-content-primary">Stats</h3>
            {hasMarketData ? (
              <div className="grid grid-cols-2 gap-3">
                <StatRowCard label="1D Return" value={formatSignedPercent(marketStats?.return1d ?? null)} />
                <StatRowCard label="1M Return" value={formatSignedPercent(marketStats?.return1m ?? null)} />
                <StatRowCard label="3M Return" value={formatSignedPercent(marketStats?.return3m ?? null)} />
                <StatRowCard label="1Y Return" value={formatSignedPercent(marketStats?.return1y ?? null)} />
                <StatRowCard
                  label="From 52W High"
                  value={formatSignedPercent(marketStats?.distanceFrom52wHighPct ?? null)}
                />
                <StatRowCard
                  label="From 52W Low"
                  value={formatSignedPercent(marketStats?.distanceFrom52wLowPct ?? null)}
                />
              </div>
            ) : (
              <p className="text-body">Market stats are not available for this ticker yet.</p>
            )}
          </Card>
        </div>
      </PageSection>
      <PageSection
        title="Fundamentals"
        description="Summary metrics and latest fundamentals rows from Data Ops."
      >
        <Card className="section-gap" padding="lg">
          {!hasFundamentals ? (
            <p className="text-body">Fundamentals not available yet for this ticker.</p>
          ) : fundamentalsSummaryRows.every((row) => row.value === '—') &&
            latestFundamentalsRows.length === 0 ? (
            <p className="text-body">Fundamentals coverage is enabled, but values have not been published yet.</p>
          ) : (
            <div className="section-gap">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {fundamentalsSummaryRows.map((row) => (
                  <StatRowCard key={row.label} label={row.label} value={row.value} />
                ))}
              </div>

              {latestFundamentalsRows.length > 0 ? (
                <TableShell>
                  <TableBase>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Metric</TableHeaderCell>
                        <TableHeaderCell>Value</TableHeaderCell>
                        <TableHeaderCell>Period End</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {latestFundamentalsRows.slice(0, 10).map((row, index) => (
                        <TableRow key={`${row.metric}-${index}`} index={index}>
                          <TableCell>{row.metricLabel}</TableCell>
                          <TableCell className="numeric-tabular">
                            {row.valueDisplay ??
                              (row.valueNumber !== null ? row.valueNumber.toLocaleString() : '—')}
                          </TableCell>
                          <TableCell className="numeric-tabular" muted>
                            {formatCalendarDate(row.periodEnd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableBase>
                </TableShell>
              ) : null}
            </div>
          )}
        </Card>
      </PageSection>
      <PageSection
        title="Earnings"
        description="Next event plus recent reported history, when earnings coverage is available."
      >
        <div className="section-gap">
          <Card className="section-gap" padding="lg">
            <h3 className="text-card-title text-content-primary">Next Earnings</h3>
            {!hasEarnings ? (
              <p className="text-body">No earnings data available for this ticker.</p>
            ) : nextEarnings ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatRowCard label="Date" value={formatCalendarDate(nextEarnings.earningsDate)} />
                <StatRowCard label="Time" value={nextEarnings.earningsTime ?? '—'} />
                <StatRowCard
                  label="EPS Estimate"
                  value={nextEarnings.epsEstimate === null ? '—' : nextEarnings.epsEstimate.toFixed(2)}
                />
                <StatRowCard
                  label="Revenue Estimate"
                  value={formatCompactNumber(nextEarnings.revenueEstimate, { currency: true })}
                />
              </div>
            ) : (
              <p className="text-body">Next earnings date is not published yet.</p>
            )}
          </Card>
          <Card className="section-gap" padding="lg">
            <h3 className="text-card-title text-content-primary">Recent Earnings History</h3>
            {!hasEarnings ? (
              <p className="text-body">No earnings history available for this ticker.</p>
            ) : (
              <TableShell>
                <TableBase>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell>Period</TableHeaderCell>
                      <TableHeaderCell>EPS</TableHeaderCell>
                      <TableHeaderCell>EPS Est.</TableHeaderCell>
                      <TableHeaderCell>EPS Surprise</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {earningsHistoryRows.length === 0 ? (
                      <TableEmptyRow
                        colSpan={5}
                        title="No earnings history published yet."
                        description="Try again when the next filings are processed."
                      />
                    ) : (
                      earningsHistoryRows.map((row, index) => (
                        <TableRow key={`${row.earningsDate ?? 'row'}-${index}`} index={index}>
                          <TableCell className="numeric-tabular">
                            {formatCalendarDate(row.earningsDate)}
                          </TableCell>
                          <TableCell>{row.fiscalPeriod ?? '—'}</TableCell>
                          <TableCell className="numeric-tabular">
                            {row.epsActual === null ? '—' : row.epsActual.toFixed(2)}
                          </TableCell>
                          <TableCell className="numeric-tabular">
                            {row.epsEstimate === null ? '—' : row.epsEstimate.toFixed(2)}
                          </TableCell>
                          <TableCell className="numeric-tabular">
                            {formatSignedPercent(row.epsSurprisePct)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </TableBase>
              </TableShell>
            )}
          </Card>
        </div>
      </PageSection>
      <PageSection
        title="Insight Summary"
        description="Current state, conviction context, and signal timing before drilling into deeper behavior."
      >
        <div className="section-gap">
          <StockInsightSummary
            ticker={ticker}
            direction={latest?.direction ?? null}
            conviction={latest?.prob_side ?? null}
            horizonDays={latest?.prediction_horizon ?? null}
            biasLabel={compositionInsights.biasLabel}
            overviewSummary={overviewSummary}
            flipRatePct={recentFlipRatePct}
            activeSignalsPct={compositionInsights.activePct}
            profileState={profileBadge}
          />

          <Card className="emphasis-secondary h-[560px]" padding="lg">
            <StockChartPanel data={historicalData} signalMarkers={signalMarkers} />
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <StatRowCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Behavior"
        description="How regime state, signal composition, and peer correlation interact."
        className="rounded-[var(--radius-xl)] border border-border bg-[radial-gradient(circle_at_top_left,var(--neutral-tint),transparent_70%)] p-5"
      >
        <p className="text-body-sm rounded-[var(--radius-lg)] border border-border bg-surface-elevated px-3 py-2">
          {overviewSummary}
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <Card className="section-gap border-primary/20 bg-[radial-gradient(circle_at_top_left,var(--bullish-tint),transparent_72%)] lg:min-h-[520px]" padding="lg">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-card-title text-content-primary">Regime behavior</h3>
                <span className="text-caption text-content-muted">
                  Last {recentSignals.length || 0} signals
                </span>
              </div>
            <SignalFlowStream
              signals={recentSignals.map((signal) => ({
                signal_date: signal.signal_date,
                direction: signal.direction,
                prob_side: signal.prob_side,
              }))}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <Card className="section-gap" padding="lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-card-title text-content-primary">Signal composition</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{compositionInsights.biasLabel}</Badge>
                  <span className="text-caption text-content-muted">
                    Active {compositionInsights.activePct}%
                  </span>
                </div>
              </div>
              <SignalDistributionBubbleCluster
                bullishCount={compositionCounts.bullish}
                neutralCount={compositionCounts.neutral}
                bearishCount={compositionCounts.bearish}
                mode="compact"
                showSummaryLine={false}
                showCount={false}
                showRoleInside
              />
            </Card>

            <Card className="section-gap" padding="lg">
              <h3 className="text-card-title text-content-primary">Correlation network</h3>
              <p className="text-body">{correlationSummary}</p>
              <CorrelationNetwork
                centerTicker={ticker}
                centerName={displayName}
                peers={correlationNetwork.peers}
              />
            </Card>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Validation"
        description="Pressure-test the active signal with system profile quality, signal metrics, and AI-assisted context."
      >
        <div className="section-gap">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard title="Average Conviction" description="Recent 90-signal average">
              <div className="text-metric text-content-primary">{formatConviction(insightStats.avgConviction)}</div>
            </InsightCard>
            <InsightCard title="Signal Flips" description="Direction changes in recent history">
              <div className="text-metric text-content-primary">{insightStats.flips}</div>
            </InsightCard>
            <InsightCard title="Bullish Share" description="Portion of recent signals that were bullish">
              <div className="text-metric text-content-primary">
                {insightStats.bullishShare === null ? '—' : `${Math.round(insightStats.bullishShare * 100)}%`}
              </div>
            </InsightCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="emphasis-secondary" padding="lg">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-card-title text-content-primary">System Profile</h3>
                <div className="surface-tertiary glow-key inline-flex items-center gap-3 px-3 py-2">
                  <div className="leading-none text-content-primary">
                    <span className="text-data-lg numeric-tabular">{overallSystemScore}</span>
                    <span className="text-caption numeric-tabular ml-1 text-content-muted">/ 100</span>
                  </div>
                  <Badge variant={profileBadge.variant}>{profileBadge.label}</Badge>
                </div>
              </div>
              <p className="text-body mt-2 line-clamp-2">{profileInterpretation}</p>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[45%_55%] lg:items-stretch">
                <div className="mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center rounded-[var(--radius-xl)] border border-border bg-[radial-gradient(circle,var(--brand-electric-glow)_0%,rgba(129,140,248,0.05)_42%,transparent_72%)] p-5">
                  <SystemProfileBlob dimensions={scoreDimensions} />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  {scoreDimensions.map((dimension) => (
                    <div
                      key={dimension.label}
                      className="surface-tertiary flex items-center justify-between px-3 py-2"
                    >
                      <div className="inline-flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${dimensionDotClass(dimension.label)}`} />
                        <span className="text-label-md text-content-primary">{dimension.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-data-sm numeric-tabular text-content-primary">{Math.round(dimension.score)}</div>
                        <div className="text-micro text-content-muted">
                          {dimensionDescriptor(dimension.label, dimension.score)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="section-gap">
              {latest ? (
                <PremiumSignalWidget
                  ticker={ticker}
                  direction={latest.direction}
                  conviction={latest.prob_side}
                  horizon={latest.prediction_horizon}
                  signalDate={latest.signal_date}
                  recentDirectionShare={signalSummaryContext.recentDirectionShare}
                  recentFlipRate={signalSummaryContext.recentFlipRate}
                />
              ) : (
                <Card className="section-gap surface-primary">
                  <h3 className="text-heading-sm text-content-primary">Signal Summary</h3>
                  <p className="text-body mt-2">Signals are not available for this ticker right now.</p>
                </Card>
              )}

              <Card className="section-gap emphasis-secondary">
                <h3 className="text-card-title text-content-primary">Use this in your model</h3>
                <p className="text-body">Save to watchlist, inspect financials, or compare nearby assets for validation.</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/models/new?ticker=${encodeURIComponent(ticker)}&from=stock_page`}
                    className={buttonClass({ variant: 'primary' })}
                  >
                    Build model from this stock
                  </Link>
                  <Link href={`/stocks/${ticker}/financials/fund-profile`} className={buttonClass({ variant: 'secondary' })}>
                    View Financials
                  </Link>
                  <Link href={`/stocks/${ticker}/signal-history`} className={buttonClass({ variant: 'ghost' })}>
                    Signal History
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          <AiAnalystPanel
            ticker={ticker}
            signal={{
              direction: latest?.direction ?? 'neutral',
              conviction: latest?.prob_side ?? null,
              predictionHorizon: latest?.prediction_horizon ?? null,
              signalDate: latest?.signal_date ?? new Date().toISOString(),
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
        </div>
      </PageSection>

      <PageSection
        title="Details"
        description="Fundamentals, holdings, recent news, and peer context for deeper research."
      >
        <div className="emphasis-tertiary">
          <p className="text-body">
            Move from signal interpretation into supporting company, portfolio, and market context.
          </p>
        </div>
      </PageSection>

      <PageSection id="profile" title="About" description="Company / fund profile and strategy context.">
        <Card>
          <p className="text-body leading-7 text-base">
            {!hasFundamentals
              ? 'Fundamentals profile information is not available for this ticker yet.'
              : (fundamentals.about ||
                `The ${displayName} provides exposure to highly liquid market segments. This page combines live model context with supporting fundamentals so you can evaluate stance changes in context.`)}
          </p>
        </Card>
      </PageSection>

      <PageSection
        id="top-holdings"
        title="Top Holdings Preview"
        description="Largest disclosed positions by portfolio weight."
        action={
          <Link href={`/stocks/${ticker}/holdings-dividends`} className={buttonClass({ variant: 'secondary' })}>
            View full holdings
          </Link>
        }
      >
        <Card>
          {holdingsPreview.length === 0 ? (
            <p className="text-body">Holdings data is not currently available for this ticker.</p>
          ) : (
            <div className="space-y-2">
              {holdingsPreview.map((holding, i) => {
                const weightLabel = holding.weightPercent === null ? '—' : `${holding.weightPercent.toFixed(2)}%`
                const barWidth = calcWeightBarWidth(holding.weightPercent, maxHoldingPreviewWeight)

                return (
                  <div key={`${holding.symbol}-${i}`} className="surface-tertiary p-3">
                    <div className="text-body-sm mb-2 flex items-center justify-between gap-3">
                      <div className="text-label-md text-content-primary">
                        {holding.symbol}
                        <span className="ml-2 text-content-muted">{holding.name}</span>
                      </div>
                      <div className="text-data-sm numeric-tabular text-content-secondary">{weightLabel}</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </PageSection>

      <PageSection id="latest-news" title="Latest News" description="Recent headlines for this asset.">
        <div className="grid grid-cols-1 gap-3">
          {newsItems.length === 0 ? (
            <Card>
              <p className="text-body">No recent news available for this ticker.</p>
            </Card>
          ) : (
            newsItems.map((item) => {
              const sourceIconUrl = getNewsIconUrl(item)
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="state-interactive block"
                >
                  <Card className="hover:border-primary/40 hover:bg-surface-hover" padding="md">
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="h-[64px] w-[88px] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated">
                        {item.imageUrl ? (
                          <div
                            className="h-full w-full bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                          />
                        ) : sourceIconUrl ? (
                          <div
                            className="h-full w-full bg-center bg-no-repeat bg-contain"
                            style={{ backgroundImage: `url(${sourceIconUrl})` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-content-muted">
                            <Newspaper className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-label-lg text-content-primary line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-body mt-1">{item.publisher} · <span className="numeric-tabular">{formatTimeAgo(item.publishedAt)}</span></div>
                      </div>
                    </div>
                  </Card>
                </a>
              )
            })
          )}
        </div>
      </PageSection>

      <PageSection title="Related Research Actions" description="Move from overview into detailed datasets and history.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              title: 'Financials',
              body: 'Explore profile, portfolio, distributions, and risk sections.',
              href: `/stocks/${ticker}/financials/fund-profile`,
            },
            {
              title: 'Signal History',
              body: 'Inspect daily stance changes, conviction, and episode outcomes.',
              href: `/stocks/${ticker}/signal-history`,
            },
            {
              title: 'Holdings & Dividends',
              body: 'Review allocations, sector exposure, and dividend fields.',
              href: `/stocks/${ticker}/holdings-dividends`,
            },
          ].map((item) => (
            <Card key={item.href} className="section-gap">
              <h3 className="text-card-title text-content-primary">{item.title}</h3>
              <p className="text-body">{item.body}</p>
              <Link href={item.href} className={buttonClass({ variant: 'secondary' })}>
                Open
              </Link>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection title="Similar Assets" description="Peer tickers for adjacent research.">
        {relatedAssets.length === 0 ? (
          <Card>
            <p className="text-body">No peer assets available right now.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedAssets.map((asset) => {
              const peerQuote = asset.quote
              const changePercent = peerQuote?.changePercent ?? null
              const up = changePercent !== null && changePercent >= 0

              return (
                <Link key={asset.symbol} href={`/stocks/${asset.symbol}`} className="block">
                  <Card className="hover:border-primary/40 hover:bg-surface-hover">
                    <div className="text-heading-sm text-content-primary">{asset.symbol}</div>
                    <div className="text-body mt-1 truncate">{peerQuote?.name ?? asset.symbol}</div>
                    <div className="text-data-lg numeric-tabular mt-3 text-content-primary">
                      {peerQuote ? `$${peerQuote.price.toFixed(2)}` : '—'}
                    </div>
                    <div className={`text-data-sm numeric-tabular mt-1 ${up ? 'signal-bullish' : 'signal-bearish'}`}>
                      {changePercent === null ? '—' : `${up ? '+' : ''}${changePercent.toFixed(2)}%`}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </PageSection>
    </>
  )
}
