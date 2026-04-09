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

export type FinancialChartDatum = {
  label: string
  value: number
  formatted: string
}

type FinancialStatementBarChartProps = {
  data: FinancialChartDatum[]
  valueSuffix: string
  decimals: number
}

function trimTrailingZeroes(value: string): string {
  if (!value.includes('.')) return value
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function formatTick(value: number, decimals: number, suffix: string): string {
  const rounded = value.toFixed(decimals)
  return `${trimTrailingZeroes(rounded)}${suffix}`
}

type FinancialTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: FinancialChartDatum
  }>
  palette: ChartPalette
}

function FinancialTooltip({
  active,
  payload,
  palette,
}: FinancialTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as FinancialChartDatum | undefined
  if (!point) return null

  return (
    <ChartTooltipCard
      title={point.label}
      rows={[
        {
          label: 'Value',
          value: point.formatted ?? '—',
          swatchColor: palette.primary,
        },
      ]}
    />
  )
}

export default function FinancialStatementBarChart({
  data,
  valueSuffix,
  decimals,
}: FinancialStatementBarChartProps) {
  return (
    <ChartContainer className="h-[290px] w-full min-w-0">
      {({ palette }) => (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          <BarChart data={data} layout="vertical" margin={CHART_MARGINS.withYAxisLabels}>
            <CartesianGrid strokeDasharray="2 6" stroke={palette.grid} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: palette.textMuted }}
              tickFormatter={(value) => formatTick(value as number, decimals, valueSuffix)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: palette.text }}
              interval={0}
            />
            <Tooltip content={<FinancialTooltip palette={palette} />} cursor={{ fill: 'rgba(37,99,235,0.08)' }} />
            <Bar dataKey="value" fill={palette.primary} radius={[6, 6, 6, 6]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}
