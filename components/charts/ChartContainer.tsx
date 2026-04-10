'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type ChartPalette = {
  isDark: boolean
  primary: string
  secondary: string
  accent: string
  neutral: string
  grid: string
  text: string
  textMuted: string
  axisText: string
  tooltipBg: string
  tooltipBorder: string
  bullish: string
  bearish: string
  signalNeutral: string
  regimeBullish: string
  regimeBearish: string
  regimeNeutral: string
}

export const LIGHT_CHART_PALETTE: ChartPalette = {
  isDark: false,
  primary: '#2563eb',
  secondary: '#0f766e',
  accent: '#d97706',
  neutral: '#64748b',
  grid: 'rgba(100, 116, 139, 0.24)',
  text: '#1f2937',
  textMuted: '#6b7280',
  axisText: '#5f6f84',
  tooltipBg: '#ffffff',
  tooltipBorder: '#cbd5e1',
  bullish: '#16a34a',
  bearish: '#ef4444',
  signalNeutral: '#64748b',
  regimeBullish: 'rgba(22, 163, 74, 0.14)',
  regimeBearish: 'rgba(239, 68, 68, 0.14)',
  regimeNeutral: 'rgba(100, 116, 139, 0.12)',
}

export const DARK_CHART_PALETTE: ChartPalette = {
  isDark: true,
  primary: '#7ea6d9',
  secondary: '#62b8a8',
  accent: '#d2a14f',
  neutral: '#9fb0c3',
  grid: 'rgba(142, 162, 191, 0.15)',
  text: '#dde8f6',
  textMuted: '#9cb0c9',
  axisText: '#b3c3d8',
  tooltipBg: '#132238',
  tooltipBorder: '#476184',
  bullish: '#4fae7d',
  bearish: '#d18b8b',
  signalNeutral: '#9fb0c3',
  regimeBullish: 'rgba(79, 174, 125, 0.18)',
  regimeBearish: 'rgba(209, 139, 139, 0.19)',
  regimeNeutral: 'rgba(159, 176, 195, 0.16)',
}

export const CHART_PALETTE: ChartPalette = LIGHT_CHART_PALETTE

function detectDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const root = document.documentElement
  const theme = root.dataset.theme
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useChartPalette(): ChartPalette {
  const [isDark, setIsDark] = useState(() => detectDarkMode())

  useEffect(() => {
    const update = () => setIsDark(detectDarkMode())
    update()

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => update()
    media.addEventListener('change', onMediaChange)

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    return () => {
      media.removeEventListener('change', onMediaChange)
      observer.disconnect()
    }
  }, [])

  return isDark ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE
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
    <div className="rounded-xl border border-chart-tooltip-border bg-chart-tooltip px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-[2px] dark:shadow-[0_14px_32px_rgba(2,8,20,0.6)]">
      {title ? (
        <div className="mb-2 text-[12px] font-semibold text-content-primary">
          {title}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4 text-[12px]">
            <div className="inline-flex items-center gap-2 text-content-secondary">
              {row.swatchColor ? (
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.swatchColor }} />
              ) : null}
              <span>{row.label}</span>
            </div>
            <span className="font-semibold text-content-primary">
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
  const palette = useChartPalette()

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
          palette,
        })
      ) : (
        <div className="flex h-full min-h-[180px] items-center justify-center text-xs text-content-muted">
          {loadingText}
        </div>
      )}
    </div>
  )
}
