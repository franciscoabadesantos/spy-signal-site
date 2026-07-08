import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterTickerIndexItems,
  normalizeTickerIndexPayload,
} from '../lib/ticker-search'

const payload = {
  items: [
    { symbol: 'GME', name: 'GameStop Corp.', exchange: null, hasSignals: false },
    { symbol: 'ABNB', name: 'Airbnb, Inc.', exchange: 'NASDAQ', hasSignals: false },
    { symbol: 'AF.PA', name: 'Air France-KLM SA', exchange: 'PAR', hasSignals: false },
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
    ['GME', 'ABNB', 'AF.PA']
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
