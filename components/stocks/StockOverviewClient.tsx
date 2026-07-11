'use client'

import Link from 'next/link'
import { Suspense, use, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import AiAnalystPanel from '@/components/AiAnalystPanel'
import RelationshipOrbit from '@/components/RelationshipOrbit'
import ScorecardDisc from '@/components/stocks/ScorecardDisc'
import SegmentedControl from '@/components/ui/SegmentedControl'
import ChartContainer from '@/components/charts/ChartContainer'
import type { OhlcPoint, PricePoint } from '@/lib/finance'
import type { TickerRelationships } from '@/lib/relationships'
import { scoreColor, type Scorecard, type ScorecardReadiness } from '@/lib/scorecard-types'
import {
  buildTechnicalSummary,
  type TechnicalAction,
  type TechnicalIndicatorRow,
  type TechnicalTimeframe,
} from '@/lib/technicalSignals'
import { formatMoney, formatSignedMoney } from '@/lib/currency'
import { tickerReadinessBadge } from '@/lib/ticker-readiness'
import { cn } from '@/lib/utils'
import styles from './StockOverviewClient.module.css'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'
type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | 'YTD' | '1Y' | '5Y'

type OverviewStat = {
  label: string
  value: string
}

type OverviewRelatedAsset = {
  symbol: string
  name: string | null
  price: number | null
  changePercent: number | null
}

type OverviewFundDetail = {
  label: string
  value: string
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
}

type StockOverviewClientProps = {
  ticker: string
  currency: string
  displayName: string
  assetBadgeLabel: string
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  latestSignal: OverviewSignal | null
  historicalData: PricePoint[]
  ohlcData: OhlcPoint[]
  keyStats: OverviewStat[]
  relationship126: Promise<TickerRelationships>
  relationship252: Promise<TickerRelationships>
  fundDetails: OverviewFundDetail[]
  relatedAssets: Promise<OverviewRelatedAsset[]>
  regimeSignals: OverviewRegimePoint[]
  scorecard: Scorecard
  watchlistSlot?: ReactNode
  showCopilot: boolean
  copilot: {
    isPro: boolean
    providerEnabled: boolean
    upgradeHref: string | null
    initialQuestion: string | null
    initialPromptLabel: string | null
  }
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
  const readiness = tickerReadinessBadge({
    coverageState: scorecard.coverageState,
    hasPrices: scorecard.hasPrices,
    hasTechnicals: scorecard.hasTechnicals,
    hasScorecard: scorecard.hasScorecard,
    missingInputs: scorecard.missingInputs,
    registryStatus: scorecard.registryStatus,
    validationStatus: scorecard.validationStatus,
    promotionStatus: scorecard.promotionStatus,
    scorecardReadiness: scorecard.readiness,
  })

  if (scorecard.readiness === 'ready' && readiness.label === 'Tracked') return null
  if (scorecard.readiness === 'pending_build') return 'Scorecard pending daily build'
  if (scorecard.readiness === 'not_tracked') return 'Ticker is not tracked yet'
  if (scorecard.readiness === 'unavailable_missing_inputs') {
    const missingInputs = scorecard.missingInputs.length > 0 ? scorecard.missingInputs.join('/') : 'fundamentals/earnings'
    return `Scorecard unavailable: missing ${missingInputs}`
  }
  if (readiness.label !== 'Tracked') return readiness.label
  return 'Scorecard is temporarily unavailable'
}

function scorecardReadinessTone(readiness: ScorecardReadiness): 'waiting' | 'blocked' | 'neutral' {
  if (readiness === 'pending_build') return 'waiting'
  if (readiness === 'unavailable_missing_inputs' || readiness === 'error') return 'blocked'
  return 'neutral'
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

type XTick = {
  index: number
  label: string
}

function thinTicks(ticks: XTick[], max: number): XTick[] {
  if (ticks.length <= max) return ticks
  const step = Math.ceil(ticks.length / max)
  return ticks.filter((_, position) => position % step === 0)
}

function buildXTicks(dates: string[]): XTick[] {
  const total = dates.length
  if (total === 0) return []
  if (total === 1) return [{ index: 0, label: formatDate(dates[0], { month: 'short', day: 'numeric' }) }]

  const spanDays = (parseChartDate(dates[total - 1]) - parseChartDate(dates[0])) / 86_400_000

  if (spanDays > 700) {
    const ticks: XTick[] = []
    let previousYear: number | null = null
    dates.forEach((date, index) => {
      const year = new Date(`${date}T00:00:00Z`).getUTCFullYear()
      if (previousYear !== null && year !== previousYear) {
        ticks.push({ index, label: String(year) })
      }
      previousYear = year
    })
    return thinTicks(ticks, 10)
  }

  if (spanDays > 45) {
    const ticks: XTick[] = []
    let previousMonth: number | null = null
    dates.forEach((date, index) => {
      const parsed = new Date(`${date}T00:00:00Z`)
      const monthKey = parsed.getUTCFullYear() * 12 + parsed.getUTCMonth()
      if (previousMonth !== null && monthKey !== previousMonth) {
        ticks.push({
          index,
          label:
            parsed.getUTCMonth() === 0
              ? String(parsed.getUTCFullYear())
              : parsed.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        })
      }
      previousMonth = monthKey
    })
    return thinTicks(ticks, 8)
  }

  const count = Math.min(6, total)
  const ticks: XTick[] = []
  for (let position = 0; position < count; position++) {
    const index = Math.round((position / Math.max(1, count - 1)) * (total - 1))
    if (!ticks.some((tick) => tick.index === index)) {
      ticks.push({ index, label: formatDate(dates[index], { month: 'short', day: 'numeric' }) })
    }
  }
  return ticks
}

function GradeRing({ grade, score }: { grade: string; score: number | null }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const clamped = score === null ? 0 : Math.max(0, Math.min(100, score))
  const color = score === null ? 'var(--color-neutral)' : scoreColor(clamped)

  return (
    <svg width={60} height={60} viewBox="0 0 60 60" role="img" aria-label={`Grade ${grade}`} className={styles.gradeRing}>
      <circle cx={30} cy={30} r={radius} fill="none" stroke="var(--color-border-light)" strokeWidth={4.5} />
      {score !== null ? (
        <circle
          cx={30}
          cy={30}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={`${(circumference * clamped) / 100} ${circumference}`}
          transform="rotate(-90 30 30)"
        />
      ) : null}
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
        <div className={styles.gaugeVerdictLine}>
          <span className={cn(styles.gaugeVerdict, actionTone(verdictAction))}>{verdict}</span>
          <span className={styles.gaugePressureValue}>{Math.round(clamped)}</span>
        </div>
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
  className,
  currency,
}: {
  data: PricePoint[]
  className?: string
  currency: string
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  return (
    <ChartContainer className={cn(styles.heroChart, className)} loadingText="Loading chart...">
      {({ width, height }) => {
        if (data.length === 0) {
          return <div className={styles.emptyState}>Historical price data is unavailable.</div>
        }

        const padding = { top: 12, right: 52, bottom: 22, left: 6 }
        const innerWidth = Math.max(1, width - padding.left - padding.right)
        const innerHeight = Math.max(1, height - padding.top - padding.bottom)
        const closes = data.map((point) => point.close)
        const min = Math.min(...closes)
        const max = Math.max(...closes)
        const spread = max - min || Math.max(1, min * 0.03)
        const floor = min - spread * 0.08
        const ceiling = max + spread * 0.08
        const points = data.map((point, index) => {
          const x = padding.left + (index / Math.max(1, data.length - 1)) * innerWidth
          const y = padding.top + (1 - (point.close - floor) / (ceiling - floor)) * innerHeight
          return { ...point, x, y }
        })

        const linePath = points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
          .join(' ')
        const areaPath = `${linePath} L${points[points.length - 1]?.x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} L${points[0]?.x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} Z`
        const xTicks = buildXTicks(data.map((point) => point.date))
        const yTicks = Array.from({ length: 5 }, (_, index) => floor + ((ceiling - floor) / 4) * index)
        const hoverPoint = hoverIndex === null ? null : points[hoverIndex] ?? null
        const tooltipLeft = hoverPoint ? Math.min(width - 148, Math.max(8, hoverPoint.x + 14)) : 0
        const tooltipTop = hoverPoint ? Math.max(8, Math.min(height - 92, hoverPoint.y - 76)) : 0
        const chartKey = `${data.length}:${data[0]?.date ?? ''}:${data[data.length - 1]?.date ?? ''}`
        const rangeBaseClose = data[0]?.close ?? null
        const hoverDeltaPct =
          hoverPoint && rangeBaseClose ? ((hoverPoint.close - rangeBaseClose) / rangeBaseClose) * 100 : null

        return (
          <div className="relative h-full w-full">
            <svg width={width} height={height} className="block">
              {yTicks.map((tick) => {
                const y = padding.top + (1 - (tick - floor) / (ceiling - floor)) * innerHeight
                return (
                  <line
                    key={tick}
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + innerWidth}
                    y2={y}
                    stroke="var(--color-border-light)"
                    strokeWidth="1"
                  />
                )
              })}

              <path key={`area-${chartKey}`} className={styles.chartArea} d={areaPath} fill="var(--color-accent-light)" />
              <path
                key={`line-${chartKey}`}
                className={styles.chartLine}
                d={linePath}
                pathLength={1}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <defs>
                <linearGradient id="lbCrosshairGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0" />
                  <stop offset="0.2" stopColor="var(--color-accent)" stopOpacity="0.55" />
                  <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0.06" />
                </linearGradient>
              </defs>

              {hoverPoint ? (
                <>
                  <g className={styles.crosshairGroup} style={{ transform: `translateX(${hoverPoint.x}px)` }}>
                    <line
                      x1={0}
                      y1={padding.top}
                      x2={0}
                      y2={padding.top + innerHeight}
                      stroke="url(#lbCrosshairGradient)"
                      strokeWidth="1.4"
                    />
                  </g>
                  <g
                    className={styles.hoverDotGroup}
                    style={{ transform: `translate(${hoverPoint.x}px, ${hoverPoint.y}px)` }}
                  >
                    <circle r="9" fill="var(--color-accent)" opacity="0.16" />
                    <circle r="4.2" fill="var(--color-accent)" stroke="var(--bg-surface)" strokeWidth="2" />
                  </g>
                </>
              ) : null}

              {xTicks.map(({ index, label }) => {
                const point = points[index]
                if (!point) return null
                const clampedX = Math.max(padding.left + 14, Math.min(padding.left + innerWidth - 14, point.x))
                return (
                  <text
                    key={`${point.date}-${index}`}
                    x={clampedX}
                    y={height - 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--color-text-muted)"
                  >
                    {label}
                  </text>
                )
              })}

              {yTicks.map((tick) => {
                const y = padding.top + (1 - (tick - floor) / (ceiling - floor)) * innerHeight
                return (
                  <text
                    key={`y-${tick}`}
                    x={width - 4}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="var(--color-text-muted)"
                  >
                    {formatMoney(tick, currency)}
                  </text>
                )
              })}

              <rect
                x={padding.left}
                y={padding.top}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const localX = event.clientX - rect.left
                  const ratio = Math.max(0, Math.min(1, localX / innerWidth))
                  setHoverIndex(Math.round(ratio * Math.max(0, points.length - 1)))
                }}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </svg>

            {hoverPoint ? (
              <div className={styles.chartTooltip} style={{ left: tooltipLeft, top: tooltipTop }}>
                <div className={styles.chartTooltipPrice}>{formatPrice(hoverPoint.close, currency)}</div>
                <div className={cn(styles.chartTooltipDelta, directionToneClass(hoverDeltaPct))}>
                  {formatCompactPercent(hoverDeltaPct)}
                  <span className={styles.chartTooltipSubtle}> in range</span>
                </div>
                <div className={styles.chartTooltipSubtle}>{formatDate(hoverPoint.date)}</div>
              </div>
            ) : null}
          </div>
        )
      }}
    </ChartContainer>
  )
}

function SignalTable({
  title,
  rows,
}: {
  title: string
  rows: TechnicalIndicatorRow[]
}) {
  return (
    <div className={styles.signalTableCard}>
      <div className={styles.signalTableHeader}>
        <span className={styles.signalTableTitle}>{title}</span>
        <span style={{ textAlign: 'right' }}>Value</span>
        <span style={{ textAlign: 'right' }}>Action</span>
      </div>
      <div>
        {rows.map((row) => (
          <div key={row.name} className={styles.signalTableRow}>
            <div className={styles.signalTableName}>{row.name}</div>
            <div className={styles.signalTableValue}>{row.value}</div>
            <div className={cn(styles.signalTableAction, actionTone(row.action))}>{row.action}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegimeHistoryChart({
  signals,
}: {
  signals: OverviewRegimePoint[]
}) {
  const ordered = useMemo(
    () =>
      [...signals]
        .filter((row) => Boolean(row.signal_date))
        .sort((a, b) => Date.parse(a.signal_date) - Date.parse(b.signal_date)),
    [signals]
  )

  return (
    <ChartContainer className={styles.regimeChart} loadingText="Loading regime history...">
      {({ width, height }) => {
        if (ordered.length === 0) {
          return <div className={styles.emptyState}>Regime history is not available yet.</div>
        }

        const padding = { top: 12, right: 32, bottom: 24, left: 32 }
        const innerWidth = Math.max(1, width - padding.left - padding.right)
        const innerHeight = Math.max(1, height - padding.top - padding.bottom)
        const directionY = (direction: SignalDirection) => {
          if (direction === 'bullish') return padding.top + innerHeight * 0.2
          if (direction === 'bearish') return padding.top + innerHeight * 0.8
          return padding.top + innerHeight * 0.5
        }
        const points = ordered.map((point, index) => ({
          ...point,
          x: padding.left + (index / Math.max(1, ordered.length - 1)) * innerWidth,
          y: directionY(point.direction),
        }))

        const segments = points.reduce<Array<{ x1: number; x2: number; direction: SignalDirection }>>((acc, point, index) => {
          const next = points[index + 1]
          if (!next) return acc
          acc.push({ x1: point.x, x2: next.x, direction: point.direction })
          return acc
        }, [])

        const linePath = points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
          .join(' ')
        const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
          (value, index, array) => array.indexOf(value) === index
        )

        const fillForDirection = (direction: SignalDirection) => {
          if (direction === 'bullish') return 'rgba(22, 163, 74, 0.15)'
          if (direction === 'bearish') return 'rgba(220, 38, 38, 0.15)'
          return 'rgba(107, 114, 128, 0.1)'
        }

        return (
          <svg width={width} height={height} className="block">
            {segments.map((segment, index) => (
              <rect
                key={`${segment.x1}-${index}`}
                x={segment.x1}
                y={padding.top}
                width={Math.max(1, segment.x2 - segment.x1)}
                height={innerHeight}
                fill={fillForDirection(segment.direction)}
              />
            ))}
            <path d={linePath} fill="none" stroke="#6b7280" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((point, index) => (
              <circle
                key={`${point.signal_date}-${index}`}
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill={point.direction === 'bullish' ? '#16a34a' : point.direction === 'bearish' ? '#dc2626' : '#6b7280'}
              />
            ))}
            {xTicks.map((index) => {
              const point = points[index]
              if (!point) return null
              return (
                <text
                  key={`tick-${point.signal_date}`}
                  x={point.x}
                  y={height - 4}
                  textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                  fontSize="12"
                  fill="#6b7280"
                >
                  {formatDate(point.signal_date, { month: 'short', day: 'numeric' })}
                </text>
              )
            })}
          </svg>
        )
      }}
    </ChartContainer>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modalPanel}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>{title}</div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label={`Close ${title}`}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PeerWebContent({
  ticker,
  displayName,
  relationship126Promise,
  relationship252Promise,
}: {
  ticker: string
  displayName: string
  relationship126Promise: Promise<TickerRelationships>
  relationship252Promise: Promise<TickerRelationships>
}) {
  const relationship126 = use(relationship126Promise)
  const relationship252 = use(relationship252Promise)

  return (
    <RelationshipOrbit
      centerTicker={ticker}
      centerName={displayName}
      relationshipsByWindow={{
        126: relationship126,
        252: relationship252,
      }}
    />
  )
}

function RelatedAssetsContent({
  relatedAssetsPromise,
}: {
  relatedAssetsPromise: Promise<OverviewRelatedAsset[]>
}) {
  const relatedAssets = use(relatedAssetsPromise)
  if (relatedAssets.length === 0) {
    return <div className={styles.emptyState}>No related assets are available right now.</div>
  }
  return (
    <div className={styles.relatedAssets}>
      {relatedAssets.map((asset) => (
        <Link key={asset.symbol} href={`/stocks/${asset.symbol}`} className={styles.relatedChip}>
          <span className={styles.chipTicker}>{asset.symbol}</span>
          <span>{formatPrice(asset.price, 'USD')}</span>
          <span className={directionToneClass(asset.changePercent)}>{formatCompactPercent(asset.changePercent)}</span>
        </Link>
      ))}
    </div>
  )
}

export default function StockOverviewClient({
  ticker,
  currency,
  displayName,
  assetBadgeLabel,
  price,
  dailyMoveAmount,
  dailyMovePercent,
  latestSignal,
  historicalData,
  ohlcData,
  keyStats,
  relationship126: relationship126Promise,
  relationship252: relationship252Promise,
  fundDetails,
  relatedAssets: relatedAssetsPromise,
  regimeSignals,
  scorecard,
  watchlistSlot,
  showCopilot,
  copilot,
}: StockOverviewClientProps) {
  const [heroTimeframe, setHeroTimeframe] = useState<ChartTimeframe>('1Y')
  const [signalTimeframe, setSignalTimeframe] = useState<TechnicalTimeframe>('1D')
  const [isChartModalOpen, setChartModalOpen] = useState(false)
  const [isIndicatorsModalOpen, setIndicatorsModalOpen] = useState(false)
  const scorecardMessage = scorecardReadinessMessage(scorecard)
  const scorecardStateClass = styles[`scorecardState_${scorecardReadinessTone(scorecard.readiness)}`]

  const filteredChartData = useMemo(() => filterChartData(historicalData, heroTimeframe), [historicalData, heroTimeframe])
  const technicalSummary = useMemo(
    () => buildTechnicalSummary(ohlcData, signalTimeframe),
    [ohlcData, signalTimeframe]
  )

  const regimeClass =
    regimeTone(latestSignal?.direction ?? null) === 'bullish'
      ? styles.regimeBullish
      : regimeTone(latestSignal?.direction ?? null) === 'bearish'
        ? styles.regimeBearish
        : styles.regimeNeutral

  return (
    <div className={styles.page}>
      <section className={styles.heroZone}>
        <div className={styles.heroHeader}>
          <div className={styles.heroIdentity}>
            <h1 className={styles.name}>{displayName}</h1>
            <span className={styles.tickerBadge}>{ticker}</span>
            <span className={styles.exchangeBadge}>{assetBadgeLabel}</span>
          </div>
          <div className={styles.heroBadgeRow}>
            <span className={cn(styles.regimeBadge, regimeClass)}>{regimeCopy(latestSignal?.direction ?? null)}</span>
            {latestSignal?.signalDate ? (
              <span className={styles.signalDateBadge}>Signal: {formatDate(latestSignal.signalDate, { month: 'short', day: 'numeric' })}</span>
            ) : null}
            {watchlistSlot}
          </div>
        </div>

        <div className={styles.priceBlock}>
          <div className={styles.price}>{formatPrice(price, currency)}</div>
          <div className={cn(styles.delta, directionToneClass(dailyMoveAmount))}>
            {formatSignedDelta(dailyMoveAmount, currency)} ({formatCompactPercent(dailyMovePercent)})
          </div>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.heroChartColumn}>
            <div className={styles.chartToolbar}>
              <SegmentedControl
                options={HERO_TIMEFRAMES}
                value={heroTimeframe}
                onChange={setHeroTimeframe}
                ariaLabel="Chart timeframe"
              />
              <button type="button" className={styles.chartExpandButton} onClick={() => setChartModalOpen(true)} aria-label="Expand chart">
                ⤢
              </button>
            </div>
            <div className={styles.heroChartWrap}>
              <HeroPriceChart data={filteredChartData} currency={currency} />
            </div>
          </div>

          <aside className={styles.heroSidebar}>
            {scorecardMessage ? (
              <div className={cn(styles.heroScorecardState, scorecardStateClass)}>
                {scorecardMessage}
              </div>
            ) : (
              <div className={styles.scorecardCard}>
                <div className={styles.scorecardTop}>
                  <GradeRing grade={scorecard.overall.grade || '–'} score={scorecard.overall.score} />
                  <div className={styles.scorecardMeta}>
                    <span className={styles.scorecardGrade}>Grade {scorecard.overall.grade}</span>
                    <span className={styles.scorecardScore}>
                      Score {scorecard.overall.score ?? '—'} · {scorecard.overall.label}
                    </span>
                  </div>
                </div>
                <div className={styles.scorecardAxes}>
                  {scorecard.axes.map((axis) => (
                    <div key={axis.key} className={styles.scorecardAxis}>
                      <span className={styles.scorecardAxisLabel}>{axis.label}</span>
                      <span className={styles.scorecardAxisValue}>
                        {axis.available && axis.score !== null ? axis.score : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.scorecardPopover} aria-hidden="true">
                  <ScorecardDisc scorecard={scorecard} compact size={230} />
                  <div className={styles.popoverAxes}>
                    {scorecard.axes.map((axis, index) => {
                      const available = axis.available && axis.score !== null
                      const fillStyle = {
                        '--axis-fill': `${available ? Math.max(0, Math.min(100, axis.score ?? 0)) : 0}%`,
                        '--axis-delay': `${120 + index * 70}ms`,
                        '--axis-color': available ? scoreColor(axis.score ?? 0) : 'var(--color-neutral)',
                      } as CSSProperties
                      return (
                        <div key={axis.key} className={styles.popoverAxisRow} style={fillStyle}>
                          <span className={styles.popoverAxisLabel}>{axis.label}</span>
                          <span className={styles.popoverAxisTrack}>
                            <span className={styles.popoverAxisFill} />
                          </span>
                          <span className={styles.popoverAxisValue}>{available ? axis.score : '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className={styles.keyStatsGrid}>
              {keyStats.map((stat) => (
                <div key={stat.label} className={styles.keyStatCell}>
                  <span className={styles.keyStatLabel}>{stat.label}</span>
                  <span className={styles.keyStatValue}>{stat.value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.zone3Grid}>
        <article className={cn(styles.zone, styles.dashboardCard, styles.spanWide)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Regime history</div>
              <div className={styles.cardHint}>Visible state changes over time</div>
            </div>
          </div>
          <RegimeHistoryChart signals={regimeSignals} />
        </article>

        <article className={cn(styles.openPanel, styles.spanNarrow)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Technical signals</div>
            </div>
            <SegmentedControl
              options={SIGNAL_TIMEFRAMES}
              value={signalTimeframe}
              onChange={setSignalTimeframe}
              ariaLabel="Technical signals timeframe"
            />
          </div>
          <div className={styles.gaugeStack}>
            <Gauge
              title="Summary"
              position={technicalSummary.gauges.summary.position}
              verdict={technicalSummary.gauges.summary.verdict}
              verdictAction={technicalSummary.gauges.summary.verdictAction}
              counts={technicalSummary.gauges.summary.counts}
            />
            <Gauge
              title="Oscillators"
              position={technicalSummary.gauges.oscillators.position}
              verdict={technicalSummary.gauges.oscillators.verdict}
              verdictAction={technicalSummary.gauges.oscillators.verdictAction}
              counts={technicalSummary.gauges.oscillators.counts}
            />
            <Gauge
              title="Moving Averages"
              position={technicalSummary.gauges.movingAverages.position}
              verdict={technicalSummary.gauges.movingAverages.verdict}
              verdictAction={technicalSummary.gauges.movingAverages.verdictAction}
              counts={technicalSummary.gauges.movingAverages.counts}
            />
          </div>
          <button type="button" className="btn-glass mt-3" onClick={() => setIndicatorsModalOpen(true)}>
            Indicator details →
          </button>
        </article>

        <article className={cn(styles.zone, styles.dashboardCard, styles.fullWidth)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Peer web</div>
              <div className={styles.cardHint}>Multi-layer relationship map with residual links first</div>
            </div>
          </div>
          <Suspense fallback={<div className={styles.emptyState}>Loading relationship map…</div>}>
            <PeerWebContent
              ticker={ticker}
              displayName={displayName}
              relationship126Promise={relationship126Promise}
              relationship252Promise={relationship252Promise}
            />
          </Suspense>
        </article>

        <article className={cn(styles.zone, styles.dashboardCard)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Fund details</div>
              <div className={styles.cardHint}>Canonical backend fundamentals</div>
            </div>
          </div>
          {fundDetails.length === 0 ? (
            <div className={styles.emptyState}>No additional fund detail rows are available for this asset.</div>
          ) : (
            <div className={styles.fundDetails}>
              {fundDetails.map((row) => (
                <div key={row.label} className={styles.fundDetailRow}>
                  <div className={styles.fundDetailLabel}>{row.label}</div>
                  <div className={styles.fundDetailValue}>{row.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.actionsRow}>
            <Link href={`/stocks/${ticker}/financials/fund-profile`} className={styles.actionLink}>
              Financial data
            </Link>
            <Link href={`/stocks/${ticker}/holdings-dividends`} className={styles.actionLink}>
              Holdings / dividends
            </Link>
            <Link href={`/stocks/${ticker}/signal-history`} className={styles.actionLink}>
              Full signal history
            </Link>
          </div>
        </article>

        <article className={cn(styles.zone, styles.dashboardCard)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Related assets</div>
              <div className={styles.cardHint}>Compact peer shortcuts</div>
            </div>
          </div>
          <Suspense fallback={<div className={styles.emptyState}>Loading related assets…</div>}>
            <RelatedAssetsContent relatedAssetsPromise={relatedAssetsPromise} />
          </Suspense>
        </article>

        {showCopilot ? (
          <article className={cn(styles.zone, styles.dashboardCard, styles.fullWidth)}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Research copilot</div>
                <div className={styles.cardHint}>Prompt-driven AI follow-up</div>
              </div>
            </div>
            <AiAnalystPanel
              ticker={ticker}
              signal={{
                direction: latestSignal?.direction ?? 'neutral',
                conviction: latestSignal?.conviction ?? null,
                predictionHorizon: latestSignal?.horizon ?? null,
                signalDate: latestSignal?.signalDate ?? new Date().toISOString(),
              }}
              news={[]}
              isPro={copilot.isPro}
              providerEnabled={copilot.providerEnabled}
              upgradeHref={copilot.upgradeHref}
              initialQuestion={copilot.initialQuestion}
              initialPromptLabel={copilot.initialPromptLabel}
              compact
            />
          </article>
        ) : null}
      </section>

      {isChartModalOpen ? (
        <Modal title="Expanded Price Chart" onClose={() => setChartModalOpen(false)}>
          <HeroPriceChart data={filteredChartData} className={styles.expandedChart} currency={currency} />
        </Modal>
      ) : null}

      {isIndicatorsModalOpen ? (
        <Modal title={`Indicator details · ${signalTimeframe}`} onClose={() => setIndicatorsModalOpen(false)}>
          <div className={styles.indicatorModalGrid}>
            <SignalTable title="Oscillators" rows={technicalSummary.oscillatorRows} />
            <SignalTable title="Moving Averages" rows={technicalSummary.movingAverageRows} />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
