import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasRelationshipExperience,
  usableRelationshipSymbols,
} from '../lib/relationship-visibility'
import type { RelationshipNeighbor, TickerRelationships } from '../lib/relationships'

function neighbor(symbol: string): RelationshipNeighbor {
  return { symbol, strength: 0.7, confidence: 0.8, direction: 'same' }
}

function relationships(overrides: Partial<TickerRelationships> = {}): TickerRelationships {
  return {
    asOf: null,
    ticker: 'TEST',
    window: 252,
    node: null,
    nodes: [],
    marketCoMovers: [],
    residualCoMovers: [],
    leadLag: { followers: [], leaders: [] },
    probableSpurious: [],
    themePeers: [],
    ...overrides,
  }
}

test('requires six distinct non-weak relationships for the dedicated experience', () => {
  const strong = relationships({
    residualCoMovers: ['A', 'B', 'C'].map(neighbor),
    marketCoMovers: ['D', 'E', 'F'].map(neighbor),
  })
  assert.equal(hasRelationshipExperience(strong), true)
})

test('does not count weak, duplicate, or center relationships', () => {
  const weak = relationships({
    residualCoMovers: ['A', 'A', 'TEST'].map(neighbor),
    themePeers: [
      { ...neighbor('B'), theme: 'theme', themes: ['theme'] },
      { ...neighbor('C'), theme: 'theme', themes: ['theme'] },
    ],
    probableSpurious: ['D', 'E', 'F', 'G'].map(neighbor),
  })
  assert.deepEqual(usableRelationshipSymbols(weak), ['A', 'B', 'C'])
  assert.equal(hasRelationshipExperience(weak), false)
})

test('hides the dedicated experience when no usable relationships exist', () => {
  assert.equal(hasRelationshipExperience(relationships()), false)
})
