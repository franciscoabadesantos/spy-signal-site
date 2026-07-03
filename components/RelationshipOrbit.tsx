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

const DEFAULT_LAYER_RENDER_LIMIT = 24

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
  strength,
  label,
  description,
  inlineLabel,
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
  strength: number
  label: string
  description: string
  inlineLabel: string
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
    relationshipLabel: label,
    relationshipDescription: description,
    relationshipInlineLabel: inlineLabel,
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
  activeLayers: Record<ToggleLayer, boolean>,
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

  if (activeLayers.residual) {
    for (const neighbor of cappedResidual) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      const isInverse = neighbor.strength < 0
      const label = isInverse ? 'mexe ao contrário idiossincraticamente' : 'mexe junto além do mercado'
      edges.push(
        relationshipEdge({
          id: `residual:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          strength: neighbor.strength,
          label,
          description: `${center} and ${neighbor.symbol}: ${label}`,
          inlineLabel: isInverse ? 'ao contrário' : 'além mercado',
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

  if (activeLayers.theme) {
    for (const neighbor of cappedTheme) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      const theme = themeDisplayName(neighbor.theme)
      const label = `same theme: ${theme}`
      edges.push(
        relationshipEdge({
          id: `theme:${neighbor.symbol}:${neighbor.theme ?? 'unknown'}`,
          source: center,
          target: neighbor.symbol,
          strength: neighbor.strength,
          label,
          description: `${center} and ${neighbor.symbol}: ${label}`,
          inlineLabel: label,
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

  if (activeLayers.leadLag) {
    for (const neighbor of cappedLeadLag.followers) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `lead-follower:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          strength: neighbor.strength,
          label: 'tende a liderar/seguir',
          description: `${center} tende a liderar ${neighbor.symbol}`,
          inlineLabel: `${center} lidera`,
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
          strength: neighbor.strength,
          label: 'tende a liderar/seguir',
          description: `${neighbor.symbol} tende a liderar ${center}`,
          inlineLabel: `${center} segue`,
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

  if (activeLayers.market) {
    for (const neighbor of cappedMarket) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `market:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          strength: neighbor.strength,
          label: 'mexe junto (com o mercado todo)',
          description: `${center} and ${neighbor.symbol}: mexe junto (com o mercado todo)`,
          inlineLabel: 'com mercado',
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

  if (activeLayers.spurious) {
    for (const neighbor of cappedSpurious) {
      addNeighborNode(visibleNodes, lookup, neighbor)
      edges.push(
        relationshipEdge({
          id: `spurious:${neighbor.symbol}`,
          source: center,
          target: neighbor.symbol,
          strength: neighbor.strength,
          label: 'parece relacionado, mas é só mercado',
          description: `${center} and ${neighbor.symbol}: parece relacionado, mas é só mercado`,
          inlineLabel: 'só mercado',
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

export default function RelationshipOrbit({
  centerTicker,
  centerName,
  relationshipsByWindow,
  maxNeighborsPerLayer = DEFAULT_LAYER_RENDER_LIMIT,
}: RelationshipOrbitProps) {
  const normalizedCenter = centerTicker.trim().toUpperCase()
  const [window, setWindow] = useState<RelationshipWindow>(252)
  const [activeLayers, setActiveLayers] = useState<Record<ToggleLayer, boolean>>({
    residual: true,
    theme: true,
    leadLag: false,
    market: false,
    spurious: false,
  })
  const relationships = relationshipsByWindow[window]
  const renderLimit = Math.max(1, Math.round(maxNeighborsPerLayer))
  const { graph, rows, counts, moreCounts } = useMemo(
    () => buildRelationshipGraph(relationships, normalizedCenter, centerName, activeLayers, renderLimit),
    [activeLayers, centerName, normalizedCenter, relationships, renderLimit]
  )
  const hasVisibleRelationships = graph.edges.length > 0
  const hasEnabledLayer = Object.values(activeLayers).some(Boolean)

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
              onClick={() => setActiveLayers((current) => ({ ...current, [layer]: !current[layer] }))}
              className={cn(
                'inline-flex items-center gap-2 rounded-[8px] border px-2.5 py-1.5 text-caption transition',
                activeLayers[layer]
                  ? 'border-primary/55 bg-primary/10 text-content-primary'
                  : 'border-border bg-surface text-content-muted hover:bg-surface-hover hover:text-content-secondary'
              )}
              title={LAYER_COPY[layer].hint}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full border',
                  activeLayers[layer] ? 'border-primary bg-primary' : 'border-content-muted'
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
              {hasEnabledLayer ? 'No relationships in the selected layers for this ticker yet.' : 'Turn on at least one relationship layer.'}
            </div>
          )}
        </div>

        <aside className="space-y-3 rounded-[8px] border border-border bg-surface-elevated p-4">
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
