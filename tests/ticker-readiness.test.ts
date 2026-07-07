import assert from 'node:assert/strict'
import test from 'node:test'
import { tickerReadinessBadge } from '../lib/ticker-readiness'

test('SPCX-style partial ticker is not a tracked badge', () => {
  const badge = tickerReadinessBadge({
    isTracked: false,
    coverageState: 'partial',
    hasPrices: true,
    hasTechnicals: false,
    hasScorecard: false,
  })

  assert.equal(badge.label, 'Missing technicals')
  assert.equal(badge.tone, 'missing')
})

test('active registry row missing prices is diagnostic', () => {
  const badge = tickerReadinessBadge({
    isTracked: true,
    registryStatus: 'active',
    coverageState: 'ready',
    hasPrices: false,
    hasTechnicals: true,
    hasScorecard: true,
  })

  assert.equal(badge.label, 'Missing prices')
})

test('active registry row missing scorecard is diagnostic', () => {
  const badge = tickerReadinessBadge({
    isTracked: true,
    registryStatus: 'active',
    coverageState: 'ready',
    hasPrices: true,
    hasTechnicals: true,
    hasScorecard: false,
  })

  assert.equal(badge.label, 'Missing scorecard')
})

test('fully materialized tracked row remains normal', () => {
  const badge = tickerReadinessBadge({
    isTracked: true,
    registryStatus: 'active',
    coverageState: 'ready',
    hasPrices: true,
    hasTechnicals: true,
    hasScorecard: true,
  })

  assert.equal(badge.label, 'Tracked')
  assert.equal(badge.tone, 'tracked')
})
