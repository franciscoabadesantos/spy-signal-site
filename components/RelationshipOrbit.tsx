'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import NetworkGraphCanvas from '@/components/NetworkGraphCanvas'
import FilterChip from '@/components/ui/FilterChip'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type { NetworkEdge, NetworkGraph, NetworkNode } from '@/lib/network'
import type { RelationshipNeighbor, RelationshipThemePeer, TickerRelationships } from '@/lib/relationships'

export type RelationshipWindow = 126 | 252
export type ToggleLayer = 'residual' | 'theme' | 'leadLag' | 'market'

type RelationshipOrbitProps = {
  centerTicker: string
  centerName: string | null
  relationshipsByWindow: Record<RelationshipWindow, TickerRelationships>
  initialWindow?: RelationshipWindow
  initialLayer?: ToggleLayer
  maxNeighborsPerLayer?: number
}

type RelationshipRow = {
  symbol: string
  name: string | null
  context: string | null
  relation: string
  detail: string | null
  strength: number | null
  direction: string
}

const DEFAULT_LAYER_RENDER_LIMIT = 5
const LAYER_ORDER: ToggleLayer[] = ['residual', 'theme', 'leadLag', 'market']
const LAYER_COPY: Record<ToggleLayer, { label: string; hint: string }> = {
  residual: { label: 'Residual co-movement', hint: 'Observed co-movement after the backend’s residual treatment.' },
  theme: { label: 'Theme relationship', hint: 'A theme relationship returned by the backend.' },
  leadLag: { label: 'Directional relationship', hint: 'A directional relationship returned by the backend; not a causal claim.' },
  market: { label: 'Market co-movement', hint: 'Observed co-movement associated with the wider market.' },
}
const WINDOW_OPTIONS = ['126', '252'] as const

function emptyNode(ticker: string, name: string | null): NetworkNode {
  return { ticker, name, country: null, region: null, sector: null, marketCap: null, degree: null }
}

function strengthMagnitude(value: number | null): number {
  return value === null ? -1 : Math.abs(value)
}

function capByStrength<T extends { strength: number | null; symbol: string }>(items: T[], limit: number): T[] {
  return [...items]
    .sort((a, b) => strengthMagnitude(b.strength) - strengthMagnitude(a.strength) || a.symbol.localeCompare(b.symbol))
    .slice(0, Math.max(1, Math.round(limit)))
}

function formatStrength(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function themeLabel(peer: RelationshipThemePeer): string | null {
  const theme = peer.theme ?? peer.themes[0]
  return theme ? theme.replace(/[_-]+/g, ' ') : null
}

function sortRows(rows: RelationshipRow[]): RelationshipRow[] {
  return [...rows].sort((a, b) => strengthMagnitude(b.strength) - strengthMagnitude(a.strength) || a.symbol.localeCompare(b.symbol))
}

function layerItems(relationships: TickerRelationships, layer: ToggleLayer): RelationshipRow[] {
  const nodeLookup = new Map(relationships.nodes.map((node) => [node.ticker, node]))
  const row = (
    item: RelationshipNeighbor | RelationshipThemePeer,
    relation: string,
    detail: string | null = null,
  ): RelationshipRow => {
    const node = nodeLookup.get(item.symbol)
    return {
      symbol: item.symbol,
      name: node?.name ?? null,
      context: node ? [node.sector, node.region, node.country].find(Boolean) ?? null : null,
      relation,
      detail,
      strength: item.strength,
      direction: 'direction' in item ? item.direction.trim() : '',
    }
  }

  if (layer === 'residual') return relationships.residualCoMovers.map((item) => row(item, LAYER_COPY.residual.label))
  if (layer === 'theme') return relationships.themePeers.map((item) => row(item, LAYER_COPY.theme.label, themeLabel(item)))
  if (layer === 'market') return relationships.marketCoMovers.map((item) => row(item, LAYER_COPY.market.label))
  return [
    ...relationships.leadLag.leaders.map((item) => row(item, LAYER_COPY.leadLag.label)),
    ...relationships.leadLag.followers.map((item) => row(item, LAYER_COPY.leadLag.label)),
  ]
}

function preferredLayer(relationships: TickerRelationships): ToggleLayer {
  return [...LAYER_ORDER].sort(
    (left, right) => layerItems(relationships, right).length - layerItems(relationships, left).length,
  )[0] ?? 'residual'
}

function buildGraph(
  relationships: TickerRelationships,
  centerTicker: string,
  centerName: string | null,
  layer: ToggleLayer,
  limit: number,
): { graph: NetworkGraph; rows: RelationshipRow[]; total: number } {
  const center = centerTicker.trim().toUpperCase()
  const lookup = new Map(relationships.nodes.map((node) => [node.ticker, node]))
  const centerNode = relationships.node ?? lookup.get(center) ?? emptyNode(center, centerName)
  const allRows = sortRows(layerItems(relationships, layer))
  const rows = capByStrength(allRows, limit)
  const nodes = new Map<string, NetworkNode>([[center, centerNode]])
  const edges: NetworkEdge[] = []

  for (const [index, item] of rows.entries()) {
    const node = lookup.get(item.symbol)
    // A relationship row can remain readable by symbol, but the graph must not
    // manufacture a node or an edge without a matching backend identity.
    if (!node || item.strength === null) continue
    nodes.set(item.symbol, node)
    edges.push({
      id: `${layer}:${item.symbol}`,
      source: center,
      target: item.symbol,
      correlation: item.strength,
      absCorrelation: Math.abs(item.strength),
      inMst: true,
      relationshipLayer: layer,
      relationshipLabel: item.relation,
      relationshipDescription: item.strength === null ? 'Observed relationship.' : `Observed relationship; raw strength ${formatStrength(item.strength)}.`,
      relationshipColor: layer === 'leadLag' ? '#FFCB47' : layer === 'theme' ? '#A7F3D0' : '#36B3FF',
      relationshipAlpha: layer === 'theme' || layer === 'market' ? 0.5 : 0.82,
      relationshipDash: layer === 'theme' || layer === 'market' ? [5, 5] : null,
      relationshipDirectional: false,
      relationshipCurvature: 0.16 + index * 0.012,
      relationshipWidthBoost: 0.3,
    })
  }

  return {
    graph: { asOf: relationships.asOf, window: String(relationships.window), focus: center, nodes: [...nodes.values()], edges },
    rows,
    total: allRows.length,
  }
}

function RelationshipRows({ rows, compact = false }: { rows: RelationshipRow[]; compact?: boolean }) {
  return (
    <ol className={compact ? 'divide-y divide-border/70' : 'mt-3 divide-y divide-border/70'}>
      {rows.map((item) => {
        const strength = formatStrength(item.strength)
        return (
          <li
            key={`${item.relation}:${item.symbol}`}
            className={compact ? 'grid min-w-0 max-w-full gap-1.5 py-3' : 'grid min-w-0 max-w-full gap-2 py-3'}
          >
            <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="min-w-0 flex-1">
                <Link href={`/stocks/${item.symbol}`} className="action-link font-semibold">{item.symbol}</Link>
                {item.name ? <span className="ml-2 break-words text-caption text-content-muted [overflow-wrap:anywhere]">{item.name}</span> : null}
              </div>
              {strength ? <span className="numeric-tabular ml-auto max-w-full shrink-0 break-words text-caption text-content-muted max-[640px]:ml-0 max-[640px]:basis-full">Strength {strength}</span> : null}
            </div>
            <div className="flex min-w-0 max-w-full flex-wrap gap-x-3 gap-y-1 text-caption text-content-secondary">
              <span className="max-[640px]:basis-full">{item.relation}</span>
              {item.detail ? <span className="max-[640px]:basis-full">{item.detail}</span> : null}
              {item.context ? <span className="max-[640px]:basis-full">{item.context}</span> : null}
              {item.direction ? <span className="max-[640px]:basis-full">Observed direction: {item.direction}</span> : null}
            </div>
          </li>
        )
      })}
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

export default function RelationshipOrbit({
  centerTicker,
  centerName,
  relationshipsByWindow,
  initialWindow = 252,
  initialLayer,
  maxNeighborsPerLayer = DEFAULT_LAYER_RENDER_LIMIT,
}: RelationshipOrbitProps) {
  const normalizedCenter = centerTicker.trim().toUpperCase()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const availableWindows = useMemo(
    () => ([126, 252] as RelationshipWindow[]).filter((candidate) =>
      LAYER_ORDER.some((layer) => layerItems(relationshipsByWindow[candidate], layer).length > 0),
    ),
    [relationshipsByWindow],
  )
  const firstWindow = availableWindows.includes(initialWindow) ? initialWindow : (availableWindows[0] ?? initialWindow)
  const [window, setWindow] = useState<RelationshipWindow>(firstWindow)
  const relationships = relationshipsByWindow[window]
  const availableLayers = LAYER_ORDER.filter((layer) => layerItems(relationships, layer).length > 0)
  const firstLayer = initialLayer && availableLayers.includes(initialLayer) ? initialLayer : preferredLayer(relationships)
  const [activeLayer, setActiveLayer] = useState<ToggleLayer>(firstLayer)
  const desktop = useDesktopLayout()
  const visibleLayer = availableLayers.includes(activeLayer) ? activeLayer : preferredLayer(relationships)
  const { graph, rows, total } = buildGraph(relationships, normalizedCenter, centerName, visibleLayer, maxNeighborsPerLayer)
  const allRows = sortRows(layerItems(relationships, visibleLayer))
  const weakRows = sortRows(relationships.probableSpurious.map((item) => {
    const node = relationships.nodes.find((candidate) => candidate.ticker === item.symbol)
    return {
      symbol: item.symbol,
      name: node?.name ?? null,
      context: node ? [node.sector, node.region, node.country].find(Boolean) ?? null : null,
      relation: 'Probable spurious relationship',
      detail: null,
      strength: item.strength,
      direction: item.direction.trim(),
    }
  }))

  const updateQuery = (next: { layer?: ToggleLayer; window?: RelationshipWindow }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.layer) params.set('layer', next.layer)
    if (next.window) params.set('window', String(next.window))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const selectWindow = (value: string) => {
    const nextWindow = value === '126' ? 126 : 252
    if (!availableWindows.includes(nextWindow)) return
    setWindow(nextWindow)
    const nextLayers = LAYER_ORDER.filter((layer) => layerItems(relationshipsByWindow[nextWindow], layer).length > 0)
    if (!nextLayers.includes(activeLayer)) setActiveLayer(preferredLayer(relationshipsByWindow[nextWindow]))
    updateQuery({ window: nextWindow })
  }

  const selectLayer = (layer: ToggleLayer) => {
    if (!availableLayers.includes(layer)) return
    setActiveLayer(layer)
    updateQuery({ layer })
  }

  return (
    <div className="space-y-5" data-relationship-evidence="">
      <div className="flex min-w-0 flex-col items-start gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-wrap items-center gap-x-4 gap-y-1 text-caption text-content-muted max-[640px]:flex-col max-[640px]:items-start">
          <span className="min-w-0 break-words max-[640px]:w-full">Dataset as of {relationships.asOf ?? '—'}</span>
          <span className="min-w-0 break-words max-[640px]:w-full">Observed window {relationships.window}</span>
          <span className="min-w-0 break-words max-[640px]:w-full">{total} total · {rows.length} shown</span>
        </div>
        {availableWindows.length > 1 ? (
          <SegmentedControl
            options={WINDOW_OPTIONS.filter((option) => availableWindows.includes(Number(option) as RelationshipWindow))}
            value={String(window)}
            onChange={selectWindow}
            ariaLabel="Observed relationship window"
          />
        ) : (
          <span className="text-caption text-content-muted">Window {window}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Relationship type">
        {availableLayers.map((layer) => (
          <FilterChip
            key={layer}
            label={LAYER_COPY[layer].label}
            active={visibleLayer === layer}
            onClick={() => selectLayer(layer)}
            title={LAYER_COPY[layer].hint}
          />
        ))}
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-h-[420px] overflow-hidden rounded-[8px] border border-border bg-[var(--bg-surface)] p-3">
          {desktop && graph.edges.length > 0 ? (
            <ChartContainer className="h-[420px]" loadingText="Loading relationship map...">
              {({ width, height }) => <NetworkGraphCanvas graph={graph} mode="peer" centerTicker={normalizedCenter} width={width} height={height} />}
            </ChartContainer>
          ) : (
            <div className="flex h-[420px] items-center justify-center px-8 text-center text-caption text-content-muted">
              {graph.edges.length > 0 ? 'Preparing relationship map…' : 'Map needs a matching node and raw strength for each displayed relationship.'}
            </div>
          )}
        </div>
        <aside className="rounded-[8px] border border-border bg-surface-elevated p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-section-title text-content-primary">{LAYER_COPY[visibleLayer].label}</h2>
              <p className="mt-1 text-caption text-content-muted">{LAYER_COPY[visibleLayer].hint}</p>
            </div>
            <span className="text-caption text-content-muted">{total} total · {rows.length} shown</span>
          </div>
          {rows.length > 0 ? <RelationshipRows rows={rows} compact /> : <p className="mt-5 text-caption text-content-muted">No usable relationships are available for this layer.</p>}
          {allRows.length > rows.length ? (
            <details className="mt-3 border-t border-border pt-3">
              <summary className="cursor-pointer text-caption font-medium text-content-secondary">View all {allRows.length} relationships</summary>
              <RelationshipRows rows={allRows} compact />
            </details>
          ) : null}
        </aside>
      </div>

      <div className="min-w-0 lg:hidden">
        <div className="border-y border-border">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1 py-3">
            <div className="min-w-0 max-[640px]:w-full">
              <h2 className="text-section-title text-content-primary">{LAYER_COPY[visibleLayer].label}</h2>
              <p className="mt-1 text-caption text-content-muted">{LAYER_COPY[visibleLayer].hint}</p>
            </div>
            <span className="max-w-[44%] shrink-0 break-words text-right text-caption text-content-muted max-[640px]:w-full max-[640px]:max-w-full max-[640px]:text-left [overflow-wrap:anywhere]">{total} total · {rows.length} shown</span>
          </div>
          {rows.length > 0 ? <RelationshipRows rows={rows} /> : <p className="py-4 text-caption text-content-muted">No usable relationships are available for this layer.</p>}
          {allRows.length > rows.length ? (
            <details className="border-t border-border py-2">
              <summary className="cursor-pointer py-2 text-caption font-medium text-content-secondary">View all {allRows.length} relationships</summary>
              <RelationshipRows rows={allRows.slice(rows.length)} />
            </details>
          ) : null}
        </div>
      </div>

      {weakRows.length > 0 ? (
        <details className="border-y border-border px-1">
          <summary className="cursor-pointer py-4 text-caption font-medium text-content-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45">
            Weak relationships ({weakRows.length})
          </summary>
          <p className="pb-1 text-caption text-content-muted">Backend classification kept separate from the primary relationship view.</p>
          <RelationshipRows rows={weakRows} />
        </details>
      ) : null}
    </div>
  )
}
