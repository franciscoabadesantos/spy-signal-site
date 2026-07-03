'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { forceCenter, forceCollide, forceManyBody, forceRadial, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { ChartTooltipCard } from '@/components/charts/ChartContainer'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import {
  countryDisplayName,
  nodeColor,
  normalizeGicsSector,
  sectorLabel,
  type ColorMode,
  type GicsSectorKey,
} from '@/lib/network-regions'
import type { ForceGraphMethods } from 'react-force-graph-2d'

type ForceGraph2DComponent = React.ComponentType<{
  ref?: MutableRefObject<ForceGraphMethods<GraphNode, GraphLink> | undefined>
  [key: string]: unknown
}>

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[220px] items-center justify-center text-xs text-content-muted">
      Loading correlation network...
    </div>
  ),
}) as unknown as ForceGraph2DComponent

export const NETWORK_PHYSICS = {
  velocityDecay: 0.28,
  alphaDecay: 0.02,
  cooldownTimeMs: 15_000,
  globalCharge: -90,
  peerCharge: 0,
  collidePadding: 6,
  peerCollidePadding: 6,
  linkStrengthBase: 0.06,
  linkStrengthCorrelation: 0.28,
  mstLinkStrength: 0.45,
  linkDistanceBase: 45,
  linkDistanceSpread: 140,
  peerOrbitMinDistance: 34,
  peerOrbitSpread: 330,
  peerRadialStrength: 2.4,
  peerSectorStrength: 0.006,
} as const

export const NETWORK_ARCS = {
  curvature: 0.25,
  peerCurvature: 0.22,
  mstWidth: 2.6,
  baseWidth: 0.8,
  correlationWidth: 3.6, // higher contrast: strong correlations read much thicker than weak ones
  baseAlpha: 0.12,
  correlationAlpha: 0.6,
  // On the GLOBAL map, edges rest at a uniform readable opacity (strength is shown by
  // thickness, not by fading). Strength-scaled opacity is kept only for the per-ticker peer web.
  globalRestingAlpha: 0.4,
} as const

export const NETWORK_GLOW = {
  normalBlur: 10,
  focusBlur: 22,
  clusterAlpha: 1,
  dimAlpha: 0.12,
  sectorDimAlpha: 0.18,
} as const

export const NETWORK_LOD = {
  zoomOutScale: 0.7,
  zoomMidScale: 1.1,
  zoomNearScale: 1.8,
  zoomOutNodeLimit: 150,
  zoomMidNodeLimit: 450,
  zoomNearNodeLimit: 900,
  zoomOutLabelLimit: 34,
  zoomMidLabelLimit: 80,
  zoomNearLabelLimit: 140,
} as const

type NetworkGraphCanvasProps = {
  graph: NetworkGraph
  colorMode?: ColorMode
  sectorFilter?: GicsSectorKey | null
  mode: 'global' | 'peer'
  centerTicker?: string
  threshold?: number
  topK?: number
  width: number
  height: number
}

type GraphNode = NetworkNode &
  SimulationNodeDatum & {
  id: string
  radius: number
  rank: number
  isCenter: boolean
  relationshipStrength: number
  relationshipRank: number
  relationshipLayer: string | null
  relationshipThemes: string[]
  orbitRadius: number
  orbitAngle: number
  orbitX: number
  orbitY: number
  }

type GraphLink = Omit<NetworkEdge, 'source' | 'target'> & {
  id: string
  source: string | GraphNode
  target: string | GraphNode
}

type MutableLinkForce = {
  distance: (accessor: (link: GraphLink) => number) => MutableLinkForce
  strength: (accessor: (link: GraphLink) => number) => MutableLinkForce
}

type TooltipState = {
  ticker: string
  x: number
  y: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join('__')
}

function formatMarketCap(value: number | null): string {
  if (!value || !Number.isFinite(value)) return '-'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${Math.round(value).toLocaleString()}`
}

function correlationDescriptor(absCorrelation: number): 'Strong' | 'Moderate' | 'Weak' {
  if (absCorrelation >= 0.75) return 'Strong'
  if (absCorrelation >= 0.5) return 'Moderate'
  return 'Weak'
}

function marketCapRadius(marketCap: number | null, isCenter: boolean): number {
  if (!marketCap || !Number.isFinite(marketCap) || marketCap <= 0) return 5
  // Market cap spans ~1000x (billions -> trillions). Log keeps it on-screen; the power>1 and the
  // wide radius range make megacaps clearly dominate while small caps stay visible.
  // Window ~ $1B (log 9) to ~$4T (log 12.6); values above clamp so one outlier can't dwarf the rest.
  const normalized = clamp((Math.log10(marketCap) - 9) / 3.6, 0, 1)
  const emphasized = Math.pow(normalized, 1.5)
  const radius = 5 + emphasized * 28
  return isCenter ? Math.max(14, radius) : radius
}

function peerNodeRadius(strength: number, isCenter: boolean): number {
  if (isCenter) return 15
  return 7 + clamp(Math.abs(strength), 0, 1) * 5
}

function linkColor(edge: Pick<NetworkEdge, 'correlation' | 'relationshipColor'>, alpha = 1): string {
  if (typeof edge.relationshipColor === 'string') {
    return edge.relationshipColor.includes('rgba(')
      ? edge.relationshipColor
      : hexToRgba(edge.relationshipColor, alpha)
  }
  return edge.correlation >= 0 ? `rgba(54, 179, 255, ${alpha})` : `rgba(255, 134, 123, ${alpha})`
}

function linkWidth(edge: Pick<NetworkEdge, 'inMst' | 'absCorrelation' | 'relationshipWidthBoost' | 'relationshipConfidence'>, mode: 'global' | 'peer'): number {
  if (mode === 'peer') {
    const confidence = confidenceValue(edge.relationshipConfidence)
    if (confidence !== null) return 1.25 + confidence * 5.6
    return 1.5 + edge.absCorrelation * 2.4
  }
  return (edge.inMst ? NETWORK_ARCS.mstWidth : NETWORK_ARCS.baseWidth) + edge.absCorrelation * NETWORK_ARCS.correlationWidth + (edge.relationshipWidthBoost ?? 0)
}

function linkAlpha(edge: Pick<NetworkEdge, 'absCorrelation' | 'relationshipAlpha'>): number {
  if (typeof edge.relationshipAlpha === 'number' && Number.isFinite(edge.relationshipAlpha)) {
    return clamp(edge.relationshipAlpha, 0.08, 1)
  }
  return clamp(NETWORK_ARCS.baseAlpha + edge.absCorrelation * NETWORK_ARCS.correlationAlpha, 0.16, 0.86)
}

function hexToRgba(color: string, alpha: number): string {
  const hex = color.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color
  const value = Number.parseInt(hex, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function linkCurvature(link: GraphLink, mode: 'global' | 'peer'): number {
  if (typeof link.relationshipCurvature === 'number' && Number.isFinite(link.relationshipCurvature)) {
    return link.relationshipCurvature
  }
  return mode === 'peer' ? NETWORK_ARCS.peerCurvature : NETWORK_ARCS.curvature
}

function peerOrbitDistance(strength: number): number {
  const normalized = clamp(Math.abs(strength), 0, 1)
  return NETWORK_PHYSICS.peerOrbitMinDistance + Math.pow(1 - normalized, 2.1) * NETWORK_PHYSICS.peerOrbitSpread
}

function confidenceValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return clamp(value > 1 ? value / 100 : value, 0, 1)
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function relationshipSectorKey(node: NetworkNode, edge: NetworkEdge | null): string {
  const theme = edge?.relationshipThemes?.find((item) => item.trim())
  if (theme) return `theme:${theme.trim().toLowerCase()}`
  if (node.region) return `region:${node.region}`
  if (node.country) return `country:${node.country}`
  if (node.sector) return `sector:${node.sector}`
  return `ticker:${node.ticker}`
}

function relationshipSectorAngle(node: NetworkNode, edge: NetworkEdge | null): number {
  const key = relationshipSectorKey(node, edge)
  const sector = hashString(key) % 12
  const jitter = ((hashString(`${key}:${node.ticker}`) % 100) / 100 - 0.5) * 0.34
  return -Math.PI / 2 + (sector / 12) * Math.PI * 2 + jitter
}

function peerOrbitAngle(node: NetworkNode, edge: NetworkEdge | null, peerIndex: number, peerCount: number): number {
  const base = -Math.PI / 2 + (peerIndex / Math.max(1, peerCount)) * Math.PI * 2
  const sector = relationshipSectorAngle(node, edge)
  const delta = Math.atan2(Math.sin(sector - base), Math.cos(sector - base))
  const jitter = ((hashString(`${node.ticker}:orbit`) % 100) / 100 - 0.5) * 0.06
  return base + delta * 0.14 + jitter
}

function formatTooltipConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return value <= 1 ? `${Math.round(value * 100)}%` : `${Math.round(value)}%`
}

export function selectGlobalEdges(edges: NetworkEdge[], threshold: number, topK: number): NetworkEdge[] {
  const included = new Map<string, NetworkEdge>()
  const counts = new Map<string, number>()
  const increment = (edge: NetworkEdge) => {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1)
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1)
  }

  for (const edge of edges.filter((item) => item.inMst).sort((a, b) => b.absCorrelation - a.absCorrelation)) {
    const id = edgeKey(edge.source, edge.target)
    included.set(id, edge)
    increment(edge)
  }

  const candidates = edges
    .filter((edge) => !edge.inMst && edge.absCorrelation >= threshold)
    .sort((a, b) => b.absCorrelation - a.absCorrelation)

  for (const edge of candidates) {
    if ((counts.get(edge.source) ?? 0) >= topK || (counts.get(edge.target) ?? 0) >= topK) continue
    const id = edgeKey(edge.source, edge.target)
    if (included.has(id)) continue
    included.set(id, edge)
    increment(edge)
  }

  return [...included.values()].sort((a, b) => Number(a.inMst) - Number(b.inMst) || a.absCorrelation - b.absCorrelation)
}

function sourceId(link: GraphLink): string {
  return typeof link.source === 'object' ? link.source.id : link.source
}

function targetId(link: GraphLink): string {
  return typeof link.target === 'object' ? link.target.id : link.target
}

function sourceNode(link: GraphLink): GraphNode | null {
  return typeof link.source === 'object' ? link.source : null
}

function targetNode(link: GraphLink): GraphNode | null {
  return typeof link.target === 'object' ? link.target : null
}

function visibleLimitForScale(scale: number): { nodes: number; labels: number } {
  if (scale < NETWORK_LOD.zoomOutScale) {
    return { nodes: NETWORK_LOD.zoomOutNodeLimit, labels: NETWORK_LOD.zoomOutLabelLimit }
  }
  if (scale < NETWORK_LOD.zoomMidScale) {
    return { nodes: NETWORK_LOD.zoomMidNodeLimit, labels: NETWORK_LOD.zoomMidLabelLimit }
  }
  if (scale < NETWORK_LOD.zoomNearScale) {
    return { nodes: NETWORK_LOD.zoomNearNodeLimit, labels: NETWORK_LOD.zoomNearLabelLimit }
  }
  return { nodes: Number.POSITIVE_INFINITY, labels: Number.POSITIVE_INFINITY }
}

function buildGraphData({
  graph,
  mode,
  centerTicker,
  threshold,
  topK,
}: {
  graph: NetworkGraph
  mode: 'global' | 'peer'
  centerTicker: string | null
  threshold: number
  topK: number
}): { nodes: GraphNode[]; links: GraphLink[] } {
  const normalizedCenter = centerTicker?.trim().toUpperCase() ?? null
  const capRanks = new Map(
    [...graph.nodes]
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .map((node, index) => [node.ticker, index + 1])
  )
  const nodeByTicker = new Map(graph.nodes.map((node) => [node.ticker, node]))
  const rawEdges =
    mode === 'peer' && normalizedCenter
      ? graph.edges
          .filter((edge) => nodeByTicker.has(edge.source) && nodeByTicker.has(edge.target))
          .filter((edge) => edge.source === normalizedCenter || edge.target === normalizedCenter)
          .sort((a, b) => a.absCorrelation - b.absCorrelation)
      : selectGlobalEdges(graph.edges, threshold, topK)

  const centerEdgesByTicker = new Map<string, NetworkEdge>()
  if (mode === 'peer' && normalizedCenter) {
    for (const edge of rawEdges) {
      const peer = edge.source === normalizedCenter ? edge.target : edge.target === normalizedCenter ? edge.source : null
      if (!peer) continue
      const current = centerEdgesByTicker.get(peer)
      if (!current || edge.absCorrelation > current.absCorrelation) centerEdgesByTicker.set(peer, edge)
    }
  }
  const relationshipRanks = new Map(
    [...centerEdgesByTicker.entries()]
      .sort((a, b) => b[1].absCorrelation - a[1].absCorrelation || a[0].localeCompare(b[0]))
      .map(([ticker], index) => [ticker, index + 1])
  )
  const peerCount = centerEdgesByTicker.size

  const includedTickers = new Set<string>()
  if (mode === 'peer' && normalizedCenter) includedTickers.add(normalizedCenter)
  for (const edge of rawEdges) {
    includedTickers.add(edge.source)
    includedTickers.add(edge.target)
  }

  const visibleNodes = graph.nodes.filter((node) => (mode === 'peer' ? includedTickers.has(node.ticker) : true))
  const nodes = visibleNodes.map<GraphNode>((node, index) => {
    const isCenter = node.ticker === normalizedCenter
    const relationshipEdge = isCenter ? null : centerEdgesByTicker.get(node.ticker) ?? null
    const relationshipStrength = relationshipEdge?.absCorrelation ?? 0
    const relationshipRank = isCenter ? 0 : relationshipRanks.get(node.ticker) ?? Number.MAX_SAFE_INTEGER
    const angle =
      mode === 'peer'
        ? isCenter
          ? 0
          : peerOrbitAngle(node, relationshipEdge, Math.max(0, relationshipRank - 1), peerCount)
        : -Math.PI / 2 + (index / Math.max(1, visibleNodes.length)) * Math.PI * 2
    const ring = mode === 'peer' ? (isCenter ? 0 : peerOrbitDistance(relationshipStrength)) : 180 + (index % 9) * 22
    const orbitX = Math.cos(angle) * ring
    const orbitY = Math.sin(angle) * ring
    return {
      ...node,
      id: node.ticker,
      radius: mode === 'peer' ? peerNodeRadius(relationshipStrength, isCenter) : marketCapRadius(node.marketCap, isCenter),
      rank: capRanks.get(node.ticker) ?? Number.MAX_SAFE_INTEGER,
      isCenter,
      relationshipStrength,
      relationshipRank,
      relationshipLayer: relationshipEdge?.relationshipLayer ?? null,
      relationshipThemes: relationshipEdge?.relationshipThemes ?? [],
      orbitRadius: ring,
      orbitAngle: angle,
      orbitX,
      orbitY,
      x: isCenter ? 0 : orbitX,
      y: isCenter ? 0 : orbitY,
      fx: isCenter && mode === 'peer' ? 0 : undefined,
      fy: isCenter && mode === 'peer' ? 0 : undefined,
    }
  })

  const existingTickers = new Set(nodes.map((node) => node.ticker))
  const links = rawEdges
    .filter((edge) => existingTickers.has(edge.source) && existingTickers.has(edge.target))
    .map<GraphLink>((edge) => ({
      ...edge,
      id: edge.id ?? edgeKey(edge.source, edge.target),
      source: edge.source,
      target: edge.target,
    }))

  return { nodes, links }
}

export default function NetworkGraphCanvas({
  graph,
  colorMode = 'zone',
  sectorFilter = null,
  mode,
  centerTicker,
  threshold = 0.5,
  topK = 5,
  width,
  height,
}: NetworkGraphCanvasProps) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined)
  const [zoomScale, setZoomScale] = useState(1)
  const [hover, setHover] = useState<TooltipState | null>(null)
  const [dragTicker, setDragTicker] = useState<string | null>(null)
  const center = centerTicker?.trim().toUpperCase() ?? graph.focus?.trim().toUpperCase() ?? null

  const graphData = useMemo(
    () => buildGraphData({ graph, mode, centerTicker: center, threshold, topK }),
    [center, graph, mode, threshold, topK]
  )

  const nodeByTicker = useMemo(() => new Map(graphData.nodes.map((node) => [node.ticker, node])), [graphData.nodes])
  const focusedTicker = dragTicker ?? hover?.ticker ?? null
  const connectedTickers = useMemo(() => {
    if (!focusedTicker) return null
    const connected = new Set<string>([focusedTicker])
    for (const link of graphData.links) {
      const source = sourceId(link)
      const target = targetId(link)
      if (source === focusedTicker) connected.add(target)
      if (target === focusedTicker) connected.add(source)
    }
    return connected
  }, [focusedTicker, graphData.links])
  const connectedEdges = useMemo(() => {
    if (!focusedTicker) return null
    return new Set(
      graphData.links
        .filter((link) => sourceId(link) === focusedTicker || targetId(link) === focusedTicker)
        .map((link) => link.id)
    )
  }, [focusedTicker, graphData.links])

  const strongestEdge = hover
    ? graphData.links
        .filter((link) => sourceId(link) === hover.ticker || targetId(link) === hover.ticker)
        .sort((a, b) => b.absCorrelation - a.absCorrelation)[0] ?? null
    : null
  const centerEdge = hover && center
    ? graphData.links.find(
        (link) =>
          (sourceId(link) === hover.ticker && targetId(link) === center) ||
          (targetId(link) === hover.ticker && sourceId(link) === center)
      ) ?? null
    : null

  const updateTooltipPosition = useCallback((clientX: number, clientY: number, ticker: string) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) {
      setHover({ ticker, x: 12, y: 12 })
      return
    }
    setHover({
      ticker,
      x: clamp(clientX - rect.left + 14, 10, Math.max(10, rect.width - 248)),
      y: clamp(clientY - rect.top - 8, 10, Math.max(10, rect.height - 150)),
    })
  }, [])

  const nodeIsVisible = useCallback(
    (node: GraphNode) => {
      if (mode === 'peer') return true
      if (node.isCenter) return true
      if (connectedTickers?.has(node.ticker)) return true
      return node.rank <= visibleLimitForScale(zoomScale).nodes
    },
    [connectedTickers, mode, zoomScale]
  )
  // Keep a stable ref so the layout/zoom-to-fit effect doesn't re-run (and reheat) on every
  // hover/zoom change — those would restart the sim and override the user's zoom.
  const nodeIsVisibleRef = useRef(nodeIsVisible)

  useEffect(() => {
    nodeIsVisibleRef.current = nodeIsVisible
  }, [nodeIsVisible])

  const linkIsVisible = useCallback(
    (link: GraphLink) => {
      const source = sourceNode(link)
      const target = targetNode(link)
      if (!source || !target) return true
      return nodeIsVisible(source) && nodeIsVisible(target)
    },
    [nodeIsVisible]
  )

  const isNodeDimmed = useCallback(
    (node: GraphNode) => {
      const isClusterDimmed = connectedTickers ? !connectedTickers.has(node.ticker) : false
      const isSectorDimmed = sectorFilter ? normalizeGicsSector(node.sector) !== sectorFilter : false
      return isClusterDimmed || isSectorDimmed
    },
    [connectedTickers, sectorFilter]
  )

  const isLinkDimmed = useCallback(
    (link: GraphLink) => {
      const source = sourceNode(link)
      const target = targetNode(link)
      const isClusterDimmed = connectedEdges ? !connectedEdges.has(link.id) : false
      const isSectorDimmed =
        sectorFilter && source && target
          ? normalizeGicsSector(source.sector) !== sectorFilter && normalizeGicsSector(target.sector) !== sectorFilter
          : false
      return isClusterDimmed || isSectorDimmed
    },
    [connectedEdges, sectorFilter]
  )

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let fitTimer = 0
    let centerTimer = 0

    const applyForcesAndLayout = () => {
      const fg = graphRef.current
      if (!fg) {
        // ForceGraph2D is dynamically imported (ssr:false), so its ref can still be null on the
        // first mount. Retry until it exists — otherwise the custom forces (incl. collide) are
        // never applied and the nodes stay overlapped until the next interaction reheats the sim.
        if (!cancelled) raf = requestAnimationFrame(applyForcesAndLayout)
        return
      }

      fg.d3Force(
        'charge',
        forceManyBody<GraphNode>().strength(mode === 'peer' ? NETWORK_PHYSICS.peerCharge : NETWORK_PHYSICS.globalCharge) as unknown as never
      )
      fg.d3Force(
        'collide',
        forceCollide<GraphNode>()
          .radius((node) => node.radius + (mode === 'peer' ? NETWORK_PHYSICS.peerCollidePadding : NETWORK_PHYSICS.collidePadding))
          .strength(1)
          .iterations(2) as unknown as never
      )
      fg.d3Force('center', forceCenter(0, 0) as unknown as never)
      fg.d3Force(
        'peer-radius',
        (mode === 'peer'
          ? forceRadial<GraphNode>((node) => (node.isCenter ? 0 : node.orbitRadius), 0, 0).strength((node) =>
              node.isCenter ? 1 : NETWORK_PHYSICS.peerRadialStrength
            )
          : null) as unknown as never
      )
      fg.d3Force(
        'peer-sector-x',
        (mode === 'peer'
          ? forceX<GraphNode>((node) => (node.isCenter ? 0 : node.orbitX)).strength((node) =>
              node.isCenter ? 1 : NETWORK_PHYSICS.peerSectorStrength
            )
          : null) as unknown as never
      )
      fg.d3Force(
        'peer-sector-y',
        (mode === 'peer'
          ? forceY<GraphNode>((node) => (node.isCenter ? 0 : node.orbitY)).strength((node) =>
              node.isCenter ? 1 : NETWORK_PHYSICS.peerSectorStrength
            )
          : null) as unknown as never
      )
      const linkForce = fg.d3Force('link') as unknown as MutableLinkForce | undefined
      if (linkForce) {
        linkForce
          .distance((link: GraphLink) =>
            mode === 'peer'
              ? peerOrbitDistance(link.absCorrelation)
              : NETWORK_PHYSICS.linkDistanceBase + (1 - link.absCorrelation) * NETWORK_PHYSICS.linkDistanceSpread
          )
          .strength((link: GraphLink) =>
            mode === 'peer'
              ? 0.28 + link.absCorrelation * 0.18
              : link.inMst
              ? NETWORK_PHYSICS.mstLinkStrength
              : NETWORK_PHYSICS.linkStrengthBase + link.absCorrelation * NETWORK_PHYSICS.linkStrengthCorrelation
          )
      }

      fg.d3ReheatSimulation()
      fitTimer = window.setTimeout(() => {
        fg.zoomToFit(650, mode === 'peer' ? 54 : 42, (node) => nodeIsVisibleRef.current(node as GraphNode))
        if (mode === 'peer') centerTimer = window.setTimeout(() => fg.centerAt(0, 0, 450), 680)
      }, 80)
    }

    applyForcesAndLayout()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (fitTimer) window.clearTimeout(fitTimer)
      if (centerTimer) window.clearTimeout(centerTimer)
    }
  }, [graphData, mode, width, height])

  if (graphData.nodes.length === 0 || graphData.links.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-[8px] border border-dashed border-border p-6 text-sm text-content-muted">
        Correlation relationships are not available for this ticker yet.
      </div>
    )
  }

  const hoveredNode = hover ? nodeByTicker.get(hover.ticker) ?? null : null

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden rounded-[8px] bg-[#07111f]"
      onMouseMove={(event) => {
        if (!hover) return
        updateTooltipPosition(event.clientX, event.clientY, hover.ticker)
      }}
      onMouseLeave={() => {
        setHover(null)
        setDragTicker(null)
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="#07111f"
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        d3VelocityDecay={NETWORK_PHYSICS.velocityDecay}
        d3AlphaDecay={NETWORK_PHYSICS.alphaDecay}
        cooldownTime={NETWORK_PHYSICS.cooldownTimeMs}
        // 0 (not the lib default) so the on-mount warmup doesn't pre-collapse the ring with the
        // library's DEFAULT forces (no collide) before our real forces + collide are applied.
        warmupTicks={0}
        minZoom={0.28}
        maxZoom={5}
        enableNodeDrag
        showPointerCursor={(object: GraphNode | GraphLink | undefined) => Boolean(object && 'ticker' in object)}
        nodeVisibility={(node: GraphNode) => nodeIsVisible(node)}
        linkVisibility={(link: GraphLink) => linkIsVisible(link)}
        linkCurvature={(link: GraphLink) => linkCurvature(link, mode)}
        linkWidth={(link: GraphLink) => linkWidth(link, mode)}
        linkColor={(link: GraphLink) => linkColor(link, linkAlpha(link))}
        linkLineDash={(link: GraphLink) => link.relationshipDash ?? (link.inMst ? null : [5, 8])}
        nodeLabel={(node: GraphNode) => `${node.ticker} - ${countryDisplayName(node.country, node.region)} - ${sectorLabel(node.sector)}`}
        linkLabel={(link: GraphLink) =>
          link.relationshipDescription ??
          `${sourceId(link)} / ${targetId(link)} - correlation ${link.correlation.toFixed(2)}`
        }
        onZoom={({ k }: { k: number }) => setZoomScale(k)}
        onNodeHover={(node: GraphNode | null) => {
          if (!node) {
            setHover(null)
            return
          }
          const rect = wrapperRef.current?.getBoundingClientRect()
          updateTooltipPosition(rect ? rect.left + width / 2 : 0, rect ? rect.top + 24 : 0, node.ticker)
        }}
        onNodeClick={(node: GraphNode) => {
          router.push(`/stocks/${node.ticker}`)
        }}
        onNodeDrag={(node: GraphNode) => {
          setDragTicker(node.ticker)
          if (mode === 'peer' && node.isCenter) {
            node.fx = 0
            node.fy = 0
          }
          graphRef.current?.d3ReheatSimulation()
        }}
        onNodeDragEnd={(node: GraphNode) => {
          setDragTicker(null)
          if (mode === 'peer' && node.isCenter) {
            node.fx = 0
            node.fy = 0
          } else {
            node.fx = undefined
            node.fy = undefined
          }
          graphRef.current?.d3ReheatSimulation()
        }}
        linkPointerAreaPaint={(link: GraphLink, color: string, ctx: CanvasRenderingContext2D) => {
          // Paint the hover hit-area along the SAME curved arc we render (with extra width as
          // tolerance), so hovering a line maps to the link you're actually over — not a nearby
          // straight-line path the library would otherwise hit-test against.
          const source = sourceNode(link)
          const target = targetNode(link)
          if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return
          const sx = source.x
          const sy = source.y
          const tx = target.x
          const ty = target.y
          const dx = tx - sx
          const dy = ty - sy
          const length = Math.max(1, Math.hypot(dx, dy))
          const curvature = linkCurvature(link, mode) * length
          const cx = (sx + tx) / 2 + (-dy / length) * curvature
          const cy = (sy + ty) / 2 + (dx / length) * curvature
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.quadraticCurveTo(cx, cy, tx, ty)
          ctx.strokeStyle = color
          ctx.lineWidth = Math.max(8, linkWidth(link, mode) + 4)
          ctx.lineCap = 'round'
          ctx.stroke()
        }}
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={(link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const source = sourceNode(link)
          const target = targetNode(link)
          if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return
          const sx = source.x
          const sy = source.y
          const tx = target.x
          const ty = target.y
          const dx = tx - sx
          const dy = ty - sy
          const length = Math.max(1, Math.hypot(dx, dy))
          const curvature = linkCurvature(link, mode) * length
          const cx = (sx + tx) / 2 + (-dy / length) * curvature
          const cy = (sy + ty) / 2 + (dx / length) * curvature
          const focused = connectedEdges?.has(link.id) ?? false
          const dimmed = isLinkDimmed(link)
          // Per-ticker: opacity encodes correlation strength. Global: uniform so nothing fades
          // away; strength reads from thickness, and hover handles focus/dim.
          const restingAlpha = mode === 'peer' ? linkAlpha(link) : NETWORK_ARCS.globalRestingAlpha
          const alpha = dimmed ? NETWORK_GLOW.dimAlpha : focused ? NETWORK_GLOW.clusterAlpha : restingAlpha

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.quadraticCurveTo(cx, cy, tx, ty)
          ctx.strokeStyle = linkColor(link, alpha)
          ctx.lineWidth = focused ? linkWidth(link, mode) + 1.4 : linkWidth(link, mode)
          ctx.lineCap = 'round'
          ctx.setLineDash(link.relationshipDash ?? [])
          if (focused) {
            ctx.shadowBlur = NETWORK_GLOW.focusBlur
            ctx.shadowColor = linkColor(link, 0.85)
          }
          ctx.stroke()
          ctx.restore()

          if (link.relationshipDirectional) {
            const t = 0.72
            const arrowX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * tx
            const arrowY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty
            const tangentX = 2 * (1 - t) * (cx - sx) + 2 * t * (tx - cx)
            const tangentY = 2 * (1 - t) * (cy - sy) + 2 * t * (ty - cy)
            const angle = Math.atan2(tangentY, tangentX)
            const arrowLength = (focused ? 10 : 8) / globalScale
            const arrowWidth = (focused ? 6 : 5) / globalScale

            ctx.save()
            ctx.translate(arrowX, arrowY)
            ctx.rotate(angle)
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(-arrowLength, -arrowWidth)
            ctx.lineTo(-arrowLength, arrowWidth)
            ctx.closePath()
            ctx.fillStyle = linkColor(link, Math.min(1, alpha + 0.18))
            ctx.shadowBlur = focused ? NETWORK_GLOW.focusBlur : 0
            ctx.shadowColor = linkColor(link, 0.75)
            ctx.fill()
            ctx.restore()
          }

          if (mode !== 'peer' && link.relationshipInlineLabel) {
            const t = 0.5
            const labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * tx
            const labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty
            const label = link.relationshipInlineLabel
            const fontSize = 9.5 / globalScale
            const paddingX = 5 / globalScale
            const paddingY = 3 / globalScale

            ctx.save()
            ctx.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`
            const metrics = ctx.measureText(label)
            const boxWidth = metrics.width + paddingX * 2
            const boxHeight = fontSize + paddingY * 2
            ctx.globalAlpha = dimmed ? 0.34 : 0.9
            ctx.fillStyle = 'rgba(7, 17, 31, 0.76)'
            ctx.strokeStyle = linkColor(link, 0.58)
            ctx.lineWidth = 1 / globalScale
            ctx.beginPath()
            ctx.roundRect(labelX - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight, 4 / globalScale)
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = '#f7fbff'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, labelX, labelY + 0.5 / globalScale)
            ctx.restore()
          }
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const x = node.x ?? 0
          const y = node.y ?? 0
          const focused = focusedTicker === node.ticker
          const connected = connectedTickers?.has(node.ticker) ?? false
          const dimmed = isNodeDimmed(node)
          const color = nodeColor(node, colorMode)
          const alpha = dimmed ? (sectorFilter ? NETWORK_GLOW.sectorDimAlpha : NETWORK_GLOW.dimAlpha) : 1
          const radius = node.radius + (focused ? 4 : connected ? 2 : 0)

          ctx.save()
          if (node.isCenter) {
            ctx.beginPath()
            ctx.arc(x, y, radius + 7, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255, 255, 255, ${dimmed ? 0.22 : 0.62})`
            ctx.lineWidth = 1.6
            ctx.setLineDash([2.5, 4.5])
            ctx.stroke()
            ctx.setLineDash([])
          } else if (mode === 'peer') {
            const edge = center
              ? graphData.links.find(
                  (link) =>
                    (sourceId(link) === node.ticker && targetId(link) === center) ||
                    (targetId(link) === node.ticker && sourceId(link) === center)
                )
              : null
            if (edge?.correlation && edge.correlation < 0) {
              ctx.beginPath()
              ctx.arc(x, y, radius + 4, 0, Math.PI * 2)
              ctx.strokeStyle = `rgba(255, 118, 108, ${dimmed ? 0.28 : 0.95})`
              ctx.lineWidth = 2
              ctx.setLineDash([3, 3])
              ctx.stroke()
              ctx.setLineDash([])
            }
          }

          ctx.beginPath()
          ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = alpha * (node.isCenter ? 0.38 : 0.26)
          ctx.shadowBlur = focused || connected ? NETWORK_GLOW.focusBlur : NETWORK_GLOW.normalBlur
          ctx.shadowColor = color
          ctx.fill()

          ctx.beginPath()
          ctx.arc(x, y, Math.max(4, radius * 0.48), 0, Math.PI * 2)
          ctx.globalAlpha = alpha * 0.88
          ctx.fillStyle = color
          ctx.shadowBlur = focused ? NETWORK_GLOW.focusBlur : 0
          ctx.fill()

          ctx.beginPath()
          ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2)
          ctx.globalAlpha = alpha
          ctx.strokeStyle = color
          ctx.lineWidth = focused ? 2.6 : node.isCenter ? 2.2 : 1.25
          ctx.stroke()

          const limits = visibleLimitForScale(globalScale)
          const showLabel =
            mode === 'peer'
              ? true
              : focused || connected || node.rank <= limits.labels
          if (showLabel) {
            const fontSize = (node.isCenter ? 12 : 10.5) / globalScale
            ctx.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = node.isCenter && mode === 'peer' ? 'middle' : 'bottom'
            ctx.lineWidth = 3.6 / globalScale
            ctx.strokeStyle = '#07111f'
            ctx.fillStyle = '#f7fbff'
            ctx.globalAlpha = dimmed ? 0.34 : 0.96
            const labelY = mode === 'peer' && !node.isCenter ? y - radius - 5 / globalScale : mode === 'peer' ? y : y - radius - 5 / globalScale
            ctx.strokeText(node.ticker, x, labelY)
            ctx.fillText(node.ticker, x, labelY)
          }
          ctx.restore()
        }}
        nodePointerAreaPaint={(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + 8, 0, Math.PI * 2)
          ctx.fill()
        }}
      />

      {hoveredNode && hover ? (
        <div className="pointer-events-none absolute z-20" style={{ left: hover.x, top: hover.y }}>
          <ChartTooltipCard
            title={hoveredNode.ticker}
            rows={[
              { label: 'Name', value: hoveredNode.name ?? '-' },
              {
                label: 'Country',
                value: countryDisplayName(hoveredNode.country, hoveredNode.region),
                swatchColor: nodeColor(hoveredNode, colorMode),
              },
              { label: 'Sector', value: sectorLabel(hoveredNode.sector) },
              { label: 'Market cap', value: formatMarketCap(hoveredNode.marketCap) },
              ...(mode === 'peer'
                ? [
                    {
                      label: centerEdge?.relationshipLabel ? 'Relationship' : center ? `Correlation vs ${center}` : 'Relationship',
                      value: centerEdge?.relationshipLabel ?? centerEdge?.correlation.toFixed(2) ?? '-',
                      swatchColor: centerEdge ? linkColor(centerEdge, 1) : undefined,
                    },
                    ...(centerEdge?.relationshipThemes?.length
                      ? [{ label: 'Themes', value: centerEdge.relationshipThemes.join(', ') }]
                      : []),
                    { label: 'Strength', value: centerEdge?.correlation.toFixed(2) ?? '-' },
                    { label: 'Confidence', value: formatTooltipConfidence(centerEdge?.relationshipConfidence) },
                  ]
                : [
                    {
                      label: 'Top correlation',
                      value: strongestEdge?.correlation.toFixed(2) ?? '-',
                      swatchColor: strongestEdge ? linkColor(strongestEdge, 1) : undefined,
                    },
                    { label: 'Strength', value: strongestEdge ? correlationDescriptor(strongestEdge.absCorrelation) : '-' },
                  ]),
            ]}
          />
        </div>
      ) : null}
    </div>
  )
}
