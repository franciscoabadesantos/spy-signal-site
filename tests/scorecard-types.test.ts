import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeScorecard } from '../lib/scorecard-types'

const readyPayload = {
  asOf: '2026-07-06',
  readiness: 'scorecard_ready',
  buildStatus: 'scorecard_ready',
  missingInputs: [],
  overall: { score: 74.4, grade: 'B+', label: 'Solid' },
  axes: [
    { key: 'value', label: 'Value', score: 71.2, available: true },
    { key: 'potential', label: 'Potential', score: 78.8, available: true },
    { key: 'health', label: 'Health', score: 82.1, available: true },
    { key: 'income', label: 'Income', score: null, available: false, hint: 'No income data.' },
    { key: 'momentum', label: 'Momentum', score: 68.2, available: true },
  ],
}

test('ready scorecard preserves current layout fields', () => {
  const scorecard = normalizeScorecard(readyPayload)

  assert.ok(scorecard)
  assert.equal(scorecard.readiness, 'ready')
  assert.equal(scorecard.buildStatus, 'scorecard_ready')
  assert.deepEqual(scorecard.missingInputs, [])
  assert.equal(scorecard.asOf, '2026-07-06')
  assert.deepEqual(scorecard.overall, { score: 74, grade: 'B+', label: 'Solid' })
  assert.deepEqual(
    scorecard.axes.map((axis) => axis.key),
    ['value', 'potential', 'health', 'income', 'momentum']
  )
  assert.equal(scorecard.axes[0]?.score, 71)
  assert.equal(scorecard.axes[3]?.available, false)
})

test('pending_build scorecard renders as an explicit non-ready state', () => {
  const scorecard = normalizeScorecard({
    asOf: null,
    readiness: 'pending_build',
    buildStatus: 'pending_build',
    missingInputs: [],
    overall: { score: null, grade: 'N/A', label: 'Pending' },
    axes: [{ score: null, available: false, hint: 'Tracked ticker is waiting for the daily scorecard build' }],
  })

  assert.ok(scorecard)
  assert.equal(scorecard.readiness, 'pending_build')
  assert.equal(scorecard.overall.label, 'Pending')
  assert.equal(scorecard.axes.every((axis) => axis.available === false), true)
})

test('unavailable_missing_inputs preserves missing input details', () => {
  const scorecard = normalizeScorecard({
    asOf: null,
    readiness: 'unavailable_missing_inputs',
    buildStatus: 'unavailable_missing_inputs',
    missingInputs: ['fundamentals', 'earnings'],
    overall: { score: null, grade: 'N/A', label: 'Unavailable' },
    axes: [{ score: null, available: false, hint: 'Scorecard unavailable: missing required inputs' }],
  })

  assert.ok(scorecard)
  assert.equal(scorecard.readiness, 'unavailable_missing_inputs')
  assert.deepEqual(scorecard.missingInputs, ['fundamentals', 'earnings'])
  assert.equal(scorecard.overall.label, 'Unavailable')
})

test('not_tracked scorecard renders as an explicit non-ready state', () => {
  const scorecard = normalizeScorecard({
    asOf: null,
    readiness: 'not_tracked',
    buildStatus: 'not_tracked',
    missingInputs: [],
    overall: { score: null, grade: 'N/A', label: 'Not tracked' },
    axes: [{ score: null, available: false, hint: 'Ticker is not in the tracked price-eligible universe' }],
  })

  assert.ok(scorecard)
  assert.equal(scorecard.readiness, 'not_tracked')
  assert.equal(scorecard.overall.label, 'Not tracked')
  assert.equal(scorecard.axes.every((axis) => axis.available === false), true)
})
