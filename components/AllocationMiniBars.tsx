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

export type AllocationMiniBarDatum = {
  label: string
  value: number
}

type AllocationMiniBarsProps = {
  title: string
  data: AllocationMiniBarDatum[]
  color?: string
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

export default function AllocationMiniBars({
  title,
  data,
  color = '#0f766e',
}: AllocationMiniBarsProps) {
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
    <div className="rounded-md border border-gray-200 p-3">
      <div className="text-[12px] font-semibold text-gray-700 mb-2">{title}</div>
      <div ref={containerRef} className="h-[210px] w-full min-w-0">
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
            <BarChart data={data} layout="vertical" margin={{ top: 6, right: 12, left: 2, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={78}
                tick={{ fontSize: 10, fill: '#374151' }}
                interval={0}
              />
              <Tooltip
                formatter={(value) => [formatPercent(value as number), 'Weight']}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  )
}
