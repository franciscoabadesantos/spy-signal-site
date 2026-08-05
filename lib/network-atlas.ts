export type AtlasView = 'market' | 'residual' | 'timing' | 'theme'

export type AtlasPosition = { x: number; y: number; z: number }

export type AtlasCommunity = {
  id: string
  label: string
  displayLabel: string
  displayName: string
  description: string
  scopeLabel: string
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

function finite(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizedSymbol(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}

function optionalAtlasText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const token = String(value).trim()
  if (!token || ['<na>', 'nan', 'nat', 'none', 'null', 'unknown'].includes(token.toLowerCase())) return null
  return token
}

function normalizedPosition(value: Partial<AtlasPosition> | null | undefined): AtlasPosition {
  return { x: finite(value?.x), y: finite(value?.y), z: finite(value?.z) }
}

function normalizeAtlasNodes(nodes: AtlasNode[]): AtlasNode[] {
  return nodes.map((node) => ({
    symbol: normalizedSymbol(node.symbol),
    name: optionalAtlasText(node.name) ?? normalizedSymbol(node.symbol),
    communityId: String(node.communityId || ''),
    position: normalizedPosition(node.position),
    importance: Math.max(0, Math.min(1, finite(node.importance))),
    centrality: Math.max(0, Math.min(1, finite(node.centrality, finite(node.importance)))),
    bridgeScore: Math.max(0, Math.min(1, finite(node.bridgeScore))),
    volatility: node.volatility === null || node.volatility === undefined ? null : Math.max(0, finite(node.volatility)),
    sector: optionalAtlasText(node.sector),
    industry: optionalAtlasText(node.industry),
    country: optionalAtlasText(node.country),
    region: optionalAtlasText(node.region),
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
      label: optionalAtlasText(community.label) ?? 'Market cluster',
      displayLabel: optionalAtlasText(community.displayLabel)
        ?? communityDisplayLabel(community),
      displayName: optionalAtlasText(community.displayName)
        ?? communityDisplayName(community),
      description: optionalAtlasText(community.description)
        ?? communityDescription(community),
      scopeLabel: optionalAtlasText(community.scopeLabel)
        ?? optionalAtlasText(community.dominantRegion)
        ?? optionalAtlasText(community.dominantCountry)
        ?? 'Global',
      memberCount: Math.max(1, finite(community.memberCount, 1)),
      averageConfidence: Math.max(0, Math.min(1, finite(community.averageConfidence))),
      dominantSector: optionalAtlasText(community.dominantSector),
      dominantCountry: optionalAtlasText(community.dominantCountry),
      dominantRegion: optionalAtlasText(community.dominantRegion),
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

function communityBaseLabel(community: Partial<AtlasCommunity>): string {
  const label = optionalAtlasText(community.label) ?? 'Market cluster'
  return label.toLowerCase() === 'market cluster' ? 'Cross-market' : label
}

function communityRepresentatives(community: Partial<AtlasCommunity>): string[] {
  return Array.isArray(community.representativeSymbols)
    ? community.representativeSymbols.map(normalizedSymbol).filter(Boolean)
    : []
}

function communityDisplayLabel(community: Partial<AtlasCommunity>): string {
  const base = communityBaseLabel(community)
  const anchor = communityRepresentatives(community)[0]
  return anchor ? `${base} · ${anchor}` : base
}

function communityDisplayName(community: Partial<AtlasCommunity>): string {
  const base = communityBaseLabel(community)
  return communityRepresentatives(community).length ? `${base}-led network` : `${base} network`
}

function communityDescription(community: Partial<AtlasCommunity>): string {
  const scope = optionalAtlasText(community.dominantRegion)
    ?? optionalAtlasText(community.dominantCountry)
    ?? 'Global'
  const anchors = communityRepresentatives(community).slice(0, 3)
  if (!anchors.length) return `${scope} relationship field.`
  const anchorCopy = anchors.length === 1
    ? anchors[0]
    : `${anchors.slice(0, -1).join(', ')} and ${anchors.at(-1)}`
  return `${scope} relationship field anchored by ${anchorCopy}.`
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
