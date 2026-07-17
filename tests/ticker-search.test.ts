import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterTickerIndexItems,
  normalizeTickerIndexPayload,
  tickerEntityDisplayName,
  tickerEntitySiblingListings,
  tickerIndexItemToSearchResult,
} from '../lib/ticker-search'

const payload = {
  items: [
    { symbol: 'GME', name: 'GameStop Corp.', exchange: null, hasSignals: false },
    { symbol: 'ABNB', name: 'Airbnb, Inc.', exchange: 'NASDAQ', hasSignals: false },
    { symbol: 'AF.PA', name: 'Air France-KLM SA', exchange: 'PAR', hasSignals: false },
    { symbol: 'BCP.LS', name: 'Banco Comercial Portugues, S.A.', exchange: 'Euronext Lisbon', hasSignals: false },
  ],
}

function symbolsFor(query: string): string[] {
  const index = normalizeTickerIndexPayload(payload, null)
  assert.ok(index)
  return filterTickerIndexItems(index.items, query, 8).map((item) => item.symbol)
}

test('ticker index payload uses items with symbol fields', () => {
  const index = normalizeTickerIndexPayload(payload, null)

  assert.ok(index)
  assert.deepEqual(
    index.items.map((item) => item.symbol),
    ['GME', 'ABNB', 'AF.PA', 'BCP.LS']
  )
})

test('autocomplete matches ticker prefixes and exact tickers', () => {
  assert.deepEqual(symbolsFor('gm'), ['GME'])
  assert.deepEqual(symbolsFor('gme'), ['GME'])
  assert.equal(symbolsFor('af')[0], 'AF.PA')
})

test('autocomplete matches company names with punctuation and spacing tolerance', () => {
  assert.deepEqual(symbolsFor('gamestop'), ['GME'])
  assert.deepEqual(symbolsFor('game stop'), ['GME'])
  assert.ok(symbolsFor('air').includes('ABNB'))
  assert.ok(symbolsFor('air').includes('AF.PA'))
  assert.deepEqual(symbolsFor('airbnb'), ['ABNB'])
  assert.deepEqual(symbolsFor('air france'), ['AF.PA'])
})

test('autocomplete matches exchanges from the local index', () => {
  assert.ok(symbolsFor('lisbon').includes('BCP.LS'))
  assert.ok(symbolsFor('euronext').includes('BCP.LS'))
})

const entityPayload = {
  items: [
    {
      symbol: 'SAP',
      name: 'SAP SE',
      exchange: 'NYSE',
      hasSignals: true,
      entity_id: 'ent-sap',
      lei: '529900D6BF99LW9R2E68',
      legal_name: 'SAP SE',
      sibling_symbols: ['SAP', 'SAP.DE'],
    },
    {
      symbol: 'NOVO-B.CO',
      name: 'Novo Nordisk A/S',
      exchange: 'CPH',
      hasSignals: false,
      entity_id: 'ent-novo',
      legal_name: 'Novo Nordisk A/S',
      sibling_symbols: ['NVO', 'NOVO-B.CO'],
    },
    {
      symbol: 'GOOG',
      name: 'Alphabet Inc.',
      exchange: 'NASDAQ',
      hasSignals: true,
      entity_id: 'ent-alphabet',
      legal_name: 'Alphabet Inc.',
      sibling_symbols: ['GOOG', 'GOOGL'],
    },
    { symbol: '005930.KS', name: 'Samsung Electronics Co., Ltd.', exchange: 'KRX', hasSignals: false },
    { symbol: 'NOK', name: 'Nokia Oyj', exchange: 'NYSE', hasSignals: false },
  ],
}

function entityItems() {
  const index = normalizeTickerIndexPayload(entityPayload, null)
  assert.ok(index)
  return index.items
}

test('collapsed entity rows expose optional entity fields', () => {
  const [sap] = entityItems()

  assert.equal(sap.symbol, 'SAP')
  assert.equal(sap.entityId, 'ent-sap')
  assert.equal(sap.lei, '529900D6BF99LW9R2E68')
  assert.equal(sap.legalName, 'SAP SE')
  assert.deepEqual(sap.siblingSymbols, ['SAP', 'SAP.DE'])
})

test('rows without entity fields keep the legacy shape', () => {
  const items = entityItems()
  const nokia = items.find((item) => item.symbol === 'NOK')
  const samsung = items.find((item) => item.symbol === '005930.KS')

  for (const item of [nokia, samsung]) {
    assert.ok(item)
    assert.equal('entityId' in item, false)
    assert.equal('lei' in item, false)
    assert.equal('legalName' in item, false)
    assert.equal('siblingSymbols' in item, false)
    assert.equal(tickerEntitySiblingListings(item), null)
    assert.equal(tickerEntityDisplayName(item), item.name)
  }

  const legacyResult = tickerIndexItemToSearchResult(nokia!)
  assert.deepEqual(legacyResult, {
    symbol: 'NOK',
    name: 'Nokia Oyj',
    exchange: 'NYSE',
    hasSignals: false,
    readiness: null,
    convictionPct: null,
    tone: null,
    signalDate: null,
    scorecard: null,
  })
})

test('search results carry entity fields through to display helpers', () => {
  const items = entityItems()
  const results = filterTickerIndexItems(items, 'sap', 8)

  assert.equal(results.length, 1)
  const [sap] = results
  assert.equal(sap.symbol, 'SAP')
  assert.equal(tickerEntityDisplayName(sap), 'SAP SE')
  assert.deepEqual(tickerEntitySiblingListings(sap), ['SAP', 'SAP.DE'])
})

test('sibling symbols match the collapsed row in search', () => {
  const items = entityItems()

  assert.deepEqual(filterTickerIndexItems(items, 'sap.de', 8).map((item) => item.symbol), ['SAP'])
  assert.deepEqual(filterTickerIndexItems(items, 'googl', 8).map((item) => item.symbol), ['GOOG'])
  assert.deepEqual(filterTickerIndexItems(items, 'nvo', 8).map((item) => item.symbol), ['NOVO-B.CO'])
})

test('single or missing sibling lists never render as entity listings', () => {
  assert.equal(tickerEntitySiblingListings({}), null)
  assert.equal(tickerEntitySiblingListings({ siblingSymbols: ['SAP'] }), null)
  assert.deepEqual(tickerEntitySiblingListings({ siblingSymbols: ['SAP', 'SAP.DE'] }), ['SAP', 'SAP.DE'])
})

test('malformed sibling entries are dropped during normalization', () => {
  const index = normalizeTickerIndexPayload(
    {
      items: [
        {
          symbol: 'HUT',
          name: 'Hut 8 Corp.',
          exchange: 'NASDAQ',
          hasSignals: false,
          sibling_symbols: ['HUT', 'hut.to', '', '!!bad!!', 'HUT'],
        },
      ],
    },
    null
  )

  assert.ok(index)
  assert.deepEqual(index.items[0].siblingSymbols, ['HUT', 'HUT.TO'])
})
