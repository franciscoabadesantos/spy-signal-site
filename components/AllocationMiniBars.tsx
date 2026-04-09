'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartContainer, {
  CHART_MARGINS,
  CHART_PALETTE,
  ChartTooltipCard,
} from '@/components/charts/ChartContainer'

export type AllocationMiniBarDatum = {
  label: string
  value: number
}

type AllocationMiniBarsProps = {
  title: string
  data: AllocationMiniBarDatum[]
  tone?: 'primary' | 'secondary'
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function resolveBarColor(tone: AllocationMiniBarsProps['tone']): string {
  if (tone === 'secondary') return CHART_PALETTE.secondary
  return CHART_PALETTE.primary
}

type AllocationTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: AllocationMiniBarDatum
    color?: string
  }>
}

function AllocationTooltip({
  active,
  payload,
}: AllocationTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as AllocationMiniBarDatum | undefined
  const swatchColor = typeof payload[0]?.color === 'string' ? payload[0].color : CHART_PALETTE.primary
  if (!point) return null

  return (
    <ChartTooltipCard
      title={point.label}
      rows={[
        {
          label: 'Weight',
          value: formatPercent(point.value),
          swatchColor,
        },
      ]}
    />
  )
}

export default function AllocationMiniBars({
  title,
  data,
  tone = 'primary',
}: AllocationMiniBarsProps) {
  const barColor = resolveBarColor(tone)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-[12px] font-semibold text-gray-700 mb-2">{title}</div>
      <ChartContainer className="h-[210px] w-full min-w-0">
        {() => (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
            <BarChart data={data} layout="vertical" margin={CHART_MARGINS.standard}>
              <CartesianGrid strokeDasharray="2 6" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: CHART_PALETTE.textMuted }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={78}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: CHART_PALETTE.text }}
                interval={0}
              />
              <Tooltip content={<AllocationTooltip />} cursor={{ fill: 'rgba(37,99,235,0.08)' }} />
              <Bar dataKey="value" fill={barColor} radius={[6, 6, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  )
}
