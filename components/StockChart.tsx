'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import type { PricePoint } from '@/lib/finance'

type Size = { width: number; height: number }
type Point = { x: number; y: number; value: number; date: string }
type HoverState = { index: number; mouseX: number; mouseY: number; yOnCurve: number }
type SignalDirection = 'bullish' | 'bearish' | 'neutral'
type SignalMarkerKind = 'flip' | 'latest'

export type StockChartSignalMarker = {
  date: string
  direction: SignalDirection
  conviction: number | null
  horizon: number
  kind: SignalMarkerKind
}

type RenderedSignalMarker = StockChartSignalMarker & {
  index: number
  x: number
  y: number
}

type SignalBand = {
  x: number
  width: number
  direction: SignalDirection
}

function formatDateShort(date: string): string {
  const d = new Date(date)
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
}

function formatPrice(value: number): string {
  return `$${value.toFixed(0)}`
}

function formatDateLong(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatConviction(prob: number | null): string {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

function signalColor(direction: SignalDirection): { solid: string; soft: string } {
  if (direction === 'bullish') {
    return { solid: '#059669', soft: 'rgba(5,150,105,0.22)' }
  }
  if (direction === 'bearish') {
    return { solid: '#dc2626', soft: 'rgba(220,38,38,0.22)' }
  }
  return { solid: '#475569', soft: 'rgba(71,85,105,0.22)' }
}

function signalBandFill(direction: SignalDirection): string {
  if (direction === 'bullish') return 'rgba(16,185,129,0.11)'
  if (direction === 'bearish') return 'rgba(244,63,94,0.11)'
  return 'rgba(100,116,139,0.08)'
}

function signalDirectionLabel(direction: SignalDirection): string {
  if (direction === 'bullish') return 'Bullish'
  if (direction === 'bearish') return 'Bearish'
  return 'Neutral'
}

function signalKindLabel(kind: SignalMarkerKind): string {
  if (kind === 'flip') return 'Model Flip'
  return 'Latest Signal'
}

export default function StockChart({
  data,
  signalMarkers = [],
  showRegimes = true,
  showSignalMarkers = true,
}: {
  data: PricePoint[]
  signalMarkers?: StockChartSignalMarker[]
  showRegimes?: boolean
  showSignalMarkers?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gradientToken = useId().replace(/:/g, '')
  const areaGradientId = `stock-area-gradient-${gradientToken}`
  const lineGradientId = `stock-line-gradient-${gradientToken}`
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [hover, setHover] = useState<HoverState | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const applyRect = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    applyRect()

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: Math.max(0, Math.floor(entry.contentRect.width)),
          height: Math.max(0, Math.floor(entry.contentRect.height)),
        })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const width = size.width
  const height = size.height
  const hasSize = width > 40 && height > 40

  if (!data || data.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[220px] min-w-0 flex flex-col items-center justify-center text-gray-500"
      >
        <span>No historical data available.</span>
      </div>
    )
  }

  const padding = { top: 16, right: 16, bottom: 26, left: 44 }
  const innerW = Math.max(1, width - padding.left - padding.right)
  const innerH = Math.max(1, height - padding.top - padding.bottom)
  const prices = data.map((d) => d.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const spread = maxPrice - minPrice
  const pad = spread === 0 ? Math.max(1, minPrice * 0.01) : spread * 0.1
  const yMin = minPrice - pad
  const yMax = maxPrice + pad
  const yRange = Math.max(1e-6, yMax - yMin)

  const points: Point[] = data.map((d, idx) => {
    const x = padding.left + (idx / Math.max(1, data.length - 1)) * innerW
    const y = padding.top + (1 - (d.close - yMin) / yRange) * innerH
    return { x, y, value: d.close, date: d.date }
  })

  const path = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
  const baselineY = padding.top + innerH
  const areaPath = [
    `M${points[0]?.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    ...points.map((p, idx) => `${idx === 0 ? 'L' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`),
    `L${points[points.length - 1]?.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    'Z',
  ].join(' ')

  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (i / yTicks) * yRange)
  const xTickIndexes = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i
  )
  const dateToPointIndex = new Map(points.map((point, idx) => [point.date, idx]))
  const signalMarkerMap = new Map<string, RenderedSignalMarker>()
  for (const marker of signalMarkers) {
    const normalizedDate = marker.date.slice(0, 10)
    const pointIndex = dateToPointIndex.get(normalizedDate)
    if (pointIndex === undefined) continue
    const point = points[pointIndex]
    if (!point) continue

    const key = `${normalizedDate}:${marker.kind}`
    signalMarkerMap.set(key, {
      ...marker,
      date: normalizedDate,
      index: pointIndex,
      x: point.x,
      y: point.y,
    })
  }
  const resolvedSignalMarkers = [...signalMarkerMap.values()].sort((a, b) => a.index - b.index)
  const renderedSignalMarkers = showSignalMarkers ? resolvedSignalMarkers : []
  const stateMarkersByIndex = new Map<number, RenderedSignalMarker>()
  for (const marker of resolvedSignalMarkers) {
    const existing = stateMarkersByIndex.get(marker.index)
    if (!existing) {
      stateMarkersByIndex.set(marker.index, marker)
      continue
    }

    if (existing.kind === 'latest' && marker.kind === 'flip') {
      stateMarkersByIndex.set(marker.index, marker)
    }
  }
  const stateMarkers = [...stateMarkersByIndex.values()].sort((a, b) => a.index - b.index)
  const signalBands: SignalBand[] = showRegimes
    ? stateMarkers
        .map((marker, idx) => {
          const next = stateMarkers[idx + 1]
          const startX = marker.x
          const endX = next ? next.x : padding.left + innerW
          return {
            x: startX,
            width: Math.max(0, endX - startX),
            direction: marker.direction,
          }
        })
        .filter((band) => band.width >= 4)
    : []

  const hoverPoint = hover ? points[hover.index] : null
  const hoverVisible = Boolean(hoverPoint && isHovering)
  const hoverSignalMarker =
    hoverPoint
      ? renderedSignalMarkers.find((marker) => marker.date === hoverPoint.date) ?? null
      : null

  const handleHoverMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const localX = event.clientX - rect.left
    const localY = event.clientY - rect.top
    const x = padding.left + localX
    const y = padding.top + localY
    const clampedX = Math.min(Math.max(x, padding.left), padding.left + innerW)
    const clampedY = Math.min(Math.max(y, padding.top), padding.top + innerH)
    const ratio = (clampedX - padding.left) / Math.max(1, innerW)
    const scaled = ratio * Math.max(0, points.length - 1)
    const index = Math.min(points.length - 1, Math.max(0, Math.round(scaled)))
    const lockedPoint = points[index]
    if (!lockedPoint) return
    setIsHovering(true)
    setHover((prev) => {
      if (
        prev &&
        prev.index === index &&
        prev.mouseX === lockedPoint.x &&
        prev.yOnCurve === lockedPoint.y
      ) {
        return prev
      }
      return {
        index,
        mouseX: lockedPoint.x,
        mouseY: clampedY,
        yOnCurve: lockedPoint.y,
      }
    })
  }

  const tooltipWidth = 206
  const tooltipHeight = hoverSignalMarker ? 128 : 76
  const tooltipTop = hover
    ? Math.min(Math.max(8, hover.yOnCurve - tooltipHeight / 2), height - tooltipHeight - 8)
    : 0
  const placeLeft = hover ? hover.mouseX - tooltipWidth - 14 >= 8 : true
  const tooltipLeft = hover
    ? placeLeft
      ? hover.mouseX - tooltipWidth - 14
      : Math.min(width - tooltipWidth - 8, hover.mouseX + 14)
    : 0
  const hoverX = hover?.mouseX ?? 0
  const hoverYOnCurve = hover?.yOnCurve ?? 0

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[220px] min-w-0">
      {hasSize ? (
        <svg width={width} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f6e92" stopOpacity="0.34" />
              <stop offset="65%" stopColor="#4f6e92" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4f6e92" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6e8eb6" />
              <stop offset="100%" stopColor="#36597f" />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="transparent" />

          {signalBands.map((band, idx) => (
            <rect
              key={`band-${idx}`}
              x={band.x}
              y={padding.top}
              width={band.width}
              height={innerH}
              fill={signalBandFill(band.direction)}
            />
          ))}

          {yTickValues.map((value) => {
            const y = padding.top + (1 - (value - yTickValues[0]) / (yTickValues[yTickValues.length - 1] - yTickValues[0])) * innerH
            return (
              <g key={`y-${value}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerW}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#6b7280">
                  {formatPrice(value)}
                </text>
              </g>
            )
          })}

          {xTickIndexes.map((idx) => {
            const point = points[idx]
            if (!point) return null
            return (
              <text
                key={`x-${idx}`}
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
              >
                {formatDateShort(point.date)}
              </text>
            )
          })}

          <path d={areaPath} fill={`url(#${areaGradientId})`} stroke="none" />
          <path d={path} fill="none" stroke="rgba(79, 110, 146, 0.23)" strokeWidth={7} />
          <path d={path} fill="none" stroke={`url(#${lineGradientId})`} strokeWidth={3} />
          {renderedSignalMarkers.map((marker) => {
            const colors = signalColor(marker.direction)
            const isActive = hoverPoint?.date === marker.date
            return (
              <g key={`${marker.date}:${marker.kind}`} style={{ pointerEvents: 'none' }}>
                <circle cx={marker.x} cy={marker.y} r={isActive ? 13 : 10} fill={colors.soft} />
                <circle cx={marker.x} cy={marker.y} r={isActive ? 6 : 5} fill={colors.solid} stroke="#ffffff" strokeWidth={2} />
                <circle cx={marker.x} cy={marker.y} r={1.75} fill="#ffffff" />
                {marker.kind === 'flip' ? (
                  <rect
                    x={marker.x - 3}
                    y={marker.y - 14}
                    width={6}
                    height={6}
                    rx={1}
                    transform={`rotate(45 ${marker.x} ${marker.y - 11})`}
                    fill={colors.solid}
                    opacity={0.9}
                  />
                ) : null}
              </g>
            )
          })}

          <rect
            x={padding.left}
            y={padding.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleHoverMove}
            onMouseLeave={() => setIsHovering(false)}
          />

          {hoverPoint ? (
            <g style={{ opacity: hoverVisible ? 1 : 0, transition: 'opacity 180ms ease-out' }}>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + innerH}
                stroke="#d1d5db"
                strokeWidth={1}
              />
              <circle cx={hoverX} cy={hoverYOnCurve} r={12} fill="rgba(79, 110, 146, 0.20)" />
              <circle cx={hoverX} cy={hoverYOnCurve} r={5} fill="#4f6e92" stroke="#ffffff" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : (
        <div className="w-full h-full" />
      )}

      {hasSize && hoverPoint ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            opacity: hoverVisible ? 1 : 0,
            transform: hoverVisible ? 'translate3d(0,0,0)' : 'translate3d(0,6px,0)',
            transition: 'left 120ms ease-out, top 120ms ease-out, opacity 180ms ease-out, transform 180ms ease-out',
          }}
        >
          <div className="relative min-w-[150px] rounded-md border border-[#cbd5e1] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.20)]">
            <div className="text-[15px] font-medium leading-none text-[#1f2937]">
              {formatDateLong(hoverPoint.date)}
            </div>
            <div className="mt-2 text-[15px] font-semibold leading-none text-[#111827]">
              {`$${hoverPoint.value.toFixed(2)}`}
            </div>
            {hoverSignalMarker ? (
              <div className="mt-3 border-t border-[#e5e7eb] pt-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#475569]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: signalColor(hoverSignalMarker.direction).solid }}
                  />
                  <span>{signalKindLabel(hoverSignalMarker.kind)}</span>
                </div>
                <div className="mt-1 text-[13px] font-semibold leading-none text-[#0f172a]">
                  {signalDirectionLabel(hoverSignalMarker.direction)}
                </div>
                <div className="mt-1 text-[12px] text-[#475569]">
                  {`${formatConviction(hoverSignalMarker.conviction)} conviction · ${hoverSignalMarker.horizon}d horizon`}
                </div>
              </div>
            ) : null}

            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-white"
              style={
                placeLeft
                  ? { right: -6, borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }
                  : { left: -6, borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1' }
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
