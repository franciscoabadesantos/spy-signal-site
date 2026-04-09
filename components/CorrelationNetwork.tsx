'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CorrelationNetworkPeer } from '@/lib/finance'
import { useChartPalette } from '@/components/charts/ChartContainer'

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
}

const WIDTH = 860
const HEIGHT = 420
const CENTER_X = WIDTH / 2
const CENTER_Y = HEIGHT / 2

const SECTOR_SWATCH: Record<string, string> = {
  Technology: '#3b82f6',
  Semiconductors: '#6366f1',
  'Communication Services': '#06b6d4',
  Financials: '#14b8a6',
  Energy: '#f59e0b',
  'Consumer Discretionary': '#a855f7',
  'Health Care': '#22c55e',
  'Broad Market ETF': '#64748b',
  'Growth ETF': '#60a5fa',
  'Dow ETF': '#2dd4bf',
  'Small Cap ETF': '#f97316',
  'Total Market ETF': '#94a3b8',
  'Technology ETF': '#818cf8',
  'Financials ETF': '#34d399',
  'Energy ETF': '#fbbf24',
}

function correlationDescriptor(absCorrelation: number): 'high' | 'moderate' | 'low' {
  if (absCorrelation >= 0.75) return 'high'
  if (absCorrelation >= 0.5) return 'moderate'
  return 'low'
}

function ringRadius(absCorrelation: number): number {
  const minRadius = 104
  const maxRadius = 172
  const normalized = Math.max(0, Math.min(1, absCorrelation))
  return maxRadius - normalized * (maxRadius - minRadius)
}

function colorForSector(sector: string | null): string {
  if (!sector) return '#94a3b8'
  return SECTOR_SWATCH[sector] ?? '#94a3b8'
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
    const nodeRadius = 16 + peer.absCorrelation * 8
    const edgeOpacity = 0.24 + peer.absCorrelation * 0.56
    const edgeWidth = 1 + peer.absCorrelation * 3.6

    return {
      ...peer,
      x,
      y,
      radius: nodeRadius,
      edgeOpacity,
      edgeWidth,
    }
  })
}

export default function CorrelationNetwork({
  centerTicker,
  centerName,
  peers,
}: CorrelationNetworkProps) {
  const palette = useChartPalette()
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)
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
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-card p-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[360px] w-full" role="img" aria-label="Correlation network">
          {layoutNodes.map((node) => {
            const isHovered = hoveredTicker === node.ticker
            return (
              <line
                key={`edge-${node.ticker}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={node.x}
                y2={node.y}
                stroke={isHovered ? palette.primary : palette.neutral}
                strokeOpacity={isHovered ? 0.92 : node.edgeOpacity}
                strokeWidth={isHovered ? node.edgeWidth + 1.2 : node.edgeWidth}
              />
            )
          })}

          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={34}
            fill={palette.primary}
            fillOpacity={0.18}
            stroke={palette.primary}
            strokeWidth={2.4}
          />
          <text
            x={CENTER_X}
            y={CENTER_Y - 2}
            textAnchor="middle"
            className="text-[16px] font-semibold"
            fill={palette.text}
          >
            {centerTicker}
          </text>
          <text
            x={CENTER_X}
            y={CENTER_Y + 14}
            textAnchor="middle"
            className="text-[11px]"
            fill={palette.textMuted}
          >
            anchor
          </text>

          {layoutNodes.map((node) => {
            const isHovered = hoveredTicker === node.ticker
            const swatch = colorForSector(node.sector)
            return (
              <a
                key={node.ticker}
                href={`/stocks/${node.ticker}`}
                onMouseEnter={() => setHoveredTicker(node.ticker)}
                onMouseLeave={() => setHoveredTicker((prev) => (prev === node.ticker ? null : prev))}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? node.radius + 2 : node.radius}
                  fill={swatch}
                  fillOpacity={isHovered ? 0.36 : 0.2}
                  stroke={swatch}
                  strokeWidth={isHovered ? 2.4 : 1.6}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className={cn('text-[11px] font-semibold', isHovered ? 'text-[12px]' : undefined)}
                  fill={palette.text}
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
      </div>

      <div
        className={cn(
          'rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-content-secondary',
          hoveredNode ? 'border-primary/40 text-content-primary' : undefined
        )}
      >
        {hoveredNode ? (
          <span>
            {hoveredNode.ticker} · {(hoveredNode.correlation * 100).toFixed(1)}% correlation ·{' '}
            {correlationDescriptor(hoveredNode.absCorrelation)} correlation
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
