/**
 * Synthetic market atlas used ONLY by the Playwright backend stub.
 *
 * This is not production data and must never be imported by application code.
 * Every symbol carries the FX prefix and every name says "Fixture" so that a
 * screenshot or a stray log line is instantly recognisable as test-only.
 *
 * The shape follows lib/network-atlas.ts: RelationshipAtlas for /network/atlas,
 * RelationshipAtlasDetail for /network/communities/{id} and
 * /network/neighborhoods/{ticker}. Values are fixed rather than random so the
 * browser suite is deterministic run to run.
 */

const AS_OF = '2026-01-02'

const FIELDS = [
  {
    id: 'fx-field-alpha',
    label: 'Fixture Alpha',
    dominantSector: 'Fixture Industrials',
    dominantCountry: 'Testland',
    dominantRegion: 'Test Region',
    position: { x: -0.62, y: 0.18, z: 0 },
    themes: ['fixture', 'alpha'],
  },
  {
    id: 'fx-field-beta',
    label: 'Fixture Beta',
    dominantSector: 'Fixture Technology',
    dominantCountry: 'Testland',
    dominantRegion: 'Test Region',
    position: { x: 0.54, y: -0.22, z: 0 },
    themes: ['fixture', 'beta'],
  },
  {
    id: 'fx-field-gamma',
    label: 'Fixture Gamma',
    dominantSector: 'Fixture Materials',
    dominantCountry: 'Testland',
    dominantRegion: 'Test Region',
    position: { x: 0.06, y: 0.66, z: 0 },
    themes: ['fixture', 'gamma'],
  },
]

/** Six deterministic members per field, spread on a fixed ring. */
function membersFor(fieldIndex) {
  const field = FIELDS[fieldIndex]
  const letter = 'ABC'[fieldIndex]
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2
    return {
      symbol: `FX${letter}${i + 1}`,
      name: `Fixture ${field.label} Holding ${i + 1}`,
      communityId: field.id,
      position: {
        x: field.position.x + Math.cos(angle) * 0.16,
        y: field.position.y + Math.sin(angle) * 0.16,
        z: 0,
      },
      importance: 0.9 - i * 0.1,
      centrality: 0.8 - i * 0.09,
      bridgeScore: i === 0 ? 0.62 : 0.18 + i * 0.04,
      volatility: 0.21 + i * 0.02,
      sector: field.dominantSector,
      industry: `${field.label} Fixture Industry`,
      country: field.dominantCountry,
      region: field.dominantRegion,
      marketCap: 900_000_000_000 - i * 60_000_000_000,
      context: false,
      isPrimary: true,
      memberships: [{ communityId: field.id, weight: 1 }],
    }
  })
}

const ALL_MEMBERS = FIELDS.map((_, index) => membersFor(index))

function communities() {
  return FIELDS.map((field, index) => {
    const members = ALL_MEMBERS[index]
    return {
      id: field.id,
      label: field.label,
      displayLabel: field.label,
      displayName: `${field.label} field`,
      description: `Synthetic ${field.label} field used by the browser fixture backend.`,
      scopeLabel: field.dominantRegion,
      memberCount: members.length,
      averageConfidence: 0.72 - index * 0.05,
      dominantSector: field.dominantSector,
      dominantCountry: field.dominantCountry,
      dominantRegion: field.dominantRegion,
      marketCapTotal: members.reduce((total, node) => total + node.marketCap, 0),
      bridgeCount: 2 + index,
      position: field.position,
      representativeSymbols: members.slice(0, 3).map((node) => node.symbol),
      themes: field.themes,
    }
  })
}

/** One backbone edge per adjacent pair inside a field, plus cross-field bridges. */
function backbone() {
  const edges = []
  ALL_MEMBERS.forEach((members, fieldIndex) => {
    members.forEach((node, i) => {
      const peer = members[(i + 1) % members.length]
      edges.push({
        source: node.symbol,
        target: peer.symbol,
        sourceCommunityId: FIELDS[fieldIndex].id,
        targetCommunityId: FIELDS[fieldIndex].id,
        correlation: 0.61 - i * 0.03,
        absCorrelation: 0.61 - i * 0.03,
        strength: 0.61 - i * 0.03,
        confidence: 0.68,
        tier: 1,
      })
    })
  })
  for (let i = 0; i < FIELDS.length; i += 1) {
    const from = ALL_MEMBERS[i][0]
    const to = ALL_MEMBERS[(i + 1) % FIELDS.length][0]
    edges.push({
      source: from.symbol,
      target: to.symbol,
      sourceCommunityId: from.communityId,
      targetCommunityId: to.communityId,
      correlation: 0.34,
      absCorrelation: 0.34,
      strength: 0.34,
      confidence: 0.55,
      tier: 2,
    })
  }
  return edges
}

function links() {
  return FIELDS.map((field, index) => {
    const next = FIELDS[(index + 1) % FIELDS.length]
    return {
      source: field.id,
      target: next.id,
      strength: 0.38 - index * 0.04,
      confidence: 0.6,
      edgeCount: 3 + index,
    }
  })
}

export function atlasFixture(window, view) {
  return {
    asOf: AS_OF,
    window,
    view,
    materialized: true,
    detail: { backboneTier: 2, nodeBudget: 64, backboneTruncated: false },
    communities: communities(),
    links: links(),
    landmarks: ALL_MEMBERS.flat(),
    backbone: backbone(),
  }
}

export function communityFixture(communityId, window, view) {
  const index = FIELDS.findIndex((field) => field.id === communityId)
  if (index === -1) return null
  const members = ALL_MEMBERS[index]
  const symbols = new Set(members.map((node) => node.symbol))
  return {
    asOf: AS_OF,
    window,
    view,
    focus: communityId,
    community: communities()[index],
    nodes: members,
    edges: backbone().filter((edge) => symbols.has(edge.source) && symbols.has(edge.target)),
  }
}

export function neighborhoodFixture(ticker, window, view) {
  const symbol = String(ticker).toUpperCase()
  const all = ALL_MEMBERS.flat()
  const focus = all.find((node) => node.symbol === symbol)
  if (!focus) return null
  const edges = backbone().filter((edge) => edge.source === symbol || edge.target === symbol)
  const peerSymbols = new Set(
    edges.map((edge) => (edge.source === symbol ? edge.target : edge.source))
  )
  const peers = all
    .filter((node) => peerSymbols.has(node.symbol))
    .map((node) => ({ ...node, context: true }))
  return {
    asOf: AS_OF,
    window,
    view,
    focus: symbol,
    community: communities()[FIELDS.findIndex((field) => field.id === focus.communityId)],
    nodes: [focus, ...peers],
    edges,
  }
}

/**
 * Ticker index for the header search that every page renders. Without it the
 * proxy answers 502 and the browser logs a resource error, which the Market
 * Universe specs assert against. Same synthetic symbols as the atlas.
 */
export function tickerIndexFixture() {
  return {
    items: ALL_MEMBERS.flat().map((node) => ({
      symbol: node.symbol,
      name: node.name,
      exchange: 'FIXTURE',
      hasSignals: true,
    })),
  }
}
