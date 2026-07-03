'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import NetworkGraphCanvas from '@/components/NetworkGraphCanvas'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import type { RelationshipNeighbor, RelationshipThemePeer, TickerRelationships } from '@/lib/relationships'
import { countryDisplayName } from '@/lib/network-regions'
import { cn } from '@/lib/utils'

type RelationshipWindow = 126 | 252
type ToggleLayer = 'residual' | 'theme' | 'leadLag' | 'market' | 'spurious'

type RelationshipOrbitProps = {
  centerTicker: string
  centerName: string | null
  relationshipsByWindow: Record<RelationshipWindow, TickerRelationships>
  maxNeighborsPerLayer?: number
}

type RelationshipRow = {
  symbol: string
  name: string | null
  label: string
  strength: number
  confidence: number
  country: string | null
  region: string | null
  tone: 'primary' | 'inverse' | 'theme' | 'lead' | 'market' | 'spurious'
}

const DEFAULT_LAYER_RENDER_LIMIT = 12

const LAYER_COPY: Record<ToggleLayer, { label: string; hint: string }> = {
  residual: {
    label: 'Residual co-movers',
    hint: 'mexe junto além do mercado',
  },
  theme: {
    label: 'Theme peers',
    hint: 'same ETF basket or investable theme',
  },
  leadLag: {
    label: 'Lead-lag',
    hint: 'tende a liderar/seguir',
  },
  market: {
    label: 'Market co-movers',
    hint: 'mexe junto (com o mercado todo)',
  },
  spurious: {
    label: 'Probable spurious',
    hint: 'provavelmente só ruído de mercado',
  },
}

const WINDOW_OPTIONS: RelationshipWindow[] = [126, 252]

function emptyNode(ticker: string, name: string | null = null): NetworkNode {
  return {
    ticker,
    name,
    country: null,
    region: null,
    sector: null,
    marketCap: null,
    degree: null,
  }
}

function formatStrength(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function formatConfidence(value: number): string {
  if (!Number.isFinite(value)) return '-'
  if (value <= 1) return `${Math.round(value * 100)}%`
  return `${Math.round(value)}%`
}

function themeDisplayName(theme: string | null): string {
  if (!theme) return 'theme basket'
  const key = theme.trim().toLowerCase().replace(/[-\s]+/g, '_')
  const labels: Record<string, string> = {
    ai_semis: 'AI-semis',
    glp1_obesity: 'GLP-1 / obesity',
    space: 'space',
  }
  return labels[key] ?? theme.replace(/[_-]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function themeKey(theme: string): string {
  return theme.trim().toLowerCase().replace(/[-\s]+/g, '_')
}

function peerThemes(peer: RelationshipThemePeer): string[] {
  const rawThemes = peer.themes.length > 0 ? peer.themes : peer.theme ? [peer.theme] : []
  const unique = new Map<string, string>()
  for (const theme of rawThemes) {
    const cleaned = theme.trim()
    if (!cleaned) continue
    unique.set(themeKey(cleaned), cleaned)
  }
  return [...unique.values()]
}

function relationshipNode(nodes: Map<string, NetworkNode>, symbol: string): NetworkNode {
  return nodes.get(symbol) ?? emptyNode(symbol)
}

function addNeighborNode(
  visibleNodes: Map<string, NetworkNode>,
  lookup: Map<string, NetworkNode>,
  neighbor: Pick<RelationshipNeighbor, 'symbol'>
) {
  if (!visibleNodes.has(neighbor.symbol)) {
    visibleNodes.set(neighbor.symbol, relationshipNode(lookup, neighbor.symbol))
  }
}

function capByStrength<T extends { strength: number }>(items: T[], limit: number): T[] {
  return [...items]
    .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))
    .slice(0, Math.max(1, Math.round(limit)))
}

function capLeadLag(leadLag: TickerRelationships['leadLag'], limit: number): TickerRelationships['leadLag'] {
  const capped = capByStrength(
    [
      ...leadLag.followers.map((neighbor) => ({ role: 'followers' as const, strength: neighbor.strength, neighbor })),
      ...leadLag.leaders.map((neighbor) => ({ role: 'leaders' as const, strength: neighbor.strength, neighbor })),
    ],
    limit
  )
  return {
    followers: capped.filter((item) => item.role === 'followers').map((item) => item.neighbor),
    leaders: capped.filter((item) => item.role === 'leaders').map((item) => item.neighbor),
  }
}

function relationshipEdge({
  id,
  source,
  target,
  layer,
  strength,
  label,
  description,
  inlineLabel,
  themes,
  color,
  alpha,
  dash,
  directional = false,
  curvature,
  widthBoost,
  confidence,
}: {
  id: string
  source: string
  target: string
  layer: ToggleLayer
  strength: number
  label: string
  description: string
  inlineLabel?: string
  themes?: string[]
  color: string
  alpha: number
  dash?: number[] | null
  directional?: boolean
  curvature: number
  widthBoost?: number
  confidence: number
}): NetworkEdge {
  return {
    id,
    source,
    target,
    correlation: strength,
    absCorrelation: Math.min(1, Math.abs(strength)),
    inMst: true,
    relationshipLayer: layer,
    relationshipLabel: label,
    relationshipDescription: description,
    relationshipInlineLabel: inlineLabel,
    relationshipThemes: themes,
    relationshipColor: color,
    relationshipAlpha: alpha,
    relationshipDash: dash ?? null,
    relationshipDirectional: directional,
    relationshipCurvature: curvature,
    relationshipWidthBoost: widthBoost,
    relationshipConfidence: confidence,
  }
}

function buildRelationshipGraph(
  relationships: TickerRelationships,
  centerTicker: string,
  centerName: string | null,
  activeLayer: ToggleLayer,
  maxNeighborsPerLayer: number
): { graph: NetworkGraph; rows: RelationshipRow[]; counts: Record<ToggleLayer, number>; moreCounts: Record<ToggleLayer, number> } {
  const center = centerTicker.trim().toUpperCase()
  const lookup = new Map<string, NetworkNode>()
  for (const node of relationships.nodes) lookup.set(node.ticker, node)
  const centerNode = relationships.node ?? lookup.get(center) ?? emptyNode(center, centerName)
  lookup.set(center, centerNode)

  const visibleNodes = new Map<string, NetworkNode>([[center, centerNode]])
  const edges: NetworkEdge[] = []
  const rows = new Map<string, RelationshipRow>()
  const counts = {
    residual: relationships.residualCoMovers.length,
    theme: relationships.themePeers.length,
    leadLag: relationships.leadLag.followers.length + relationships.leadLag.leaders.length,
    market: relationships.marketCoMovers.length,
    spurious: relationships.probableSpurious.length,
  }
  const cappedResidual = capByStrength(relationships.residualCoMovers, maxNeighborsPerLayer)
  const cappedTheme = capByStrength(relationships.themePeers, maxNeighborsPerLayer)
  const cappedLeadLag = capLeadLag(relationships.leadLag, maxNeighborsPerLayer)
  const cappedMarket = capByStrength(relationships.marketCoMovers, maxNeighborsPerLayer)
  const cappedSpurious = capByStrength(relationships.probableSpurious, maxNeighborsPerLayer)
  const renderedCounts = {
    residual: cappedResidual.length,
    theme: cappedTheme.length,
    leadLag: cappedLeadLag.followers.length + cappedLeadLag.leaders.length,
    market: cappedMarket.length,
    spurious: cappedSpurious.length,
  }
  const moreCounts = {
    residual: Math.max(0, counts.residual - renderedCounts.residual),
    theme: Math.max(0, counts.theme - renderedCounts.theme),
    leadLag: Math.max(0, counts.leadLag - renderedCounts.leadLag),
    market: Math.max(0, counts.market - renderedCounts.market),
    spurious: Math.max(0, counts.spurious - renderedCounts.spurious),
  }

  const addRow = (neighbor: RelationshipNeighbor | RelationshipThemePeer, label: string, tone: RelationshipRow['tone']) => {
    if (rows.has(`${tone}:${neighbor.symbol}`)) return
    const node = relationshipNode(lookup, neighbor.symbol)
    rows.set(`${tone}:${neighbor.symbol}`, {
      symbol: neighbor.symbol,
      name: node.name,
      label,
      strength: neighbor.strength,
      confidence: neighbor.confidence,
      country: node.country,
      region: node.region,
      tone,
    })
  }

  if (activeLayer === 'residual') {
    for (const neighbor of cappedResidual) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      const isInverse = neighbor.strength < 0
      const label = isInverse ? 'mexe ao contrário idiossincraticamente' : 'mexe junto além do mercado'
      edges.push(
        relationshipEdge({
          id: `residual:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          layer: 'residual',
          strength: neighbor.strength,
          label,
          description: `${center} and ${neighbor.symbol}: ${label}`,
          color: isInverse ? '#FF867B' : '#36B3FF',
          alpha: isInverse ? 0.78 : 0.86,
          dash: isInverse ? [5, 5] : null,
          curvature: isInverse ? -0.16 : 0.18,
          widthBoost: isInverse ? 0.45 : 0.65,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, label, isInverse ? 'inverse' : 'primary')
    }
  }

  if (activeLayer === 'theme') {
    for (const neighbor of cappedTheme) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      const themes = peerThemes(neighbor)
      const themeLabel = themes.length > 0 ? themes.map((theme) => themeDisplayName(theme)).join(', ') : themeDisplayName(neighbor.theme)
      const label = `same theme: ${themeLabel}`
      edges.push(
        relationshipEdge({
          id: `theme:${neighbor.symbol}:${themes.map(themeKey).join('+') || neighbor.theme || 'unknown'}`,
          source: center,
          target: neighbor.symbol,
          layer: 'theme',
          strength: neighbor.strength,
          label,
          description: `${center} and ${neighbor.symbol}: ${label}`,
          themes,
          color: '#A7F3D0',
          alpha: 0.34,
          dash: [3, 5],
          curvature: 0.12,
          widthBoost: -0.28,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, label, 'theme')
    }
  }

  if (activeLayer === 'leadLag') {
    for (const neighbor of cappedLeadLag.followers) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `lead-follower:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          layer: 'leadLag',
          strength: neighbor.strength,
          label: 'tende a liderar/seguir',
          description: `${center} tende a liderar ${neighbor.symbol}`,
          color: '#FFCB47',
          alpha: 0.78,
          directional: true,
          curvature: 0.34,
          widthBoost: 0.35,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, `${center} tende a liderar`, 'lead')
    }

    for (const neighbor of cappedLeadLag.leaders) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `lead-leader:${neighbor.symbol}`,
          source: neighbor.symbol,
          target: center,
          layer: 'leadLag',
          strength: neighbor.strength,
          label: 'tende a liderar/seguir',
          description: `${neighbor.symbol} tende a liderar ${center}`,
          color: '#F59E0B',
          alpha: 0.74,
          directional: true,
          curvature: -0.34,
          widthBoost: 0.25,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, `${center} tende a seguir`, 'lead')
    }
  }

  if (activeLayer === 'market') {
    for (const neighbor of cappedMarket) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `market:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          layer: 'market',
          strength: neighbor.strength,
          label: 'mexe junto (com o mercado todo)',
          description: `${center} and ${neighbor.symbol}: mexe junto (com o mercado todo)`,
          color: '#73CBFF',
          alpha: 0.26,
          dash: [8, 7],
          curvature: 0.06,
          widthBoost: -0.25,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, 'mexe junto (com o mercado todo)', 'market')
    }
  }

  if (activeLayer === 'spurious') {
    for (const neighbor of cappedSpurious) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `spurious:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          layer: 'spurious',
          strength: neighbor.strength,
          label: 'parece relacionado, mas é só mercado',
          description: `${center} and ${neighbor.symbol}: parece relacionado, mas é só mercado`,
          color: '#94A3B8',
          alpha: 0.18,
          dash: [2, 7],
          curvature: -0.1,
          widthBoost: -0.45,
          confidence: neighbor.confidence,
        })
      )
      addRow(neighbor, 'parece relacionado, mas é só mercado', 'spurious')
    }
  }

  return {
    graph: {
      asOf: relationships.asOf,
      window: String(relationships.window),
      focus: center,
      nodes: [...visibleNodes.values()],
      edges,
    },
    rows: [...rows.values()].sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol)).slice(0, 14),
    counts,
    moreCounts,
  }
}

type ThemeDiagramPoint = {
  symbol: string
  name: string | null
  country: string
  strength: number | null
  confidence: number | null
  themes: string[]
  x: number
  y: number
  radius: number
  isCenter: boolean
}

function ThemeSetDiagram({
  centerTicker,
  centerName,
  relationships,
}: {
  centerTicker: string
  centerName: string | null
  relationships: TickerRelationships
}) {
  const [hover, setHover] = useState<ThemeDiagramPoint | null>(null)
  const data = useMemo(() => {
    const nodeLookup = new Map(relationships.nodes.map((node) => [node.ticker, node]))
    const themeScores = new Map<string, { label: string; count: number; maxStrength: number }>()
    for (const peer of relationships.themePeers) {
      for (const theme of peerThemes(peer)) {
        const key = themeKey(theme)
        const current = themeScores.get(key)
        if (current) {
          current.count += 1
          current.maxStrength = Math.max(current.maxStrength, Math.abs(peer.strength))
        } else {
          themeScores.set(key, { label: theme, count: 1, maxStrength: Math.abs(peer.strength) })
        }
      }
    }

    const selectedThemes = [...themeScores.values()]
      .sort((a, b) => b.maxStrength - a.maxStrength || b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 3)
      .map((item) => item.label)
    const selectedKeys = selectedThemes.map(themeKey)
    const overflowThemes = Math.max(0, themeScores.size - selectedThemes.length)

    const circleGeometry = [
      [{ x: 150, y: 118, r: 74 }],
      [
        { x: 124, y: 118, r: 72 },
        { x: 176, y: 118, r: 72 },
      ],
      [
        { x: 150, y: 92, r: 68 },
        { x: 118, y: 148, r: 68 },
        { x: 182, y: 148, r: 68 },
      ],
    ][Math.max(0, selectedThemes.length - 1)] ?? []

    const anchorFor = (membership: number[]) => {
      if (membership.length === 0 || circleGeometry.length === 0) return { x: 150, y: 118 }
      const points = membership.map((index) => circleGeometry[index])
      const x = points.reduce((sum, point) => sum + point.x, 0) / points.length
      const y = points.reduce((sum, point) => sum + point.y, 0) / points.length
      if (membership.length === 1 && selectedThemes.length > 1) {
        const dx = x - 150
        const dy = y - 118
        const length = Math.max(1, Math.hypot(dx, dy))
        return { x: x + (dx / length) * 20, y: y + (dy / length) * 20 }
      }
      return { x, y }
    }

    const peersByRegion = new Map<string, RelationshipThemePeer[]>()
    for (const peer of relationships.themePeers) {
      const keys = new Set(peerThemes(peer).map(themeKey))
      const membership = selectedKeys.map((key, index) => (keys.has(key) ? index : -1)).filter((index) => index >= 0)
      if (membership.length === 0) continue
      const regionKey = membership.join(',')
      peersByRegion.set(regionKey, [...(peersByRegion.get(regionKey) ?? []), peer])
    }

    const points: ThemeDiagramPoint[] = []
    for (const [regionKey, peers] of peersByRegion) {
      const membership = regionKey.split(',').map((index) => Number(index))
      const anchor = anchorFor(membership)
      const sortedPeers = [...peers].sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol))
      const visiblePeers = sortedPeers.slice(0, 18)
      visiblePeers.forEach((peer, index) => {
        const node = nodeLookup.get(peer.symbol)
        const angle = -Math.PI / 2 + (index / Math.max(1, visiblePeers.length)) * Math.PI * 2
        const spread = membership.length > 1 ? 16 : 24
        points.push({
          symbol: peer.symbol,
          name: node?.name ?? null,
          country: countryDisplayName(node?.country ?? null, node?.region ?? null),
          strength: peer.strength,
          confidence: peer.confidence,
          themes: peerThemes(peer).filter((theme) => selectedKeys.includes(themeKey(theme))),
          x: anchor.x + Math.cos(angle) * spread,
          y: anchor.y + Math.sin(angle) * spread,
          radius: 4.5 + Math.min(4, Math.abs(peer.strength) * 4),
          isCenter: false,
        })
      })
    }

    if (selectedThemes.length > 0) {
      const centerNode = relationships.node
      points.push({
        symbol: centerTicker,
        name: centerName,
        country: countryDisplayName(centerNode?.country ?? null, centerNode?.region ?? null),
        strength: null,
        confidence: null,
        themes: selectedThemes,
        x: 150,
        y: selectedThemes.length === 3 ? 128 : 118,
        radius: 8.5,
        isCenter: true,
      })
    }

    return { selectedThemes, overflowThemes, circles: circleGeometry, points }
  }, [centerName, centerTicker, relationships])

  if (data.selectedThemes.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-border p-4 text-sm text-content-muted">
        No theme baskets for this ticker yet.
      </div>
    )
  }

  return (
    <div className="relative rounded-[8px] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-filter-label">Theme set</div>
        {data.overflowThemes > 0 ? <div className="text-caption text-content-muted">+{data.overflowThemes} more themes</div> : null}
      </div>
      <svg viewBox="0 0 300 230" role="img" aria-label={`${centerTicker} theme membership`} className="h-[220px] w-full">
        {data.circles.map((circle, index) => (
          <g key={data.selectedThemes[index]}>
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.r}
              fill={['rgba(54, 179, 255, 0.12)', 'rgba(167, 243, 208, 0.12)', 'rgba(255, 203, 71, 0.12)'][index]}
              stroke={['rgba(54, 179, 255, 0.58)', 'rgba(167, 243, 208, 0.58)', 'rgba(255, 203, 71, 0.58)'][index]}
              strokeWidth="1.2"
            />
            <text
              x={circle.x}
              y={circle.y - circle.r + 17}
              textAnchor="middle"
              className="fill-content-secondary text-[10px] font-semibold"
            >
              {themeDisplayName(data.selectedThemes[index])}
            </text>
          </g>
        ))}
        {data.points.map((point) => (
          <g
            key={`${point.isCenter ? 'center' : 'peer'}:${point.symbol}`}
            onMouseEnter={() => setHover(point)}
            onMouseLeave={() => setHover(null)}
            className="cursor-default"
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius + (point.isCenter ? 3 : 1.5)}
              fill={point.isCenter ? 'rgba(255,255,255,0.2)' : 'rgba(7,17,31,0.88)'}
              stroke={point.isCenter ? 'rgba(255,255,255,0.92)' : 'rgba(247,251,255,0.52)'}
              strokeWidth={point.isCenter ? 1.8 : 1}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius}
              fill={point.isCenter ? '#f7fbff' : '#A7F3D0'}
              opacity={point.isCenter ? 1 : 0.86}
            />
            {(point.isCenter || point.radius >= 7.5) && (
              <text
                x={point.x}
                y={point.y - point.radius - 5}
                textAnchor="middle"
                className="fill-content-primary text-[9px] font-bold"
              >
                {point.symbol}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute left-3 right-3 top-12 z-10 rounded-[8px] border border-border bg-surface-elevated p-3 text-caption shadow-xl">
          <div className="font-semibold text-content-primary">{hover.symbol}</div>
          <div className="truncate text-content-muted">{hover.name ?? (hover.isCenter ? centerName ?? 'Central company' : 'Related asset')}</div>
          <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-content-secondary">
            <span className="text-content-muted">Themes</span>
            <span>{hover.themes.map(themeDisplayName).join(', ') || '-'}</span>
            <span className="text-content-muted">Strength</span>
            <span>{hover.strength === null ? '-' : formatStrength(hover.strength)}</span>
            <span className="text-content-muted">Confidence</span>
            <span>{hover.confidence === null ? '-' : formatConfidence(hover.confidence)}</span>
            <span className="text-content-muted">Country</span>
            <span>{hover.country}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function RelationshipOrbit({
  centerTicker,
  centerName,
  relationshipsByWindow,
  maxNeighborsPerLayer = DEFAULT_LAYER_RENDER_LIMIT,
}: RelationshipOrbitProps) {
  const normalizedCenter = centerTicker.trim().toUpperCase()
  const [window, setWindow] = useState<RelationshipWindow>(252)
  const [activeLayer, setActiveLayer] = useState<ToggleLayer>('residual')
  const relationships = relationshipsByWindow[window]
  const renderLimit = Math.max(1, Math.round(maxNeighborsPerLayer))
  const { graph, rows, counts, moreCounts } = useMemo(
    () => buildRelationshipGraph(relationships, normalizedCenter, centerName, activeLayer, renderLimit),
    [activeLayer, centerName, normalizedCenter, relationships, renderLimit]
  )
  const hasVisibleRelationships = graph.edges.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[8px] border border-border bg-surface p-1">
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setWindow(option)}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-label-sm transition',
                window === option
                  ? 'bg-primary/15 text-content-primary'
                  : 'text-content-muted hover:bg-surface-hover hover:text-content-secondary'
              )}
            >
              {option}d
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(LAYER_COPY) as ToggleLayer[]).map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setActiveLayer(layer)}
              className={cn(
                'inline-flex items-center gap-2 rounded-[8px] border px-2.5 py-1.5 text-caption transition',
                activeLayer === layer
                  ? 'border-primary/70 bg-primary/15 text-content-primary shadow-[0_0_0_1px_rgba(54,179,255,0.18)]'
                  : 'border-border bg-surface text-content-muted hover:bg-surface-hover hover:text-content-secondary'
              )}
              title={LAYER_COPY[layer].hint}
              aria-pressed={activeLayer === layer}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full border',
                  activeLayer === layer ? 'border-primary bg-primary' : 'border-content-muted'
                )}
              />
              {LAYER_COPY[layer].label}
              <span className="numeric-tabular text-content-muted">{counts[layer]}</span>
              {moreCounts[layer] > 0 ? <span className="numeric-tabular text-content-muted">+{moreCounts[layer]} more</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative min-h-[380px] overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[var(--bg-surface)] p-3">
          {hasVisibleRelationships ? (
            <ChartContainer className="h-[380px]" loadingText="Loading relationship map...">
              {({ width, height }) => (
                <NetworkGraphCanvas
                  graph={graph}
                  mode="peer"
                  centerTicker={normalizedCenter}
                  width={width}
                  height={height}
                />
              )}
            </ChartContainer>
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-[8px] border border-dashed border-border p-6 text-sm text-content-muted">
              No relationships in the selected layer for this ticker yet.
            </div>
          )}
        </div>

        <aside className="space-y-3 rounded-[8px] border border-border bg-surface-elevated p-4">
          <ThemeSetDiagram centerTicker={normalizedCenter} centerName={centerName} relationships={relationships} />
          <div className="text-filter-label">Legend</div>
          <div className="space-y-2 text-caption text-content-secondary">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-[#36B3FF]" />
              Residual: mexe junto além do mercado
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 border-t-2 border-dashed border-[#A7F3D0] opacity-70" />
              Theme peers: same theme basket
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 border-t-2 border-dashed border-[#FF867B]" />
              Rotates-against: mexe ao contrário idiossincraticamente
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-[#FFCB47]" />
              Lead-lag: tende a liderar/seguir
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 border-t-2 border-dashed border-[#73CBFF] opacity-60" />
              Market: mexe junto (com o mercado todo)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 border-t-2 border-dashed border-[#94A3B8] opacity-45" />
              Spurious: provavelmente só ruído de mercado
            </div>
          </div>
          <div className="border-t border-border pt-3 text-caption text-content-muted">
            {centerName ? `${normalizedCenter}: ${centerName} · ` : null}
            {relationships.asOf ? `As of ${relationships.asOf} · ` : null}
            Window {relationships.window}
          </div>
        </aside>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-[8px] border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-elevated text-caption uppercase tracking-[0.08em] text-content-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Ticker</th>
                <th className="px-3 py-2 text-left font-semibold">Relationship</th>
                <th className="px-3 py-2 text-right font-semibold">Strength</th>
                <th className="px-3 py-2 text-right font-semibold">Confidence</th>
                <th className="px-3 py-2 text-left font-semibold">Country</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.tone}:${row.symbol}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/stocks/${row.symbol}`} className="font-semibold text-content-primary underline-offset-2 hover:underline">
                      {row.symbol}
                    </Link>
                    <div className="truncate text-caption text-content-muted">{row.name ?? 'Related asset'}</div>
                  </td>
                  <td className="px-3 py-2 text-content-secondary">{row.label}</td>
                  <td className="numeric-tabular px-3 py-2 text-right text-content-primary">{formatStrength(row.strength)}</td>
                  <td className="numeric-tabular px-3 py-2 text-right text-content-secondary">{formatConfidence(row.confidence)}</td>
                  <td className="px-3 py-2 text-content-secondary">{countryDisplayName(row.country, row.region)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
