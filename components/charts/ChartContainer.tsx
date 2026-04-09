'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type ChartPalette = {
  primary: string
  secondary: string
  accent: string
  neutral: string
  grid: string
  text: string
  textMuted: string
  tooltipBg: string
  tooltipBorder: string
  bullish: string
  bearish: string
  signalNeutral: string
  regimeBullish: string
  regimeBearish: string
  regimeNeutral: string
}

export const CHART_PALETTE: ChartPalette = {
  primary: '#2563eb',
  secondary: '#0f766e',
  accent: '#d97706',
  neutral: '#64748b',
  grid: 'rgba(100, 116, 139, 0.18)',
  text: '#1f2937',
  textMuted: '#6b7280',
  tooltipBg: '#ffffff',
  tooltipBorder: '#d4d4d8',
  bullish: '#16a34a',
  bearish: '#ef4444',
  signalNeutral: '#64748b',
  regimeBullish: 'rgba(22, 163, 74, 0.10)',
  regimeBearish: 'rgba(239, 68, 68, 0.10)',
  regimeNeutral: 'rgba(100, 116, 139, 0.08)',
}

export const CHART_MARGINS = {
  standard: { top: 12, right: 16, bottom: 12, left: 16 },
  withYAxisLabels: { top: 12, right: 16, bottom: 12, left: 24 },
  stock: { top: 14, right: 14, bottom: 30, left: 46 },
  sankey: { top: 28, right: 20, bottom: 20, left: 20 },
} as const

type ChartTooltipRow = {
  label: string
  value: string
  swatchColor?: string
}

export function ChartTooltipCard({
  title,
  rows,
}: {
  title?: string
  rows: ChartTooltipRow[]
}) {
  if (rows.length === 0) return null

  return (
    <div
      className="rounded-xl border px-3 py-2.5 shadow-sm"
      style={{
        backgroundColor: CHART_PALETTE.tooltipBg,
        borderColor: CHART_PALETTE.tooltipBorder,
      }}
    >
      {title ? (
        <div className="mb-2 text-[12px] font-semibold" style={{ color: CHART_PALETTE.text }}>
          {title}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4 text-[12px]">
            <div className="inline-flex items-center gap-2" style={{ color: CHART_PALETTE.textMuted }}>
              {row.swatchColor ? (
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.swatchColor }} />
              ) : null}
              <span>{row.label}</span>
            </div>
            <span className="font-semibold" style={{ color: CHART_PALETTE.text }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ChartContainerArgs = {
  width: number
  height: number
  isReady: boolean
  palette: ChartPalette
}

type ChartContainerProps = {
  className?: string
  padding?: 'none' | 'sm' | 'md'
  loading?: boolean
  loadingText?: string
  children: (args: ChartContainerArgs) => React.ReactNode
}

function paddingClass(padding: ChartContainerProps['padding']): string {
  if (padding === 'md') return 'p-4'
  if (padding === 'sm') return 'p-2'
  return ''
}

export default function ChartContainer({
  className,
  padding = 'none',
  loading = false,
  loadingText = 'Loading chart...',
  children,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    updateSize()
    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const isReady = !loading && size.width > 40 && size.height > 40

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0', paddingClass(padding), className)}>
      {isReady ? (
        children({
          width: size.width,
          height: size.height,
          isReady,
          palette: CHART_PALETTE,
        })
      ) : (
        <div className="flex h-full min-h-[180px] items-center justify-center text-xs text-neutral-500">
          {loadingText}
        </div>
      )}
    </div>
  )
}
