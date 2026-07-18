import {
  buildUnavailableScorecard,
  normalizeScorecard,
  type Scorecard,
} from './scorecard-types'

export type TickerSummaryWithScorecard = {
  scorecard?: unknown
}

export function scorecardFromTickerSummary(
  summary: TickerSummaryWithScorecard,
  unavailableLabel = 'Temporarily unavailable'
): Scorecard {
  return normalizeScorecard(summary.scorecard) ?? buildUnavailableScorecard(unavailableLabel)
}

export function hasUsableMaterializedScorecard(scorecard: Scorecard): boolean {
  return (
    scorecard.hasScorecard === true &&
    scorecard.readiness === 'ready' &&
    scorecard.overall.score !== null
  )
}
