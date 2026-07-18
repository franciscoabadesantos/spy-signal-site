import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { hasUsableMaterializedScorecard, scorecardFromTickerSummary } from '../lib/ticker-page-scorecard'

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

test('ticker page scorecard comes from summary payload', () => {
  const scorecard = scorecardFromTickerSummary({
    scorecard: {
      asOf: '2026-07-11',
      readiness: 'scorecard_ready',
      buildStatus: 'scorecard_ready',
      missingInputs: [],
      overall: { score: 83, grade: 'A-', label: 'Strong' },
      axes: [
        { key: 'value', label: 'Value', score: 76, available: true },
        { key: 'momentum', label: 'Momentum', score: 91, available: true },
      ],
    },
  })

  assert.equal(scorecard.readiness, 'ready')
  assert.deepEqual(scorecard.overall, { score: 83, grade: 'A-', label: 'Strong' })
  assert.equal(scorecard.axes.find((axis) => axis.key === 'value')?.score, 76)
  assert.equal(scorecard.axes.find((axis) => axis.key === 'momentum')?.score, 91)
})

test('missing or malformed summary scorecard renders unavailable state', () => {
  for (const summary of [{}, { scorecard: null }, { scorecard: { overall: null } }]) {
    const scorecard = scorecardFromTickerSummary(summary)
    assert.equal(scorecard.readiness, 'error')
    assert.equal(scorecard.hasScorecard, false)
    assert.equal(scorecard.overall.label, 'Temporarily unavailable')
  }
})

test('partial summary scorecards keep available axes and unavailable states', () => {
  const scorecard = scorecardFromTickerSummary({
    scorecard: {
      asOf: '2026-07-11',
      readiness: 'unavailable_missing_inputs',
      buildStatus: 'unavailable_missing_inputs',
      missingInputs: ['income'],
      overall: { score: 58, grade: 'B-', label: 'Mixed' },
      axes: [
        { key: 'value', label: 'Value', score: 62, available: true },
        { key: 'income', label: 'Income', score: null, available: false, hint: 'Needs dividend data.' },
      ],
    },
  })

  assert.equal(scorecard.readiness, 'unavailable_missing_inputs')
  assert.deepEqual(scorecard.missingInputs, ['income'])
  assert.equal(scorecard.axes.find((axis) => axis.key === 'value')?.available, true)
  assert.equal(scorecard.axes.find((axis) => axis.key === 'income')?.available, false)
})

test('materialized partial scorecard remains visible when page components are missing', () => {
  const scorecard = scorecardFromTickerSummary({
    scorecard: {
      asOf: '2026-07-17',
      readiness: 'scorecard_ready',
      buildStatus: 'scorecard_ready',
      materializationReadiness: 'scorecard_ready',
      buildReadiness: 'partial',
      buildMissingInputs: ['fundamentals', 'latest_fundamentals', 'statement_rows'],
      // Compatibility aliases must not be used as page-component diagnostics.
      missingInputs: ['fundamentals', 'latest_fundamentals', 'statement_rows'],
      hasScorecard: true,
      overall: { score: 56, grade: 'B-', label: 'Mixed' },
      axes: [
        { key: 'value', label: 'Value', score: null, available: false },
        { key: 'momentum', label: 'Momentum', score: 73, available: true },
      ],
    },
  })

  assert.equal(hasUsableMaterializedScorecard(scorecard), true)
  assert.equal(scorecard.buildReadiness, 'partial')
  assert.equal(scorecard.overall.score, 56)
  assert.equal(scorecard.axes.find((axis) => axis.key === 'momentum')?.score, 73)
})

test('missing scorecard does not pass the materialized scorecard visibility gate', () => {
  const scorecard = scorecardFromTickerSummary({
    scorecard: {
      readiness: 'scorecard_ready',
      hasScorecard: false,
      overall: { score: 56, grade: 'B-', label: 'Mixed' },
      axes: [],
    },
  })

  assert.equal(hasUsableMaterializedScorecard(scorecard), false)
})

test('ticker page normal render has no page-level scorecard fetch', () => {
  const source = readRepoFile('app/(app)/stocks/[ticker]/page.tsx')

  assert.match(source, /scorecardFromTickerSummary\(tickerSummary\)/)
  assert.doesNotMatch(source, /getTickerScorecard/)
  assert.doesNotMatch(source, /backend\.tickers\.scorecard/)
  assert.doesNotMatch(source, /\/scorecard/)
})

test('suffix tickers keep canonical symbol form for summary routing', () => {
  const symbols = ['SAP.DE', 'GALP.LS', 'NEXI.MI', 'ZEAL.CO']
  assert.deepEqual(
    symbols.map((symbol) => `/tickers/${encodeURIComponent(symbol)}/summary`),
    [
      '/tickers/SAP.DE/summary',
      '/tickers/GALP.LS/summary',
      '/tickers/NEXI.MI/summary',
      '/tickers/ZEAL.CO/summary',
    ]
  )
})
