import type { PricePoint } from '@/lib/finance'
import type { Signal } from '@/lib/types'
import type { SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'

type OrbitSignalDirection = 'bullish' | 'bearish' | 'neutral'

export type SignalOrbitTelemetry = {
  momentum: number
  risk: number
  conviction: number
  direction: OrbitSignalDirection
  trendAge: number
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function movingAverage(data: PricePoint[], windowSize: number): number | null {
  if (data.length < windowSize || windowSize <= 0) return null
  const slice = data.slice(-windowSize)
  const total = slice.reduce((sum, point) => sum + point.close, 0)
  return total / slice.length
}

function computeDailyReturns(data: PricePoint[]): number[] {
  const returns: number[] = []
  for (let index = 1; index < data.length; index += 1) {
    const current = data[index]
    const previous = data[index - 1]
    if (!current || !previous || previous.close <= 0) continue
    returns.push((current.close - previous.close) / previous.close)
  }
  return returns
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function parsePercentString(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

export function buildOrbitDimensionsFromHistory({
  historicalData,
  recentSignals,
  dividendYield,
  hasFundamentals,
}: {
  historicalData: PricePoint[]
  recentSignals: Signal[]
  dividendYield: string | null
  hasFundamentals: boolean
}): SystemProfileBlobDimension[] {
  const latestPoint = historicalData[historicalData.length - 1]
  const ma200 = movingAverage(historicalData, 200)
  const ma50 = movingAverage(historicalData, 50)
  const trendAnchor = ma200 ?? ma50
  const trendScore =
    latestPoint && trendAnchor
      ? clampScore(50 + ((latestPoint.close - trendAnchor) / trendAnchor) * 260)
      : 55

  const momentumBase = historicalData[Math.max(0, historicalData.length - 64)]?.close ?? null
  const momentumScore =
    latestPoint && momentumBase && momentumBase > 0
      ? clampScore(50 + ((latestPoint.close - momentumBase) / momentumBase) * 230)
      : 52

  const recentReturns = computeDailyReturns(historicalData).slice(-90)
  const annualizedVol =
    recentReturns.length > 10 ? stdDev(recentReturns) * Math.sqrt(252) : null
  const riskScore = annualizedVol === null ? 48 : clampScore(100 - annualizedVol * 240)

  const yieldPct = parsePercentString(dividendYield)
  const yieldScore = !hasFundamentals ? 34 : yieldPct === null ? 42 : clampScore(yieldPct * 14)

  const stabilityWindow = recentSignals.slice(0, 90)
  let flips = 0
  for (let index = 1; index < stabilityWindow.length; index += 1) {
    const current = stabilityWindow[index]
    const previous = stabilityWindow[index - 1]
    if (current && previous && current.direction !== previous.direction) flips += 1
  }
  const flipRate =
    stabilityWindow.length > 1 ? flips / (stabilityWindow.length - 1) : 0
  const convictionValues = stabilityWindow
    .map((row) => row.prob_side)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .map((value) => value * 100)
  const convictionDispersion =
    convictionValues.length > 1 ? stdDev(convictionValues) : 18
  const stabilityScore = clampScore(100 - flipRate * 85 - convictionDispersion * 0.55)

  return [
    { label: 'Trend', score: trendScore, hint: 'Price trend versus long-window baseline.' },
    { label: 'Momentum', score: momentumScore, hint: 'Medium-horizon directional push from recent closes.' },
    { label: 'Risk', score: riskScore, hint: 'Higher means lower realized volatility.' },
    { label: 'Yield', score: yieldScore, hint: 'Income contribution from available fundamentals.' },
    { label: 'Stability', score: stabilityScore, hint: 'Signal consistency with lower flip frequency.' },
  ]
}

export function trendAgeFromSignals(signals: Array<{ direction: OrbitSignalDirection }>, latestDirection: OrbitSignalDirection | null): number {
  if (!latestDirection) return 0
  let streak = 0
  for (const signal of signals) {
    if (signal.direction !== latestDirection) break
    streak += 1
  }
  return streak
}

export function buildOrbitTelemetry({
  dimensions,
  conviction,
  direction,
  trendAge,
}: {
  dimensions: SystemProfileBlobDimension[]
  conviction: number | null
  direction: OrbitSignalDirection | null
  trendAge: number
}): SignalOrbitTelemetry {
  const byLabel = new Map(dimensions.map((dimension) => [dimension.label, dimension.score]))
  const convictionPct =
    conviction === null ? 50 : conviction > 1 ? conviction : conviction * 100

  return {
    momentum: Math.round(byLabel.get('Momentum') ?? 50),
    risk: Math.round(100 - (byLabel.get('Risk') ?? 50)),
    conviction: clampScore(convictionPct),
    direction: direction ?? 'neutral',
    trendAge,
  }
}

export function buildMiniOrbitDimensions({
  direction,
  conviction,
  changePercent,
  horizon,
}: {
  direction: OrbitSignalDirection | null
  conviction: number | null
  changePercent: number | null
  horizon: number | null
}): SystemProfileBlobDimension[] {
  const convictionPct =
    conviction === null ? 42 : conviction > 1 ? conviction : conviction * 100
  const moveMag = Math.min(8, Math.abs(changePercent ?? 0))
  const horizonTarget = horizon ?? 20
  const horizonScore = Math.max(28, 100 - Math.abs(horizonTarget - 20) * 2.1)
  const trendBase = direction === 'bullish' ? 58 : direction === 'bearish' ? 44 : 50
  const trend = Math.max(22, Math.min(96, trendBase + convictionPct * 0.32))
  const momentum = Math.max(22, Math.min(96, convictionPct * 0.88 + moveMag * 4.4))
  const risk = Math.max(22, Math.min(96, 68 - moveMag * 4.6))
  const yieldScore = Math.max(22, Math.min(96, 34 + convictionPct * 0.26))
  const stability = Math.max(22, Math.min(96, convictionPct * 0.8 - moveMag * 3.7 + horizonScore * 0.08))

  return [
    { label: 'Trend', score: Math.round(trend) },
    { label: 'Momentum', score: Math.round(momentum) },
    { label: 'Risk', score: Math.round(risk) },
    { label: 'Yield', score: Math.round(yieldScore) },
    { label: 'Stability', score: Math.round(stability) },
  ]
}
