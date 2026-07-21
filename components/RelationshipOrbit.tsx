'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import NetworkGraphCanvas from '@/components/NetworkGraphCanvas'
import FilterChip from '@/components/ui/FilterChip'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import type { RelationshipNeighbor, RelationshipThemePeer, TickerRelationships } from '@/lib/relationships'

type RelationshipWindow = 126 | 252
type ToggleLayer = 'residual' | 'theme' | 'leadLag' | 'market'

type RelationshipOrbitProps = {
  centerTicker: string
  centerName: string | null
  relationshipsByWindow: Record<RelationshipWindow, TickerRelationships>
  maxNeighborsPerLayer?: number
}

type RelationshipRow = {
  symbol: string
  name: string | null
  relation: string
  detail: string | null
  strength: number
  confidence: number
  direction: string
}

const DEFAULT_LAYER_RENDER_LIMIT = 5
const LAYER_ORDER: ToggleLayer[] = ['residual', 'theme', 'leadLag', 'market']
const LAYER_COPY: Record<ToggleLayer, { label: string; hint: string }> = {
  residual: { label: 'Moves together', hint: 'Residual co-movement beyond broad market factors.' },
  theme: { label: 'Same theme', hint: 'Shared ETF basket or investable theme.' },
  leadLag: { label: 'Leads or follows', hint: 'Directional lead-lag relationship.' },
  market: { label: 'Market-driven', hint: 'Co-movement associated with the wider market.' },
}
const WINDOW_OPTIONS = ['126d', '252d'] as const

function emptyNode(ticker: string, name: string | null): NetworkNode {
  return { ticker, name, country: null, region: null, sector: null, marketCap: null, degree: null }
}

function capByStrength<T extends { strength: number; symbol: string }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol)).slice(0, Math.max(1, Math.round(limit)))
}

function formatStrength(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${Math.round((value <= 1 ? value : value / 100) * 100)}%`
}

function themeLabel(peer: RelationshipThemePeer): string | null {
  const theme = peer.theme ?? peer.themes[0]
  return theme ? theme.replace(/[_-]+/g, ' ') : null
}

function sortRows(rows: RelationshipRow[]): RelationshipRow[] {
  return [...rows].sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || a.symbol.localeCompare(b.symbol))
}

function layerItems(relationships: TickerRelationships, layer: ToggleLayer): RelationshipRow[] {
  const nodeLookup = new Map(relationships.nodes.map((node) => [node.ticker, node]))
  const row = (item: RelationshipNeighbor | RelationshipThemePeer, relation: string, detail: string | null = null, direction?: string) => ({
    symbol: item.symbol,
    name: nodeLookup.get(item.symbol)?.name ?? null,
    relation,
    detail,
    strength: item.strength,
    confidence: item.confidence,
    direction: direction ?? ('direction' in item ? item.direction : ''),
  })
  if (layer === 'residual') return relationships.residualCoMovers.map((item) => row(item, item.strength < 0 ? 'Moves opposite' : 'Moves together', null, item.strength < 0 ? 'Opposite direction' : 'Same direction'))
  if (layer === 'theme') return relationships.themePeers.map((item) => row(item, 'Same theme', themeLabel(item), 'Shared theme'))
  if (layer === 'market') return relationships.marketCoMovers.map((item) => row(item, 'Market-driven', null, 'Moves with the wider market'))
  return [
    ...relationships.leadLag.leaders.map((item) => row(item, 'Leads', null, `Leads ${relationships.ticker}`)),
    ...relationships.leadLag.followers.map((item) => row(item, 'Follows', null, `Follows ${relationships.ticker}`)),
  ]
}

function preferredLayer(relationships: TickerRelationships): ToggleLayer {
  return [...LAYER_ORDER].sort(
    (left, right) => layerItems(relationships, right).length - layerItems(relationships, left).length
  )[0] ?? 'residual'
}

function buildGraph(relationships: TickerRelationships, centerTicker: string, centerName: string | null, layer: ToggleLayer, limit: number): { graph: NetworkGraph; rows: RelationshipRow[]; total: number } {
  const center = centerTicker.trim().toUpperCase()
  const lookup = new Map(relationships.nodes.map((node) => [node.ticker, node]))
  const centerNode = relationships.node ?? lookup.get(center) ?? emptyNode(center, centerName)
  const items = capByStrength(sortRows(layerItems(relationships, layer)), limit)
  const nodes = new Map<string, NetworkNode>([[center, centerNode]])
  const edges: NetworkEdge[] = []
  for (const [index, item] of items.entries()) {
    const node = lookup.get(item.symbol) ?? emptyNode(item.symbol, item.name)
    nodes.set(item.symbol, node)
    const directional = layer === 'leadLag'
    const follows = item.relation === 'Follows'
    edges.push({
      id: `${layer}:${item.symbol}`,
      source: directional && !follows ? item.symbol : center,
      target: directional && !follows ? center : item.symbol,
      correlation: item.strength,
      absCorrelation: Math.min(1, Math.abs(item.strength)),
      inMst: true,
      relationshipLayer: layer,
      relationshipLabel: item.relation,
      relationshipDescription: `${item.relation}; strength ${formatStrength(item.strength)}, confidence ${formatPercent(item.confidence)}.`,
      relationshipColor: layer === 'leadLag' ? '#FFCB47' : layer === 'theme' ? '#A7F3D0' : '#36B3FF',
      relationshipAlpha: layer === 'theme' || layer === 'market' ? 0.5 : 0.82,
      relationshipDash: layer === 'theme' || layer === 'market' ? [5, 5] : null,
      relationshipDirectional: directional,
      relationshipCurvature: directional ? (follows ? 0.3 : -0.3) : 0.16 + index * 0.012,
      relationshipWidthBoost: 0.3,
      relationshipConfidence: item.confidence,
    })
  }
  return { graph: { asOf: relationships.asOf, window: String(relationships.window), focus: center, nodes: [...nodes.values()], edges }, rows: items, total: layerItems(relationships, layer).length }
}

function RelationshipRows({ rows, compact = false }: { rows: RelationshipRow[]; compact?: boolean }) {
  return (
    <ol className={compact ? 'divide-y divide-border/70' : 'mt-3 divide-y divide-border/70'}>
      {rows.map((item) => (
        <li key={`${item.relation}:${item.symbol}`} className={compact ? 'grid gap-1.5 py-3' : 'grid gap-2 py-3 sm:grid-cols-[minmax(0,1.25fr)_0.9fr_0.75fr_0.75fr] sm:items-center'}>
          <div className="min-w-0">
            <Link href={`/stocks/${item.symbol}`} className="action-link font-semibold">{item.symbol}</Link>
            {item.name ? <span className="ml-2 text-caption text-content-muted">{item.name}</span> : null}
            <div className="text-caption text-content-secondary">{item.relation}{item.detail ? ` · ${item.detail}` : ''}</div>
          </div>
          <span className="text-caption text-content-secondary">{item.direction || '—'}</span>
          <span className="text-caption text-content-secondary">Strength {formatStrength(item.strength)}</span>
          <span className="text-caption text-content-secondary">Confidence {formatPercent(item.confidence)}</span>
        </li>
      ))}
    </ol>
  )
}

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return desktop
}

export default function RelationshipOrbit({ centerTicker, centerName, relationshipsByWindow, maxNeighborsPerLayer = DEFAULT_LAYER_RENDER_LIMIT }: RelationshipOrbitProps) {
  const normalizedCenter = centerTicker.trim().toUpperCase()
  const availableWindows = useMemo(
    () => ([126, 252] as RelationshipWindow[]).filter((candidate) =>
      LAYER_ORDER.some((layer) => layerItems(relationshipsByWindow[candidate], layer).length > 0)
    ),
    [relationshipsByWindow]
  )
  const [window, setWindow] = useState<RelationshipWindow>(() => availableWindows.includes(252) ? 252 : (availableWindows[0] ?? 252))
  const [activeLayer, setActiveLayer] = useState<ToggleLayer>(() => preferredLayer(relationshipsByWindow[availableWindows.includes(252) ? 252 : (availableWindows[0] ?? 252)]))
  const desktop = useDesktopLayout()
  const relationships = relationshipsByWindow[window]
  const availableLayers = LAYER_ORDER.filter((layer) => layerItems(relationships, layer).length > 0)
  const visibleLayer = availableLayers.includes(activeLayer) ? activeLayer : preferredLayer(relationships)
  const { graph, rows, total } = buildGraph(relationships, normalizedCenter, centerName, visibleLayer, maxNeighborsPerLayer)
  const allRows = sortRows(layerItems(relationships, visibleLayer))
  const weakRows = sortRows(relationships.probableSpurious.map((item) => ({
    symbol: item.symbol,
    name: relationships.nodes.find((node) => node.ticker === item.symbol)?.name ?? null,
    relation: 'Weak relationship',
    detail: null,
    strength: item.strength,
    confidence: item.confidence,
    direction: item.direction || 'Lower confidence',
  })))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {availableWindows.length > 1 ? (
          <SegmentedControl options={WINDOW_OPTIONS.filter((option) => availableWindows.includes(option === '126d' ? 126 : 252))} value={`${window}d`} onChange={(value) => setWindow(value === '126d' ? 126 : 252)} ariaLabel="Relationship window" />
        ) : (
          <span className="text-caption text-content-muted">{window}-session window</span>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Relationship category">
          {availableLayers.map((layer) => {
            const count = layerItems(relationships, layer).length
            return <FilterChip key={layer} label={LAYER_COPY[layer].label} active={visibleLayer === layer} onClick={() => setActiveLayer(layer)} title={LAYER_COPY[layer].hint} trailing={<span className="numeric-tabular text-content-muted">{count}</span>} />
          })}
        </div>
      </div>
      <p className="text-caption text-content-muted">Strength is the returned relationship magnitude; confidence is model support. Direction is shown in words as well as in the map.</p>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-h-[420px] overflow-hidden rounded-[8px] border border-border bg-[var(--bg-surface)] p-3">
          {desktop && graph.edges.length > 0 ? <ChartContainer className="h-[420px]" loadingText="Loading relationship map...">{({ width, height }) => <NetworkGraphCanvas graph={graph} mode="peer" centerTicker={normalizedCenter} width={width} height={height} />}</ChartContainer> : <div className="flex h-[420px] items-center justify-center text-sm text-content-muted">{graph.edges.length > 0 ? 'Preparing relationship map…' : 'No relationships in this layer yet.'}</div>}
        </div>
        <aside className="rounded-[8px] border border-border bg-surface-elevated p-4">
          <div className="flex items-baseline justify-between gap-2"><div><h2 className="text-section-title text-content-primary">{LAYER_COPY[visibleLayer].label}</h2><p className="mt-1 text-caption text-content-muted">{LAYER_COPY[visibleLayer].hint}</p></div><span className="text-caption text-content-muted">{total} total · {rows.length} shown</span></div>
          {rows.length > 0 ? <RelationshipRows rows={rows} compact /> : <p className="mt-5 text-caption text-content-muted">No ranked relationships are available for this layer.</p>}
          {allRows.length > rows.length ? <details className="mt-3 border-t border-border pt-3"><summary className="cursor-pointer text-caption font-medium text-content-secondary">View all {allRows.length} relationships</summary><RelationshipRows rows={allRows} compact /></details> : null}
        </aside>
      </div>

      <div className="lg:hidden">
        <div className="rounded-[8px] border border-border bg-surface-elevated p-4"><div className="flex items-baseline justify-between gap-2"><div><h2 className="text-section-title text-content-primary">{LAYER_COPY[visibleLayer].label}</h2><p className="mt-1 text-caption text-content-muted">{LAYER_COPY[visibleLayer].hint}</p></div><span className="text-caption text-content-muted">{total} total · {rows.length} shown</span></div>{rows.length > 0 ? <RelationshipRows rows={rows} /> : <p className="mt-5 text-caption text-content-muted">No relationships are available in this layer.</p>}{allRows.length > rows.length ? <details className="mt-3 border-t border-border pt-3"><summary className="cursor-pointer py-2 text-caption font-medium text-content-secondary">Show all {allRows.length}</summary><RelationshipRows rows={allRows.slice(rows.length)} /></details> : null}</div>
      </div>

      {weakRows.length > 0 ? (
        <details className="rounded-[8px] border border-border bg-[var(--bg-surface)] px-4">
          <summary className="cursor-pointer py-4 text-caption font-medium text-content-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45">
            Weak relationships ({weakRows.length})
          </summary>
          <p className="pb-1 text-caption text-content-muted">Lower-confidence links are kept separate from the primary map.</p>
          <RelationshipRows rows={weakRows} />
        </details>
      ) : null}
    </div>
  )
}
