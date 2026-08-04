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
  const aliases = new Map<string, string>()
  for (const node of graph.nodes ?? []) {
    const symbol = normalizedSymbol(node.symbol ?? node.ticker)
    const entityId = normalizedSymbol(node.entityId ?? node.entity_id)
    if (symbol) aliases.set(symbol, symbol)
    if (entityId && symbol) aliases.set(entityId, symbol)
  }
  return {
    asOf: graph.asOf ?? null,
    window: graph.window || '1y',
    focus: graph.focus ?? focus,
    nodes: (graph.nodes ?? [])
      .map((node): NetworkNode | null => {
        const symbol = normalizedSymbol(node.symbol ?? node.ticker)
        const entityId = normalizedSymbol(node.entityId ?? node.entity_id)
        const ticker = symbol || entityId
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
          source: aliases.get(normalizedSymbol(edge.source)) ?? normalizedSymbol(edge.source),
          target: aliases.get(normalizedSymbol(edge.target)) ?? normalizedSymbol(edge.target),
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
  dominantCountry: string | null
  dominantRegion: string | null
  marketCapTotal: number | null
  bridgeCount: number
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
  landmarks: AtlasNode[]
  backbone: AtlasEdge[]
  materialized: boolean
}

export type AtlasNode = {
  symbol: string
  name: string
  communityId: string
  position: AtlasPosition
  importance: number
  centrality: number
  bridgeScore: number
  volatility: number | null
  sector: string | null
  industry: string | null
  country: string | null
  region: string | null
  marketCap: number | null
  context: boolean
  isBoundary?: boolean
}

export type AtlasEdge = {
  source: string
  target: string
  sourceCommunityId: string
  targetCommunityId: string
  strength: number
  confidence: number | null
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
  {
    window = 252,
    view = 'market',
    limit = 64,
    asOf,
  }: { window?: number; view?: AtlasView; limit?: number; asOf?: string } = {}
): string {
  const params = new URLSearchParams({ window: String(window), view, limit: String(limit) })
  if (asOf) params.set('asOf', asOf)
  return `/network/communities/${encodeURIComponent(communityId)}?${params.toString()}`
}

export function marketAtlasNeighborhoodPath(
  ticker: string,
  {
    window = 252,
    view = 'market',
    limit = 28,
    asOf,
  }: { window?: number; view?: AtlasView; limit?: number; asOf?: string } = {}
): string {
  const params = new URLSearchParams({ window: String(window), view, limit: String(limit) })
  if (asOf) params.set('asOf', asOf)
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
      dominantCountry: community.dominantCountry ? String(community.dominantCountry) : null,
      dominantRegion: community.dominantRegion ? String(community.dominantRegion) : null,
      marketCapTotal: community.marketCapTotal === null || community.marketCapTotal === undefined
        ? null
        : Math.max(0, finite(community.marketCapTotal)),
      bridgeCount: Math.max(0, finite(community.bridgeCount)),
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
    landmarks: normalizeAtlasNodes(payload.landmarks ?? []),
    backbone: normalizeAtlasEdges(payload.backbone ?? []),
  }
}

function normalizeAtlasNodes(nodes: AtlasNode[]): AtlasNode[] {
  return nodes.map((node) => ({
    symbol: normalizedSymbol(node.symbol),
    name: String(node.name || node.symbol || ''),
    communityId: String(node.communityId || ''),
    position: normalizedPosition(node.position),
    importance: Math.max(0, Math.min(1, finite(node.importance))),
    centrality: Math.max(0, Math.min(1, finite(node.centrality, finite(node.importance)))),
    bridgeScore: Math.max(0, Math.min(1, finite(node.bridgeScore))),
    volatility: node.volatility === null || node.volatility === undefined ? null : Math.max(0, finite(node.volatility)),
    sector: node.sector ? String(node.sector) : null,
    industry: node.industry ? String(node.industry) : null,
    country: node.country ? String(node.country) : null,
    region: node.region ? String(node.region) : null,
    marketCap: node.marketCap === null || node.marketCap === undefined ? null : Math.max(0, finite(node.marketCap)),
    context: node.context === true || node.isBoundary === true,
    isBoundary: Boolean(node.isBoundary),
  })).filter((node) => node.symbol)
}

function normalizeAtlasEdges(edges: AtlasEdge[]): AtlasEdge[] {
  return edges.map((edge) => ({
    source: normalizedSymbol(edge.source),
    target: normalizedSymbol(edge.target),
    sourceCommunityId: String(edge.sourceCommunityId || ''),
    targetCommunityId: String(edge.targetCommunityId || ''),
    strength: finite(edge.strength),
    confidence: edge.confidence === null || edge.confidence === undefined
      ? null
      : Math.max(0, Math.min(1, finite(edge.confidence))),
    direction: String(edge.direction || 'undirected'),
    score: Math.max(0, finite(edge.score)),
  })).filter((edge) => edge.source && edge.target && edge.source !== edge.target)
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
    nodes: normalizeAtlasNodes(payload.nodes ?? []),
    edges: normalizeAtlasEdges(payload.edges ?? []),
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
  options: { window?: number; view?: AtlasView; limit?: number; asOf?: string } = {}
): Promise<RelationshipAtlasDetail> {
  const payload = await fetchBackendJson<Partial<RelationshipAtlasDetail>>(
    marketAtlasCommunityPath(communityId, options),
    { context: 'market.atlas.community', timeoutMs: 9000, init: currentNetworkInit() }
  )
  return normalizeRelationshipAtlasDetail(payload)
}

export async function getRelationshipAtlasNeighborhood(
  ticker: string,
  options: { window?: number; view?: AtlasView; limit?: number; asOf?: string } = {}
): Promise<RelationshipAtlasDetail> {
  const payload = await fetchBackendJson<Partial<RelationshipAtlasDetail>>(
    marketAtlasNeighborhoodPath(ticker, options),
    { context: 'market.atlas.neighborhood', timeoutMs: 9000, init: currentNetworkInit() }
  )
  return normalizeRelationshipAtlasDetail(payload)
}

function fallbackTopologyPositions(nodes: NetworkNode[], edges: NetworkEdge[]): Map<string, AtlasPosition> {
  type MutablePoint = AtlasPosition & { vx: number; vy: number }
  const points = new Map<string, MutablePoint>()
  nodes.forEach((node, index) => {
    const angle = index * 2.399963229728653
    const radius = 0.9 + Math.sqrt(index) * 0.52
    points.set(node.ticker, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.74, z: 0, vx: 0, vy: 0 })
  })
  const visibleEdges = edges.filter((edge) => points.has(edge.source) && points.has(edge.target))
  const values = [...points.values()]
  for (let tick = 0; tick < 130; tick += 1) {
    const cooling = 1 - tick / 150
    for (const edge of visibleEdges) {
      const source = points.get(edge.source)
      const target = points.get(edge.target)
      if (!source || !target) continue
      const dx = target.x - source.x || 0.001
      const dy = target.y - source.y || 0.001
      const distance = Math.sqrt(dx * dx + dy * dy)
      const desired = 1.05 + Math.pow(1 - Math.min(1, Math.abs(edge.correlation)), 1.4) * 2.8
      const force = (distance - desired) * 0.018 * cooling
      source.vx += (dx / distance) * force
      source.vy += (dy / distance) * force
      target.vx -= (dx / distance) * force
      target.vy -= (dy / distance) * force
    }
    for (let left = 0; left < values.length; left += 1) {
      for (let right = left + 1; right < values.length; right += 1) {
        const a = values[left]
        const b = values[right]
        const dx = b.x - a.x || 0.001
        const dy = b.y - a.y || 0.001
        const distanceSquared = Math.max(0.08, dx * dx + dy * dy)
        const force = (0.008 * cooling) / distanceSquared
        a.vx -= dx * force
        a.vy -= dy * force
        b.vx += dx * force
        b.vy += dy * force
      }
    }
    for (const point of values) {
      point.vx = (point.vx - point.x * 0.0018) * 0.82
      point.vy = (point.vy - point.y * 0.0018) * 0.82
      point.x += point.vx
      point.y += point.vy
    }
  }
  return new Map([...points.entries()].map(([symbol, point]) => [symbol, { x: point.x, y: point.y, z: 0 }]))
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
  const scoreBySymbol = new Map<string, number>()
  for (const edge of viewEdges) {
    const score = Math.abs(edge.correlation)
    scoreBySymbol.set(edge.source, (scoreBySymbol.get(edge.source) ?? 0) + score)
    scoreBySymbol.set(edge.target, (scoreBySymbol.get(edge.target) ?? 0) + score)
  }
  const sourceNodes = [...graph.nodes]
    .sort((left, right) => (scoreBySymbol.get(right.ticker) ?? 0) - (scoreBySymbol.get(left.ticker) ?? 0))
    .slice(0, 84)
  const symbols = new Set(sourceNodes.map((node) => node.ticker))
  const maxScore = Math.max(...sourceNodes.map((node) => scoreBySymbol.get(node.ticker) ?? 0), 1)
  const positions = fallbackTopologyPositions(sourceNodes, viewEdges)
  const landmarks: AtlasNode[] = sourceNodes.map((node, index) => {
    const centrality = Math.sqrt((scoreBySymbol.get(node.ticker) ?? 0) / maxScore)
    return {
      symbol: node.ticker,
      name: node.name || node.ticker,
      communityId: '',
      position: positions.get(node.ticker) ?? { x: index, y: 0, z: 0 },
      importance: centrality,
      centrality,
      bridgeScore: 0,
      volatility: null,
      sector: node.sector,
      industry: null,
      country: node.country,
      region: node.region,
      marketCap: node.marketCap,
      context: false,
    }
  })
  const backbone: AtlasEdge[] = viewEdges
    .filter((edge) => symbols.has(edge.source) && symbols.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceCommunityId: '',
      targetCommunityId: '',
      strength: edge.correlation,
      confidence: edge.relationshipConfidence ?? null,
      direction: edge.relationshipDirectional ? 'a_leads_b' : 'undirected',
      score: Math.abs(edge.correlation),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 120)
  return {
    atlas: {
      asOf: graph.asOf ?? '',
      window: Number(graph.window) || 252,
      view,
      communities: [],
      links: [],
      landmarks,
      backbone,
      materialized: false,
    },
    details: {},
  }
}
