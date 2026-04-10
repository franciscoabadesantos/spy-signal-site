'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SystemProfileBlob, { type SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'
import ChartContainer, {
  CHART_MARGINS,
  type ChartPalette,
  ChartTooltipCard,
} from '@/components/charts/ChartContainer'

const PRICE_SERIES = [
  { t: 'Mar 3', price: 506.2 },
  { t: 'Mar 6', price: 508.7 },
  { t: 'Mar 10', price: 510.5 },
  { t: 'Mar 13', price: 509.1 },
  { t: 'Mar 17', price: 512.8 },
  { t: 'Mar 20', price: 514.4 },
  { t: 'Mar 24', price: 513.6 },
  { t: 'Mar 27', price: 516.3 },
  { t: 'Mar 31', price: 517.9 },
  { t: 'Apr 3', price: 519.4 },
  { t: 'Apr 7', price: 521.2 },
] as const

const PRICE_REGIME_ZONES = [
  { x1: 'Mar 3', x2: 'Mar 10', direction: 'neutral' },
  { x1: 'Mar 10', x2: 'Mar 20', direction: 'bullish' },
  { x1: 'Mar 20', x2: 'Mar 24', direction: 'neutral' },
  { x1: 'Mar 24', x2: 'Apr 7', direction: 'bullish' },
] as const

const PRICE_FLIP_MARKERS = [
  { t: 'Mar 10', price: 510.5, direction: 'bullish' },
  { t: 'Mar 20', price: 514.4, direction: 'neutral' },
  { t: 'Mar 24', price: 513.6, direction: 'bullish' },
] as const

const BACKTEST_SERIES = [
  { t: 'W1', equity: 100 },
  { t: 'W2', equity: 101.4 },
  { t: 'W3', equity: 102.1 },
  { t: 'W4', equity: 101.8 },
  { t: 'W5', equity: 103.3 },
  { t: 'W6', equity: 104.1 },
  { t: 'W7', equity: 104.9 },
  { t: 'W8', equity: 106.2 },
  { t: 'W9', equity: 107.4 },
  { t: 'W10', equity: 108.6 },
] as const

const BENCHMARK_SERIES = [
  { t: 'W1', benchmark: 100 },
  { t: 'W2', benchmark: 100.6 },
  { t: 'W3', benchmark: 101.2 },
  { t: 'W4', benchmark: 100.9 },
  { t: 'W5', benchmark: 101.7 },
  { t: 'W6', benchmark: 102.4 },
  { t: 'W7', benchmark: 103.1 },
  { t: 'W8', benchmark: 103.8 },
  { t: 'W9', benchmark: 104.5 },
  { t: 'W10', benchmark: 105.0 },
] as const

const PREVIEW_SCORE_DIMENSIONS: SystemProfileBlobDimension[] = [
  { label: 'Trend', score: 74 },
  { label: 'Momentum', score: 69 },
  { label: 'Risk', score: 58 },
  { label: 'Yield', score: 44 },
  { label: 'Stability', score: 72 },
]

type TooltipPoint = {
  t: string
  price?: number
  equity?: number
  benchmark?: number
}

type PreviewTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: TooltipPoint
  }>
}

function regimeBandColor(direction: 'bullish' | 'neutral' | 'bearish'): string {
  if (direction === 'bullish') return 'rgba(22,163,74,0.07)'
  if (direction === 'bearish') return 'rgba(239,68,68,0.07)'
  return 'rgba(100,116,139,0.06)'
}

function regimeAccent(direction: 'bullish' | 'neutral' | 'bearish', palette: ChartPalette): string {
  if (direction === 'bullish') return palette.bullish
  if (direction === 'bearish') return palette.bearish
  return palette.signalNeutral
}

function renderLastPointDot(color: string, lastIndex: number, centerFill: string) {
  return function LastPointDot(props: { cx?: number; cy?: number; index?: number; payload?: TooltipPoint }) {
    const { cx, cy, index } = props
    if (typeof cx !== 'number' || typeof cy !== 'number') return null

    if (index !== lastIndex) return null

    return (
      <g>
        <circle cx={cx} cy={cy} r={6.5} fill={color} opacity={0.14} />
        <circle cx={cx} cy={cy} r={3.8} fill={centerFill} stroke={color} strokeWidth={2} />
      </g>
    )
  }
}

function PriceTooltip({ active, payload, palette }: PreviewTooltipProps & { palette: ChartPalette }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point || typeof point.price !== 'number') return null

  return (
    <ChartTooltipCard
      title={point.t}
      rows={[
        {
          label: 'Price',
          value: `$${point.price.toFixed(2)}`,
          swatchColor: palette.primary,
        },
      ]}
    />
  )
}

function BacktestTooltip({ active, payload, palette }: PreviewTooltipProps & { palette: ChartPalette }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point || typeof point.equity !== 'number') return null

  const spread =
    typeof point.benchmark === 'number' ? point.equity - point.benchmark : null

  return (
    <ChartTooltipCard
      title={point.t}
      rows={[
        {
          label: 'Strategy',
          value: point.equity.toFixed(1),
          swatchColor: palette.secondary,
        },
        ...(typeof point.benchmark === 'number'
          ? [
              {
                label: 'Baseline',
                value: point.benchmark.toFixed(1),
                swatchColor: palette.neutral,
              },
            ]
          : []),
        ...(spread !== null
          ? [
              {
                label: 'Spread',
                value: `${spread >= 0 ? '+' : ''}${spread.toFixed(1)}`,
              },
            ]
          : []),
      ]}
    />
  )
}

export default function HeroProductPreview() {
  const latest = PRICE_SERIES[PRICE_SERIES.length - 1]
  const first = PRICE_SERIES[0]
  const move = latest && first ? latest.price - first.price : 0
  const movePct = latest && first ? (move / first.price) * 100 : 0
  const lastFlip = PRICE_FLIP_MARKERS[PRICE_FLIP_MARKERS.length - 1]
  const lastFlipIndex = PRICE_SERIES.findIndex((point) => point.t === lastFlip?.t)
  const sessionsHeld =
    lastFlipIndex >= 0 ? Math.max(1, PRICE_SERIES.length - lastFlipIndex) : PRICE_SERIES.length
  const flipBaseline = lastFlip?.price ?? first?.price ?? 1
  const regimeMovePct = latest && flipBaseline > 0 ? ((latest.price - flipBaseline) / flipBaseline) * 100 : 0
  const priceConfirmationLabel = regimeMovePct >= 0 ? 'Price confirming' : 'Price diverging'
  const previewScore = Math.round(
    PREVIEW_SCORE_DIMENSIONS.reduce((sum, dimension) => sum + dimension.score, 0) /
      PREVIEW_SCORE_DIMENSIONS.length
  )
  const comparisonSeries = BACKTEST_SERIES.map((point, index) => ({
    ...point,
    benchmark: BENCHMARK_SERIES[index]?.benchmark ?? point.equity,
  }))
  const strategyStart = comparisonSeries[0]?.equity ?? 100
  const strategyEnd = comparisonSeries[comparisonSeries.length - 1]?.equity ?? strategyStart
  const benchmarkStart = comparisonSeries[0]?.benchmark ?? 100
  const benchmarkEnd = comparisonSeries[comparisonSeries.length - 1]?.benchmark ?? benchmarkStart
  const strategyReturn = strategyStart > 0 ? ((strategyEnd - strategyStart) / strategyStart) * 100 : 0
  const benchmarkReturn = benchmarkStart > 0 ? ((benchmarkEnd - benchmarkStart) / benchmarkStart) * 100 : 0
  const returnSpread = strategyReturn - benchmarkReturn

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="space-y-5 border-primary/25 bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_64%)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-filter-label">System Workspace</div>
            <div className="mt-1 text-card-title text-neutral-900 dark:text-neutral-100">SPY system validation surface</div>
            <p className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-300">
              Bullish regime has held for {sessionsHeld} sessions; {priceConfirmationLabel.toLowerCase()}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Bullish</Badge>
            <Badge variant="neutral">{sessionsHeld}s Stable</Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-elevated p-3">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div className="text-sm font-semibold text-content-primary">${latest?.price.toFixed(2)}</div>
            <div className={move >= 0 ? 'text-xs font-semibold text-emerald-600' : 'text-xs font-semibold text-rose-600'}>
              {move >= 0 ? '+' : ''}{move.toFixed(2)} ({movePct >= 0 ? '+' : ''}{movePct.toFixed(2)}%)
            </div>
          </div>
          <ChartContainer className="h-[140px]">
            {({ width, height, palette: chartPalette }) => (
              <AreaChart width={width} height={height} data={PRICE_SERIES} margin={CHART_MARGINS.standard}>
                  <defs>
                    <linearGradient id="heroPriceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartPalette.primary} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={chartPalette.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {PRICE_REGIME_ZONES.map((zone) => (
                    <ReferenceArea
                      key={`${zone.x1}-${zone.x2}-${zone.direction}`}
                      x1={zone.x1}
                      x2={zone.x2}
                      fill={regimeBandColor(zone.direction)}
                      ifOverflow="extendDomain"
                      strokeOpacity={0}
                    />
                  ))}
                  <ReferenceArea
                    x1={PRICE_SERIES[Math.max(0, PRICE_SERIES.length - 2)]?.t}
                    x2={latest?.t}
                    fill={chartPalette.regimeNeutral}
                    ifOverflow="extendDomain"
                    strokeOpacity={0}
                  />
                  <CartesianGrid strokeDasharray="2 6" stroke={chartPalette.grid} vertical={false} />
                  <XAxis
                    dataKey="t"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartPalette.textMuted }}
                    minTickGap={18}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartPalette.textMuted }}
                    width={36}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                  />
                  <Tooltip content={<PriceTooltip palette={chartPalette} />} cursor={{ stroke: chartPalette.primary, strokeOpacity: 0.25 }} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={chartPalette.primary}
                    strokeOpacity={0.2}
                    strokeWidth={7}
                    dot={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartPalette.primary}
                    strokeWidth={2.6}
                    fill="url(#heroPriceFill)"
                    dot={renderLastPointDot(chartPalette.primary, PRICE_SERIES.length - 1, chartPalette.tooltipBg)}
                    activeDot={{
                      r: 5,
                      fill: chartPalette.tooltipBg,
                      stroke: chartPalette.primary,
                      strokeWidth: 2.2,
                    }}
                  />
                  {PRICE_FLIP_MARKERS.map((marker) => (
                    <ReferenceDot
                      key={`flip-${marker.t}`}
                      x={marker.t}
                      y={marker.price}
                      r={4.2}
                      fill={regimeAccent(marker.direction, chartPalette)}
                      stroke={chartPalette.tooltipBg}
                      strokeWidth={1.8}
                    />
                  ))}
              </AreaChart>
            )}
          </ChartContainer>
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
            <div className="text-filter-label">Conviction</div>
            <div className="mt-1 font-semibold text-content-primary">78%</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
            <div className="text-filter-label">Horizon</div>
            <div className="mt-1 font-semibold text-content-primary">20d</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
            <div className="text-filter-label">Flips</div>
            <div className="mt-1 font-semibold text-content-primary">3 / month</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
            <div className="text-filter-label">Confirmation</div>
            <div className={`mt-1 font-semibold ${regimeMovePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {regimeMovePct >= 0 ? '+' : ''}{regimeMovePct.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-elevated p-3">
          <div className="text-filter-label">System Profile</div>
          <div className="mt-2 grid grid-cols-[132px_1fr] items-center gap-3">
            <SystemProfileBlob compact dimensions={PREVIEW_SCORE_DIMENSIONS} />
            <div>
              <div className="text-xl font-semibold leading-none text-content-primary">
                {previewScore} / 100
              </div>
              <div className="mt-1 text-[12px] font-medium text-content-secondary">
                Constructive profile
              </div>
              <p className="mt-1 text-[12px] text-content-muted">
                Trend and stability support the current stance while risk remains moderate.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border-neutral-200/80 bg-[radial-gradient(circle_at_top_left,var(--bullish-tint),transparent_70%)]" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-filter-label">Validation Snapshot</div>
            <div className="text-card-title text-content-primary">Strategy vs baseline</div>
          </div>
          <span className="text-xs font-semibold text-emerald-600">
            {returnSpread >= 0 ? '+' : ''}{returnSpread.toFixed(2)}% edge
          </span>
        </div>

        <ChartContainer className="h-[96px]">
          {({ width, height, palette: chartPalette }) => (
            <AreaChart width={width} height={height} data={comparisonSeries} margin={CHART_MARGINS.standard}>
                <defs>
                  <linearGradient id="heroBacktestFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPalette.secondary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={chartPalette.secondary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke={chartPalette.grid} vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis hide domain={['dataMin - 0.8', 'dataMax + 0.8']} />
                <Tooltip content={<BacktestTooltip palette={chartPalette} />} cursor={{ stroke: chartPalette.secondary, strokeOpacity: 0.25 }} />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke={chartPalette.neutral}
                  strokeOpacity={0.7}
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  dot={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="none"
                  fill="url(#heroBacktestFill)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={chartPalette.secondary}
                  strokeOpacity={0.2}
                  strokeWidth={6}
                  dot={false}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={chartPalette.secondary}
                  strokeWidth={2.5}
                  dot={renderLastPointDot(chartPalette.secondary, comparisonSeries.length - 1, chartPalette.tooltipBg)}
                  activeDot={{
                    r: 4.5,
                    fill: chartPalette.tooltipBg,
                    stroke: chartPalette.secondary,
                    strokeWidth: 2,
                  }}
                />
            </AreaChart>
          )}
        </ChartContainer>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-filter-label">Sharpe</div>
            <div className="mt-1 font-semibold text-content-primary">1.24</div>
          </div>
          <div>
            <div className="text-filter-label">Validation Win</div>
            <div className="mt-1 font-semibold text-content-primary">62%</div>
          </div>
          <div>
            <div className="text-filter-label">Max DD</div>
            <div className="mt-1 font-semibold text-rose-600">-5.1%</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
