'use client'

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CorrelationNetworkPeer } from '@/lib/finance'
import { ChartTooltipCard } from '@/components/charts/ChartContainer'

type CorrelationNetworkProps = {
  centerTicker: string
  centerName: string | null
  peers: CorrelationNetworkPeer[]
}

type LayoutNode = CorrelationNetworkPeer & {
  x: number
  y: number
  radius: number
  edgeOpacity: number
  edgeWidth: number
  edgeColor: string
  ringColor: string
  fillColor: string
}

type HoverTooltipState = {
  x: number
  y: number
}

const WIDTH = 860
const HEIGHT = 420
const CENTER_X = WIDTH / 2
const CENTER_Y = HEIGHT / 2

function correlationDescriptor(absCorrelation: number): 'high' | 'moderate' | 'low' {
  if (absCorrelation >= 0.75) return 'high'
  if (absCorrelation >= 0.5) return 'moderate'
  return 'low'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function ringRadius(absCorrelation: number): number {
  const minRadius = 104
  const maxRadius = 172
  const normalized = Math.max(0, Math.min(1, absCorrelation))
  return maxRadius - normalized * (maxRadius - minRadius)
}

function edgeColorForCorrelation(correlation: number): string {
  return correlation >= 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)'
}

function ringColorForCorrelation(correlation: number): string {
  return correlation >= 0 ? '#60a5fa' : '#f87171'
}

function fillColorForCorrelation(correlation: number): string {
  if (correlation >= 0.15) return '#1e3a5f'
  if (correlation <= -0.15) return '#3f1e1e'
  return '#1e1e2e'
}

function computeNodeLayout(peers: CorrelationNetworkPeer[]): LayoutNode[] {
  const sorted = peers
    .slice()
    .sort((a, b) => b.absCorrelation - a.absCorrelation || a.ticker.localeCompare(b.ticker))

  const count = sorted.length
  if (count === 0) return []

  return sorted.map((peer, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count
    const r = ringRadius(peer.absCorrelation)
    const x = CENTER_X + Math.cos(angle) * r
    const y = CENTER_Y + Math.sin(angle) * r
    const nodeRadius = 20
    const edgeOpacity = 0.3 + peer.absCorrelation * 0.7
    const edgeWidth = Math.max(1, peer.absCorrelation * 6)

    return {
      ...peer,
      x,
      y,
      radius: nodeRadius,
      edgeOpacity,
      edgeWidth,
      edgeColor: edgeColorForCorrelation(peer.correlation),
      ringColor: ringColorForCorrelation(peer.correlation),
      fillColor: fillColorForCorrelation(peer.correlation),
    }
  })
}

export default function CorrelationNetwork({
  centerTicker,
  centerName,
  peers,
}: CorrelationNetworkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)
  const [tooltipState, setTooltipState] = useState<HoverTooltipState | null>(null)
  const layoutNodes = useMemo(() => computeNodeLayout(peers), [peers])
  const hoveredNode = hoveredTicker
    ? layoutNodes.find((node) => node.ticker === hoveredTicker) ?? null
    : null

  if (layoutNodes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-content-muted">
        Correlation relationships are not available for this ticker yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative overflow-hidden rounded-xl border border-[#d1d5db] bg-[#f8fafc] p-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[380px] w-full" role="img" aria-label="Correlation network">
          {layoutNodes.map((node) => {
            const isHovered = hoveredTicker === node.ticker
            const hasActiveHover = hoveredTicker !== null
            return (
              <line
                key={`edge-${node.ticker}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={node.x}
                y2={node.y}
                stroke={node.edgeColor}
                strokeOpacity={hasActiveHover ? (isHovered ? 1 : 0.1) : node.edgeOpacity}
                strokeWidth={isHovered ? node.edgeWidth + 1 : node.edgeWidth}
              />
            )
          })}

          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={28}
            fill="#111827"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <text
            x={CENTER_X}
            y={CENTER_Y + 5}
            textAnchor="middle"
            className="text-[14px] font-semibold"
            fill="#f9fafb"
          >
            {centerTicker}
          </text>

          {layoutNodes.map((node) => {
            const isHovered = hoveredTicker === node.ticker
            return (
              <a
                key={node.ticker}
                href={`/stocks/${node.ticker}`}
                onMouseEnter={(event) => {
                  setHoveredTicker(node.ticker)
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTooltipState({
                    x: clamp(event.clientX - rect.left + 10, 8, rect.width - 196),
                    y: clamp(event.clientY - rect.top - 10, 8, rect.height - 120),
                  })
                }}
                onMouseMove={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTooltipState({
                    x: clamp(event.clientX - rect.left + 10, 8, rect.width - 196),
                    y: clamp(event.clientY - rect.top - 10, 8, rect.height - 120),
                  })
                }}
                onMouseLeave={() => {
                  setHoveredTicker((prev) => (prev === node.ticker ? null : prev))
                  setTooltipState(null)
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.radius + 2 : node.radius}
                  fill={node.fillColor}
                  stroke={node.ringColor}
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className={cn('text-[11px] font-semibold', isHovered ? 'text-[12px]' : undefined)}
                  fill="#f9fafb"
                >
                  {node.ticker}
                </text>
                <title>
                  {`${node.ticker} · ${(node.correlation * 100).toFixed(1)}% correlation${node.sector ? ` · ${node.sector}` : ''}`}
                </title>
              </a>
            )
          })}
        </svg>

        {hoveredNode && tooltipState ? (
          <div className="pointer-events-none absolute z-20" style={{ left: tooltipState.x, top: tooltipState.y }}>
            <ChartTooltipCard
              title={hoveredNode.ticker}
              rows={[
                {
                  label: 'Correlation',
                  value: hoveredNode.correlation.toFixed(2),
                  swatchColor: hoveredNode.correlation >= 0 ? '#60a5fa' : '#f87171',
                },
                {
                  label: 'Strength',
                  value:
                    correlationDescriptor(hoveredNode.absCorrelation) === 'high'
                      ? 'Strong'
                      : correlationDescriptor(hoveredNode.absCorrelation) === 'moderate'
                        ? 'Moderate'
                        : 'Weak',
                },
                ...(hoveredNode.sector ? [{ label: 'Sector', value: hoveredNode.sector }] : []),
              ]}
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-xs text-content-secondary',
          hoveredNode ? 'border-[#93c5fd] text-content-primary' : undefined
        )}
      >
        {hoveredNode ? (
          <span>
            {hoveredNode.ticker} · correlation {hoveredNode.correlation.toFixed(2)} ·{' '}
            {correlationDescriptor(hoveredNode.absCorrelation) === 'high'
              ? 'Strong'
              : correlationDescriptor(hoveredNode.absCorrelation) === 'moderate'
                ? 'Moderate'
                : 'Weak'}
            {hoveredNode.sector ? ` · ${hoveredNode.sector}` : ''}
            {hoveredNode.name ? ` · ${hoveredNode.name}` : ''}
          </span>
        ) : (
          <span>
            Hover a node to inspect ticker, correlation strength, and sector context.
          </span>
        )}
      </div>
      {centerName ? (
        <p className="text-[11px] text-content-muted">
          {centerTicker}: {centerName}
        </p>
      ) : null}
    </div>
  )
}
