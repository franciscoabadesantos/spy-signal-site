'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force'
import { ChartTooltipCard } from '@/components/charts/ChartContainer'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import { countryColor, countryDisplayName, sectorLabel } from '@/lib/network-regions'
import { cn } from '@/lib/utils'

type CorrelationNetworkProps = {
  centerTicker: string
  centerName: string | null
  graph: NetworkGraph
}

type LayoutNode = NetworkNode &
  SimulationNodeDatum & {
    id: string
    radius: number
  }

type LayoutEdge = NetworkEdge & {
  id: string
}

type HoverTooltipState = {
  x: number
  y: number
}

const WIDTH = 860
const HEIGHT = 420

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function correlationDescriptor(absCorrelation: number): 'Strong' | 'Moderate' | 'Weak' {
  if (absCorrelation >= 0.75) return 'Strong'
  if (absCorrelation >= 0.5) return 'Moderate'
  return 'Weak'
}

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join('__')
}

function edgeStroke(edge: NetworkEdge): string {
  const alpha = clamp(0.18 + edge.absCorrelation * 0.72, 0.24, 0.9)
  return edge.correlation >= 0 ? `rgba(54, 179, 255, ${alpha})` : `rgba(255, 134, 123, ${alpha})`
}

function marketCapRadius(marketCap: number | null): number {
  if (!marketCap || !Number.isFinite(marketCap) || marketCap <= 0) return 11
  // Wider, more sensitive range so market-cap differences are clearly visible.
  const normalized = clamp((Math.log10(marketCap) - 8.5) / 4.1, 0, 1)
  return 9 + normalized * 25
}

function buildLayout(graph: NetworkGraph, centerTickerRaw: string): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const centerTicker = centerTickerRaw.trim().toUpperCase()
  const nodeByTicker = new Map<string, NetworkNode>()
  for (const node of graph.nodes) {
    nodeByTicker.set(node.ticker, node)
  }

  // Per-ticker peer web: only the center ticker's own correlations (spokes),
  // not the edges between the peers themselves — those belong to the global map.
  const edges = graph.edges
    .filter((edge) => nodeByTicker.has(edge.source) && nodeByTicker.has(edge.target))
    .filter((edge) => edge.source === centerTicker || edge.target === centerTicker)
    .sort((a, b) => a.absCorrelation - b.absCorrelation)
    .map((edge) => ({ ...edge, id: edgeKey(edge.source, edge.target) }))

  const connectedToCenter = new Set<string>([centerTicker])
  for (const edge of edges) {
    connectedToCenter.add(edge.source)
    connectedToCenter.add(edge.target)
  }

  const visibleNodes = [...nodeByTicker.values()].filter((node) => connectedToCenter.has(node.ticker))
  const nodes: LayoutNode[] = visibleNodes.map((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, visibleNodes.length)) * Math.PI * 2
    const isCenter = node.ticker === centerTicker
    return {
      ...node,
      id: node.ticker,
      radius: isCenter ? Math.max(12, marketCapRadius(node.marketCap)) : marketCapRadius(node.marketCap),
      x: isCenter ? WIDTH / 2 : WIDTH / 2 + Math.cos(angle) * 150,
      y: isCenter ? HEIGHT / 2 : HEIGHT / 2 + Math.sin(angle) * 118,
      fx: isCenter ? WIDTH / 2 : undefined,
      fy: isCenter ? HEIGHT / 2 : undefined,
    }
  })

  const linkEdges = edges.map((edge) => ({ ...edge }))
  const simulation = forceSimulation<LayoutNode>(nodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutEdge>(linkEdges)
        .id((node) => node.id)
        // Distance encodes correlation: stronger correlation pulls the peer closer to center.
        .distance((edge) => 50 + (1 - edge.absCorrelation) * 120)
        .strength((edge) => 0.55 + edge.absCorrelation * 0.35)
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-225))
    .force('collide', forceCollide<LayoutNode>().radius((node) => node.radius + 15).strength(0.9))
    .force('x', forceX<LayoutNode>(WIDTH / 2).strength((node) => (node.id === centerTicker ? 0.42 : 0.045)))
    .force('y', forceY<LayoutNode>(HEIGHT / 2).strength((node) => (node.id === centerTicker ? 0.42 : 0.06)))
    .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
    .stop()

  for (let index = 0; index < 180; index += 1) simulation.tick()

  for (const node of nodes) {
    node.x = clamp(node.x ?? WIDTH / 2, node.radius + 14, WIDTH - node.radius - 14)
    node.y = clamp(node.y ?? HEIGHT / 2, node.radius + 18, HEIGHT - node.radius - 18)
  }

  return { nodes, edges }
}

function edgeBetween(a: string, b: string, edges: NetworkEdge[]): NetworkEdge | null {
  if (a === b) return null
  return (
    edges.find(
      (edge) =>
        (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a),
    ) ?? null
  )
}

export default function CorrelationNetwork({
  centerTicker,
  centerName,
  graph,
}: CorrelationNetworkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)
  const [tooltipState, setTooltipState] = useState<HoverTooltipState | null>(null)
  const { nodes, edges } = useMemo(() => buildLayout(graph, centerTicker), [centerTicker, graph])
  const nodeByTicker = useMemo(() => new Map(nodes.map((node) => [node.ticker, node])), [nodes])
  const hoveredNode = hoveredTicker ? nodeByTicker.get(hoveredTicker) ?? null : null
  const connectedTickers = useMemo(() => {
    if (!hoveredTicker) return null
    const connected = new Set<string>([hoveredTicker])
    for (const edge of edges) {
      if (edge.source === hoveredTicker) connected.add(edge.target)
      if (edge.target === hoveredTicker) connected.add(edge.source)
    }
    return connected
  }, [edges, hoveredTicker])
  const connectedEdges = useMemo(() => {
    if (!hoveredTicker) return null
    return new Set(edges.filter((edge) => edge.source === hoveredTicker || edge.target === hoveredTicker).map((edge) => edge.id))
  }, [edges, hoveredTicker])
  const tooltipEdge = hoveredTicker
    ? edgeBetween(hoveredTicker, centerTicker.trim().toUpperCase(), edges)
    : null
  const centerEdgeByTicker = useMemo(() => {
    const center = centerTicker.trim().toUpperCase()
    const map = new Map<string, LayoutEdge>()
    for (const edge of edges) {
      map.set(edge.source === center ? edge.target : edge.source, edge)
    }
    return map
  }, [edges, centerTicker])

  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const [clock, setClock] = useState(0)
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      setClock((now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  // Gentle "orbit in space" drift: each peer sways slowly around its base angle
  // (and bobs slightly in radius) about the fixed center. Spokes follow because
  // edges are drawn from these animated positions.
  const orbits = useMemo(() => {
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    return nodes.map((node, index) => {
      const dx = (node.x ?? cx) - cx
      const dy = (node.y ?? cy) - cy
      const baseR = Math.hypot(dx, dy)
      return {
        node,
        baseR,
        theta0: Math.atan2(dy, dx),
        swaySpeed: 0.1 + (index % 5) * 0.013,
        bobSpeed: 0.22 + (index % 4) * 0.03,
        phase: index * 1.7,
        swayAmp: baseR < 1 ? 0 : 0.1,
        bobAmp: baseR < 1 ? 0 : 2.4,
      }
    })
  }, [nodes])

  if (nodes.length === 0 || edges.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-border p-6 text-sm text-content-muted">
        Correlation relationships are not available for this ticker yet.
      </div>
    )
  }

  const positioned = orbits.map((o) => {
    if (o.baseR < 1) return { node: o.node, x: WIDTH / 2, y: HEIGHT / 2 }
    const theta = o.theta0 + Math.sin(clock * o.swaySpeed + o.phase) * o.swayAmp
    const r = o.baseR + Math.sin(clock * o.bobSpeed + o.phase) * o.bobAmp
    return { node: o.node, x: WIDTH / 2 + Math.cos(theta) * r, y: HEIGHT / 2 + Math.sin(theta) * r }
  })
  const posByTicker = new Map(positioned.map((p) => [p.node.ticker, p]))

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[var(--bg-surface)] p-4"
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[340px] w-full rounded-[8px] bg-[var(--bg-surface)]"
          role="img"
          aria-label="Correlation network"
        >
          {edges.map((edge) => {
            const source = posByTicker.get(edge.source)
            const target = posByTicker.get(edge.target)
            if (!source || !target) return null
            const isHighlighted = connectedEdges ? connectedEdges.has(edge.id) : false
            const isDimmed = connectedEdges ? !isHighlighted : false
            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edgeStroke(edge)}
                strokeOpacity={isDimmed ? 0.08 : edge.inMst ? 0.92 : 0.46}
                strokeWidth={isHighlighted ? 4.2 : edge.inMst ? 3 : 1.4 + edge.absCorrelation * 1.8}
                strokeDasharray={edge.inMst ? undefined : '4 8'}
                strokeLinecap="round"
              />
            )
          })}

          {nodes.map((node) => {
            const isCenter = node.ticker === centerTicker
            const isHovered = hoveredTicker === node.ticker
            const isDimmed = connectedTickers ? !connectedTickers.has(node.ticker) : false
            const color = countryColor(node.country, node.region)
            const centerEdge = centerEdgeByTicker.get(node.ticker)
            const isNegative = !isCenter && !!centerEdge && centerEdge.correlation < 0
            const pos = posByTicker.get(node.ticker)
            const nx = pos?.x ?? node.x ?? WIDTH / 2
            const ny = pos?.y ?? node.y ?? HEIGHT / 2
            return (
              <a
                key={node.ticker}
                href={`/stocks/${node.ticker}`}
                onMouseEnter={(event) => {
                  setHoveredTicker(node.ticker)
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTooltipState({
                    x: clamp(event.clientX - rect.left + 10, 8, rect.width - 220),
                    y: clamp(event.clientY - rect.top - 10, 8, rect.height - 132),
                  })
                }}
                onMouseMove={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTooltipState({
                    x: clamp(event.clientX - rect.left + 10, 8, rect.width - 220),
                    y: clamp(event.clientY - rect.top - 10, 8, rect.height - 132),
                  })
                }}
                onMouseLeave={() => {
                  setHoveredTicker((prev) => (prev === node.ticker ? null : prev))
                  setTooltipState(null)
                }}
              >
                {isCenter ? (
                  <circle
                    cx={nx}
                    cy={ny}
                    r={node.radius + 7}
                    fill="none"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth={1.5}
                    strokeDasharray="2 4"
                    opacity={isDimmed ? 0.3 : 1}
                  />
                ) : isNegative ? (
                  <circle
                    cx={nx}
                    cy={ny}
                    r={node.radius + 4}
                    fill="none"
                    stroke="rgba(255,118,108,0.95)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    opacity={isDimmed ? 0.3 : 1}
                  />
                ) : null}
                <circle
                  cx={nx}
                  cy={ny}
                  r={node.radius + (isHovered ? 5 : 0)}
                  fill={color}
                  fillOpacity={isDimmed ? 0.18 : isCenter ? 0.38 : 0.26}
                  stroke={color}
                  strokeWidth={isCenter ? 2.8 : isHovered ? 2.4 : 1.5}
                  opacity={isDimmed ? 0.3 : 1}
                />
                <circle
                  cx={nx}
                  cy={ny}
                  r={Math.max(7, node.radius * 0.48)}
                  fill={color}
                  fillOpacity={isDimmed ? 0.28 : 0.72}
                />
                <text
                  x={nx}
                  y={ny + 4}
                  textAnchor="middle"
                  className={cn('text-[10px] font-semibold', isCenter ? 'text-[12px]' : undefined)}
                  fill="#f9fafb"
                  opacity={isDimmed ? 0.32 : 0.96}
                >
                  {node.ticker}
                </text>
                <title>
                  {`${node.ticker} · ${countryDisplayName(node.country, node.region)} · ${sectorLabel(node.sector)}${tooltipEdge ? ` · ${tooltipEdge.correlation.toFixed(2)} correlation` : ''}`}
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
                { label: 'Name', value: hoveredNode.name ?? '—' },
                {
                  label: 'Country',
                  value: countryDisplayName(hoveredNode.country, hoveredNode.region),
                  swatchColor: countryColor(hoveredNode.country, hoveredNode.region),
                },
                { label: 'Sector', value: sectorLabel(hoveredNode.sector) },
                {
                  label: hoveredNode.ticker === centerTicker.trim().toUpperCase()
                    ? 'Correlation'
                    : `Correlation vs ${centerTicker.trim().toUpperCase()}`,
                  value: tooltipEdge ? tooltipEdge.correlation.toFixed(2) : '—',
                  swatchColor: tooltipEdge ? edgeStroke(tooltipEdge) : undefined,
                },
                {
                  label: 'Strength',
                  value: tooltipEdge ? correlationDescriptor(tooltipEdge.absCorrelation) : '—',
                },
              ]}
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[var(--bg-surface-raised)] px-3 py-2 text-xs text-content-secondary',
          hoveredNode ? 'border-[#36B3FF] text-content-primary' : undefined
        )}
      >
        {hoveredNode ? (
          <span>
            {hoveredNode.ticker} · {countryDisplayName(hoveredNode.country, hoveredNode.region)} · {sectorLabel(hoveredNode.sector)}
            {tooltipEdge ? ` · correlation ${tooltipEdge.correlation.toFixed(2)} · ${correlationDescriptor(tooltipEdge.absCorrelation)}` : ''}
            {hoveredNode.name ? ` · ${hoveredNode.name}` : ''}
          </span>
        ) : (
          <span>
            Hover a node to inspect country, sector, correlation strength, and graph neighbors.
          </span>
        )}
      </div>
      <p className="text-[11px] text-content-muted">
        {centerName ? `${centerTicker}: ${centerName} · ` : null}
        {graph.asOf ? `As of ${graph.asOf} · ` : null}
        Window {graph.window}
      </p>
    </div>
  )
}
