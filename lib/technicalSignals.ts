import type { PricePoint } from '@/lib/finance'

export type TechnicalTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1D' | '1W' | '1M'
export type TechnicalAction = 'Buy' | 'Sell' | 'Neutral'

export type TechnicalIndicatorRow = {
  name: string
  value: string
  action: TechnicalAction
}

export type TechnicalGaugeData = {
  label: string
  verdict: string
  verdictAction: TechnicalAction
  position: number
  counts: {
    buy: number
    neutral: number
    sell: number
  }
}

export type TechnicalSummary = {
  gauges: {
    summary: TechnicalGaugeData
    oscillators: TechnicalGaugeData
    movingAverages: TechnicalGaugeData
  }
  oscillatorRows: TechnicalIndicatorRow[]
  movingAverageRows: TechnicalIndicatorRow[]
}

type TimeframeConfig = {
  oscillatorLookback: number
  priceSmoothing: number
}

const TIMEFRAME_CONFIG: Record<TechnicalTimeframe, TimeframeConfig> = {
  '1m': { oscillatorLookback: 35, priceSmoothing: 2 },
  '5m': { oscillatorLookback: 45, priceSmoothing: 3 },
  '15m': { oscillatorLookback: 55, priceSmoothing: 5 },
  '30m': { oscillatorLookback: 70, priceSmoothing: 8 },
  '1h': { oscillatorLookback: 90, priceSmoothing: 10 },
  '2h': { oscillatorLookback: 120, priceSmoothing: 14 },
  '4h': { oscillatorLookback: 160, priceSmoothing: 21 },
  '1D': { oscillatorLookback: 240, priceSmoothing: 30 },
  '1W': { oscillatorLookback: 360, priceSmoothing: 60 },
  '1M': { oscillatorLookback: 520, priceSmoothing: 90 },
}

function getCloses(data: PricePoint[]): number[] {
  return data
    .map((point) => point.close)
    .filter((value): value is number => Number.isFinite(value))
}

function takeLast(values: number[], count: number): number[] {
  if (values.length <= count) return values
  return values.slice(-count)
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatNumber(value: number | null, digits: number = 2): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

function actionFromScore(score: number): TechnicalAction {
  if (score >= 0.22) return 'Buy'
  if (score <= -0.22) return 'Sell'
  return 'Neutral'
}

function gaugeLabelFromAction(action: TechnicalAction, score: number): string {
  if (action === 'Buy') return score >= 0.58 ? 'Strong Buy' : 'Buy'
  if (action === 'Sell') return score <= -0.58 ? 'Strong Sell' : 'Sell'
  return 'Neutral'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function latest(values: number[]): number | null {
  const value = values[values.length - 1]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function sma(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const slice = values.slice(-period)
  return average(slice)
}

function emaSeries(values: number[], period: number): number[] {
  if (period <= 0 || values.length < period) return []
  const seed = average(values.slice(0, period))
  if (seed === null) return []

  const multiplier = 2 / (period + 1)
  const output: number[] = [seed]

  for (let index = period; index < values.length; index += 1) {
    const previous = output[output.length - 1] ?? seed
    output.push((values[index] - previous) * multiplier + previous)
  }

  return output
}

function ema(values: number[], period: number): number | null {
  const series = emaSeries(values, period)
  return latest(series)
}

function wma(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const slice = values.slice(-period)
  const denominator = (period * (period + 1)) / 2
  const numerator = slice.reduce((sum, value, index) => sum + value * (index + 1), 0)
  return numerator / denominator
}

function hma(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const half = Math.max(1, Math.floor(period / 2))
  const sqrt = Math.max(1, Math.round(Math.sqrt(period)))
  const transformed: number[] = []

  for (let index = period - 1; index < values.length; index += 1) {
    const prefix = values.slice(0, index + 1)
    const halfWma = wma(prefix, half)
    const fullWma = wma(prefix, period)
    if (halfWma === null || fullWma === null) continue
    transformed.push(2 * halfWma - fullWma)
  }

  return wma(transformed, sqrt)
}

function meanDeviation(values: number[]): number | null {
  const mean = average(values)
  if (mean === null) return null
  return average(values.map((value) => Math.abs(value - mean)))
}

function rsiSeries(values: number[], period: number): number[] {
  if (period <= 0 || values.length <= period) return []

  let gains = 0
  let losses = 0
  for (let index = 1; index <= period; index += 1) {
    const delta = values[index] - values[index - 1]
    gains += Math.max(delta, 0)
    losses += Math.max(-delta, 0)
  }

  let avgGain = gains / period
  let avgLoss = losses / period
  const output: number[] = []

  const seedRs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss
  output.push(100 - 100 / (1 + seedRs))

  for (let index = period + 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1]
    const gain = Math.max(delta, 0)
    const loss = Math.max(-delta, 0)
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    const rs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss
    output.push(100 - 100 / (1 + rs))
  }

  return output
}

function rsi(values: number[], period: number): number | null {
  return latest(rsiSeries(values, period))
}

function stochasticK(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const slice = values.slice(-period)
  const low = Math.min(...slice)
  const high = Math.max(...slice)
  const current = slice[slice.length - 1]
  if (!Number.isFinite(current)) return null
  if (high === low) return 50
  return ((current - low) / (high - low)) * 100
}

function cci(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const slice = values.slice(-period)
  const mean = average(slice)
  const deviation = meanDeviation(slice)
  const current = slice[slice.length - 1]
  if (mean === null || deviation === null || deviation === 0 || !Number.isFinite(current)) return null
  return (current - mean) / (0.015 * deviation)
}

function adxFromClose(values: number[], period: number): number | null {
  if (period <= 0 || values.length <= period + 1) return null

  const trList: number[] = []
  const plusDmList: number[] = []
  const minusDmList: number[] = []

  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1]
    trList.push(Math.abs(delta))
    plusDmList.push(delta > 0 ? delta : 0)
    minusDmList.push(delta < 0 ? Math.abs(delta) : 0)
  }

  if (trList.length < period) return null

  const dxValues: number[] = []
  for (let index = period - 1; index < trList.length; index += 1) {
    const tr = trList.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0)
    if (tr === 0) {
      dxValues.push(0)
      continue
    }
    const plusDm = plusDmList.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0)
    const minusDm = minusDmList.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0)
    const plusDi = (plusDm / tr) * 100
    const minusDi = (minusDm / tr) * 100
    const denominator = plusDi + minusDi
    dxValues.push(denominator === 0 ? 0 : (Math.abs(plusDi - minusDi) / denominator) * 100)
  }

  return sma(dxValues, period)
}

function awesomeOscillator(values: number[]): number | null {
  const fast = sma(values, 5)
  const slow = sma(values, 34)
  if (fast === null || slow === null) return null
  return fast - slow
}

function momentum(values: number[], period: number): number | null {
  if (period <= 0 || values.length <= period) return null
  return values[values.length - 1] - values[values.length - 1 - period]
}

function macd(values: number[]): { macd: number | null; signal: number | null } {
  const ema12Series = emaSeries(values, 12)
  const ema26Series = emaSeries(values, 26)
  if (ema12Series.length === 0 || ema26Series.length === 0) {
    return { macd: null, signal: null }
  }

  const offset = ema12Series.length - ema26Series.length
  const macdSeries = ema26Series.map((value, index) => ema12Series[index + offset] - value)
  const signalSeries = emaSeries(macdSeries, 9)
  return {
    macd: latest(macdSeries),
    signal: latest(signalSeries),
  }
}

function stochasticRsi(values: number[], period: number): number | null {
  const rsiValues = rsiSeries(values, period)
  if (rsiValues.length < period) return null
  const slice = rsiValues.slice(-period)
  const low = Math.min(...slice)
  const high = Math.max(...slice)
  const current = slice[slice.length - 1]
  if (high === low) return 50
  return ((current - low) / (high - low)) * 100
}

function williamsR(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null
  const slice = values.slice(-period)
  const low = Math.min(...slice)
  const high = Math.max(...slice)
  const current = slice[slice.length - 1]
  if (high === low) return -50
  return ((high - current) / (high - low)) * -100
}

function bullBearPower(values: number[]): number | null {
  const ema13 = ema(values, 13)
  const current = latest(values)
  if (ema13 === null || current === null) return null
  return current - ema13
}

function ichimokuBase(values: number[]): number | null {
  if (values.length < 26) return null
  const slice = values.slice(-26)
  return (Math.max(...slice) + Math.min(...slice)) / 2
}

function actionFromRsi(value: number | null): TechnicalAction {
  if (value === null) return 'Neutral'
  if (value <= 30) return 'Buy'
  if (value >= 70) return 'Sell'
  return 'Neutral'
}

function actionFromStochastic(value: number | null): TechnicalAction {
  if (value === null) return 'Neutral'
  if (value <= 20) return 'Buy'
  if (value >= 80) return 'Sell'
  return 'Neutral'
}

function actionFromCci(value: number | null): TechnicalAction {
  if (value === null) return 'Neutral'
  if (value <= -100) return 'Buy'
  if (value >= 100) return 'Sell'
  return 'Neutral'
}

function actionFromAdx(value: number | null, momentumValue: number | null): TechnicalAction {
  if (value === null || momentumValue === null || value < 20) return 'Neutral'
  if (momentumValue > 0) return 'Buy'
  if (momentumValue < 0) return 'Sell'
  return 'Neutral'
}

function actionFromZeroLine(value: number | null): TechnicalAction {
  if (value === null) return 'Neutral'
  if (value > 0) return 'Buy'
  if (value < 0) return 'Sell'
  return 'Neutral'
}

function actionFromWilliams(value: number | null): TechnicalAction {
  if (value === null) return 'Neutral'
  if (value <= -80) return 'Buy'
  if (value >= -20) return 'Sell'
  return 'Neutral'
}

function actionFromPriceLevel(current: number | null, level: number | null): TechnicalAction {
  if (current === null || level === null) return 'Neutral'
  const delta = (current - level) / Math.max(level, 1e-6)
  if (delta > 0.0025) return 'Buy'
  if (delta < -0.0025) return 'Sell'
  return 'Neutral'
}

function formatPriceLevel(level: number | null): string {
  if (level === null || !Number.isFinite(level)) return '—'
  return level.toFixed(2)
}

function formatSignedLevel(level: number | null): string {
  if (level === null || !Number.isFinite(level)) return '—'
  return `${level > 0 ? '+' : ''}${level.toFixed(2)}`
}

function buildGauge(label: string, rows: TechnicalIndicatorRow[]): TechnicalGaugeData {
  const counts = rows.reduce(
    (acc, row) => {
      if (row.action === 'Buy') acc.buy += 1
      else if (row.action === 'Sell') acc.sell += 1
      else acc.neutral += 1
      return acc
    },
    { buy: 0, neutral: 0, sell: 0 }
  )

  const total = Math.max(1, counts.buy + counts.neutral + counts.sell)
  const score = (counts.buy - counts.sell) / total
  const verdictAction = actionFromScore(score)
  return {
    label,
    verdict: gaugeLabelFromAction(verdictAction, score),
    verdictAction,
    position: clamp(((score + 1) / 2) * 100, 0, 100),
    counts,
  }
}

export function buildTechnicalSummary(
  data: PricePoint[],
  timeframe: TechnicalTimeframe
): TechnicalSummary {
  const closes = getCloses(data)
  const config = TIMEFRAME_CONFIG[timeframe]
  const oscillatorCloses = takeLast(closes, config.oscillatorLookback)
  const currentPrice = average(takeLast(closes, config.priceSmoothing))

  const rsi14 = rsi(oscillatorCloses, 14)
  const stochastic14 = stochasticK(oscillatorCloses, 14)
  const cci20 = cci(oscillatorCloses, 20)
  const adx14 = adxFromClose(oscillatorCloses, 14)
  const awesome = awesomeOscillator(oscillatorCloses)
  const momentum10 = momentum(oscillatorCloses, 10)
  const macdValue = macd(oscillatorCloses)
  const stochRsi = stochasticRsi(oscillatorCloses, 14)
  const williams14 = williamsR(oscillatorCloses, 14)
  const bullBear = bullBearPower(oscillatorCloses)

  const oscillatorRows: TechnicalIndicatorRow[] = [
    {
      name: 'Relative Strength Index (14)',
      value: formatNumber(rsi14),
      action: actionFromRsi(rsi14),
    },
    {
      name: 'Stochastic %K (14, 3, 3)',
      value: formatNumber(stochastic14),
      action: actionFromStochastic(stochastic14),
    },
    {
      name: 'Commodity Channel Index (20)',
      value: formatSignedLevel(cci20),
      action: actionFromCci(cci20),
    },
    {
      name: 'Average Directional Index (14)',
      value: formatNumber(adx14),
      action: actionFromAdx(adx14, momentum10),
    },
    {
      name: 'Awesome Oscillator',
      value: formatSignedLevel(awesome),
      action: actionFromZeroLine(awesome),
    },
    {
      name: 'Momentum (10)',
      value: formatSignedLevel(momentum10),
      action: actionFromZeroLine(momentum10),
    },
    {
      name: 'MACD Level (12, 26)',
      value: formatSignedLevel(macdValue.macd),
      action:
        macdValue.macd === null || macdValue.signal === null
          ? 'Neutral'
          : macdValue.macd > macdValue.signal
            ? 'Buy'
            : macdValue.macd < macdValue.signal
              ? 'Sell'
              : 'Neutral',
    },
    {
      name: 'Stochastic RSI Fast (3, 3, 14, 14)',
      value: formatNumber(stochRsi),
      action: actionFromStochastic(stochRsi),
    },
    {
      name: 'Williams Percent Range (14)',
      value: formatNumber(williams14),
      action: actionFromWilliams(williams14),
    },
    {
      name: 'Bull Bear Power',
      value: formatSignedLevel(bullBear),
      action: actionFromZeroLine(bullBear),
    },
  ]

  const movingAverageValues: Array<[string, number | null]> = [
    ['EMA (10)', ema(closes, 10)],
    ['SMA (10)', sma(closes, 10)],
    ['EMA (20)', ema(closes, 20)],
    ['SMA (20)', sma(closes, 20)],
    ['EMA (30)', ema(closes, 30)],
    ['SMA (30)', sma(closes, 30)],
    ['EMA (50)', ema(closes, 50)],
    ['SMA (50)', sma(closes, 50)],
    ['EMA (100)', ema(closes, 100)],
    ['SMA (100)', sma(closes, 100)],
    ['EMA (200)', ema(closes, 200)],
    ['SMA (200)', sma(closes, 200)],
    ['Ichimoku Base Line (9, 26, 52, 26)', ichimokuBase(closes)],
    ['Volume Weighted MA (20)', sma(closes, 20)],
    ['Hull Moving Average (9)', hma(closes, 9)],
  ]

  const movingAverageRows: TechnicalIndicatorRow[] = movingAverageValues.map(([name, value]) => ({
    name,
    value: formatPriceLevel(value),
    action: actionFromPriceLevel(currentPrice, value),
  }))

  const oscillatorGauge = buildGauge('Oscillators', oscillatorRows)
  const movingAverageGauge = buildGauge('Moving Averages', movingAverageRows)
  const summaryGauge = buildGauge('Summary', [...oscillatorRows, ...movingAverageRows])

  return {
    gauges: {
      summary: summaryGauge,
      oscillators: oscillatorGauge,
      movingAverages: movingAverageGauge,
    },
    oscillatorRows,
    movingAverageRows,
  }
}
