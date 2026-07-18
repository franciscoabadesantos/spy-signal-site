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
  // Page component coverage is intentionally excluded. A scorecard with partial
  // build inputs remains valid when fundamentals or earnings cards are absent.
  return (
    scorecard.hasScorecard === true &&
    scorecard.readiness === 'ready' &&
    scorecard.overall.score !== null
  )
}
