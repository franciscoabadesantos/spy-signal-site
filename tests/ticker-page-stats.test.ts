import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalTickerStats } from '../lib/ticker-page-stats'

test('canonical overview stats prefer profile market cap and use market stats volume', () => {
  const stats = canonicalTickerStats({
    profileMarketCap: 2_000_000_000,
    fundamentalsMarketCap: 1_000_000_000,
    quoteMarketCapText: '$1.0B',
    fundamentalsTrailingPe: 18.25,
    profileTrailingPe: 19.5,
    marketStatsVolume: 1_234_567,
  })

  assert.equal(stats.marketCap, 2_000_000_000)
  assert.equal(stats.trailingPe, 18.25)
  assert.equal(stats.volume, 1_234_567)
})

test('canonical overview stats fall back only to declared summary fields', () => {
  const stats = canonicalTickerStats({
    profileMarketCap: null,
    fundamentalsMarketCap: 900_000_000,
    quoteMarketCapText: '$0.9B',
    fundamentalsTrailingPe: null,
    profileTrailingPe: null,
    marketStatsVolume: null,
  })

  assert.equal(stats.marketCap, 900_000_000)
  assert.equal(stats.trailingPe, null)
  assert.equal(stats.volume, null)
})
