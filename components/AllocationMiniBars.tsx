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
  type ChartPalette,
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

function resolveBarColor(tone: AllocationMiniBarsProps['tone'], palette: ChartPalette): string {
  if (tone === 'secondary') return palette.secondary
  return palette.primary
}

type AllocationTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: AllocationMiniBarDatum
    color?: string
  }>
  palette: ChartPalette
}

function AllocationTooltip({
  active,
  payload,
  palette,
}: AllocationTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as AllocationMiniBarDatum | undefined
  const swatchColor = typeof payload[0]?.color === 'string' ? payload[0].color : palette.primary
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
  return (
    <div className="rounded-2xl border border-border bg-surface-card p-3 shadow-sm">
      <div className="mb-2 text-[12px] font-semibold text-content-secondary">{title}</div>
      <ChartContainer className="h-[210px] w-full min-w-0">
        {({ palette }) => {
          const barColor = resolveBarColor(tone, palette)
          return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
            <BarChart data={data} layout="vertical" margin={CHART_MARGINS.standard}>
              <CartesianGrid strokeDasharray="2 6" stroke={palette.grid} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: palette.textMuted }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={78}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: palette.text }}
                interval={0}
              />
              <Tooltip content={<AllocationTooltip palette={palette} />} cursor={{ fill: 'rgba(37,99,235,0.08)' }} />
              <Bar dataKey="value" fill={barColor} radius={[6, 6, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        )}}
      </ChartContainer>
    </div>
  )
}
