import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMarketUniverseScene } from '../lib/market-universe-layout'
import type { AtlasCommunity, AtlasEdge, AtlasNode, RelationshipAtlas, RelationshipAtlasDetail } from '../lib/network-atlas'

function community(id: string, x: number, y: number, memberCount = 40): AtlasCommunity {
  return {
    id,
    label: 'Technology',
    displayLabel: `Technology · ${id.toUpperCase()}`,
    displayName: 'Technology-led network',
    description: `US relationship field anchored by ${id.toUpperCase()}.`,
    scopeLabel: 'US',
    memberCount,
    averageConfidence: 0.9,
    dominantSector: 'Technology',
    dominantCountry: 'US',
    dominantRegion: 'US',
    marketCapTotal: null,
    bridgeCount: 12,
    position: { x, y, z: 0 },
    representativeSymbols: [id.toUpperCase()],
    themes: [],
  }
}

function node(symbol: string, communityId: string, x: number, y: number): AtlasNode {
  return {
    symbol,
    name: symbol,
    communityId,
    position: { x, y, z: 0 },
    importance: 0.6,
    centrality: 0.6,
    bridgeScore: 0.3,
    volatility: 0.2,
    sector: 'Technology',
    industry: null,
    country: 'US',
    region: 'US',
    marketCap: null,
    context: false,
  }
}

function edge(source: string, target: string, strength: number, confidence = 0.9): AtlasEdge {
  return {
    source,
    target,
    sourceCommunityId: 'a',
    targetCommunityId: 'a',
    strength,
    confidence,
    direction: 'undirected',
    score: Math.abs(strength) * confidence,
  }
}

const communities = Array.from({ length: 14 }, (_, index) => community(`c${index}`, index % 3, Math.floor(index / 3)))
const atlas: RelationshipAtlas = {
  asOf: '2026-08-03',
  window: 252,
  view: 'market',
  communities,
  links: [],
  landmarks: communities.map((item, index) => node(item.representativeSymbols[0]!, item.id, index, index)),
  backbone: [],
  materialized: true,
}

test('economy projection is bounded, selective, and deterministic', () => {
  const first = buildMarketUniverseScene({ atlas, detail: null, neighborhood: null, selectedCommunityId: null, activeSymbol: null, mobile: false })
  const second = buildMarketUniverseScene({ atlas, detail: null, neighborhood: null, selectedCommunityId: null, activeSymbol: null, mobile: false })
  assert.equal(first.level, 'economy')
  assert.equal(first.overview.communities.length, 14)
  assert.ok(first.overview.communities.every((item) => item.sceneRadius >= 1.5 && item.sceneRadius <= 3.3))
  assert.ok(first.overview.communities.every((item) => item.visibleMemberCount > 0))
  // The economy is spread across the correlation plane but bounded to a compact,
  // topology-true world (fields sit nearly tangent so distances read as relatedness)
  // rather than the old deliberately-wide layout that pushed the camera far back.
  const maxAbsX = Math.max(...first.overview.communities.map((item) => Math.abs(item.position.x)))
  assert.ok(maxAbsX > 6 && maxAbsX <= 17, `communities spread but bounded: ${maxAbsX}`)
  // Every field sits on one level — none is stacked in front of or behind
  // another. Depth lives inside each field (its balls form a rounded 3D cluster),
  // not between fields, so the field centers stay coplanar.
  const zSpread = Math.max(...first.overview.communities.map((item) => item.position.z))
    - Math.min(...first.overview.communities.map((item) => item.position.z))
  assert.ok(zSpread < 0.001, `field centers are coplanar: ${zSpread}`)
  assert.deepEqual(first.overview.communities.map((item) => item.position), second.overview.communities.map((item) => item.position))
})

test('economy fields expose multiple real landmarks when the overview payload provides them', () => {
  const richAtlas: RelationshipAtlas = {
    ...atlas,
    landmarks: communities.flatMap((item, communityIndex) => Array.from({ length: 3 }, (_, nodeIndex) => (
      node(`${item.id.toUpperCase()}-${nodeIndex}`, item.id, communityIndex, nodeIndex)
    ))),
  }
  const scene = buildMarketUniverseScene({ atlas: richAtlas, detail: null, neighborhood: null, selectedCommunityId: null, activeSymbol: null, mobile: false })
  assert.equal(scene.overview.communities.length, 14)
  assert.equal(scene.overview.nodes.length, 42)
  assert.ok(scene.overview.communities.every((item) => item.visibleMemberCount === 3))
})

test('loaded field members fill in around the landmarks without moving them', () => {
  const target = communities[0]!
  const landmark = atlas.landmarks.find((item) => item.communityId === target.id)!
  // Members share the same embedding as their landmark, so their coordinates sit
  // in its neighbourhood (near the landmark at 0,0) — not scattered across the map.
  const members = Array.from({ length: 6 }, (_, index) => node(`M${index}`, target.id, (index + 1) * 0.2, (index + 1) * -0.15))
  const detail: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: target.id,
    community: target,
    nodes: [landmark, ...members],
    edges: [],
  }
  const base = buildMarketUniverseScene({ atlas, detail: null, neighborhood: null, selectedCommunityId: null, activeSymbol: null, mobile: false })
  const withMembers = buildMarketUniverseScene({ atlas, detail: null, neighborhood: null, selectedCommunityId: null, fieldDetails: new Map([[target.id, detail]]), activeSymbol: null, mobile: false })

  // No extra members until that field's detail has been loaded.
  assert.equal(base.overview.memberNodesByCommunity.size, 0)

  // Once loaded, the members appear, excluding the landmark already on the map.
  const loaded = withMembers.overview.memberNodesByCommunity.get(target.id) ?? []
  assert.equal(loaded.length, 6)
  assert.ok(loaded.every((item) => item.symbol !== landmark.symbol))

  // The landmark keeps its exact position whether or not members were loaded —
  // members fill in around it, the map never re-lays-out.
  const key = `${landmark.communityId}:${landmark.symbol}`
  const before = base.overview.nodes.find((item) => `${item.communityId}:${item.symbol}` === key)!.position
  const after = withMembers.overview.nodes.find((item) => `${item.communityId}:${item.symbol}` === key)!.position
  assert.deepEqual(before, after)

  // Members sit in the same field neighbourhood as the landmark, not scattered.
  const maxSpread = Math.max(...loaded.map((item) => Math.hypot(item.position.x - after.x, item.position.y - after.y)))
  assert.ok(maxSpread < 8, `members cluster near the field: ${maxSpread}`)
})

test('world overview retains cross-field bridge companies and their relationship', () => {
  const left = community('left', -1, 0)
  const right = community('right', 1, 0)
  const leftBridge = node('LEFT', left.id, -1, 0)
  const rightBridge = node('RIGHT', right.id, 1, 0)
  const bridge = {
    ...edge(leftBridge.symbol, rightBridge.symbol, 0.82),
    sourceCommunityId: left.id,
    targetCommunityId: right.id,
  }
  const scene = buildMarketUniverseScene({
    atlas: {
      ...atlas,
      communities: [left, right],
      landmarks: [leftBridge, rightBridge],
      backbone: [bridge],
    },
    detail: null,
    neighborhood: null,
    selectedCommunityId: null,
    activeSymbol: null,
    mobile: false,
  })
  assert.ok(scene.overview.nodes.some((item) => item.symbol === leftBridge.symbol && item.communityId === left.id))
  assert.ok(scene.overview.nodes.some((item) => item.symbol === rightBridge.symbol && item.communityId === right.id))
  assert.equal(scene.overview.edges.length, 1)
  assert.equal(scene.overview.edges[0]?.sourceCommunityId, left.id)
  assert.equal(scene.overview.edges[0]?.targetCommunityId, right.id)
})

test('field projection spreads coincident canonical nodes without changing their identity', () => {
  const selected = communities[0]!
  const nodes = Array.from({ length: 32 }, (_, index) => node(`N${index}`, selected.id, 0, 0))
  const detail: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: selected.id,
    community: selected,
    nodes,
    edges: [],
  }
  const scene = buildMarketUniverseScene({ atlas, detail, neighborhood: null, selectedCommunityId: selected.id, activeSymbol: null, mobile: false })
  assert.equal(scene.level, 'field')
  assert.equal(scene.field?.nodes.length, 28)
  assert.ok(new Set(scene.field?.nodes.map((item) => `${item.position.x.toFixed(3)}:${item.position.y.toFixed(3)}`)).size > 20)
})

test('field projection preserves boundary companies and their cross-field evidence', () => {
  const selected = communities[0]!
  const internal = node('INTERNAL', selected.id, 0, 0)
  const boundary = { ...node('BRIDGE', 'outside', 4, 2), context: true, isBoundary: true }
  const detail: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: selected.id,
    community: selected,
    nodes: [internal, boundary],
    edges: [{ ...edge('INTERNAL', 'BRIDGE', 0.74), targetCommunityId: 'outside' }],
  }
  const scene = buildMarketUniverseScene({ atlas, detail, neighborhood: null, selectedCommunityId: selected.id, activeSymbol: null, mobile: false })
  assert.equal(scene.level, 'field')
  assert.ok(scene.field?.nodes.some((item) => item.symbol === 'BRIDGE' && item.isBoundary))
  assert.ok(scene.field?.edges.some((item) => item.target === 'BRIDGE'))
})

test('scene layout collapses duplicate ticker records and duplicate relationships', () => {
  const selected = communities[0]!
  const primary = node('DUPLICATE', selected.id, 0, 0)
  const duplicate = { ...node('DUPLICATE', selected.id, 0, 0), centrality: 0.25, context: true }
  const peer = node('PEER', selected.id, 1, 1)
  const detail: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: selected.id,
    community: selected,
    nodes: [primary, duplicate, peer],
    edges: [edge('DUPLICATE', 'PEER', 0.42), edge('PEER', 'DUPLICATE', 0.71)],
  }
  const scene = buildMarketUniverseScene({ atlas, detail, neighborhood: null, selectedCommunityId: selected.id, activeSymbol: null, mobile: false })
  assert.equal(scene.field?.nodes.filter((item) => item.symbol === 'DUPLICATE').length, 1)
  assert.equal(scene.field?.edges.length, 1)
  assert.equal(scene.field?.edges[0]?.strength, 0.71)
})

test('company projection keeps the focus central and maps stronger relationships closer', () => {
  const focus = node('FOCUS', 'a', 8, 8)
  const strong = node('STRONG', 'a', 9, 9)
  const weak = node('WEAK', 'a', 10, 10)
  const neighborhood: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: focus.symbol,
    community: communities[0]!,
    nodes: [focus, strong, weak],
    edges: [edge('FOCUS', 'STRONG', 0.9), edge('FOCUS', 'WEAK', 0.2)],
  }
  const scene = buildMarketUniverseScene({ atlas: { ...atlas, landmarks: [focus] }, detail: null, neighborhood, selectedCommunityId: 'a', activeSymbol: focus.symbol, mobile: false })
  assert.ok(scene.company)
  const central = scene.company.nodes.find((item) => item.symbol === 'FOCUS')
  const strongNode = scene.company.nodes.find((item) => item.symbol === 'STRONG')
  const weakNode = scene.company.nodes.find((item) => item.symbol === 'WEAK')
  assert.ok(central)
  assert.ok(strongNode)
  assert.ok(weakNode)
  assert.equal(scene.level, 'company')
  assert.notDeepEqual(central.position, { x: 0, y: 0, z: 0.18 })
  assert.ok(Math.hypot(strongNode.position.x - central.position.x, strongNode.position.y - central.position.y) < Math.hypot(weakNode.position.x - central.position.x, weakNode.position.y - central.position.y))
  assert.equal(scene.company?.edges.length, 2)
})

test('semantic zoom adds field detail without replacing the world overview', () => {
  const selected = communities[0]!
  const detail: RelationshipAtlasDetail = {
    asOf: atlas.asOf,
    window: atlas.window,
    view: atlas.view,
    focus: selected.id,
    community: selected,
    nodes: [node('LOCAL', selected.id, 0, 0), node('PEER', selected.id, 1, 1)],
    edges: [edge('LOCAL', 'PEER', 0.75)],
  }
  const scene = buildMarketUniverseScene({
    atlas,
    detail: null,
    neighborhood: null,
    selectedCommunityId: null,
    lodCommunityId: selected.id,
    lodDetail: detail,
    activeSymbol: null,
    mobile: false,
  })
  assert.equal(scene.level, 'economy')
  assert.equal(scene.overview.communities.length, 14)
  assert.equal(scene.field?.communities[0]?.id, selected.id)
  assert.equal(scene.field?.nodes.length, 2)
})
