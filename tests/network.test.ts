import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeNetworkGraph } from '../lib/network'

test('normalizes the relationship-map payload with entity graph ids and representative listings', () => {
  const graph = normalizeNetworkGraph(
    {
      asOf: '2026-07-17',
      window: '252',
      nodes: [
        {
          ticker: 'SAP.DE',
          symbol: 'SAP.DE',
          name: 'SAP listing',
          entity_id: 'entity_sap',
          legal_name: 'SAP SE',
          home_country: 'DE',
          sibling_symbols: ['SAP', 'SAP.DE'],
          degree: 1,
        },
        { ticker: 'SPY', name: 'SPDR S&P 500 ETF', degree: 1 },
      ],
      edges: [
        {
          source: 'entity_sap',
          target: 'SPY',
          layer: 'residual_price',
          strength: 0.82,
          confidence: 0.71,
          direction: 'undirected',
        },
      ],
    },
    null
  )

  assert.equal(graph.nodes.length, 2)
  assert.deepEqual(graph.nodes[0], {
    ticker: 'ENTITY_SAP',
    symbol: 'SAP.DE',
    name: 'SAP SE',
    country: 'DE',
    region: null,
    sector: null,
    marketCap: null,
    degree: 1,
    entityId: 'ENTITY_SAP',
    lei: null,
    legalName: 'SAP SE',
    homeCountry: 'DE',
    siblingSymbols: ['SAP', 'SAP.DE'],
  })
  assert.deepEqual(graph.edges, [
    {
      source: 'ENTITY_SAP',
      target: 'SPY',
      correlation: 0.82,
      absCorrelation: 0.82,
      inMst: false,
      relationshipSourceLayer: 'residual_price',
      relationshipConfidence: 0.71,
      relationshipAlpha: 0.71,
      relationshipLabel: 'Residual price',
      relationshipDescription: 'Idiosyncratic relationship after market and FX factors.',
      relationshipColor: '#1FC8A7',
      relationshipDash: null,
      relationshipDirectional: false,
    },
  ])
})
