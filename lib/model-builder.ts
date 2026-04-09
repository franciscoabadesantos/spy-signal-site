import { type SignalDirection } from '@/lib/signalSummary'

export type ModelUniverse = 'single-stock' | 'watchlist' | 'screener-results'
export type LogicMode = 'all' | 'any'
export type ConditionMetric =
  | 'Trend'
  | 'Momentum'
  | 'Risk'
  | 'Yield'
  | 'Stability'
  | 'Conviction'
  | 'Flip rate'
  | 'Confirmation'
export type ConditionOperator = 'above' | 'below'
export type SignalUpdateFrequency = 'daily' | 'weekly'
export type RiskMode = 'conservative' | 'balanced' | 'aggressive'
export type ModelStatus = 'draft' | 'validated'
export type ModelQualitativeState = 'Constructive' | 'Mixed' | 'Fragile'
export type ModelSourceKind = 'manual' | 'template' | 'variation'

export type ModelCondition = {
  id: string
  metric: ConditionMetric
  operator: ConditionOperator
  value: number
}

export type ProfileDimension = {
  label: 'Trend' | 'Momentum' | 'Risk' | 'Yield' | 'Stability'
  score: number
  hint?: string
}

export type ModelValidationSettings = {
  holdingHorizonDays: number
  signalUpdateFrequency: SignalUpdateFrequency
  compareAgainstBenchmark: boolean
  riskMode: RiskMode
}

export type ValidationSummary = {
  validationScore: number
  winRate: number
  maxDrawdown: number
  relativePerformance: number
}

export type ValidationPoint = {
  t: string
  strategy: number
  benchmark: number
}

export type TradeSignalRow = {
  date: string
  signal: SignalDirection
  conviction: number
  returnPct: number
  benchmarkPct: number
}

export type ModelDiagnostics = {
  strengths: string[]
  weaknesses: string[]
  notes: string[]
}

export type ModelRecord = {
  id: string
  name: string
  universe: ModelUniverse
  ticker: string | null
  lookbackDays: number
  benchmark: string
  logicMode: LogicMode
  conditions: ModelCondition[]
  validation: ModelValidationSettings
  status: ModelStatus
  createdAt: string
  updatedAt: string
  lastRunAt: string | null
  summary: ValidationSummary | null
  profileDimensions: ProfileDimension[]
  currentSignal: {
    direction: SignalDirection
    conviction: number
    horizon: number
    signalDate: string
  } | null
  equityCurve: ValidationPoint[]
  signals: TradeSignalRow[]
  diagnostics: ModelDiagnostics
  sourceKind?: ModelSourceKind
  templateKey?: string | null
  variationOfModelId?: string | null
  variationLabel?: string | null
}

export type ModelDraftInput = {
  name: string
  universe: ModelUniverse
  ticker: string | null
  lookbackDays: number
  benchmark: string
  logicMode: LogicMode
  conditions: ModelCondition[]
  validation: ModelValidationSettings
  sourceKind?: ModelSourceKind
  templateKey?: string | null
  variationOfModelId?: string | null
  variationLabel?: string | null
}

export type HistoricalPricePoint = {
  date: string
  close: number
}

export const MODEL_UNIVERSE_OPTIONS: Array<{ value: ModelUniverse; label: string }> = [
  { value: 'single-stock', label: 'Single stock' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'screener-results', label: 'Screener results' },
]

export const LOOKBACK_OPTIONS = [63, 126, 252, 504, 756]
export const BENCHMARK_OPTIONS = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI']
export const METRIC_OPTIONS: ConditionMetric[] = [
  'Trend',
  'Momentum',
  'Risk',
  'Yield',
  'Stability',
  'Conviction',
  'Flip rate',
  'Confirmation',
]
export const OPERATOR_OPTIONS: ConditionOperator[] = ['above', 'below']
export const LOGIC_OPTIONS: Array<{ value: LogicMode; label: string }> = [
  { value: 'all', label: 'Match all conditions' },
  { value: 'any', label: 'Match any condition' },
]
export const HOLDING_HORIZON_OPTIONS = [5, 10, 20, 30, 60]
export const UPDATE_FREQUENCY_OPTIONS: Array<{ value: SignalUpdateFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]
export const RISK_MODE_OPTIONS: Array<{ value: RiskMode; label: string }> = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'aggressive', label: 'Aggressive' },
]

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function createRng(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng()
}

function metricBias(conditions: ModelCondition[], metric: ConditionMetric): number {
  const rows = conditions.filter((row) => row.metric === metric)
  if (rows.length === 0) return 0
  const avg = rows.reduce((sum, row) => sum + row.value, 0) / rows.length
  const directional = rows.reduce((sum, row) => sum + (row.operator === 'above' ? 1 : -1), 0) / rows.length
  return (avg - 50) * 0.22 + directional * 8
}

function generateProfileDimensions(input: ModelDraftInput, rng: () => number): ProfileDimension[] {
  const trend = clamp(54 + metricBias(input.conditions, 'Trend') + metricBias(input.conditions, 'Confirmation') * 0.45 + randomBetween(rng, -8, 8), 20, 96)
  const momentum = clamp(50 + metricBias(input.conditions, 'Momentum') + metricBias(input.conditions, 'Conviction') * 0.35 + randomBetween(rng, -7, 7), 20, 96)
  const risk = clamp(58 - metricBias(input.conditions, 'Risk') + (input.validation.riskMode === 'conservative' ? 10 : input.validation.riskMode === 'aggressive' ? -7 : 0) + randomBetween(rng, -9, 9), 18, 96)
  const yieldScore = clamp(42 + metricBias(input.conditions, 'Yield') * 0.8 + randomBetween(rng, -10, 10), 18, 92)
  const stability = clamp(52 + metricBias(input.conditions, 'Stability') + metricBias(input.conditions, 'Flip rate') * -0.5 + (input.logicMode === 'all' ? 5 : -4) + randomBetween(rng, -8, 8), 20, 96)

  return [
    { label: 'Trend', score: Math.round(trend), hint: 'Directional persistence from lookback window.' },
    { label: 'Momentum', score: Math.round(momentum), hint: 'Follow-through behavior after signal events.' },
    { label: 'Risk', score: Math.round(risk), hint: 'Expected volatility and drawdown behavior.' },
    { label: 'Yield', score: Math.round(yieldScore), hint: 'Income contribution profile.' },
    { label: 'Stability', score: Math.round(stability), hint: 'Flip cadence and signal consistency.' },
  ]
}

function inferDirection(profileDimensions: ProfileDimension[]): SignalDirection {
  const trend = profileDimensions.find((item) => item.label === 'Trend')?.score ?? 50
  const momentum = profileDimensions.find((item) => item.label === 'Momentum')?.score ?? 50
  const risk = profileDimensions.find((item) => item.label === 'Risk')?.score ?? 50
  const stability = profileDimensions.find((item) => item.label === 'Stability')?.score ?? 50

  const biasScore = trend * 0.36 + momentum * 0.32 + stability * 0.24 - risk * 0.18
  if (biasScore >= 40) return 'bullish'
  if (biasScore <= 22) return 'bearish'
  return 'neutral'
}

function buildValidationSummary(
  input: ModelDraftInput,
  profileDimensions: ProfileDimension[],
  rng: () => number
): ValidationSummary {
  const averageProfile =
    profileDimensions.reduce((sum, dimension) => sum + dimension.score, 0) /
    profileDimensions.length
  const logicBonus = input.logicMode === 'all' ? 3 : -1
  const conditionBonus = clamp(input.conditions.length * 2.1, 0, 11)
  const riskModeBonus =
    input.validation.riskMode === 'conservative'
      ? 3
      : input.validation.riskMode === 'aggressive'
        ? -2
        : 1

  const validationScore = Math.round(
    clamp(averageProfile + logicBonus + conditionBonus + riskModeBonus + randomBetween(rng, -4, 4), 32, 94)
  )
  const winRate = clamp(46 + (validationScore - 50) * 0.4 + randomBetween(rng, -5, 5), 35, 79)
  const maxDrawdown = -clamp(
    4 + (100 - (profileDimensions.find((d) => d.label === 'Risk')?.score ?? 50)) * 0.12 + randomBetween(rng, -1.3, 2.4),
    2,
    22
  )
  const relativePerformance = clamp(
    (validationScore - 50) * 0.18 + randomBetween(rng, -2.2, 3.2),
    -9,
    18
  )

  return {
    validationScore,
    winRate: Number(winRate.toFixed(1)),
    maxDrawdown: Number(maxDrawdown.toFixed(1)),
    relativePerformance: Number(relativePerformance.toFixed(1)),
  }
}

function buildValidationCurve(
  summary: ValidationSummary,
  input: ModelDraftInput,
  rng: () => number
): ValidationPoint[] {
  const points: ValidationPoint[] = []
  let strategy = 100
  let benchmark = 100
  const periods = 24
  const stepLabelPrefix = input.validation.signalUpdateFrequency === 'weekly' ? 'W' : 'M'
  const strategyDrift = summary.relativePerformance / periods + 0.42
  const benchmarkDrift = 0.34

  for (let period = 1; period <= periods; period += 1) {
    strategy *= 1 + (strategyDrift + randomBetween(rng, -0.85, 1.05)) / 100
    benchmark *= 1 + (benchmarkDrift + randomBetween(rng, -0.7, 0.8)) / 100
    points.push({
      t: `${stepLabelPrefix}${period}`,
      strategy: Number(strategy.toFixed(2)),
      benchmark: Number(benchmark.toFixed(2)),
    })
  }

  return points
}

function buildSignalRows(
  input: ModelDraftInput,
  summary: ValidationSummary,
  direction: SignalDirection,
  rng: () => number
): TradeSignalRow[] {
  const rows: TradeSignalRow[] = []
  const now = new Date()
  const baseConviction = clamp(summary.validationScore / 100, 0.18, 0.94)
  const spacingDays = input.validation.signalUpdateFrequency === 'weekly' ? 7 : 3

  for (let i = 0; i < 14; i += 1) {
    const date = new Date(now.getTime() - i * spacingDays * 24 * 60 * 60 * 1000)
    const altDirectionRoll = rng()
    const signal =
      altDirectionRoll < 0.13
        ? direction === 'bullish'
          ? 'neutral'
          : direction === 'bearish'
            ? 'neutral'
            : 'bullish'
        : direction
    const conviction = clamp(baseConviction + randomBetween(rng, -0.14, 0.14), 0.1, 0.95)
    const returnPct = Number((randomBetween(rng, -1.3, 1.7) + (summary.relativePerformance / 25) * 0.6).toFixed(2))
    const benchmarkPct = Number(randomBetween(rng, -1.2, 1.2).toFixed(2))
    rows.push({
      date: date.toISOString().slice(0, 10),
      signal,
      conviction: Number(conviction.toFixed(2)),
      returnPct,
      benchmarkPct,
    })
  }

  return rows
}

function buildDiagnostics(profileDimensions: ProfileDimension[], summary: ValidationSummary): ModelDiagnostics {
  const sorted = [...profileDimensions].sort((a, b) => b.score - a.score)
  const strongest = sorted.slice(0, 2)
  const weakest = sorted.slice(-2)

  return {
    strengths: strongest.map((item) => `${item.label} profile is supportive (${item.score}/100).`),
    weaknesses: weakest.map((item) => `${item.label} profile is limiting reliability (${item.score}/100).`),
    notes: [
      `Validation score landed at ${summary.validationScore}/100 with ${summary.winRate.toFixed(1)}% win rate.`,
      `${summary.relativePerformance >= 0 ? 'Outperformance' : 'Underperformance'} versus benchmark was ${summary.relativePerformance.toFixed(1)}%.`,
      'Treat this as a model behavior preview until live and execution data are added.',
    ],
  }
}

function scoreFromRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 50
  if (max <= min) return 50
  return clamp(((value - min) / (max - min)) * 100, 0, 100)
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sampleStdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const avg = mean(values)
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function movingAverage(values: number[], endIndex: number, window: number): number {
  const start = Math.max(0, endIndex - window + 1)
  const span = endIndex - start + 1
  if (span <= 0) return values[endIndex] ?? 0
  let sum = 0
  for (let i = start; i <= endIndex; i += 1) {
    sum += values[i] ?? 0
  }
  return sum / span
}

function trailingSignFlipRate(returns: number[], endIndex: number, window: number): number {
  const start = Math.max(0, endIndex - window + 1)
  let flips = 0
  let comparisons = 0
  for (let i = start + 1; i <= endIndex; i += 1) {
    const prev = returns[i - 1]
    const curr = returns[i]
    if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue
    const prevSign = prev > 0 ? 1 : prev < 0 ? -1 : 0
    const currSign = curr > 0 ? 1 : curr < 0 ? -1 : 0
    if (prevSign === 0 || currSign === 0) continue
    comparisons += 1
    if (prevSign !== currSign) flips += 1
  }
  if (comparisons <= 0) return 0
  return flips / comparisons
}

function maxDrawdownPercent(equityValues: number[]): number {
  if (equityValues.length === 0) return 0
  let peak = equityValues[0] ?? 100
  let worst = 0
  for (const value of equityValues) {
    if (!Number.isFinite(value) || value <= 0) continue
    if (value > peak) peak = value
    const drawdown = ((value / peak) - 1) * 100
    if (drawdown < worst) worst = drawdown
  }
  return worst
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function roundedPercent(value: number): number {
  return Number(value.toFixed(1))
}

function downsampleValidationCurve(
  points: Array<{ date: string; strategy: number; benchmark: number }>,
  maxPoints: number = 36
): ValidationPoint[] {
  if (points.length === 0) return []
  if (points.length <= maxPoints) {
    return points.map((point) => ({
      t: point.date,
      strategy: round2(point.strategy),
      benchmark: round2(point.benchmark),
    }))
  }

  const sampled: ValidationPoint[] = []
  const step = Math.ceil(points.length / maxPoints)
  for (let index = 0; index < points.length; index += step) {
    const point = points[index]
    if (!point) continue
    sampled.push({
      t: point.date,
      strategy: round2(point.strategy),
      benchmark: round2(point.benchmark),
    })
  }
  const last = points[points.length - 1]
  if (last && sampled[sampled.length - 1]?.t !== last.date) {
    sampled.push({
      t: last.date,
      strategy: round2(last.strategy),
      benchmark: round2(last.benchmark),
    })
  }
  return sampled
}

function normalizeHistoricalSeries(
  points: HistoricalPricePoint[]
): HistoricalPricePoint[] {
  return points
    .map((point) => ({
      date: String(point.date),
      close: Number(point.close),
    }))
    .filter((point) => Number.isFinite(point.close) && point.close > 0 && point.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function matchCondition(metricValue: number, operator: ConditionOperator, threshold: number): boolean {
  if (operator === 'above') return metricValue >= threshold
  return metricValue <= threshold
}

type MetricsSnapshot = {
  trend: number
  momentum: number
  risk: number
  yield: number
  stability: number
  conviction: number
  flipRate: number
  confirmation: number
}

function metricFromSnapshot(snapshot: MetricsSnapshot, metric: ConditionMetric): number {
  if (metric === 'Trend') return snapshot.trend
  if (metric === 'Momentum') return snapshot.momentum
  if (metric === 'Risk') return snapshot.risk
  if (metric === 'Yield') return snapshot.yield
  if (metric === 'Stability') return snapshot.stability
  if (metric === 'Conviction') return snapshot.conviction
  if (metric === 'Flip rate') return snapshot.flipRate
  return snapshot.confirmation
}

export function buildModelRecordFromHistoricalData(
  input: ModelDraftInput,
  priceHistoryRaw: HistoricalPricePoint[],
  benchmarkHistoryRaw: HistoricalPricePoint[],
  {
    id = `model_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt = new Date().toISOString(),
  }: {
    id?: string
    createdAt?: string
  } = {}
): ModelRecord {
  const normalizedTicker = input.ticker?.trim().toUpperCase() ?? null
  const tickerHistory = normalizeHistoricalSeries(priceHistoryRaw)
  const benchmarkHistory =
    benchmarkHistoryRaw.length > 0
      ? normalizeHistoricalSeries(benchmarkHistoryRaw)
      : tickerHistory

  const benchmarkByDate = new Map(benchmarkHistory.map((point) => [point.date, point.close]))
  const aligned = tickerHistory
    .map((point) => {
      const benchmarkClose = benchmarkByDate.get(point.date)
      if (!Number.isFinite(benchmarkClose)) return null
      return {
        date: point.date,
        price: point.close,
        benchmark: benchmarkClose as number,
      }
    })
    .filter((point): point is { date: string; price: number; benchmark: number } => point !== null)

  const fallback = buildModelRecord(input, { id, createdAt, status: 'validated' })
  if (aligned.length < 80) {
    return {
      ...fallback,
      diagnostics: {
        ...fallback.diagnostics,
        notes: [
          'Validation uses historical daily data.',
          'Simplified execution assumptions (no slippage, fixed horizon).',
          'Insufficient synchronized history; showing preview output.',
        ],
      },
    }
  }

  const closes = aligned.map((point) => point.price)
  const benchmarkCloses = aligned.map((point) => point.benchmark)
  const dates = aligned.map((point) => point.date)
  const returns = closes.map((close, index) =>
    index === 0 ? 0 : close / closes[index - 1] - 1
  )

  const lookbackWindow = clamp(Math.round(input.lookbackDays), 63, 1260)
  const trendWindow = clamp(Math.round(lookbackWindow * 0.22), 20, 120)
  const momentumWindow = clamp(Math.round(lookbackWindow * 0.1), 10, 40)
  const yieldWindow = clamp(Math.round(Math.min(lookbackWindow, 252)), 63, 252)
  const volatilityWindow = 20
  const flipWindow = 20
  const maShortWindow = 10
  const maLongWindow = 40
  const horizon = clamp(Math.round(input.validation.holdingHorizonDays), 3, 60)
  const evalStep = input.validation.signalUpdateFrequency === 'weekly' ? 5 : 1

  const startIndex = Math.max(
    trendWindow,
    momentumWindow,
    yieldWindow,
    volatilityWindow + 2,
    maLongWindow + 1,
    aligned.length - lookbackWindow
  )
  const finalEntryIndex = aligned.length - horizon - 1

  if (finalEntryIndex <= startIndex + 2) {
    return {
      ...fallback,
      diagnostics: {
        ...fallback.diagnostics,
        notes: [
          'Validation uses historical daily data.',
          'Simplified execution assumptions (no slippage, fixed horizon).',
          'Not enough data points for the selected lookback and horizon; showing preview output.',
        ],
      },
    }
  }

  const bearishIntent = input.conditions.some((condition) => {
    if (condition.metric === 'Risk') {
      return condition.operator === 'above' && condition.value >= 55
    }
    if (condition.metric === 'Flip rate') {
      return condition.operator === 'above' && condition.value >= 52
    }
    return condition.operator === 'below' && condition.value >= 50
  })
  const bullishIntent = input.conditions.some((condition) => {
    if (condition.metric === 'Risk') {
      return condition.operator === 'below' && condition.value <= 50
    }
    if (condition.metric === 'Flip rate') {
      return condition.operator === 'below' && condition.value <= 50
    }
    return condition.operator === 'above' && condition.value >= 50
  })

  type EvalSnapshot = {
    index: number
    date: string
    signal: SignalDirection
    conviction: number
    metrics: MetricsSnapshot
  }

  const evaluationSnapshots: EvalSnapshot[] = []
  const triggerSnapshots: EvalSnapshot[] = []
  const signalRowsChronological: TradeSignalRow[] = []
  const curvePoints: Array<{ date: string; strategy: number; benchmark: number }> = []
  const equitySeries: number[] = [100]

  let strategyEquity = 100
  let benchmarkEquity = 100
  let activeTrade:
    | {
        entryIndex: number
        entryPrice: number
        entryBenchmark: number
        direction: SignalDirection
        conviction: number
        signalDate: string
      }
    | null = null
  let evalCount = 0

  for (let i = startIndex; i < aligned.length; i += 1) {
    const dayReturn = i > 0 ? closes[i] / closes[i - 1] - 1 : 0
    const benchmarkDayReturn = i > 0 ? benchmarkCloses[i] / benchmarkCloses[i - 1] - 1 : 0

    benchmarkEquity *= 1 + benchmarkDayReturn
    if (activeTrade) {
      const directionalReturn = activeTrade.direction === 'bearish' ? -dayReturn : dayReturn
      strategyEquity *= 1 + directionalReturn
    }

    if (activeTrade && i >= activeTrade.entryIndex + horizon) {
      const entryPrice = activeTrade.entryPrice
      const exitPrice = closes[i]
      const entryBenchmark = activeTrade.entryBenchmark
      const exitBenchmark = benchmarkCloses[i]
      const tradeReturn =
        activeTrade.direction === 'bearish'
          ? entryPrice / exitPrice - 1
          : exitPrice / entryPrice - 1
      const benchmarkReturn = exitBenchmark / entryBenchmark - 1
      signalRowsChronological.push({
        date: activeTrade.signalDate,
        signal: activeTrade.direction,
        conviction: round2(activeTrade.conviction),
        returnPct: round2(tradeReturn * 100),
        benchmarkPct: round2(benchmarkReturn * 100),
      })
      activeTrade = null
    }

    const shouldEvaluate = i <= finalEntryIndex && evalCount % evalStep === 0
    evalCount += 1
    if (shouldEvaluate) {
      const trendReturn = closes[i] / closes[i - trendWindow] - 1
      const momentumReturn = closes[i] / closes[i - momentumWindow] - 1
      const yieldReturn = closes[i] / closes[i - yieldWindow] - 1
      const trailingReturns = returns.slice(i - volatilityWindow + 1, i + 1)
      const annualizedVol = sampleStdDev(trailingReturns) * Math.sqrt(252)
      const flipRate = trailingSignFlipRate(returns, i, flipWindow)
      const maShort = movingAverage(closes, i, maShortWindow)
      const maLong = movingAverage(closes, i, maLongWindow)

      const trendMetric = scoreFromRange(trendReturn, -0.2, 0.25)
      const momentumMetric = scoreFromRange(momentumReturn, -0.12, 0.15)
      const riskMetric = scoreFromRange(annualizedVol, 0.08, 0.45)
      const yieldMetric = scoreFromRange(yieldReturn, -0.15, 0.2)
      const stabilityMetric = clamp((1 - flipRate) * 100, 0, 100)
      const flipMetric = clamp(flipRate * 100, 0, 100)
      const confirmationMetric = clamp(
        (maShort > maLong ? 45 : 0) +
          (closes[i] > maShort ? 25 : 0) +
          (trendReturn > 0 ? 15 : 0) +
          (momentumReturn > 0 ? 15 : 0),
        0,
        100
      )
      const convictionMetric = clamp(
        trendMetric * 0.24 +
          momentumMetric * 0.22 +
          stabilityMetric * 0.22 +
          confirmationMetric * 0.2 +
          (100 - riskMetric) * 0.12,
        0,
        100
      )

      const metrics: MetricsSnapshot = {
        trend: trendMetric,
        momentum: momentumMetric,
        risk: riskMetric,
        yield: yieldMetric,
        stability: stabilityMetric,
        conviction: convictionMetric,
        flipRate: flipMetric,
        confirmation: confirmationMetric,
      }

      const matches =
        input.logicMode === 'all'
          ? input.conditions.every((condition) =>
              matchCondition(
                metricFromSnapshot(metrics, condition.metric),
                condition.operator,
                condition.value
              )
            )
          : input.conditions.some((condition) =>
              matchCondition(
                metricFromSnapshot(metrics, condition.metric),
                condition.operator,
                condition.value
              )
            )

      let direction: SignalDirection = 'neutral'
      if (matches) {
        const directionalBias =
          trendMetric * 0.38 +
          momentumMetric * 0.26 +
          confirmationMetric * 0.18 +
          stabilityMetric * 0.18 -
          riskMetric * 0.22
        if (
          bearishIntent &&
          (trendMetric <= 52 || momentumMetric <= 52 || confirmationMetric <= 50)
        ) {
          direction = 'bearish'
        } else if (bullishIntent && (trendMetric >= 50 || momentumMetric >= 50)) {
          direction = 'bullish'
        } else if (directionalBias >= 40) {
          direction = 'bullish'
        } else if (directionalBias <= 12) {
          direction = 'bearish'
        }
      }

      const conviction = clamp(
        convictionMetric / 100 + (matches ? 0.08 : -0.08),
        0.05,
        0.98
      )
      const snapshot: EvalSnapshot = {
        index: i,
        date: dates[i],
        signal: direction,
        conviction: round2(conviction),
        metrics,
      }
      evaluationSnapshots.push(snapshot)
      if (direction !== 'neutral') triggerSnapshots.push(snapshot)

      if (!activeTrade && direction !== 'neutral') {
        activeTrade = {
          entryIndex: i,
          entryPrice: closes[i],
          entryBenchmark: benchmarkCloses[i],
          direction,
          conviction,
          signalDate: dates[i],
        }
      }
    }

    curvePoints.push({
      date: dates[i],
      strategy: strategyEquity,
      benchmark: benchmarkEquity,
    })
    equitySeries.push(strategyEquity)
  }

  const completedSignals = signalRowsChronological.length
  const wins = signalRowsChronological.filter((row) => row.returnPct > 0).length
  const winRate = completedSignals > 0 ? (wins / completedSignals) * 100 : 0
  const totalReturn = strategyEquity - 100
  const benchmarkReturn = benchmarkEquity - 100
  const relativePerformance = totalReturn - benchmarkReturn
  const maxDrawdown = maxDrawdownPercent(equitySeries)

  let signalFlips = 0
  for (let i = 1; i < evaluationSnapshots.length; i += 1) {
    if (evaluationSnapshots[i]?.signal !== evaluationSnapshots[i - 1]?.signal) {
      signalFlips += 1
    }
  }
  const flipRate = evaluationSnapshots.length > 1 ? signalFlips / (evaluationSnapshots.length - 1) : 0

  const performanceScore = scoreFromRange(totalReturn, -15, 25)
  const winRateScore = scoreFromRange(winRate, 35, 70)
  const drawdownScore = 100 - scoreFromRange(Math.abs(maxDrawdown), 0, 25)
  const relativeScore = scoreFromRange(relativePerformance, -15, 15)
  const activityScore = scoreFromRange(completedSignals, 1, 20)
  const validationScore = Math.round(
    clamp(
      performanceScore * 0.26 +
        winRateScore * 0.24 +
        drawdownScore * 0.2 +
        relativeScore * 0.2 +
        activityScore * 0.1,
      20,
      96
    )
  )

  const profileSource = triggerSnapshots.length > 0 ? triggerSnapshots : evaluationSnapshots
  const profileDimensions: ProfileDimension[] = [
    {
      label: 'Trend',
      score: Math.round(clamp(mean(profileSource.map((snapshot) => snapshot.metrics.trend)), 20, 96)),
      hint: 'Directional persistence from lookback window.',
    },
    {
      label: 'Momentum',
      score: Math.round(clamp(mean(profileSource.map((snapshot) => snapshot.metrics.momentum)), 20, 96)),
      hint: 'Follow-through behavior after signal events.',
    },
    {
      label: 'Risk',
      score: Math.round(
        clamp(100 - mean(profileSource.map((snapshot) => snapshot.metrics.risk)), 18, 96)
      ),
      hint: 'Expected volatility and drawdown behavior.',
    },
    {
      label: 'Yield',
      score: Math.round(clamp(mean(profileSource.map((snapshot) => snapshot.metrics.yield)), 18, 92)),
      hint: 'Income contribution profile.',
    },
    {
      label: 'Stability',
      score: Math.round(clamp(mean(profileSource.map((snapshot) => snapshot.metrics.stability)), 20, 96)),
      hint: 'Flip cadence and signal consistency.',
    },
  ]

  const summary: ValidationSummary = {
    validationScore,
    winRate: roundedPercent(winRate),
    maxDrawdown: roundedPercent(maxDrawdown),
    relativePerformance: roundedPercent(relativePerformance),
  }

  const baseDiagnostics = buildDiagnostics(profileDimensions, summary)
  const diagnostics: ModelDiagnostics = {
    strengths: baseDiagnostics.strengths,
    weaknesses: baseDiagnostics.weaknesses,
    notes: [
      'Validation uses historical daily data.',
      'Simplified execution assumptions (no slippage, fixed horizon).',
      `Signals tested: ${completedSignals} · Flip rate: ${(flipRate * 100).toFixed(1)}% · Total return: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%.`,
    ],
  }

  const latestSnapshot = evaluationSnapshots[evaluationSnapshots.length - 1] ?? null
  const curve = downsampleValidationCurve(curvePoints)
  const signalRows = [...signalRowsChronological]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50)

  return {
    id,
    name: input.name.trim() || 'Untitled model',
    universe: input.universe,
    ticker: normalizedTicker,
    lookbackDays: input.lookbackDays,
    benchmark: input.benchmark,
    logicMode: input.logicMode,
    conditions: input.conditions.map((row) => ({ ...row })),
    validation: { ...input.validation },
    status: 'validated',
    createdAt,
    updatedAt: new Date().toISOString(),
    lastRunAt: new Date().toISOString(),
    summary,
    profileDimensions,
    currentSignal: latestSnapshot
      ? {
          direction: latestSnapshot.signal,
          conviction: latestSnapshot.conviction,
          horizon,
          signalDate: latestSnapshot.date,
        }
      : {
          direction: 'neutral',
          conviction: round2(clamp(validationScore / 130, 0.08, 0.9)),
          horizon,
          signalDate: new Date().toISOString(),
        },
    equityCurve: curve,
    signals: signalRows,
    diagnostics,
    sourceKind: input.sourceKind ?? 'manual',
    templateKey: input.templateKey ?? null,
    variationOfModelId: input.variationOfModelId ?? null,
    variationLabel: input.variationLabel ?? null,
  }
}

export function defaultCondition(): ModelCondition {
  return {
    id: `cond_${Math.random().toString(36).slice(2, 8)}`,
    metric: 'Trend',
    operator: 'above',
    value: 55,
  }
}

export function buildModelRecord(
  input: ModelDraftInput,
  {
    id = `model_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt = new Date().toISOString(),
    status = 'validated',
  }: {
    id?: string
    createdAt?: string
    status?: ModelStatus
  } = {}
): ModelRecord {
  const seed = hashString(
    [
      input.name,
      input.universe,
      input.ticker ?? '',
      input.lookbackDays,
      input.benchmark,
      input.logicMode,
      input.conditions.map((row) => `${row.metric}:${row.operator}:${row.value}`).join('|'),
      input.validation.holdingHorizonDays,
      input.validation.signalUpdateFrequency,
      input.validation.riskMode,
      input.validation.compareAgainstBenchmark ? 'cmp' : 'nocmp',
      new Date().toISOString().slice(0, 10),
    ].join('::')
  )
  const rng = createRng(seed)
  const profileDimensions = generateProfileDimensions(input, rng)
  const direction = inferDirection(profileDimensions)
  const summary = status === 'validated' ? buildValidationSummary(input, profileDimensions, rng) : null
  const validationCurve = summary ? buildValidationCurve(summary, input, rng) : []
  const signalRows = summary ? buildSignalRows(input, summary, direction, rng) : []
  const conviction =
    summary === null
      ? clamp(profileDimensions.reduce((sum, dim) => sum + dim.score, 0) / (profileDimensions.length * 120), 0.12, 0.78)
      : clamp(summary.validationScore / 100, 0.12, 0.95)

  return {
    id,
    name: input.name.trim() || 'Untitled model',
    universe: input.universe,
    ticker: input.universe === 'single-stock' ? input.ticker?.trim().toUpperCase() ?? null : null,
    lookbackDays: input.lookbackDays,
    benchmark: input.benchmark,
    logicMode: input.logicMode,
    conditions: input.conditions.map((row) => ({ ...row })),
    validation: { ...input.validation },
    status,
    createdAt,
    updatedAt: new Date().toISOString(),
    lastRunAt: status === 'validated' ? new Date().toISOString() : null,
    summary,
    profileDimensions,
    currentSignal: {
      direction,
      conviction: Number(conviction.toFixed(2)),
      horizon: input.validation.holdingHorizonDays,
      signalDate: new Date().toISOString(),
    },
    equityCurve: validationCurve,
    signals: signalRows,
    diagnostics:
      summary !== null
        ? buildDiagnostics(profileDimensions, summary)
        : {
            strengths: ['Draft created. Add conditions and run validation.'],
            weaknesses: ['No validation run yet.'],
            notes: ['Draft status means metrics are placeholders until validation runs.'],
          },
    sourceKind: input.sourceKind ?? 'manual',
    templateKey: input.templateKey ?? null,
    variationOfModelId: input.variationOfModelId ?? null,
    variationLabel: input.variationLabel ?? null,
  }
}

export function universeLabel(universe: ModelUniverse): string {
  if (universe === 'single-stock') return 'Single stock'
  if (universe === 'watchlist') return 'Watchlist'
  return 'Screener results'
}

export function modelSummaryResult(model: ModelRecord): string {
  if (!model.summary) return 'Draft · No validation run yet'
  const rel = model.summary.relativePerformance
  return `Score ${model.summary.validationScore} · Win ${model.summary.winRate.toFixed(1)}% · ${rel >= 0 ? '+' : ''}${rel.toFixed(1)}% vs ${model.benchmark}`
}

function conditionPresence(
  conditions: ModelCondition[],
  metric: ConditionMetric,
  operator: ConditionOperator,
  thresholdTest: (value: number) => boolean
): boolean {
  return conditions.some(
    (condition) =>
      condition.metric === metric &&
      condition.operator === operator &&
      thresholdTest(condition.value)
  )
}

export function deriveModelQualitativeState(
  profileDimensions: ProfileDimension[]
): ModelQualitativeState {
  const scoreByLabel = new Map(profileDimensions.map((dimension) => [dimension.label, dimension.score]))
  const trend = scoreByLabel.get('Trend') ?? 50
  const momentum = scoreByLabel.get('Momentum') ?? 50
  const stability = scoreByLabel.get('Stability') ?? 50
  const risk = scoreByLabel.get('Risk') ?? 50

  const qualityScore = (trend + momentum + stability + (100 - risk)) / 4
  if (qualityScore >= 64) return 'Constructive'
  if (qualityScore >= 48) return 'Mixed'
  return 'Fragile'
}

export function buildModelSystemDescription({
  conditions,
  logicMode,
}: {
  conditions: ModelCondition[]
  logicMode: LogicMode
}): string {
  const trendStrength = conditionPresence(conditions, 'Trend', 'above', (value) => value >= 55)
  const momentumStrength = conditionPresence(conditions, 'Momentum', 'above', (value) => value >= 55)
  const stabilityStrength = conditionPresence(conditions, 'Stability', 'above', (value) => value >= 55)
  const riskControl = conditionPresence(conditions, 'Risk', 'below', (value) => value <= 50)
  const volatilityBias =
    conditionPresence(conditions, 'Risk', 'above', (value) => value >= 55) ||
    conditionPresence(conditions, 'Flip rate', 'above', (value) => value >= 55)
  const confirmationTilt = conditionPresence(conditions, 'Confirmation', 'above', (value) => value >= 55)

  if (trendStrength && momentumStrength && riskControl) {
    return 'Favors strong trend and momentum with controlled risk.'
  }
  if (trendStrength && stabilityStrength) {
    return 'Targets persistent direction with a stability filter.'
  }
  if (momentumStrength && confirmationTilt) {
    return 'Prioritizes momentum continuation with added confirmation.'
  }
  if (riskControl && !trendStrength && !momentumStrength) {
    return 'Prioritizes capital protection over directional aggression.'
  }
  if (volatilityBias && !riskControl) {
    return 'Leans into volatile moves with weaker downside control.'
  }
  if (logicMode === 'any' && conditions.length >= 3) {
    return 'Flexible trigger mix seeks setups across mixed regimes.'
  }
  return 'Balanced condition mix with no dominant edge yet.'
}
