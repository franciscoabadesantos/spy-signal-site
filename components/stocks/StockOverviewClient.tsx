'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import AiAnalystPanel from '@/components/AiAnalystPanel'
import CorrelationNetwork from '@/components/CorrelationNetwork'
import SystemProfileBlob, { type SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'
import ChartContainer from '@/components/charts/ChartContainer'
import type { PricePoint } from '@/lib/finance'
import type { SignalOrbitTelemetry } from '@/lib/signalOrbit'
import {
  buildTechnicalSummary,
  type TechnicalAction,
  type TechnicalIndicatorRow,
  type TechnicalTimeframe,
} from '@/lib/technicalSignals'
import { cn } from '@/lib/utils'
import styles from './StockOverviewClient.module.css'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'
type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | 'YTD' | '1Y' | '5Y'

type OverviewStat = {
  label: string
  value: string
}

type OverviewPeer = {
  ticker: string
  name: string | null
  correlation: number
  absCorrelation: number
  sector: string | null
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

type OrbitTooltipState = {
  x: number
  y: number
}

type StockOverviewClientProps = {
  ticker: string
  displayName: string
  assetBadgeLabel: string
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  latestSignal: OverviewSignal | null
  historicalData: PricePoint[]
  statStrip: OverviewStat[]
  peers: OverviewPeer[]
  fundDetails: OverviewFundDetail[]
  relatedAssets: OverviewRelatedAsset[]
  regimeSignals: OverviewRegimePoint[]
  orbitDimensions: SystemProfileBlobDimension[]
  orbitTelemetry: SignalOrbitTelemetry
  marketCap: number | null
  marketCapLabel: string | null
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
const SIGNAL_TIMEFRAMES: TechnicalTimeframe[] = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1D', '1W', '1M']

function formatPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `$${value.toFixed(2)}`
}

function formatSignedDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`
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

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle)
  const end = polarToCartesian(centerX, centerY, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function correlationDirection(value: number): string {
  if (value >= 0) return 'Positive'
  return 'Negative'
}

function correlationStrength(value: number): string {
  const magnitude = Math.abs(value)
  if (magnitude >= 0.75) return 'Strong'
  if (magnitude >= 0.5) return 'Moderate'
  return 'Weak'
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
  const angle = 180 - (clamped / 100) * 180
  const radians = (angle * Math.PI) / 180
  const centerX = 80
  const centerY = 90
  const radius = 60
  const needleX = centerX + Math.cos(radians) * (radius - 6)
  const needleY = centerY - Math.sin(radians) * (radius - 6)

  return (
    <div className={styles.gaugePanel}>
      <svg viewBox="0 0 160 110" className={styles.gaugeSvg} aria-hidden="true">
        <path d={describeArc(80, 90, 60, 180, 120)} fill="none" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
        <path d={describeArc(80, 90, 60, 120, 60)} fill="none" stroke="#6b7280" strokeWidth="8" strokeLinecap="round" />
        <path d={describeArc(80, 90, 60, 60, 0)} fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
        <line x1={centerX} y1={centerY} x2={needleX} y2={needleY} stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        <circle cx={centerX} cy={centerY} r="4.5" fill="#111827" />
      </svg>
      <div className={styles.gaugeLabel}>{title}</div>
      <div className={cn(styles.gaugeVerdict, actionTone(verdictAction))}>{verdict}</div>
      <div className={styles.gaugeCounts}>
        <span>
          Sell <span className={styles.gaugeCountValue}>{counts.sell}</span>
        </span>
        <span>
          Neutral <span className={styles.gaugeCountValue}>{counts.neutral}</span>
        </span>
        <span>
          Buy <span className={styles.gaugeCountValue}>{counts.buy}</span>
        </span>
      </div>
    </div>
  )
}

function HeroPriceChart({
  data,
}: {
  data: PricePoint[]
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  return (
    <ChartContainer className={styles.heroChart} loadingText="Loading chart...">
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
        const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
          (value, index, array) => array.indexOf(value) === index
        )
        const yTicks = Array.from({ length: 5 }, (_, index) => floor + ((ceiling - floor) / 4) * index)
        const hoverPoint = hoverIndex === null ? null : points[hoverIndex] ?? null
        const tooltipLeft = hoverPoint ? Math.min(width - 132, Math.max(8, hoverPoint.x - 52)) : 0

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
                    stroke="rgba(0,0,0,0.04)"
                    strokeWidth="1"
                  />
                )
              })}

              <path d={areaPath} fill="rgba(37, 99, 235, 0.06)" />
              <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />

              {hoverPoint ? (
                <>
                  <line
                    x1={hoverPoint.x}
                    y1={padding.top}
                    x2={hoverPoint.x}
                    y2={padding.top + innerHeight}
                    stroke="rgba(17,24,39,0.18)"
                    strokeDasharray="3 4"
                  />
                  <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                </>
              ) : null}

              {xTicks.map((index) => {
                const point = points[index]
                if (!point) return null
                return (
                  <text
                    key={point.date}
                    x={point.x}
                    y={height - 4}
                    textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {formatDate(point.date, { month: 'short', day: 'numeric' })}
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
                    fill="#6b7280"
                  >
                    ${tick.toFixed(0)}
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
              <div className={styles.chartTooltip} style={{ left: tooltipLeft, top: 10 }}>
                <div>{formatPrice(hoverPoint.close)}</div>
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

function OrbitPanel({
  dimensions,
  telemetry,
  marketCap,
  marketCapLabel,
}: {
  dimensions: SystemProfileBlobDimension[]
  telemetry: SignalOrbitTelemetry
  marketCap: number | null
  marketCapLabel: string | null
}) {
  const [tooltip, setTooltip] = useState<OrbitTooltipState | null>(null)

  return (
    <div
      className={styles.orbitWrap}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setTooltip({
          x: Math.min(rect.width - 172, Math.max(10, event.clientX - rect.left + 12)),
          y: Math.min(rect.height - 126, Math.max(10, event.clientY - rect.top + 12)),
        })
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      <SystemProfileBlob
        dimensions={dimensions}
        marketCap={marketCap}
        marketCapLabel={marketCapLabel}
        className={styles.orbitVisual}
      />

      {tooltip ? (
        <div className={styles.orbitTooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <div className={styles.orbitTooltipTitle}>Orbit inputs</div>
          <div className={styles.orbitTooltipRow}>
            <span>Momentum</span>
            <strong>{telemetry.momentum}</strong>
          </div>
          <div className={styles.orbitTooltipRow}>
            <span>Risk</span>
            <strong>{telemetry.risk}</strong>
          </div>
          <div className={styles.orbitTooltipRow}>
            <span>Conviction</span>
            <strong>{telemetry.conviction}</strong>
          </div>
          <div className={styles.orbitTooltipRow}>
            <span>Direction</span>
            <strong>{telemetry.direction}</strong>
          </div>
          <div className={styles.orbitTooltipRow}>
            <span>Trend age</span>
            <strong>{telemetry.trendAge}d</strong>
          </div>
        </div>
      ) : null}

      <div className={styles.orbitStats}>
        <div className={styles.orbitStat}>
          <span className={styles.orbitStatLabel}>Momentum</span>
          <span className={styles.orbitStatValue}>{telemetry.momentum}</span>
        </div>
        <div className={styles.orbitStat}>
          <span className={styles.orbitStatLabel}>Risk</span>
          <span className={styles.orbitStatValue}>{telemetry.risk}</span>
        </div>
        <div className={styles.orbitStat}>
          <span className={styles.orbitStatLabel}>Conviction</span>
          <span className={styles.orbitStatValue}>{telemetry.conviction}</span>
        </div>
        <div className={styles.orbitStat}>
          <span className={styles.orbitStatLabel}>Trend age</span>
          <span className={styles.orbitStatValue}>{telemetry.trendAge}d</span>
        </div>
      </div>
    </div>
  )
}

export default function StockOverviewClient({
  ticker,
  displayName,
  assetBadgeLabel,
  price,
  dailyMoveAmount,
  dailyMovePercent,
  latestSignal,
  historicalData,
  statStrip,
  peers,
  fundDetails,
  relatedAssets,
  regimeSignals,
  orbitDimensions,
  orbitTelemetry,
  marketCap,
  marketCapLabel,
  showCopilot,
  copilot,
}: StockOverviewClientProps) {
  const [heroTimeframe, setHeroTimeframe] = useState<ChartTimeframe>('1Y')
  const [signalTimeframe, setSignalTimeframe] = useState<TechnicalTimeframe>('1D')

  const filteredChartData = useMemo(() => filterChartData(historicalData, heroTimeframe), [historicalData, heroTimeframe])
  const technicalSummary = useMemo(
    () => buildTechnicalSummary(historicalData, signalTimeframe),
    [historicalData, signalTimeframe]
  )

  const regimeClass =
    regimeTone(latestSignal?.direction ?? null) === 'bullish'
      ? styles.regimeBullish
      : regimeTone(latestSignal?.direction ?? null) === 'bearish'
        ? styles.regimeBearish
        : styles.regimeNeutral

  return (
    <div className={styles.page}>
      <section className={cn(styles.zone, styles.heroZone)}>
        <div className={styles.heroHeader}>
          <div className={styles.heroIdentity}>
            <span className={styles.ticker}>{ticker}</span>
            <span className={styles.name}>{displayName}</span>
            <span className={styles.exchangeBadge}>{assetBadgeLabel}</span>
          </div>
        </div>

        <div className={styles.priceBlock}>
          <div className={styles.price}>{formatPrice(price)}</div>
          <div className={cn(styles.delta, directionToneClass(dailyMoveAmount))}>{formatSignedDelta(dailyMoveAmount)}</div>
          <div className={cn(styles.delta, directionToneClass(dailyMovePercent))}>({formatCompactPercent(dailyMovePercent)})</div>
          <span className={cn(styles.regimeBadge, regimeClass)}>{regimeCopy(latestSignal?.direction ?? null)}</span>
          {latestSignal?.signalDate ? (
            <span className={styles.signalDateBadge}>Signal: {formatDate(latestSignal.signalDate, { month: 'short', day: 'numeric' })}</span>
          ) : null}
        </div>

        <div className={styles.heroChartWrap}>
          <div className={styles.sectionTabsRow}>
            <div className={styles.tabStrip}>
              {HERO_TIMEFRAMES.map((timeframe) => (
                <button
                  key={timeframe}
                  type="button"
                  className={cn(styles.tabButton, heroTimeframe === timeframe ? styles.tabButtonActive : undefined)}
                  onClick={() => setHeroTimeframe(timeframe)}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          <HeroPriceChart data={filteredChartData} />
        </div>

        <div className={styles.statStrip}>
          {statStrip.map((stat) => (
            <div key={stat.label} className={styles.statCell}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={cn(styles.zone, styles.signalZone)}>
        <div className={styles.signalHeader}>
          <div className={styles.eyebrow}>Technical Signals · {signalTimeframe}</div>
          <div className={styles.tabStrip}>
            {SIGNAL_TIMEFRAMES.map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                className={cn(styles.tabButton, signalTimeframe === timeframe ? styles.tabButtonActive : undefined)}
                onClick={() => setSignalTimeframe(timeframe)}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.signalSplit}>
          <div className={styles.signalLeft}>
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
          <div className={styles.signalRight}>
            <SignalTable title="Oscillators" rows={technicalSummary.oscillatorRows} />
            <div className={styles.signalDivider} />
            <SignalTable title="Moving Averages" rows={technicalSummary.movingAverageRows} />
          </div>
        </div>
      </section>

      <section className={styles.zone3Grid}>
        <article className={cn(styles.zone, styles.dashboardCard)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Peer web</div>
              <div className={styles.cardHint}>Interactive correlation map with numeric scan below</div>
            </div>
          </div>
          <CorrelationNetwork centerTicker={ticker} centerName={displayName} peers={peers} />
          <div className={styles.peerTableWrap}>
            <table className={styles.peerTable}>
              <thead>
                <tr>
                  <th>Peer ticker</th>
                  <th>Name</th>
                  <th>Correlation</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((peer) => (
                  <tr key={peer.ticker}>
                    <td>
                      <Link href={`/stocks/${peer.ticker}`} className={styles.chipTicker}>
                        {peer.ticker}
                      </Link>
                    </td>
                    <td>{peer.name ?? 'Related asset'}</td>
                    <td>{peer.correlation.toFixed(2)} · {correlationStrength(peer.correlation)}</td>
                    <td>{correlationDirection(peer.correlation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={cn(styles.zone, styles.dashboardCard)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Orbital risk sphere</div>
              <div className={styles.cardHint}>Momentum, risk, conviction, direction, and trend age in one visual</div>
            </div>
          </div>
          <OrbitPanel
            dimensions={orbitDimensions}
            telemetry={orbitTelemetry}
            marketCap={marketCap}
            marketCapLabel={marketCapLabel}
          />
        </article>

        <article className={cn(styles.zone, styles.dashboardCard, styles.fullWidth)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Regime history</div>
              <div className={styles.cardHint}>Visible state changes over time</div>
            </div>
          </div>
          <RegimeHistoryChart signals={regimeSignals} />
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
          {relatedAssets.length === 0 ? (
            <div className={styles.emptyState}>No related assets are available right now.</div>
          ) : (
            <div className={styles.relatedAssets}>
              {relatedAssets.map((asset) => (
                <Link key={asset.symbol} href={`/stocks/${asset.symbol}`} className={styles.relatedChip}>
                  <span className={styles.chipTicker}>{asset.symbol}</span>
                  <span>{formatPrice(asset.price)}</span>
                  <span className={directionToneClass(asset.changePercent)}>{formatCompactPercent(asset.changePercent)}</span>
                </Link>
              ))}
            </div>
          )}
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
    </div>
  )
}
