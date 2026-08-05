import type {
  AtlasCommunity,
  AtlasEdge,
  AtlasNode,
  AtlasPosition,
  RelationshipAtlas,
  RelationshipAtlasDetail,
} from './network-atlas'

export type MarketUniverseLevel = 'economy' | 'field' | 'company'

export type SceneCommunity = AtlasCommunity & {
  sceneRadius: number
  visibleMemberCount: number
}

export type SceneNode = AtlasNode & {
  sceneRadius: number
}

export type MarketUniverseSceneLayer = {
  communities: SceneCommunity[]
  nodes: SceneNode[]
  edges: AtlasEdge[]
  labelSymbols: Set<string>
}

export type MarketUniverseSceneModel = {
  // Level is explicit user focus only. Semantic zoom can add a field layer
  // without moving the camera or changing the inspector state.
  level: MarketUniverseLevel
  overview: MarketUniverseSceneLayer
  field: MarketUniverseSceneLayer | null
  company: MarketUniverseSceneLayer | null
}

type SceneInput = {
  atlas: RelationshipAtlas
  detail: RelationshipAtlasDetail | null
  neighborhood: RelationshipAtlasDetail | null
  selectedCommunityId: string | null
  lodCommunityId?: string | null
  lodDetail?: RelationshipAtlasDetail | null
  activeSymbol: string | null
  mobile: boolean
}

type Projectable = {
  key: string
  source: AtlasPosition
  radius: number
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function stableUnit(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

export function marketUniverseNodeRadius(node: AtlasNode): number {
  if (node.marketCap && node.marketCap > 0) {
    const normalized = clamp((Math.log10(node.marketCap) - 8.5) / 4)
    return 0.105 + Math.pow(normalized, 1.3) * 0.24
  }
  return 0.11 + clamp(node.centrality || node.importance) * 0.17
}

export function marketUniverseCommunityRadius(community: AtlasCommunity): number {
  const mass = clamp(Math.log2(community.memberCount + 1) / 8.5)
  // A field is physical terrain in the atlas, not a small badge around a
  // company. Its mass determines the amount of world it occupies at medium
  // zoom; bridges influence discovery but do not turn into arbitrary size.
  return 1.55 + mass * 1.7
}

export function marketUniverseNodeKey(node: Pick<AtlasNode, 'communityId' | 'symbol'>): string {
  return `${node.communityId}:${node.symbol}`
}

export function marketUniverseEdgeEndpointKey(communityId: string, symbol: string): string {
  return `${communityId}:${symbol}`
}

function projectedPositions(
  items: Projectable[],
  bounds: { width: number; height: number; depth: number; spacing: number; dispersion?: number },
): Map<string, AtlasPosition> {
  const result = new Map<string, AtlasPosition>()
  if (!items.length) return result
  const means = items.reduce(
    (total, item) => ({
      x: total.x + item.source.x / items.length,
      y: total.y + item.source.y / items.length,
      z: total.z + item.source.z / items.length,
    }),
    { x: 0, y: 0, z: 0 },
  )
  const deviations = items.reduce(
    (total, item) => ({
      x: total.x + Math.pow(item.source.x - means.x, 2) / items.length,
      y: total.y + Math.pow(item.source.y - means.y, 2) / items.length,
      z: total.z + Math.pow(item.source.z - means.z, 2) / items.length,
    }),
    { x: 0, y: 0, z: 0 },
  )
  const scale = {
    x: Math.max(0.18, Math.sqrt(deviations.x) * 2.35),
    y: Math.max(0.18, Math.sqrt(deviations.y) * 2.35),
    z: Math.max(0.18, Math.sqrt(deviations.z) * 2.35),
  }
  const shallowDepth = Math.sqrt(deviations.z) < 0.001
  const positions = items.map((item, index) => {
    const fallbackAngle = stableUnit(item.key) * Math.PI * 2 + index * GOLDEN_ANGLE
    const sourceDistance = Math.hypot(item.source.x - means.x, item.source.y - means.y)
    const fallback = {
      x: Math.cos(fallbackAngle) * bounds.width * 0.78,
      y: Math.sin(fallbackAngle) * bounds.height * 0.76,
      z: (stableUnit(`${item.key}:depth`) * 2 - 1) * bounds.depth,
    }
    const source = {
      x: sourceDistance < 0.001
        ? fallback.x
        : clamp((item.source.x - means.x) / scale.x, -1, 1) * bounds.width,
      y: sourceDistance < 0.001
        ? fallback.y
        : clamp((item.source.y - means.y) / scale.y, -1, 1) * bounds.height,
      z: shallowDepth
        ? fallback.z
        : clamp((item.source.z - means.z) / scale.z, -1, 1) * bounds.depth,
    }
    const dispersion = bounds.dispersion ?? 0
    return {
      key: item.key,
      radius: item.radius,
      x: source.x * (1 - dispersion) + fallback.x * dispersion,
      y: source.y * (1 - dispersion) + fallback.y * dispersion,
      z: source.z * (1 - dispersion) + fallback.z * dispersion,
    }
  })

  for (let iteration = 0; iteration < 38; iteration += 1) {
    for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
      const left = positions[leftIndex]
      if (!left) continue
      for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
        const right = positions[rightIndex]
        if (!right) continue
        let dx = right.x - left.x
        let dy = right.y - left.y
        let dz = right.z - left.z
        let distance = Math.hypot(dx, dy, dz)
        const minimum = left.radius + right.radius + bounds.spacing
        if (distance >= minimum) continue
        if (distance < 0.0001) {
          const angle = stableUnit(`${left.key}:${right.key}`) * Math.PI * 2
          dx = Math.cos(angle)
          dy = Math.sin(angle)
          dz = stableUnit(`${right.key}:${left.key}:depth`) * 0.8 - 0.4
          distance = 1
        }
        const push = (minimum - distance) * 0.52
        const unitX = dx / distance
        const unitY = dy / distance
        const unitZ = dz / distance
        left.x -= unitX * push
        left.y -= unitY * push
        left.z -= unitZ * push * 0.6
        right.x += unitX * push
        right.y += unitY * push
        right.z += unitZ * push * 0.6
      }
    }
    for (const item of positions) {
      item.x = clamp(item.x * 0.995, -bounds.width, bounds.width)
      item.y = clamp(item.y * 0.995, -bounds.height, bounds.height)
      item.z = clamp(item.z, -bounds.depth, bounds.depth)
    }
  }

  for (const position of positions) {
    result.set(position.key, { x: position.x, y: position.y, z: position.z })
  }
  return result
}

function rankedCommunities(atlas: RelationshipAtlas, mobile: boolean): AtlasCommunity[] {
  const landmarkCommunityIds = new Set(atlas.landmarks.map((node) => node.communityId).filter(Boolean))
  return [...atlas.communities]
    .filter((community) => landmarkCommunityIds.has(community.id))
    .sort((left, right) => {
      const leftScore = Math.log2(left.memberCount + 1) + Math.log2(left.bridgeCount + 2) * 0.7 + left.averageConfidence
      const rightScore = Math.log2(right.memberCount + 1) + Math.log2(right.bridgeCount + 2) * 0.7 + right.averageConfidence
      return rightScore - leftScore || left.id.localeCompare(right.id)
    })
    // The atlas is a navigable world rather than a single object framed in a
    // viewport. Keep enough fields in the persistent overview that moving
    // through it reveals neighbouring economies instead of an isolated island.
    .slice(0, mobile ? 9 : 16)
}

function economyCommunityPositions(atlas: RelationshipAtlas, mobile: boolean): Map<string, AtlasPosition> {
  return projectedPositions(
    rankedCommunities(atlas, mobile).map((community) => ({
      key: community.id,
      source: community.position,
      radius: marketUniverseCommunityRadius(community),
    })),
    // Deliberately wide coordinates: the initial camera sits *inside* this
    // field and can travel through it. Do not shrink the world to fit all
    // communities into a single overview shot.
    {
      width: mobile ? 13.5 : 32,
      height: mobile ? 13 : 20,
      depth: mobile ? 7.4 : 15,
      spacing: mobile ? 2.05 : 3.65,
      dispersion: 0.38,
    },
  )
}

function rankedNodes(nodes: AtlasNode[], bridgeSymbols?: Set<string>): AtlasNode[] {
  return uniqueNodes(nodes).sort((left, right) => {
    const leftBridge = bridgeSymbols?.has(left.symbol) ? 0.8 : 0
    const rightBridge = bridgeSymbols?.has(right.symbol) ? 0.8 : 0
    return nodeRanking(right) + rightBridge - nodeRanking(left) - leftBridge || left.symbol.localeCompare(right.symbol)
  })
}

function uniqueNodes(nodes: AtlasNode[]): AtlasNode[] {
  const nodesBySymbol = new Map<string, AtlasNode>()
  for (const node of nodes) {
    const key = marketUniverseNodeKey(node)
    const current = nodesBySymbol.get(key)
    if (!current || nodeRanking(node) > nodeRanking(current) || (!node.context && current.context)) {
      nodesBySymbol.set(key, node)
    }
  }
  return [...nodesBySymbol.values()]
}

function uniqueEdges(edges: AtlasEdge[]): AtlasEdge[] {
  const edgesByPair = new Map<string, AtlasEdge>()
  for (const edge of edges) {
    const [left, right] = [
      marketUniverseEdgeEndpointKey(edge.sourceCommunityId, edge.source),
      marketUniverseEdgeEndpointKey(edge.targetCommunityId, edge.target),
    ].sort()
    const key = `${left}:${right}`
    const current = edgesByPair.get(key)
    const edgeScore = edge.score * (0.55 + (edge.confidence ?? 0.45) * 0.45)
    const currentScore = current ? current.score * (0.55 + (current.confidence ?? 0.45) * 0.45) : -Infinity
    if (!current || edgeScore > currentScore) edgesByPair.set(key, edge)
  }
  return [...edgesByPair.values()]
}

function fieldOffset(key: string, index: number, radius: number): AtlasPosition {
  const longitude = stableUnit(`${key}:longitude`) * Math.PI * 2 + index * GOLDEN_ANGLE
  const latitude = (stableUnit(`${key}:latitude`) - 0.5) * Math.PI * 0.9
  const distance = radius * (0.36 + stableUnit(`${key}:radius`) * 0.78)
  return {
    x: Math.cos(longitude) * Math.cos(latitude) * distance,
    y: Math.sin(latitude) * distance * 0.82,
    z: Math.sin(longitude) * Math.cos(latitude) * distance,
  }
}

function overviewScene(atlas: RelationshipAtlas, mobile: boolean): MarketUniverseSceneLayer {
  const sourceCommunities = rankedCommunities(atlas, mobile)
  const positions = economyCommunityPositions(atlas, mobile)
  const visibleIds = new Set(sourceCommunities.map((community) => community.id))
  const crossFieldEdges = uniqueEdges(atlas.backbone)
    .filter((edge) => (
      edge.sourceCommunityId !== edge.targetCommunityId
      && visibleIds.has(edge.sourceCommunityId)
      && visibleIds.has(edge.targetCommunityId)
    ))
    .sort((left, right) => right.score - left.score)
  const bridgeKeysByCommunity = new Map<string, Set<string>>()
  for (const edge of crossFieldEdges) {
    const source = bridgeKeysByCommunity.get(edge.sourceCommunityId) ?? new Set<string>()
    source.add(marketUniverseEdgeEndpointKey(edge.sourceCommunityId, edge.source))
    bridgeKeysByCommunity.set(edge.sourceCommunityId, source)
    const target = bridgeKeysByCommunity.get(edge.targetCommunityId) ?? new Set<string>()
    target.add(marketUniverseEdgeEndpointKey(edge.targetCommunityId, edge.target))
    bridgeKeysByCommunity.set(edge.targetCommunityId, target)
  }
  const candidatesByCommunity = new Map(sourceCommunities.map((community) => {
    const communityNodes = atlas.landmarks.filter((node) => node.communityId === community.id)
    const bridgeKeys = bridgeKeysByCommunity.get(community.id) ?? new Set<string>()
    const bridgeNodes = rankedNodes(communityNodes.filter((node) => bridgeKeys.has(marketUniverseNodeKey(node))))
    const landmarks = rankedNodes(communityNodes)
    const capacity = mobile ? 3 : 6
    const candidates = uniqueNodes([...bridgeNodes, ...landmarks]).slice(0, capacity)
    return [community.id, candidates] as const
  }))
  const communities = sourceCommunities.map((community) => {
    const candidates = candidatesByCommunity.get(community.id) ?? []
    return {
      ...community,
      position: positions.get(community.id) ?? community.position,
      sceneRadius: marketUniverseCommunityRadius(community),
      visibleMemberCount: candidates.length,
    }
  })
  const landmarks = communities.flatMap((community) => {
    const candidates = candidatesByCommunity.get(community.id) ?? []
    const center = positions.get(community.id) ?? community.position
    return candidates.map((node, index) => {
      const offset = fieldOffset(marketUniverseNodeKey(node), index, community.sceneRadius)
      return {
        ...node,
        position: { x: center.x + offset.x, y: center.y + offset.y, z: center.z + offset.z },
        sceneRadius: marketUniverseNodeRadius(node) * 0.86,
      }
    })
  })
  const landmarkKeys = new Set(landmarks.map((node) => marketUniverseNodeKey(node)))
  const edges = crossFieldEdges
    .filter((edge) => (
      landmarkKeys.has(marketUniverseEdgeEndpointKey(edge.sourceCommunityId, edge.source))
      && landmarkKeys.has(marketUniverseEdgeEndpointKey(edge.targetCommunityId, edge.target))
    ))
    .slice(0, mobile ? 18 : 54)
  return {
    communities,
    nodes: landmarks,
    edges,
    labelSymbols: new Set(
      communities
        .flatMap((community) => (candidatesByCommunity.get(community.id) ?? []).slice(0, 1))
        .slice(0, mobile ? 4 : 8)
        .map((node) => node.symbol),
    ),
  }
}

function nodeRanking(node: AtlasNode): number {
  return node.centrality + node.bridgeScore * 0.72 + node.importance * 0.35 + (node.context ? -0.35 : 0)
}

function fieldScene(
  atlas: RelationshipAtlas,
  community: AtlasCommunity,
  detail: RelationshipAtlasDetail | null,
  mobile: boolean,
): MarketUniverseSceneLayer {
  const fallbackNodes = atlas.landmarks.filter((node) => node.communityId === community.id)
  const availableNodes = uniqueNodes(detail?.nodes.length ? detail.nodes : fallbackNodes)
  const internalNodes = rankedNodes(availableNodes.filter((node) => !node.context && !node.isBoundary))
    .slice(0, mobile ? 15 : 28)
  const boundaryNodes = rankedNodes(availableNodes.filter((node) => node.context || node.isBoundary))
    .slice(0, mobile ? 5 : 10)
  const sourceNodes = uniqueNodes([...internalNodes, ...boundaryNodes])
  const anchor = economyCommunityPositions(atlas, mobile).get(community.id) ?? community.position
  const positions = projectedPositions(
    sourceNodes.map((node) => ({ key: marketUniverseNodeKey(node), source: node.position, radius: marketUniverseNodeRadius(node) })),
    { width: mobile ? 3.8 : 5.6, height: mobile ? 4.1 : 3.9, depth: mobile ? 2.2 : 3.25, spacing: mobile ? 0.34 : 0.48 },
  )
  const nodes = sourceNodes.map((node) => ({
    ...node,
    position: (() => {
      const position = positions.get(marketUniverseNodeKey(node)) ?? node.position
      const boundaryScale = node.context || node.isBoundary ? 1.16 : 1
      return {
        x: anchor.x + position.x * boundaryScale,
        y: anchor.y + position.y * boundaryScale,
        z: anchor.z + position.z * boundaryScale,
      }
    })(),
    sceneRadius: marketUniverseNodeRadius(node),
  }))
  const visibleSymbols = new Set(nodes.map((node) => node.symbol))
  const edges = uniqueEdges(detail?.edges ?? [])
    .filter((edge) => visibleSymbols.has(edge.source) && visibleSymbols.has(edge.target))
    .sort((left, right) => right.score - left.score)
    .slice(0, mobile ? 42 : 84)
  const extent = Math.max(
    mobile ? 4.1 : 5.15,
    ...nodes.map((node) => Math.hypot(
      node.position.x - anchor.x,
      node.position.y - anchor.y,
      node.position.z - anchor.z,
    ) + node.sceneRadius),
  )
  const sceneCommunity: SceneCommunity = {
    ...community,
    position: anchor,
    sceneRadius: extent,
    visibleMemberCount: nodes.length,
  }
  const labelNodes = [...internalNodes.slice(0, mobile ? 4 : 7), ...boundaryNodes.slice(0, mobile ? 1 : 2)]
  return {
    communities: [sceneCommunity],
    nodes,
    edges,
    labelSymbols: new Set(labelNodes.map((node) => node.symbol)),
  }
}

function companyScene(
  atlas: RelationshipAtlas,
  detail: RelationshipAtlasDetail | null,
  neighborhood: RelationshipAtlasDetail | null,
  field: MarketUniverseSceneLayer | null,
  activeSymbol: string,
  mobile: boolean,
): MarketUniverseSceneLayer | null {
  const source = neighborhood ?? detail
  const allNodes = new Map<string, AtlasNode>()
  for (const node of atlas.landmarks) allNodes.set(node.symbol, node)
  for (const node of detail?.nodes ?? []) allNodes.set(node.symbol, node)
  for (const node of neighborhood?.nodes ?? []) allNodes.set(node.symbol, node)
  const activeNode = allNodes.get(activeSymbol)
  if (!activeNode) return null
  const edges = uniqueEdges(source?.edges ?? [])
    .filter((edge) => edge.source === activeSymbol || edge.target === activeSymbol)
    .sort((left, right) => {
      const leftConfidence = left.confidence ?? 0.45
      const rightConfidence = right.confidence ?? 0.45
      return right.score * (0.55 + rightConfidence * 0.45) - left.score * (0.55 + leftConfidence * 0.45)
    })
    .slice(0, mobile ? 7 : 11)
  const strengths = edges.map((edge) => Math.abs(edge.strength))
  const minimum = Math.min(...strengths, 0)
  const maximum = Math.max(...strengths, 1)
  const fieldAnchor = field?.nodes.find((node) => node.symbol === activeSymbol)?.position
    ?? field?.communities[0]?.position
    ?? activeNode.position
  const positioned: SceneNode[] = [{
    ...activeNode,
    position: fieldAnchor,
    sceneRadius: marketUniverseNodeRadius(activeNode),
  }]
  const visibleEdges: AtlasEdge[] = []
  edges.forEach((edge, index) => {
    const peerSymbol = edge.source === activeSymbol ? edge.target : edge.source
    const peer = allNodes.get(peerSymbol)
    if (!peer) return
    const normalizedStrength = clamp((Math.abs(edge.strength) - minimum) / Math.max(0.001, maximum - minimum))
    const radius = (mobile ? 2.8 : 3.25) - normalizedStrength * (mobile ? 1.15 : 1.45)
      + (peer.context || peer.isBoundary ? 0.22 : 0)
    const angle = -0.28 + index * GOLDEN_ANGLE + stableUnit(peer.symbol) * 0.34
    const existingPosition = field?.nodes.find((node) => node.symbol === peer.symbol)?.position
    positioned.push({
      ...peer,
      position: existingPosition ?? {
        x: fieldAnchor.x + Math.cos(angle) * radius,
        y: fieldAnchor.y + Math.sin(angle) * radius * (mobile ? 1.12 : 0.72),
        z: fieldAnchor.z - 0.08 + Math.sin(angle * 1.7) * 0.34,
      },
      sceneRadius: marketUniverseNodeRadius(peer),
    })
    visibleEdges.push(edge)
  })
  const labels = [activeSymbol, ...positioned.slice(1, mobile ? 4 : 7).map((node) => node.symbol)]
  return { communities: [], nodes: positioned, edges: visibleEdges, labelSymbols: new Set(labels) }
}

export function buildMarketUniverseScene(input: SceneInput): MarketUniverseSceneModel {
  const overview = overviewScene(input.atlas, input.mobile)
  const selected = input.atlas.communities.find((community) => community.id === input.selectedCommunityId) ?? null
  const lodCommunity = input.atlas.communities.find((community) => community.id === input.lodCommunityId) ?? null
  const fieldCommunity = selected ?? lodCommunity
  const fieldDetail = selected ? input.detail : input.lodDetail ?? null
  const field = fieldCommunity ? fieldScene(input.atlas, fieldCommunity, fieldDetail, input.mobile) : null
  const company = input.activeSymbol
    ? companyScene(input.atlas, input.detail, input.neighborhood, field, input.activeSymbol, input.mobile)
    : null

  return {
    level: company ? 'company' : selected ? 'field' : 'economy',
    overview,
    field,
    company,
  }
}
