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
  isCenter: boolean
}

type ThemeCircle = {
  key: string
  label: string
  count: number
  x: number
  y: number
  r: number
  fill: string
  stroke: string
}

type ThemeRegion = {
  key: string
  membership: number[]
  label: string
  x: number
  y: number
  boxWidth: number
  boxHeight: number
  isIntersection: boolean
  members: ThemeDiagramPoint[]
  hiddenCount: number
}

const THEME_DIAGRAM_WIDTH = 360
const THEME_DIAGRAM_HEIGHT = 320
const THEME_COLORS = [
  { fill: 'rgba(54, 179, 255, 0.14)', stroke: 'rgba(54, 179, 255, 0.7)' },
  { fill: 'rgba(167, 243, 208, 0.14)', stroke: 'rgba(167, 243, 208, 0.7)' },
  { fill: 'rgba(255, 203, 71, 0.14)', stroke: 'rgba(255, 203, 71, 0.7)' },
] as const

function shortThemeLabel(theme: string): string {
  const label = themeDisplayName(theme)
  return label.length > 15 ? `${label.slice(0, 14)}...` : label
}

function shortTickerLabel(symbol: string): string {
  return symbol.length > 7 ? `${symbol.slice(0, 6)}...` : symbol
}

function memberPillLabel(member: ThemeDiagramPoint): string {
  return member.isCenter ? `${member.symbol} center` : shortTickerLabel(member.symbol)
}

function memberPillWidth(member: ThemeDiagramPoint): number {
  const label = memberPillLabel(member)
  return member.isCenter ? 82 : Math.max(38, label.length * 6.5 + 14)
}

function regionBoxSize(members: ThemeDiagramPoint[], hiddenCount: number, isIntersection: boolean): { width: number; height: number } {
  const width = Math.max(48, ...members.map(memberPillWidth)) + 18
  const height = Math.max(18, members.length * 20) + (hiddenCount > 0 ? 18 : 0) + (isIntersection ? 8 : 4)
  return { width, height }
}

function relaxThemeRegions(regions: ThemeRegion[]): ThemeRegion[] {
  const relaxed = regions.map((region) => ({ ...region }))
  for (let iteration = 0; iteration < 24; iteration += 1) {
    for (let left = 0; left < relaxed.length; left += 1) {
      for (let right = left + 1; right < relaxed.length; right += 1) {
        const a = relaxed[left]
        const b = relaxed[right]
        const overlapX = (a.boxWidth + b.boxWidth) / 2 - Math.abs(a.x - b.x)
        const overlapY = (a.boxHeight + b.boxHeight) / 2 - Math.abs(a.y - b.y)
        if (overlapX <= 0 || overlapY <= 0) continue
        const dx = a.x <= b.x ? -1 : 1
        const dy = a.y <= b.y ? -1 : 1
        if (overlapX < overlapY) {
          relaxed[left] = { ...a, x: a.x + dx * overlapX * 0.55 }
          relaxed[right] = { ...b, x: b.x - dx * overlapX * 0.55 }
        } else {
          relaxed[left] = { ...a, y: a.y + dy * overlapY * 0.55 }
          relaxed[right] = { ...b, y: b.y - dy * overlapY * 0.55 }
        }
      }
    }

    for (let index = 0; index < relaxed.length; index += 1) {
      const region = relaxed[index]
      relaxed[index] = {
        ...region,
        x: Math.max(region.boxWidth / 2 + 8, Math.min(THEME_DIAGRAM_WIDTH - region.boxWidth / 2 - 8, region.x)),
        y: Math.max(region.boxHeight / 2 + 12, Math.min(THEME_DIAGRAM_HEIGHT - region.boxHeight / 2 - 8, region.y)),
      }
    }
  }
  return relaxed
}

function circleDistanceForOverlap(a: ThemeCircle, b: ThemeCircle, overlapRatio: number): number {
  const minDistance = Math.abs(a.r - b.r) + Math.min(a.r, b.r) * 0.52
  const maxDistance = a.r + b.r - 16
  return Math.max(minDistance, Math.min(maxDistance, maxDistance - overlapRatio * Math.min(a.r, b.r) * 1.05))
}

function membershipKey(membership: number[]): string {
  return membership.join(',')
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
    const themeScores = new Map<string, { label: string; members: Set<string>; maxStrength: number }>()
    for (const peer of relationships.themePeers) {
      for (const theme of peerThemes(peer)) {
        const key = themeKey(theme)
        const current = themeScores.get(key)
        if (current) {
          current.members.add(peer.symbol)
          current.maxStrength = Math.max(current.maxStrength, Math.abs(peer.strength))
        } else {
          themeScores.set(key, { label: theme, members: new Set([peer.symbol]), maxStrength: Math.abs(peer.strength) })
        }
      }
    }

    const selectedThemes = [...themeScores.values()]
      .sort((a, b) => b.members.size - a.members.size || b.maxStrength - a.maxStrength || a.label.localeCompare(b.label))
      .slice(0, 3)
      .map((item) => item.label)
    const selectedKeys = selectedThemes.map(themeKey)
    const overflowThemes = Math.max(0, themeScores.size - selectedThemes.length)
    const peerRecords = relationships.themePeers
      .map((peer) => {
        const peerThemeKeys = new Set(peerThemes(peer).map(themeKey))
        const membership = selectedKeys.map((key, index) => (peerThemeKeys.has(key) ? index : -1)).filter((index) => index >= 0)
        return { peer, membership }
      })
      .filter((item) => item.membership.length > 0)

    const counts = selectedKeys.map((key) => peerRecords.filter((item) => item.membership.includes(selectedKeys.indexOf(key))).length + 1)
    const maxCount = Math.max(1, ...counts)
    let circles: ThemeCircle[] = selectedThemes.map((theme, index) => ({
      key: selectedKeys[index],
      label: theme,
      count: counts[index],
      x: 180,
      y: 138,
      r: 52 + Math.sqrt(counts[index] / maxCount) * 34,
      fill: THEME_COLORS[index].fill,
      stroke: THEME_COLORS[index].stroke,
    }))

    const pairOverlapRatio = (left: number, right: number) => {
      const overlap = peerRecords.filter((item) => item.membership.includes(left) && item.membership.includes(right)).length + 1
      return Math.min(1, overlap / Math.max(1, Math.min(counts[left], counts[right])))
    }

    if (circles.length === 1) {
      circles = [{ ...circles[0], x: 180, y: 142 }]
    } else if (circles.length === 2) {
      const distance = circleDistanceForOverlap(circles[0], circles[1], pairOverlapRatio(0, 1))
      circles = [
        { ...circles[0], x: 180 - distance / 2, y: 142 },
        { ...circles[1], x: 180 + distance / 2, y: 142 },
      ]
    } else if (circles.length === 3) {
      circles = [
        { ...circles[0], x: 180, y: 102 },
        { ...circles[1], x: 132, y: 178 },
        { ...circles[2], x: 228, y: 178 },
      ]
      for (let iteration = 0; iteration < 2; iteration += 1) {
        for (const [left, right] of [
          [0, 1],
          [0, 2],
          [1, 2],
        ] as const) {
          const ratio = pairOverlapRatio(left, right)
          const dx = circles[right].x - circles[left].x
          const dy = circles[right].y - circles[left].y
          const length = Math.max(1, Math.hypot(dx, dy))
          const target = circleDistanceForOverlap(circles[left], circles[right], ratio)
          const delta = (length - target) * 0.28
          const moveX = (dx / length) * delta
          const moveY = (dy / length) * delta
          circles[left] = { ...circles[left], x: circles[left].x + moveX, y: circles[left].y + moveY }
          circles[right] = { ...circles[right], x: circles[right].x - moveX, y: circles[right].y - moveY }
        }
      }
    }

    const diagramCenter = {
      x: circles.reduce((sum, circle) => sum + circle.x, 0) / Math.max(1, circles.length),
      y: circles.reduce((sum, circle) => sum + circle.y, 0) / Math.max(1, circles.length),
    }

    const anchorFor = (membership: number[]) => {
      if (membership.length === 0 || circles.length === 0) return diagramCenter
      const selected = membership.map((index) => circles[index])
      const x = selected.reduce((sum, circle) => sum + circle.x, 0) / selected.length
      const y = selected.reduce((sum, circle) => sum + circle.y, 0) / selected.length
      if (membership.length === 1 && circles.length > 1) {
        const circle = selected[0]
        const dx = circle.x - diagramCenter.x
        const dy = circle.y - diagramCenter.y
        const length = Math.max(1, Math.hypot(dx, dy))
        return {
          x: circle.x + (dx / length) * circle.r * 0.34,
          y: circle.y + (dy / length) * circle.r * 0.34,
        }
      }
      return { x, y }
    }

    const peersByRegion = new Map<string, RelationshipThemePeer[]>()
    for (const peer of relationships.themePeers) {
      const keys = new Set(peerThemes(peer).map(themeKey))
      const membership = selectedKeys.map((key, index) => (keys.has(key) ? index : -1)).filter((index) => index >= 0)
      if (membership.length === 0) continue
      const regionKey = membershipKey(membership)
      peersByRegion.set(regionKey, [...(peersByRegion.get(regionKey) ?? []), peer])
    }

    const regions: ThemeRegion[] = []
    for (const [regionKey, peerItems] of peersByRegion) {
      const membership = regionKey.split(',').map((index) => Number(index))
      const anchor = anchorFor(membership)
      const sortedPeers = [...peerItems].sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol))
      const visibleLimit = membership.length > 1 ? 3 : 2
      const members = sortedPeers.slice(0, visibleLimit).map<ThemeDiagramPoint>((peer) => {
        const node = nodeLookup.get(peer.symbol)
        return {
          symbol: peer.symbol,
          name: node?.name ?? null,
          country: countryDisplayName(node?.country ?? null, node?.region ?? null),
          strength: peer.strength,
          confidence: peer.confidence,
          themes: peerThemes(peer).filter((theme) => selectedKeys.includes(themeKey(theme))),
          isCenter: false,
        }
      })
      const hiddenCount = Math.max(0, sortedPeers.length - members.length)
      const boxSize = regionBoxSize(members, hiddenCount, membership.length > 1)
      regions.push({
        key: regionKey,
        membership,
        label: membership.map((index) => shortThemeLabel(selectedThemes[index])).join(' ∩ '),
        x: anchor.x,
        y: anchor.y,
        boxWidth: boxSize.width,
        boxHeight: boxSize.height,
        isIntersection: membership.length > 1,
        members,
        hiddenCount,
      })
    }

    const centerNode = relationships.node
    if (selectedThemes.length > 0) {
      const centerPoint: ThemeDiagramPoint = {
        symbol: centerTicker,
        name: centerName,
        country: countryDisplayName(centerNode?.country ?? null, centerNode?.region ?? null),
        strength: null,
        confidence: null,
        themes: selectedThemes,
        isCenter: true,
      }
      const centerRegionKey = `center:${membershipKey(circles.map((_, index) => index))}`
      const boxSize = regionBoxSize([centerPoint], 0, false)
      regions.push({
        key: centerRegionKey,
        membership: circles.map((_, index) => index),
        label: 'Central company',
        x: 286,
        y: 32,
        boxWidth: boxSize.width,
        boxHeight: boxSize.height,
        isIntersection: false,
        members: [centerPoint],
        hiddenCount: 0,
      })
    }

    return { selectedThemes, overflowThemes, circles, regions: relaxThemeRegions(regions) }
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
      <svg viewBox={`0 0 ${THEME_DIAGRAM_WIDTH} ${THEME_DIAGRAM_HEIGHT}`} role="img" aria-label={`${centerTicker} theme membership`} className="h-[310px] w-full">
        {data.circles.map((circle) => (
          <g key={circle.key}>
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.r}
              fill={circle.fill}
              stroke={circle.stroke}
              strokeWidth="1.4"
            />
            <text
              x={circle.x}
              y={Math.max(16, circle.y - circle.r - 6)}
              textAnchor="middle"
              className="fill-content-secondary text-[10px] font-bold"
            >
              {shortThemeLabel(circle.label)}
            </text>
            <text x={circle.x} y={Math.max(28, circle.y - circle.r + 7)} textAnchor="middle" className="fill-content-muted text-[8px] font-semibold">
              {circle.count} members
            </text>
          </g>
        ))}
        {data.regions.map((region) => (
          <g key={region.key}>
            {region.members.map((member, memberIndex) => {
              const y = region.y + (memberIndex - (region.members.length - 1) / 2) * 20
              const label = memberPillLabel(member)
              const width = memberPillWidth(member)
              return (
                <g
                  key={`${region.key}:${member.symbol}`}
                  onMouseEnter={() => setHover(member)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-default"
                >
                  <rect
                    x={region.x - width / 2}
                    y={y - 8}
                    width={width}
                    height="16"
                    rx="4"
                    fill={member.isCenter ? 'rgba(247, 251, 255, 0.96)' : region.isIntersection ? 'rgba(7,17,31,0.94)' : 'rgba(7,17,31,0.72)'}
                    stroke={member.isCenter ? 'rgba(247, 251, 255, 1)' : region.isIntersection ? 'rgba(247,251,255,0.78)' : 'rgba(247,251,255,0.38)'}
                    strokeWidth={region.isIntersection || member.isCenter ? 1.2 : 0.8}
                  />
                  <text
                    x={region.x}
                    y={y + 3.5}
                    textAnchor="middle"
                    className={member.isCenter ? 'fill-[#07111f] text-[9px] font-black' : 'fill-content-primary text-[9px] font-bold'}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
            {region.hiddenCount > 0 ? (
              <text
                x={region.x}
                y={region.y + (region.members.length / 2) * 20 + 14}
                textAnchor="middle"
                className="fill-content-muted text-[8px] font-semibold"
              >
                +{region.hiddenCount} more
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="min-h-[76px] rounded-[8px] border border-border bg-surface-elevated p-3 text-caption">
        {hover ? (
          <>
            <div className="font-semibold text-content-primary">{hover.symbol}</div>
            <div className="truncate text-content-muted">{hover.name ?? (hover.isCenter ? centerName ?? 'Central company' : 'Related asset')}</div>
            <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-content-secondary">
              <span className="text-content-muted">Themes</span>
              <span className="truncate">{hover.themes.map(themeDisplayName).join(', ') || '-'}</span>
              <span className="text-content-muted">Strength</span>
              <span>{hover.strength === null ? '-' : formatStrength(hover.strength)}</span>
              <span className="text-content-muted">Confidence</span>
              <span>{hover.confidence === null ? '-' : formatConfidence(hover.confidence)}</span>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[52px] items-center text-content-muted">Hover a ticker in the theme set for details.</div>
        )}
      </div>
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

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
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
