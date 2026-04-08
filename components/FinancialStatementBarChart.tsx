'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

export default function FinancialStatementBarChart({
  data,
  valueSuffix,
  decimals,
}: FinancialStatementBarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateReady = () => {
      const rect = element.getBoundingClientRect()
      setIsReady(rect.width > 0 && rect.height > 0)
    }

    updateReady()
    const observer = new ResizeObserver(() => updateReady())
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-[290px] w-full min-w-0">
      {isReady ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          <BarChart data={data} layout="vertical" margin={{ top: 6, right: 20, left: 20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(value) => formatTick(value as number, decimals, valueSuffix)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 11, fill: '#374151' }}
              interval={0}
            />
            <Tooltip
              formatter={(_value, _name, item) => [item?.payload?.formatted ?? '—', 'Value']}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}
