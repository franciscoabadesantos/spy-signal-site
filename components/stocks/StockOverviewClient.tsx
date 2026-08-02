'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Suspense, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TemporalLineChart from '@/components/charts/TemporalLineChart'
import type { OhlcPoint, PricePoint } from '@/lib/finance'
import { scoreColor, type Scorecard } from '@/lib/scorecard-types'
import {
  buildTechnicalSummary,
  type TechnicalAction,
  type TechnicalTimeframe,
} from '@/lib/technicalSignals'
import { formatMoney, formatSignedMoney } from '@/lib/currency'
import { hasUsableMaterializedScorecard } from '@/lib/ticker-page-scorecard'
import { cn } from '@/lib/utils'
import {
  LENS_CHART_TIMEFRAME,
  LENS_TECHNICAL_TIMEFRAME,
  type InvestmentLensKey,
} from '@/lib/investment-lens'
import styles from './StockOverviewClient.module.css'
import PerspectiveDial from './PerspectiveDial'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'
type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | 'YTD' | '1Y' | '5Y'
type HistoricalChartState = 'loaded' | 'empty' | 'error'

type OverviewStat = {
  label: string
  value: string
}

type OverviewRelatedAsset = {
  symbol: string
  name: string | null
  price: number | null
  changePercent: number | null
  relation: string
  strength: number | null
  confidence: number | null
}

type OverviewFundDetail = {
  label: string
  value: string
}

type OverviewFundGroup = {
  key: string
  label: string
  rows: OverviewFundDetail[]
}

type OverviewHolding = {
  symbol: string
  name: string
  weightPercent: number | null
}

type OverviewProfileDetail = {
  label: string
  value: string
}

type OverviewSectorWeight = {
  sector: string
  weightPercent: number | null
}

type OverviewEarnings = {
  date: string | null
  time: string | null
  fiscalPeriod: string | null
}

type OverviewSignal = {
  direction: SignalDirection
  conviction: number | null
  horizon: number | null
  signalDate: string | null
}

type OverviewRegimePoint = {
  signal_date: string
  direction: SignalDirection
  prob_side: number | null
  prediction_horizon: number
  episode_return: number | null
  episode_status: string | null
}

type StockOverviewClientProps = {
  ticker: string
  initialLens: InvestmentLensKey
  currency: string
  displayName: string
  assetBadgeLabel: string
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  latestSignal: OverviewSignal | null
  historicalData: PricePoint[]
  historicalChartState: HistoricalChartState
  ohlcData: OhlcPoint[]
  keyStats: OverviewStat[]
  fundamentalGroups: OverviewFundGroup[]
  holdings: OverviewHolding[]
  profileDetails: OverviewProfileDetail[]
  sectorWeights: OverviewSectorWeight[]
  nextEarnings: OverviewEarnings | null
  volatility30d: number | null
  relatedAssets: Promise<OverviewRelatedAsset[]>
  regimeSignals: OverviewRegimePoint[]
  scorecard: Scorecard
  about: string | null
  watchlistSlot?: ReactNode
  navigationSlot: ReactNode
}

const HERO_TIMEFRAMES: ChartTimeframe[] = ['1D', '5D', '1M', '3M', 'YTD', '1Y', '5Y']
const SIGNAL_TIMEFRAMES: TechnicalTimeframe[] = ['1D', '1W', '1M']

function formatPrice(value: number | null | undefined, currency = 'USD'): string {
  return formatMoney(value, currency)
}

function formatSignedDelta(value: number | null | undefined, currency = 'USD'): string {
  return formatSignedMoney(value, currency)
}

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

function formatCompactPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatConviction(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const scaled = Math.abs(value) <= 1 ? value * 100 : value
  return `${scaled.toFixed(0)}%`
}

function regimeCopy(direction: SignalDirection | null): string {
  if (direction === 'bullish') return 'Bullish regime'
  if (direction === 'bearish') return 'Bearish regime'
  return 'Neutral regime'
}

function regimeTone(direction: SignalDirection | null): 'bullish' | 'bearish' | 'neutral' {
  if (direction === 'bullish') return 'bullish'
  if (direction === 'bearish') return 'bearish'
  return 'neutral'
}

function scorecardReadinessMessage(scorecard: Scorecard): string | null {
  if (hasUsableMaterializedScorecard(scorecard)) return null
  if (scorecard.readiness === 'pending_build') return 'Data pending'
  if (scorecard.readiness === 'unavailable_missing_inputs') return 'Partial coverage'
  return 'Unavailable'
}

function actionTone(action: TechnicalAction): string {
  if (action === 'Buy') return styles.positiveText
  if (action === 'Sell') return styles.negativeText
  return styles.neutralText
}

function directionToneClass(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return styles.deltaNeutral
  if (value > 0) return styles.deltaPositive
  if (value < 0) return styles.deltaNegative
  return styles.deltaNeutral
}

function parseChartDate(value: string): number {
  return new Date(`${value}T00:00:00Z`).getTime()
}

function GradeRing({ grade, score }: { grade: string; score: number | null }) {
  const radius = 24
  const color = score === null ? 'var(--color-neutral)' : scoreColor(score)

  return (
    <svg width={60} height={60} viewBox="0 0 60 60" role="img" aria-label={`Grade ${grade}`} className={styles.gradeRing}>
      <circle cx={30} cy={30} r={radius} fill="none" stroke={color} strokeWidth={3.5} />
      <text x={30} y={35} textAnchor="middle" fontSize={15} fontWeight={750} fill="var(--color-text-primary)">
        {grade}
      </text>
    </svg>
  )
}

function startDateForHeroTimeframe(timeframe: ChartTimeframe, latestDate: Date): number | null {
  if (timeframe === '1D') return latestDate.getTime() - 1 * 24 * 60 * 60 * 1000
  if (timeframe === '5D') return latestDate.getTime() - 5 * 24 * 60 * 60 * 1000
  if (timeframe === '1M') return latestDate.getTime() - 30 * 24 * 60 * 60 * 1000
  if (timeframe === '3M') return latestDate.getTime() - 90 * 24 * 60 * 60 * 1000
  if (timeframe === 'YTD') return Date.UTC(latestDate.getUTCFullYear(), 0, 1)
  if (timeframe === '1Y') return latestDate.getTime() - 365 * 24 * 60 * 60 * 1000
  return latestDate.getTime() - 1825 * 24 * 60 * 60 * 1000
}

function filterChartData(data: PricePoint[], timeframe: ChartTimeframe): PricePoint[] {
  if (data.length <= 2) return data
  if (timeframe === '1D') return data.slice(-2)
  if (timeframe === '5D') return data.slice(-5)

  const latest = data[data.length - 1]
  if (!latest) return data
  const start = startDateForHeroTimeframe(timeframe, new Date(`${latest.date}T00:00:00Z`))
  if (start === null) return data

  const filtered = data.filter((point) => parseChartDate(point.date) >= start)
  return filtered.length >= 2 ? filtered : data
}

function gaugeArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toPoint = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const start = toPoint(startDeg)
  const end = toPoint(endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

function Gauge({
  title,
  position,
  verdict,
  verdictAction,
  counts,
}: {
  title: string
  position: number
  verdict: string
  verdictAction: TechnicalAction
  counts: {
    buy: number
    neutral: number
    sell: number
  }
}) {
  const clamped = Math.max(0, Math.min(100, position))
  const needleAngle = (clamped / 100) * 180 - 90
  const toneClass =
    verdictAction === 'Buy'
      ? styles.gaugePanelBuy
      : verdictAction === 'Sell'
        ? styles.gaugePanelSell
        : styles.gaugePanelNeutral

  return (
    <div className={cn(styles.gaugeItem, toneClass)}>
      <svg viewBox="0 0 120 70" className={styles.gaugeDial} aria-hidden="true">
        <path d={gaugeArcPath(60, 62, 46, -90, 90)} className={styles.gaugeArcTrack} />
        <path d={gaugeArcPath(60, 62, 46, -90, -34)} className={styles.gaugeArcSell} />
        <path d={gaugeArcPath(60, 62, 46, -30, 30)} className={styles.gaugeArcNeutral} />
        <path d={gaugeArcPath(60, 62, 46, 34, 90)} className={styles.gaugeArcBuy} />
        <g className={styles.gaugeNeedle} style={{ transform: `rotate(${needleAngle}deg)` }}>
          <path d="M 57.8 62 L 60 24.5 L 62.2 62 Z" />
        </g>
        <circle cx={60} cy={62} r={5.5} className={styles.gaugeHub} />
        <circle cx={60} cy={62} r={2.2} className={styles.gaugeHubCore} />
      </svg>

      <div className={styles.gaugeInfo}>
        <div className={styles.gaugeLabel}>{title}</div>
        <div className={cn(styles.gaugeVerdict, actionTone(verdictAction))}>{verdict}</div>
      </div>

      <div className={styles.gaugeRight}>
        <div className={styles.gaugeScore}>{Math.round(clamped)}</div>
        <div className={styles.gaugeCounts}>
          <span>
            <span className={styles.gaugeCountDotSell} /> {counts.sell}
          </span>
          <span>
            <span className={styles.gaugeCountDotNeutral} /> {counts.neutral}
          </span>
          <span>
            <span className={styles.gaugeCountDotBuy} /> {counts.buy}
          </span>
        </div>
      </div>
    </div>
  )
}

function HeroPriceChart({
  data,
  state,
  className,
  currency,
}: {
  data: PricePoint[]
  state: HistoricalChartState
  className?: string
  currency: string
}) {
  return (
    <TemporalLineChart
      className={cn(styles.heroChart, className)}
      points={data.map((point) => ({ date: point.date, value: point.close }))}
      ariaLabel="Historical closing price"
      valueFormat="currency"
      currency={currency}
      showRangeChange
      emptyState={
        <div className={styles.emptyState}>
          {state === 'error' ? 'Historical price data could not be loaded.' : 'Historical price data is unavailable.'}
        </div>
      }
    />
  )
}

function RelatedAssetsContent({
  ticker,
  relatedAssetsPromise,
  lens,
}: {
  ticker: string
  relatedAssetsPromise: Promise<OverviewRelatedAsset[]>
  lens: InvestmentLensKey
}) {
  const relatedAssets = use(relatedAssetsPromise)
  const rankedAssets = [...relatedAssets].sort((left, right) => {
    if (lens === 'trade' || lens === 'short') {
      return Math.abs(right.changePercent ?? 0) - Math.abs(left.changePercent ?? 0)
    }
    return Math.abs(right.strength ?? 0) - Math.abs(left.strength ?? 0)
  })
  const viewAllParams = new URLSearchParams({ lens })

  return (
    <article id="relationships" className={styles.relationshipEditorial} data-lens={lens}>
      <div className={styles.chapterHeader}>
        <div>
          <p className={styles.chapterEyebrow}>Observed associations</p>
          <h2 className={styles.chapterTitle}>Relationships</h2>
        </div>
        <Link href={`/stocks/${ticker}/relationships?${viewAllParams.toString()}`} className={styles.inlineArrow}>View all →</Link>
      </div>
      {rankedAssets.length > 0 ? (
        <div className={styles.relationshipPreviewGrid}>
          <div className={styles.relationshipOrbitPreview} data-relationship-orbit-preview="" aria-hidden="true">
            <span className={styles.orbitRing} />
            <span className={styles.orbitCenter}>{ticker}</span>
            {rankedAssets.slice(0, 3).map((asset, index) => (
              <span
                key={asset.symbol}
                className={styles[`orbitNode${index + 1}`]}
                style={{ opacity: asset.strength === null ? 0.62 : Math.max(0.48, Math.min(1, Math.abs(asset.strength))) }}
              >
                {asset.symbol}
              </span>
            ))}
          </div>
          <div className={styles.relatedAssets}>
            {rankedAssets.slice(0, 5).map((asset) => (
              <Link key={asset.symbol} href={`/stocks/${asset.symbol}`} className={styles.relatedChip}>
                <span className={styles.relatedIdentity}>
                  <span className={styles.chipTicker}>{asset.symbol}</span>
                  <span className={styles.relatedName}>{asset.name ?? asset.relation}</span>
                </span>
                {lens !== 'long' ? <span className={directionToneClass(asset.changePercent)}>{formatCompactPercent(asset.changePercent)}</span> : null}
                <span className={styles.relatedSemantics}>
                  <span>{asset.relation}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.inlineDataState}><span>Relationships</span><strong>Data pending</strong></div>
      )}
    </article>
  )
}

export default function StockOverviewClient({
  ticker,
  initialLens,
  currency,
  displayName,
  assetBadgeLabel,
  price,
  dailyMoveAmount,
  dailyMovePercent,
  latestSignal,
  historicalData,
  historicalChartState,
  ohlcData,
  keyStats,
  fundamentalGroups,
  holdings,
  profileDetails,
  sectorWeights,
  nextEarnings,
  volatility30d,
  relatedAssets: relatedAssetsPromise,
  scorecard,
  about,
  watchlistSlot,
  navigationSlot,
}: StockOverviewClientProps) {
  const reduceMotion = useReducedMotion()
  const [lens, setLens] = useState<InvestmentLensKey>(initialLens)
  const [heroTimeframe, setHeroTimeframe] = useState<ChartTimeframe>(LENS_CHART_TIMEFRAME[initialLens])
  const [signalTimeframe, setSignalTimeframe] = useState<TechnicalTimeframe>(LENS_TECHNICAL_TIMEFRAME[initialLens])
  const scorecardMessage = scorecardReadinessMessage(scorecard)

  const filteredChartData = useMemo(() => filterChartData(historicalData, heroTimeframe), [historicalData, heroTimeframe])
  const technicalSummary = useMemo(
    () => buildTechnicalSummary(ohlcData, signalTimeframe),
    [ohlcData, signalTimeframe]
  )
  const hasTechnicalData =
    ohlcData.length >= 30 &&
    [...technicalSummary.oscillatorRows, ...technicalSummary.movingAverageRows].some((row) => row.value !== '—')
  const regimeClass =
    regimeTone(latestSignal?.direction ?? null) === 'bullish'
      ? styles.regimeBullish
      : regimeTone(latestSignal?.direction ?? null) === 'bearish'
        ? styles.regimeBearish
        : styles.regimeNeutral

  const technicalGauges = [
    { key: 'summary', label: 'Summary', gauge: technicalSummary.gauges.summary },
    { key: 'oscillators', label: 'Oscillators', gauge: technicalSummary.gauges.oscillators },
    { key: 'moving-averages', label: 'Moving averages', gauge: technicalSummary.gauges.movingAverages },
  ] as const
  const profileRows = profileDetails
    .filter((row) => !/ticker|name|market cap|isin|identifier/i.test(row.label))
    .slice(0, 3)
  const availableStats = volatility30d === null
    ? keyStats
    : [...keyStats, { label: '30D Volatility', value: `${volatility30d.toFixed(1)}%` }]
  const priorityMetrics = (lens === 'trade'
    ? ['Volume', '30D Volatility', 'Market Cap', 'P/E']
    : lens === 'short'
      ? ['Volume', 'EPS', 'Revenue', 'Market Cap']
      : lens === 'medium'
        ? ['Market Cap', 'P/E', 'Revenue', 'EPS']
        : ['Market Cap', 'Revenue', 'Dividend Yield', 'P/E'])
    .map((label) => availableStats.find((stat) => stat.label === label))
    .filter((stat): stat is OverviewStat => Boolean(stat))
  const orderedFundamentalGroups = assetBadgeLabel === 'ETF'
    ? [...fundamentalGroups].sort((left, right) => Number(right.key === 'fund') - Number(left.key === 'fund'))
    : fundamentalGroups
  const visibleFundamentalGroups = orderedFundamentalGroups.slice(0, 6)

  useEffect(() => {
    setLens(initialLens)
    setHeroTimeframe(LENS_CHART_TIMEFRAME[initialLens])
    setSignalTimeframe(LENS_TECHNICAL_TIMEFRAME[initialLens])
  }, [initialLens])

  function updateLens(nextLens: InvestmentLensKey) {
    setLens(nextLens)
    setHeroTimeframe(LENS_CHART_TIMEFRAME[nextLens])
    setSignalTimeframe(LENS_TECHNICAL_TIMEFRAME[nextLens])
  }

  const sectionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }

  const timingSection = (
    <article id="signals" className={styles.editorialChapter} aria-labelledby="timing-heading">
      <div className={styles.chapterHeader}>
        <div>
          <p className={styles.chapterEyebrow}>Timing · {signalTimeframe}</p>
          <h2 id="timing-heading" className={styles.chapterTitle}>Technicals</h2>
        </div>
        <SegmentedControl options={SIGNAL_TIMEFRAMES} value={signalTimeframe} onChange={setSignalTimeframe} ariaLabel="Technical signals timeframe" />
      </div>
      <div className={styles.timingEditorialGrid}>
        <div className={styles.technicalRead}>
          {hasTechnicalData ? (
            <div className={styles.technicalGaugeGrid}>
              {technicalGauges.map(({ key, label, gauge }) => (
                <Gauge key={key} title={label} position={gauge.position} verdict={gauge.verdict} verdictAction={gauge.verdictAction} counts={gauge.counts} />
              ))}
            </div>
          ) : (
            <div className={styles.technicalGaugeGrid}>
              {technicalGauges.map(({ key, label }) => <div key={key} className={styles.gaugeDataPending}><span>{label}</span><strong>Data pending</strong></div>)}
            </div>
          )}
          <Link href={`/stocks/${ticker}/indicators`} className={styles.inlineArrow}>Indicator details →</Link>
        </div>
        <div className={styles.modelContextEditorial}>
          <p className={styles.chapterEyebrow}>Signal & events</p>
          {latestSignal ? (
            <>
              <div className={styles.modelSignalHeader}><strong>{regimeCopy(latestSignal.direction)}</strong><span className={cn(styles.regimeBadge, regimeClass)}>{latestSignal.direction}</span></div>
              <dl className={styles.modelSignalInline}>
                <div><dt>Conviction</dt><dd>{formatConviction(latestSignal.conviction)}</dd></div>
                <div><dt>Horizon</dt><dd>{latestSignal.horizon === null ? '—' : `${latestSignal.horizon} sessions`}</dd></div>
                <div><dt>Signal date</dt><dd>{formatDate(latestSignal.signalDate, { month: 'short', day: 'numeric' })}</dd></div>
              </dl>
            </>
          ) : (
            <div className={styles.inlineDataState}><span>Model signal</span><strong>Unavailable</strong></div>
          )}
          <div className={styles.contextLines}>
            <div><span>Earnings</span><strong>{nextEarnings?.date ? formatDate(nextEarnings.date, { month: 'short', day: 'numeric' }) : 'Data pending'}</strong></div>
            <div><span>Catalysts</span><strong>Data pending</strong></div>
          </div>
          <div className={styles.contextualLinks}><Link href={`/stocks/${ticker}/signals`}>Signal history →</Link><Link href={`/stocks/${ticker}/events`}>Earnings & events →</Link></div>
        </div>
      </div>
    </article>
  )

  const fundamentalsSection = (
    <article id="fundamentals" className={styles.editorialChapter} aria-labelledby="fundamentals-heading">
      <div className={styles.chapterHeader}>
        <div>
          <p className={styles.chapterEyebrow}>{assetBadgeLabel === 'ETF' ? 'Fund data' : 'Company data'}</p>
          <h2 id="fundamentals-heading" className={styles.chapterTitle}>Fundamentals</h2>
        </div>
        <Link href={`/stocks/${ticker}/fundamentals`} className={styles.inlineArrow}>Full fundamentals →</Link>
      </div>
      {visibleFundamentalGroups.length > 0 ? (
        <div className={styles.fundamentalEvidenceGrid}>
          {visibleFundamentalGroups.map((group) => (
            <section key={group.key}>
              <h3>{group.label}</h3>
              {group.rows.slice(0, 3).map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}
            </section>
          ))}
          {assetBadgeLabel === 'ETF' && holdings.length > 0 ? (
            <section><h3>Holdings</h3><div><span>Covered holdings</span><strong>{holdings.length}</strong></div></section>
          ) : null}
          {assetBadgeLabel === 'ETF' && sectorWeights.length > 0 ? (
            <section><h3>Exposures</h3><div><span>Covered sectors</span><strong>{sectorWeights.length}</strong></div></section>
          ) : null}
        </div>
      ) : (
        <div className={styles.inlineDataState}><span>Fundamentals</span><strong>Data pending</strong></div>
      )}
      <div className={styles.contextualLinks}>
        <Link href={`/stocks/${ticker}/financials`}>Financial statements →</Link>
        <Link href={`/stocks/${ticker}/valuation`}>Valuation history →</Link>
        <Link href={`/stocks/${ticker}/ownership`}>Ownership & capital →</Link>
      </div>
    </article>
  )

  const relationshipsSection = (
    <Suspense fallback={<div className={styles.relationshipEditorial}><div className={styles.inlineDataState}><span>Relationships</span><strong>Loading</strong></div></div>}>
      <RelatedAssetsContent ticker={ticker} relatedAssetsPromise={relatedAssetsPromise} lens={lens} />
    </Suspense>
  )

  return (
    <div className={styles.page} data-lens={lens}>
      <section className={styles.heroZone}>
        <div className={styles.headerBand}>
          <div className={styles.headerPrimary}>
            <div className={styles.heroIdentity} data-ticker-identity="">
              <h1 className={styles.name}>{displayName}</h1>
              <span className={styles.tickerBadge}>{ticker}</span>
              <span className={styles.exchangeBadge}>{assetBadgeLabel}</span>
            </div>

            <div className={styles.quoteControlRow}>
              <div className={styles.priceBlock} data-ticker-price="">
                <div className={styles.price}>{formatPrice(price, currency)}</div>
                <div className={cn(styles.delta, directionToneClass(dailyMoveAmount))}>
                  {formatSignedDelta(dailyMoveAmount, currency)} ({formatCompactPercent(dailyMovePercent)})
                </div>
              </div>
            </div>

            <div className={styles.heroBadgeRow}>
              {latestSignal ? (
                <span className={cn(styles.regimeBadge, regimeClass)}>{regimeCopy(latestSignal.direction)}</span>
              ) : null}
              {latestSignal?.signalDate ? (
                <span className={styles.signalDateBadge}>Signal: {formatDate(latestSignal.signalDate, { month: 'short', day: 'numeric' })}</span>
              ) : null}
            </div>
          </div>
          <div className={styles.controlRail}>
            <div className={styles.lensDock}>
              <PerspectiveDial initialValue={initialLens} onCommit={updateLens} />
            </div>
            {watchlistSlot}
          </div>
        </div>

        <div className={styles.tickerNavigation} data-ticker-navigation="">{navigationSlot}</div>

        <div className={styles.heroBody}>
          <div className={styles.heroChartColumn}>
            <h2 className="sr-only">Quick Read</h2>
            <div className={styles.chartToolbar}>
              <SegmentedControl
                options={HERO_TIMEFRAMES}
                value={heroTimeframe}
                onChange={setHeroTimeframe}
                ariaLabel="Chart timeframe"
              />
            </div>
            <div className={styles.heroChartWrap}>
              <HeroPriceChart data={filteredChartData} state={historicalChartState} currency={currency} />
            </div>
            <div className={styles.metricRibbon}>
              {priorityMetrics.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
            </div>
          </div>

          <aside className={styles.snapshotEditorial} aria-label="Final grade" data-overview-grade="">
            <Link href={`/stocks/${ticker}/methodology`} className={styles.snapshotGradeLink} aria-label="Open score breakdown">
              <div className={styles.snapshotGrade}>
                <GradeRing grade={scorecard.overall.grade || '–'} score={scorecard.overall.score} />
                <strong>{scorecardMessage ?? scorecard.overall.label}</strong>
              </div>
            </Link>
          </aside>
        </div>

        <div className={styles.profileIntro}>
          {about ? <p>{about}</p> : <span className={styles.previewNote}>{assetBadgeLabel === 'ETF' ? 'Fund profile' : 'Company profile'} · Data pending</span>}
          {profileRows.length > 0 ? <dl>{profileRows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl> : null}
          <Link href={`/stocks/${ticker}/profile`}>{assetBadgeLabel === 'ETF' ? 'Fund profile' : 'Company profile'} →</Link>
        </div>
      </section>

      <div className={styles.editorialSequence}>
        <motion.div layout="position" transition={sectionTransition} className={cn(styles.editorialSlot, styles.timingSlot)}>
          {timingSection}
        </motion.div>
        <motion.div layout="position" transition={sectionTransition} className={cn(styles.editorialSlot, styles.fundamentalsSlot)}>
          {fundamentalsSection}
        </motion.div>
        <motion.div layout="position" transition={sectionTransition} className={cn(styles.editorialSlot, styles.relationshipsSlot)}>
          {relationshipsSection}
        </motion.div>
      </div>

      {process.env.NODE_ENV !== 'production' ? <aside className={styles.adPlacement} aria-label="Advertisement placement preview">Advertisement placement <span>Preview · zero runtime space without a campaign</span></aside> : null}

    </div>
  )
}
