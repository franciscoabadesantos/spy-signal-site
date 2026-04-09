'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SystemProfileChart, { type SystemProfileDimension } from '@/components/page/SystemProfileChart'
import ChartContainer, {
  CHART_MARGINS,
  CHART_PALETTE,
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

const PREVIEW_SCORE_DIMENSIONS: SystemProfileDimension[] = [
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
}

type PreviewTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: TooltipPoint
  }>
}

const SOFT_GRID = 'rgba(100, 116, 139, 0.10)'

function renderLastPointDot(color: string, lastIndex: number) {
  return function LastPointDot(props: { cx?: number; cy?: number; index?: number; payload?: TooltipPoint }) {
    const { cx, cy, index } = props
    if (typeof cx !== 'number' || typeof cy !== 'number') return null

    if (index !== lastIndex) return null

    return (
      <g>
        <circle cx={cx} cy={cy} r={6.5} fill={color} opacity={0.14} />
        <circle cx={cx} cy={cy} r={3.8} fill="#ffffff" stroke={color} strokeWidth={2} />
      </g>
    )
  }
}

function PriceTooltip({ active, payload }: PreviewTooltipProps) {
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
          swatchColor: CHART_PALETTE.primary,
        },
      ]}
    />
  )
}

function BacktestTooltip({ active, payload }: PreviewTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point || typeof point.equity !== 'number') return null

  return (
    <ChartTooltipCard
      title={point.t}
      rows={[
        {
          label: 'Equity Index',
          value: point.equity.toFixed(1),
          swatchColor: CHART_PALETTE.secondary,
        },
      ]}
    />
  )
}

export default function HeroProductPreview() {
  const latest = PRICE_SERIES[PRICE_SERIES.length - 1]
  const first = PRICE_SERIES[0]
  const move = latest && first ? latest.price - first.price : 0
  const movePct = latest && first ? (move / first.price) * 100 : 0

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="section-gap bg-[radial-gradient(circle_at_top_right,#eff6ff,transparent_65%)] dark:bg-[radial-gradient(circle_at_top_right,#0b1220,transparent_65%)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-filter-label">Live Preview</div>
            <div className="mt-1 text-card-title text-neutral-900 dark:text-neutral-100">SPY model research snapshot</div>
          </div>
          <Badge variant="success">Bullish</Badge>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-end justify-between">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">${latest?.price.toFixed(2)}</div>
            <div className={move >= 0 ? 'text-xs font-semibold text-emerald-600' : 'text-xs font-semibold text-rose-600'}>
              {move >= 0 ? '+' : ''}{move.toFixed(2)} ({movePct >= 0 ? '+' : ''}{movePct.toFixed(2)}%)
            </div>
          </div>
          <ChartContainer className="h-[140px]">
            {() => (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
                <AreaChart data={PRICE_SERIES} margin={CHART_MARGINS.standard}>
                  <defs>
                    <linearGradient id="heroPriceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PALETTE.primary} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={CHART_PALETTE.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke={SOFT_GRID} vertical={false} />
                  <XAxis
                    dataKey="t"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_PALETTE.textMuted }}
                    minTickGap={18}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_PALETTE.textMuted }}
                    width={36}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                  />
                  <Tooltip content={<PriceTooltip />} cursor={{ stroke: CHART_PALETTE.primary, strokeOpacity: 0.25 }} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={CHART_PALETTE.primary}
                    strokeOpacity={0.2}
                    strokeWidth={7}
                    dot={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={CHART_PALETTE.primary}
                    strokeWidth={2.6}
                    fill="url(#heroPriceFill)"
                    dot={renderLastPointDot(CHART_PALETTE.primary, PRICE_SERIES.length - 1)}
                    activeDot={{
                      r: 5,
                      fill: '#ffffff',
                      stroke: CHART_PALETTE.primary,
                      strokeWidth: 2.2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <div className="text-filter-label">Conviction</div>
            <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">78%</div>
          </div>
          <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <div className="text-filter-label">Horizon</div>
            <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">20d</div>
          </div>
          <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <div className="text-filter-label">Regime</div>
            <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">Risk-On</div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 text-filter-label">System Profile</div>
          <SystemProfileChart
            compact
            dimensions={PREVIEW_SCORE_DIMENSIONS}
            baselineScores={[58, 56, 52, 48, 60]}
          />
        </div>
      </Card>

      <Card className="section-gap" padding="lg">
        <div className="flex items-center justify-between">
          <div className="text-card-title text-neutral-900 dark:text-neutral-100">Mini Backtest</div>
          <span className="text-xs font-semibold text-emerald-600">+8.6% (10w)</span>
        </div>

        <ChartContainer className="h-[96px]">
          {() => (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={84}>
              <AreaChart data={BACKTEST_SERIES} margin={CHART_MARGINS.standard}>
                <defs>
                  <linearGradient id="heroBacktestFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.secondary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_PALETTE.secondary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke={SOFT_GRID} vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis hide domain={['dataMin - 0.8', 'dataMax + 0.8']} />
                <Tooltip content={<BacktestTooltip />} cursor={{ stroke: CHART_PALETTE.secondary, strokeOpacity: 0.25 }} />
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
                  stroke={CHART_PALETTE.secondary}
                  strokeOpacity={0.2}
                  strokeWidth={6}
                  dot={false}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={CHART_PALETTE.secondary}
                  strokeWidth={2.5}
                  dot={renderLastPointDot(CHART_PALETTE.secondary, BACKTEST_SERIES.length - 1)}
                  activeDot={{
                    r: 4.5,
                    fill: '#ffffff',
                    stroke: CHART_PALETTE.secondary,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-filter-label">Sharpe</div>
            <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">1.24</div>
          </div>
          <div>
            <div className="text-filter-label">Win Rate</div>
            <div className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">62%</div>
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
