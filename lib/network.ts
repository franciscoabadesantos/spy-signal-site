import 'server-only'

import { fetchBackendJson } from './backend'

export type NetworkNode = {
  ticker: string
  symbol?: string
  name: string | null
  country: string | null
  region: string | null
  sector: string | null
  marketCap: number | null
  // EAS cap is current/latest metadata, never the network edge as-of value.
  marketCapSource?: 'latest_metadata' | null
  degree: number | null
  entityId?: string
  lei?: string | null
  legalName?: string | null
  homeCountry?: string | null
  siblingSymbols?: string[]
}

export type NetworkEdge = {
  id?: string
  source: string
  target: string
  correlation: number
  absCorrelation: number
  inMst: boolean
  relationshipLayer?: string
  relationshipLabel?: string
  relationshipDescription?: string
  relationshipInlineLabel?: string
  relationshipThemes?: string[]
  relationshipColor?: string
  relationshipAlpha?: number
  relationshipDash?: number[] | null
  relationshipDirectional?: boolean
  relationshipCurvature?: number
  relationshipWidthBoost?: number
  relationshipConfidence?: number | null
  relationshipSourceLayer?: string
}

export type NetworkGraph = {
  asOf: string | null
  window: string
  focus: string | null
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export type MarketNetworkOptions = {
  window?: string
  minAbsCorrelation?: number
  topK?: number
}

function appendNetworkParams(path: string, params: Record<string, string | number | null | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

function currentNetworkInit(): RequestInit {
  return {
    // The backend owns its short-lived relationship-map cache. Keeping a second
    // Next cache here leaves the page serving the prior graph after a republish
    // or a source-control change.
    cache: 'no-store',
  }
}

type BackendNetworkNode = Partial<NetworkNode> & {
  entity_id?: string
  legal_name?: string
  home_country?: string
  sibling_symbols?: string[]
}

type BackendNetworkEdge = Partial<NetworkEdge> & {
  layer?: string
  strength?: number
  confidence?: number | null
  direction?: string
}

type BackendNetworkGraph = Omit<Partial<NetworkGraph>, 'nodes' | 'edges'> & {
  nodes?: BackendNetworkNode[]
  edges?: BackendNetworkEdge[]
}

const LAYER_PRESENTATION: Record<string, Pick<NetworkEdge, 'relationshipLabel' | 'relationshipDescription' | 'relationshipColor' | 'relationshipDash' | 'relationshipDirectional'>> = {
  raw_price: { relationshipLabel: 'Raw price', relationshipDescription: 'Daily-return co-movement.', relationshipColor: '#36B3FF', relationshipDash: null, relationshipDirectional: false },
  residual_price: { relationshipLabel: 'Residual price', relationshipDescription: 'Idiosyncratic relationship after market and FX factors.', relationshipColor: '#1FC8A7', relationshipDash: null, relationshipDirectional: false },
  lead_lag: { relationshipLabel: 'Lead / lag', relationshipDescription: 'Directional lead/lag relationship.', relationshipColor: '#F2B84B', relationshipDash: null, relationshipDirectional: true },
  theme_etf: { relationshipLabel: 'Theme ETF', relationshipDescription: 'ETF or theme co-membership.', relationshipColor: '#A78BFA', relationshipDash: [4, 3], relationshipDirectional: false },
  probable_spurious: { relationshipLabel: 'Probable spurious', relationshipDescription: 'Strong raw relationship with weak residual support.', relationshipColor: '#FF867B', relationshipDash: [5, 3], relationshipDirectional: false },
}

function normalizedSymbol(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}

export function normalizeNetworkGraph(graph: BackendNetworkGraph, focus: string | null): NetworkGraph {
  return {
    asOf: graph.asOf ?? null,
    window: graph.window || '1y',
    focus: graph.focus ?? focus,
    nodes: (graph.nodes ?? [])
      .map((node): NetworkNode | null => {
        const symbol = normalizedSymbol(node.symbol ?? node.ticker)
        const entityId = normalizedSymbol(node.entityId ?? node.entity_id)
        const ticker = entityId || symbol
        if (!ticker) return null
        return {
          ticker,
          symbol: symbol || undefined,
          name: node.legalName ?? node.legal_name ?? node.name ?? null,
          country: node.country ?? node.homeCountry ?? node.home_country ?? null,
          region: node.region ?? null,
          sector: node.sector ?? null,
          marketCap: typeof node.marketCap === 'number' && Number.isFinite(node.marketCap) ? node.marketCap : null,
          marketCapSource: node.marketCapSource === 'latest_metadata' ? 'latest_metadata' : null,
          degree: typeof node.degree === 'number' && Number.isFinite(node.degree) ? node.degree : null,
          entityId: entityId || undefined,
          lei: node.lei ?? null,
          legalName: node.legalName ?? node.legal_name ?? null,
          homeCountry: node.homeCountry ?? node.home_country ?? null,
          siblingSymbols: Array.isArray(node.siblingSymbols ?? node.sibling_symbols)
            ? (node.siblingSymbols ?? node.sibling_symbols)?.map(normalizedSymbol).filter(Boolean)
            : undefined,
        }
      })
      .filter((node): node is NetworkNode => node !== null),
    edges: (graph.edges ?? [])
      .map((edge) => {
        const layer = String(edge.layer ?? edge.relationshipSourceLayer ?? 'raw_price')
        const strength = Number(edge.strength ?? edge.absCorrelation ?? edge.correlation)
        const confidence = edge.confidence ?? edge.relationshipConfidence ?? null
        return {
          source: normalizedSymbol(edge.source),
          target: normalizedSymbol(edge.target),
          correlation: strength,
          absCorrelation: strength,
          inMst: Boolean(edge.inMst),
          relationshipSourceLayer: layer,
          relationshipConfidence: typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : null,
          relationshipAlpha: typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : undefined,
          ...LAYER_PRESENTATION[layer],
        }
      })
      .filter(
        (edge) =>
          edge.source &&
          edge.target &&
          edge.source !== edge.target &&
          Number.isFinite(edge.correlation) &&
          Number.isFinite(edge.absCorrelation)
      ),
  }
}

export function marketNetworkPath(options: MarketNetworkOptions = {}): string {
  return appendNetworkParams('/network', {
    window: options.window,
    minAbsCorrelation: options.minAbsCorrelation,
    topK: options.topK,
  })
}

export async function getMarketNetwork(options: MarketNetworkOptions = {}): Promise<NetworkGraph> {
  const path = marketNetworkPath(options)
  const graph = await fetchBackendJson<BackendNetworkGraph>(path, {
    context: 'market.network',
    timeoutMs: 9000,
    init: currentNetworkInit(),
  })
  return normalizeNetworkGraph(graph, null)
}

export type AtlasView = 'market' | 'residual' | 'timing' | 'theme'

export type AtlasPosition = { x: number; y: number; z: number }

export type AtlasCommunity = {
  id: string
  label: string
  memberCount: number
  averageConfidence: number
  dominantSector: string | null
  position: AtlasPosition
  representativeSymbols: string[]
  themes: string[]
}

export type AtlasCommunityLink = {
  source: string
  target: string
  strength: number
  confidence: number
  edgeCount: number
}

export type RelationshipAtlas = {
  asOf: string
  window: number
  view: AtlasView
  communities: AtlasCommunity[]
  links: AtlasCommunityLink[]
  materialized: boolean
}

export type AtlasNode = {
  symbol: string
  name: string
  communityId: string
  position: AtlasPosition
  importance: number
  sector: string | null
  industry: string | null
  marketCap: number | null
}

export type AtlasEdge = {
  source: string
  target: string
  sourceCommunityId: string
  targetCommunityId: string
  strength: number
  confidence: number
  direction: string
  score: number
}

export type RelationshipAtlasDetail = {
  asOf: string
  window: number
  view: AtlasView
  focus: string
  community: AtlasCommunity | null
  nodes: AtlasNode[]
  edges: AtlasEdge[]
}

function atlasParams(window: number, view: AtlasView): string {
  return new URLSearchParams({ window: String(window), view }).toString()
}

export function marketAtlasPath(window = 252, view: AtlasView = 'market'): string {
  return `/network/atlas?${atlasParams(window, view)}`
}

export function marketAtlasCommunityPath(
  communityId: string,
  { window = 252, view = 'market', limit = 64 }: { window?: number; view?: AtlasView; limit?: number } = {}
): string {
  const params = new URLSearchParams({ window: String(window), view, limit: String(limit) })
  return `/network/communities/${encodeURIComponent(communityId)}?${params.toString()}`
}

export function marketAtlasNeighborhoodPath(
  ticker: string,
  { window = 252, view = 'market', limit = 28 }: { window?: number; view?: AtlasView; limit?: number } = {}
): string {
  const params = new URLSearchParams({ window: String(window), view, limit: String(limit) })
  return `/network/neighborhoods/${encodeURIComponent(ticker.trim().toUpperCase())}?${params.toString()}`
}

function finite(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizedPosition(value: Partial<AtlasPosition> | null | undefined): AtlasPosition {
  return { x: finite(value?.x), y: finite(value?.y), z: finite(value?.z) }
}

export function normalizeRelationshipAtlas(payload: Partial<RelationshipAtlas>): RelationshipAtlas {
  const view: AtlasView = ['market', 'residual', 'timing', 'theme'].includes(String(payload.view))
    ? (payload.view as AtlasView)
    : 'market'
  return {
    asOf: String(payload.asOf ?? ''),
    window: finite(payload.window, 252),
    view,
    materialized: payload.materialized !== false,
    communities: (payload.communities ?? []).map((community) => ({
      id: String(community.id),
      label: String(community.label || 'Market cluster'),
      memberCount: Math.max(1, finite(community.memberCount, 1)),
      averageConfidence: Math.max(0, Math.min(1, finite(community.averageConfidence))),
      dominantSector: community.dominantSector ? String(community.dominantSector) : null,
      position: normalizedPosition(community.position),
      representativeSymbols: Array.isArray(community.representativeSymbols)
        ? community.representativeSymbols.map(normalizedSymbol).filter(Boolean)
        : [],
      themes: Array.isArray(community.themes) ? community.themes.map(String).filter(Boolean) : [],
    })),
    links: (payload.links ?? [])
      .map((link) => ({
        source: String(link.source),
        target: String(link.target),
        strength: Math.max(0, finite(link.strength)),
        confidence: Math.max(0, Math.min(1, finite(link.confidence))),
        edgeCount: Math.max(1, finite(link.edgeCount, 1)),
      }))
      .filter((link) => link.source && link.target && link.source !== link.target),
  }
}

export function normalizeRelationshipAtlasDetail(payload: Partial<RelationshipAtlasDetail>): RelationshipAtlasDetail {
  const view: AtlasView = ['market', 'residual', 'timing', 'theme'].includes(String(payload.view))
    ? (payload.view as AtlasView)
    : 'market'
  return {
    asOf: String(payload.asOf ?? ''),
    window: finite(payload.window, 252),
    view,
    focus: String(payload.focus ?? ''),
    community: payload.community
      ? normalizeRelationshipAtlas({ communities: [payload.community], view, window: payload.window }).communities[0] ?? null
      : null,
    nodes: (payload.nodes ?? []).map((node) => ({
      symbol: normalizedSymbol(node.symbol),
      name: String(node.name || node.symbol || ''),
      communityId: String(node.communityId || ''),
      position: normalizedPosition(node.position),
      importance: Math.max(0, finite(node.importance)),
      sector: node.sector ? String(node.sector) : null,
      industry: node.industry ? String(node.industry) : null,
      marketCap: node.marketCap === null || node.marketCap === undefined ? null : finite(node.marketCap),
    })).filter((node) => node.symbol),
    edges: (payload.edges ?? []).map((edge) => ({
      source: normalizedSymbol(edge.source),
      target: normalizedSymbol(edge.target),
      sourceCommunityId: String(edge.sourceCommunityId || ''),
      targetCommunityId: String(edge.targetCommunityId || ''),
      strength: finite(edge.strength),
      confidence: Math.max(0, Math.min(1, finite(edge.confidence))),
      direction: String(edge.direction || 'undirected'),
      score: Math.max(0, finite(edge.score)),
    })).filter((edge) => edge.source && edge.target),
  }
}

export async function getRelationshipAtlas(window = 252, view: AtlasView = 'market'): Promise<RelationshipAtlas> {
  const payload = await fetchBackendJson<Partial<RelationshipAtlas>>(marketAtlasPath(window, view), {
    context: 'market.atlas',
    timeoutMs: 9000,
    init: currentNetworkInit(),
  })
  return normalizeRelationshipAtlas(payload)
}

export async function getRelationshipAtlasCommunity(
  communityId: string,
  options: { window?: number; view?: AtlasView; limit?: number } = {}
): Promise<RelationshipAtlasDetail> {
  const payload = await fetchBackendJson<Partial<RelationshipAtlasDetail>>(
    marketAtlasCommunityPath(communityId, options),
    { context: 'market.atlas.community', timeoutMs: 9000, init: currentNetworkInit() }
  )
  return normalizeRelationshipAtlasDetail(payload)
}

export async function getRelationshipAtlasNeighborhood(
  ticker: string,
  options: { window?: number; view?: AtlasView; limit?: number } = {}
): Promise<RelationshipAtlasDetail> {
  const payload = await fetchBackendJson<Partial<RelationshipAtlasDetail>>(
    marketAtlasNeighborhoodPath(ticker, options),
    { context: 'market.atlas.neighborhood', timeoutMs: 9000, init: currentNetworkInit() }
  )
  return normalizeRelationshipAtlasDetail(payload)
}

function fallbackCommunityId(view: AtlasView, value: string): string {
  return `fallback-${view}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'market'}`
}

export function deriveFallbackAtlas(graph: NetworkGraph, view: AtlasView): {
  atlas: RelationshipAtlas
  details: Record<string, RelationshipAtlasDetail>
} {
  const sourceLayer: Record<AtlasView, string> = {
    market: 'raw_price',
    residual: 'residual_price',
    timing: 'lead_lag',
    theme: 'theme_etf',
  }
  const viewEdges = graph.edges.filter((edge) => (edge.relationshipSourceLayer ?? 'raw_price') === sourceLayer[view])
  const groups = new Map<string, NetworkNode[]>()
  for (const node of graph.nodes) {
    const label = node.sector || node.region || 'Connected market'
    groups.set(label, [...(groups.get(label) ?? []), node])
  }
  const rankedGroups = [...groups.entries()].sort((left, right) => right[1].length - left[1].length)
  const communityBySymbol = new Map<string, string>()
  const communities = rankedGroups.map(([label, nodes], index): AtlasCommunity => {
    const id = fallbackCommunityId(view, label)
    nodes.forEach((node) => communityBySymbol.set(node.ticker, id))
    const angle = index * 2.399963229728653
    const radius = 3.2 + Math.sqrt(index) * 1.45
    return {
      id,
      label,
      memberCount: nodes.length,
      averageConfidence: 0.56,
      dominantSector: nodes[0]?.sector ?? null,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.72,
        z: ((index % 5) - 2) * 0.7,
      },
      representativeSymbols: nodes.slice(0, 4).map((node) => node.ticker),
      themes: [],
    }
  })
  const aggregates = new Map<string, AtlasCommunityLink>()
  for (const edge of viewEdges) {
    const source = communityBySymbol.get(edge.source)
    const target = communityBySymbol.get(edge.target)
    if (!source || !target || source === target) continue
    const [left, right] = [source, target].sort()
    const key = `${left}:${right}`
    const confidence = edge.relationshipConfidence ?? 0.5
    const current = aggregates.get(key) ?? { source: left, target: right, strength: 0, confidence: 0, edgeCount: 0 }
    current.strength += Math.abs(edge.correlation) * confidence
    current.confidence += confidence
    current.edgeCount += 1
    aggregates.set(key, current)
  }
  const links = [...aggregates.values()].map((link) => ({
    ...link,
    confidence: link.confidence / Math.max(1, link.edgeCount),
  })).sort((left, right) => right.strength - left.strength).slice(0, 40)
  const details: Record<string, RelationshipAtlasDetail> = {}
  for (const community of communities) {
    const sourceNodes = groups.get(community.label) ?? []
    const limited = sourceNodes.slice(0, 36)
    const symbols = new Set(limited.map((node) => node.ticker))
    const nodes = limited.map((node, index): AtlasNode => {
      const angle = index * 2.399963229728653
      const radius = 0.35 + Math.sqrt(index) * 0.28
      return {
        symbol: node.ticker,
        name: node.name || node.ticker,
        communityId: community.id,
        position: {
          x: community.position.x + Math.cos(angle) * radius,
          y: community.position.y + Math.sin(angle) * radius,
          z: community.position.z + ((index % 3) - 1) * 0.24,
        },
        importance: 1 - index / Math.max(1, limited.length),
        sector: node.sector,
        industry: null,
        marketCap: node.marketCap,
      }
    })
    const edgeByPair = new Map<string, AtlasEdge>()
    for (const edge of viewEdges) {
      if (!symbols.has(edge.source) || !symbols.has(edge.target)) continue
      const [left, right] = [edge.source, edge.target].sort()
      const confidence = edge.relationshipConfidence ?? 0.5
      const candidate: AtlasEdge = {
        source: left,
        target: right,
        sourceCommunityId: community.id,
        targetCommunityId: community.id,
        strength: edge.correlation,
        confidence,
        direction: edge.relationshipDirectional ? 'a_leads_b' : 'undirected',
        score: Math.abs(edge.correlation) * confidence,
      }
      const key = `${left}:${right}`
      if ((edgeByPair.get(key)?.score ?? -1) < candidate.score) edgeByPair.set(key, candidate)
    }
    const edges = [...edgeByPair.values()].sort((left, right) => right.score - left.score).slice(0, 90)
    details[community.id] = {
      asOf: graph.asOf ?? '',
      window: Number(graph.window) || 252,
      view,
      focus: community.id,
      community,
      nodes,
      edges,
    }
  }
  return {
    atlas: {
      asOf: graph.asOf ?? '',
      window: Number(graph.window) || 252,
      view,
      communities,
      links,
      materialized: false,
    },
    details,
  }
}
