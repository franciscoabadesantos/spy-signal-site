'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force'
import ChartContainer, { ChartTooltipCard } from '@/components/charts/ChartContainer'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import {
  buildCountryLegend,
  buildSectorLegend,
  countryDisplayName,
  nodeColor,
  normalizeGicsSector,
  sectorLabel,
  type ColorMode,
  type GicsSectorKey,
} from '@/lib/network-regions'
import { cn } from '@/lib/utils'

type LayoutNode = NetworkNode &
  SimulationNodeDatum & {
    id: string
    radius: number
  }

type LayoutEdge = NetworkEdge & {
  id: string
}

type TooltipState = {
  ticker: string
  x: number
  y: number
}

type TransformState = {
  x: number
  y: number
  k: number
}

type PanState = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
} | null

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join('__')
}

function edgeStroke(edge: NetworkEdge): string {
  const alpha = clamp(0.16 + edge.absCorrelation * 0.7, 0.22, 0.86)
  return edge.correlation >= 0 ? `rgba(54, 179, 255, ${alpha})` : `rgba(255, 134, 123, ${alpha})`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatMarketCap(value: number | null): string {
  if (!value || !Number.isFinite(value)) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

function marketCapRadius(marketCap: number | null): number {
  if (!marketCap || !Number.isFinite(marketCap) || marketCap <= 0) return 7
  const normalized = clamp((Math.log10(marketCap) - 7.5) / 5.2, 0, 1)
  return 6 + normalized * 13
}

function filterEdges(edges: NetworkEdge[], threshold: number, topK: number): LayoutEdge[] {
  const included = new Map<string, LayoutEdge>()
  const counts = new Map<string, number>()
  const increment = (edge: NetworkEdge) => {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1)
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1)
  }

  for (const edge of edges.filter((item) => item.inMst).sort((a, b) => b.absCorrelation - a.absCorrelation)) {
    const id = edgeKey(edge.source, edge.target)
    included.set(id, { ...edge, id })
    increment(edge)
  }

  const candidates = edges
    .filter((edge) => !edge.inMst && edge.absCorrelation >= threshold)
    .sort((a, b) => b.absCorrelation - a.absCorrelation)

  for (const edge of candidates) {
    if ((counts.get(edge.source) ?? 0) >= topK || (counts.get(edge.target) ?? 0) >= topK) continue
    const id = edgeKey(edge.source, edge.target)
    if (included.has(id)) continue
    included.set(id, { ...edge, id })
    increment(edge)
  }

  return [...included.values()].sort((a, b) => Number(a.inMst) - Number(b.inMst) || a.absCorrelation - b.absCorrelation)
}

function buildLayout({
  nodes,
  edges,
  width,
  height,
}: {
  nodes: NetworkNode[]
  edges: LayoutEdge[]
  width: number
  height: number
}): LayoutNode[] {
  const layoutNodes: LayoutNode[] = nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2
    const ring = Math.min(width, height) * (0.2 + (index % 5) * 0.035)
    return {
      ...node,
      id: node.ticker,
      radius: marketCapRadius(node.marketCap),
      x: width / 2 + Math.cos(angle) * ring,
      y: height / 2 + Math.sin(angle) * ring,
    }
  })

  const linkEdges = edges.map((edge) => ({ ...edge }))
  const simulation = forceSimulation<LayoutNode>(layoutNodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutEdge>(linkEdges)
        .id((node) => node.id)
        .distance((edge) => (edge.inMst ? 82 : 118) - edge.absCorrelation * 24)
        .strength((edge) => (edge.inMst ? 0.76 : 0.24 + edge.absCorrelation * 0.2))
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-78))
    .force('collide', forceCollide<LayoutNode>().radius((node) => node.radius + 7).strength(0.86))
    .force('center', forceCenter(width / 2, height / 2))
    .stop()

  for (let index = 0; index < 260; index += 1) simulation.tick()

  // No hard clamp to the viewport — that pins overflowing nodes to the walls/corners.
  // The canvas fits the whole graph into view via an initial zoom/pan transform instead.
  return layoutNodes
}

function computeFitTransform(nodes: LayoutNode[], width: number, height: number): TransformState {
  if (nodes.length === 0) return { x: 0, y: 0, k: 1 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    const x = node.x ?? width / 2
    const y = node.y ?? height / 2
    const r = node.radius + 16 // padding for ring/label
    minX = Math.min(minX, x - r)
    maxX = Math.max(maxX, x + r)
    minY = Math.min(minY, y - r)
    maxY = Math.max(maxY, y + r)
  }
  const contentW = Math.max(1, maxX - minX)
  const contentH = Math.max(1, maxY - minY)
  const pad = 24
  const k = clamp(Math.min((width - pad * 2) / contentW, (height - pad * 2) / contentH), 0.3, 1.4)
  return {
    x: width / 2 - ((minX + maxX) / 2) * k,
    y: height / 2 - ((minY + maxY) / 2) * k,
    k,
  }
}

function NetworkCanvas({
  graph,
  threshold,
  topK,
  colorMode,
  sectorFilter,
  width,
  height,
}: {
  graph: NetworkGraph
  threshold: number
  topK: number
  colorMode: ColorMode
  sectorFilter: GicsSectorKey | null
  width: number
  height: number
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hover, setHover] = useState<TooltipState | null>(null)
  const [panState, setPanState] = useState<PanState>(null)
  const visibleEdges = useMemo(() => filterEdges(graph.edges, threshold, topK), [graph.edges, threshold, topK])
  const nodes = useMemo(() => buildLayout({ nodes: graph.nodes, edges: visibleEdges, width, height }), [graph.nodes, visibleEdges, width, height])
  const fitTransform = useMemo(() => computeFitTransform(nodes, width, height), [nodes, width, height])
  const [transform, setTransform] = useState<TransformState>(fitTransform)
  // Re-fit the whole graph into view whenever the layout or canvas size changes
  // (initial load, threshold/topK change, resize). User pan/zoom persists otherwise.
  useEffect(() => {
    setTransform(fitTransform)
  }, [fitTransform])
  const nodeByTicker = useMemo(() => new Map(nodes.map((node) => [node.ticker, node])), [nodes])
  const hoveredNode = hover ? nodeByTicker.get(hover.ticker) ?? null : null
  const connectedTickers = useMemo(() => {
    if (!hover) return null
    const connected = new Set<string>([hover.ticker])
    for (const edge of visibleEdges) {
      if (edge.source === hover.ticker) connected.add(edge.target)
      if (edge.target === hover.ticker) connected.add(edge.source)
    }
    return connected
  }, [hover, visibleEdges])
  const connectedEdges = useMemo(() => {
    if (!hover) return null
    return new Set(visibleEdges.filter((edge) => edge.source === hover.ticker || edge.target === hover.ticker).map((edge) => edge.id))
  }, [hover, visibleEdges])
  const strongestEdge = hover
    ? visibleEdges
        .filter((edge) => edge.source === hover.ticker || edge.target === hover.ticker)
        .sort((a, b) => b.absCorrelation - a.absCorrelation)[0] ?? null
    : null

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        width={width}
        height={height}
        className="block cursor-grab touch-none rounded-[8px] bg-[var(--bg-surface)] active:cursor-grabbing"
        role="img"
        aria-label="Global market correlation network"
        onWheel={(event) => {
          event.preventDefault()
          const nextK = clamp(transform.k * (event.deltaY > 0 ? 0.92 : 1.08), 0.3, 2.6)
          setTransform((prev) => ({ ...prev, k: nextK }))
        }}
        onPointerDown={(event) => {
          if ((event.target as Element).closest('a')) return
          event.currentTarget.setPointerCapture(event.pointerId)
          setPanState({
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: transform.x,
            originY: transform.y,
          })
        }}
        onPointerMove={(event) => {
          if (!panState || panState.pointerId !== event.pointerId) return
          setTransform((prev) => ({
            ...prev,
            x: panState.originX + event.clientX - panState.startX,
            y: panState.originY + event.clientY - panState.startY,
          }))
        }}
        onPointerUp={() => setPanState(null)}
        onPointerCancel={() => setPanState(null)}
      >
        <g transform={`translate(${transform.x.toFixed(2)} ${transform.y.toFixed(2)}) scale(${transform.k.toFixed(3)})`}>
          {visibleEdges.map((edge) => {
            const source = nodeByTicker.get(edge.source)
            const target = nodeByTicker.get(edge.target)
            if (!source || !target) return null
            const isHighlighted = connectedEdges ? connectedEdges.has(edge.id) : false
            const touchesSector =
              !sectorFilter ||
              normalizeGicsSector(source.sector) === sectorFilter ||
              normalizeGicsSector(target.sector) === sectorFilter
            const isDimmed = (connectedEdges ? !isHighlighted : false) || !touchesSector
            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edgeStroke(edge)}
                strokeOpacity={isDimmed ? 0.05 : edge.inMst ? 0.88 : 0.42}
                strokeWidth={(isHighlighted ? 3.4 : edge.inMst ? 2.2 : 1.05 + edge.absCorrelation * 1.2) / transform.k}
                strokeDasharray={edge.inMst ? undefined : '4 8'}
                strokeLinecap="round"
              />
            )
          })}

          {nodes.map((node) => {
            const color = nodeColor(node, colorMode)
            const isHovered = hover?.ticker === node.ticker
            const isConnected = connectedTickers ? connectedTickers.has(node.ticker) : false
            const isSectorDimmed = sectorFilter ? normalizeGicsSector(node.sector) !== sectorFilter : false
            const isDimmed = (connectedTickers ? !isConnected : false) || isSectorDimmed
            return (
              <a
                key={node.ticker}
                href={`/stocks/${node.ticker}`}
                onMouseEnter={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setHover({
                    ticker: node.ticker,
                    x: clamp(event.clientX - rect.left + 12, 10, rect.width - 236),
                    y: clamp(event.clientY - rect.top - 8, 10, rect.height - 138),
                  })
                }}
                onMouseMove={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setHover({
                    ticker: node.ticker,
                    x: clamp(event.clientX - rect.left + 12, 10, rect.width - 236),
                    y: clamp(event.clientY - rect.top - 8, 10, rect.height - 138),
                  })
                }}
                onMouseLeave={() => setHover((prev) => (prev?.ticker === node.ticker ? null : prev))}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={(node.radius + (isHovered ? 4 : 1.5)) / transform.k}
                  fill={color}
                  fillOpacity={isDimmed ? 0.14 : 0.3}
                  stroke={color}
                  strokeWidth={(isHovered ? 2.8 : 1.4) / transform.k}
                  opacity={isDimmed ? 0.25 : 1}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={Math.max(3.5, node.radius * 0.45) / transform.k}
                  fill={color}
                  fillOpacity={isDimmed ? 0.18 : 0.8}
                />
                {(isHovered || node.radius >= 15 || isConnected) ? (
                  <text
                    x={node.x}
                    y={(node.y ?? 0) - (node.radius + 7) / transform.k}
                    textAnchor="middle"
                    className="text-[10px] font-semibold"
                    fill="var(--text-primary)"
                    stroke="var(--bg-surface)"
                    strokeWidth={3 / transform.k}
                    paintOrder="stroke"
                    opacity={isDimmed ? 0.2 : 0.92}
                  >
                    {node.ticker}
                  </text>
                ) : null}
                <title>{`${node.ticker} · ${countryDisplayName(node.country, node.region)} · ${sectorLabel(node.sector)}`}</title>
              </a>
            )
          })}
        </g>
      </svg>

      {hover && hoveredNode ? (
        <div className="pointer-events-none absolute z-20" style={{ left: hover.x, top: hover.y }}>
          <ChartTooltipCard
            title={hoveredNode.ticker}
            rows={[
              { label: 'Name', value: hoveredNode.name ?? '—' },
              {
                label: 'Country',
                value: countryDisplayName(hoveredNode.country, hoveredNode.region),
                swatchColor: nodeColor(hoveredNode, colorMode),
              },
              { label: 'Sector', value: sectorLabel(hoveredNode.sector) },
              { label: 'Market cap', value: formatMarketCap(hoveredNode.marketCap) },
              {
                label: 'Top correlation',
                value: strongestEdge ? strongestEdge.correlation.toFixed(2) : '—',
                swatchColor: strongestEdge ? edgeStroke(strongestEdge) : undefined,
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  )
}

export default function MarketCorrelationNetwork({ graph }: { graph: NetworkGraph }) {
  const [threshold, setThreshold] = useState(0.5)
  const [topK, setTopK] = useState(5)
  const [colorMode, setColorMode] = useState<ColorMode>('zone')
  const [sectorFilter, setSectorFilter] = useState<GicsSectorKey | null>(null)
  const visibleEdges = useMemo(() => filterEdges(graph.edges, threshold, topK), [graph.edges, threshold, topK])
  const countryLegend = useMemo(() => buildCountryLegend(graph.nodes), [graph.nodes])
  const sectorLegend = useMemo(() => buildSectorLegend(graph.nodes), [graph.nodes])
  const sectorFilterOptions = sectorLegend.filter((item) => item.key !== 'unknown')
  const hasSectorData = sectorFilterOptions.length > 0
  const activeColorLegend = colorMode === 'field' && hasSectorData ? sectorLegend : countryLegend

  function setRequestedColorMode(mode: ColorMode) {
    if (mode === 'field' && !hasSectorData) return
    setColorMode(mode)
  }

  return (
    <div className="section-gap">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-h-[620px] overflow-hidden rounded-[8px] border border-border bg-surface p-2">
          <ChartContainer className="h-[620px]" loadingText="Loading market network...">
            {({ width, height }) => (
              <NetworkCanvas
                graph={graph}
                threshold={threshold}
                topK={topK}
                colorMode={colorMode}
                sectorFilter={sectorFilter}
                width={width}
                height={height}
              />
            )}
          </ChartContainer>
        </div>

        <aside className="space-y-4 rounded-[8px] border border-border bg-surface-elevated p-4">
          <div>
            <div className="text-filter-label">Colour</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['zone', 'field'] as ColorMode[]).map((mode) => {
                const disabled = mode === 'field' && !hasSectorData
                const isActive = colorMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRequestedColorMode(mode)}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-label-sm transition',
                      isActive
                        ? 'border-primary/50 bg-primary/10 text-content-primary'
                        : 'border-border bg-surface text-content-secondary hover:bg-surface-hover',
                      disabled ? 'cursor-not-allowed opacity-45 hover:bg-surface' : undefined
                    )}
                    title={disabled ? 'Field colouring is coming soon once sector data is available.' : undefined}
                  >
                    {mode === 'zone' ? 'Zone' : 'Field'}
                  </button>
                )
              })}
            </div>
            {!hasSectorData ? (
              <div className="mt-2 text-caption text-content-muted">Field mode coming soon with sector data.</div>
            ) : null}
          </div>

          <div>
            <div className="text-filter-label">Edge threshold</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Minimum absolute correlation"
              />
              <span className="numeric-tabular text-label-sm text-content-primary">{formatPercent(threshold)}</span>
            </div>
          </div>

          <div>
            <div className="text-filter-label">Top-K density</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Maximum non-backbone edges per node"
              />
              <span className="numeric-tabular text-label-sm text-content-primary">{topK}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-caption text-content-muted">
            <div>
              <div className="text-label-sm text-content-primary">{graph.nodes.length}</div>
              Nodes
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{visibleEdges.length}</div>
              Visible edges
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{visibleEdges.filter((edge) => edge.inMst).length}</div>
              Backbone
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{graph.window}</div>
              Window
            </div>
          </div>

          <div>
            <div className="text-filter-label">{colorMode === 'field' && hasSectorData ? 'Field legend' : 'Zone legend'}</div>
            <div className="mt-2 max-h-48 space-y-2 overflow-auto pr-1">
              {activeColorLegend.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-caption text-content-secondary">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>
                      {item.label}
                      {'familyLabel' in item && item.familyLabel !== item.label ? (
                        <span className="text-content-muted"> · {item.familyLabel}</span>
                      ) : null}
                    </span>
                  </span>
                  {'count' in item ? <span className="numeric-tabular">{item.count}</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-filter-label">Sector spotlight</div>
              {sectorFilter ? (
                <button
                  type="button"
                  className="text-caption text-content-muted underline-offset-2 hover:text-content-primary hover:underline"
                  onClick={() => setSectorFilter(null)}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {hasSectorData ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {sectorFilterOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSectorFilter((current) => (current === item.key ? null : item.key))}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-caption transition',
                      sectorFilter === item.key
                        ? 'border-primary/60 bg-primary/10 text-content-primary'
                        : 'border-border bg-surface text-content-secondary hover:bg-surface-hover'
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-[8px] border border-dashed border-border px-3 py-2 text-caption text-content-muted">
                Coming soon once sector data is populated.
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3 text-caption text-content-muted">
            <div className="flex items-center gap-2">
              <span className="inline-block h-px w-8 bg-[#36B3FF]" />
              Positive correlation
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-px w-8 bg-[#FF867B]" />
              Negative correlation
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-px w-8 border-t-2 border-dashed border-content-muted" />
              Non-backbone edge
            </div>
          </div>
        </aside>
      </div>

      <div className={cn('text-caption text-content-muted', graph.asOf ? undefined : 'text-content-secondary')}>
        {graph.asOf ? `As of ${graph.asOf}` : 'Fixture data'} · window {graph.window} · backbone edges always stay visible.
      </div>
    </div>
  )
}
