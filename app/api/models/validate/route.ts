import { NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/finance'
import {
  BENCHMARK_OPTIONS,
  buildModelRecordFromHistoricalData,
  defaultCondition,
  type ConditionMetric,
  type ConditionOperator,
  type LogicMode,
  type ModelCondition,
  type ModelDraftInput,
  type ModelSourceKind,
  type ModelUniverse,
  type RiskMode,
  type SignalUpdateFrequency,
} from '@/lib/model-builder'

const METRICS: ConditionMetric[] = [
  'Trend',
  'Momentum',
  'Risk',
  'Yield',
  'Stability',
  'Conviction',
  'Flip rate',
  'Confirmation',
]
const OPERATORS: ConditionOperator[] = ['above', 'below']
const UNIVERSES: ModelUniverse[] = ['single-stock', 'watchlist', 'screener-results']
const LOGIC_MODES: LogicMode[] = ['all', 'any']
const FREQUENCIES: SignalUpdateFrequency[] = ['daily', 'weekly']
const RISK_MODES: RiskMode[] = ['conservative', 'balanced', 'aggressive']
const SOURCE_KINDS: ModelSourceKind[] = ['manual', 'template', 'variation']

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function sanitizeTicker(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 10)
  return normalized.length > 0 ? normalized : null
}

function parseCondition(raw: unknown, index: number): ModelCondition | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (!METRICS.includes(row.metric as ConditionMetric)) return null
  if (!OPERATORS.includes(row.operator as ConditionOperator)) return null
  if (typeof row.value !== 'number' || !Number.isFinite(row.value)) return null

  return {
    id: asString(row.id) ?? `cond_${index + 1}`,
    metric: row.metric as ConditionMetric,
    operator: row.operator as ConditionOperator,
    value: clamp(Math.round(row.value), 0, 100),
  }
}

function parseDraftInput(raw: unknown): ModelDraftInput | null {
  if (!raw || typeof raw !== 'object') return null
  const body = raw as Record<string, unknown>

  const name = asString(body.name) ?? 'Untitled model'
  const universe: ModelUniverse = UNIVERSES.includes(body.universe as ModelUniverse)
    ? (body.universe as ModelUniverse)
    : 'single-stock'

  const conditions = Array.isArray(body.conditions)
    ? body.conditions
        .map((row, index) => parseCondition(row, index))
        .filter((row): row is ModelCondition => row !== null)
    : [defaultCondition()]

  const ticker = universe === 'single-stock' ? sanitizeTicker(body.ticker) : null
  const benchmarkRaw = sanitizeTicker(body.benchmark)
  const benchmark = benchmarkRaw && BENCHMARK_OPTIONS.includes(benchmarkRaw) ? benchmarkRaw : 'SPY'

  const validationRaw = body.validation && typeof body.validation === 'object'
    ? (body.validation as Record<string, unknown>)
    : {}

  const lookbackDays =
    typeof body.lookbackDays === 'number' && Number.isFinite(body.lookbackDays)
      ? clamp(Math.round(body.lookbackDays), 63, 1260)
      : 252

  const holdingHorizonDays =
    typeof validationRaw.holdingHorizonDays === 'number' && Number.isFinite(validationRaw.holdingHorizonDays)
      ? clamp(Math.round(validationRaw.holdingHorizonDays), 3, 60)
      : 20

  const signalUpdateFrequency: SignalUpdateFrequency = FREQUENCIES.includes(
    validationRaw.signalUpdateFrequency as SignalUpdateFrequency
  )
    ? (validationRaw.signalUpdateFrequency as SignalUpdateFrequency)
    : 'daily'

  const compareAgainstBenchmark =
    typeof validationRaw.compareAgainstBenchmark === 'boolean'
      ? validationRaw.compareAgainstBenchmark
      : true

  const riskMode: RiskMode = RISK_MODES.includes(validationRaw.riskMode as RiskMode)
    ? (validationRaw.riskMode as RiskMode)
    : 'balanced'

  const logicMode: LogicMode = LOGIC_MODES.includes(body.logicMode as LogicMode)
    ? (body.logicMode as LogicMode)
    : 'all'

  const sourceKind: ModelSourceKind = SOURCE_KINDS.includes(body.sourceKind as ModelSourceKind)
    ? (body.sourceKind as ModelSourceKind)
    : 'manual'

  return {
    name,
    universe,
    ticker,
    lookbackDays,
    benchmark,
    logicMode,
    conditions: conditions.length > 0 ? conditions : [defaultCondition()],
    validation: {
      holdingHorizonDays,
      signalUpdateFrequency,
      compareAgainstBenchmark,
      riskMode,
    },
    sourceKind,
    templateKey: asString(body.templateKey),
    variationOfModelId: asString(body.variationOfModelId),
    variationLabel: asString(body.variationLabel),
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | {
          input?: unknown
          id?: unknown
          createdAt?: unknown
        }
      | null
    if (!payload) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const input = parseDraftInput(payload.input)
    if (!input) {
      return NextResponse.json({ error: 'Invalid model input' }, { status: 400 })
    }

    if (input.universe !== 'single-stock' || !input.ticker) {
      return NextResponse.json(
        { error: 'Validation engine v1 supports single-stock models only.' },
        { status: 422 }
      )
    }

    const historyDays = clamp(
      input.lookbackDays + input.validation.holdingHorizonDays + 220,
      320,
      2200
    )
    const benchmarkTicker = input.validation.compareAgainstBenchmark ? input.benchmark : input.ticker

    const [priceHistory, benchmarkHistory] = await Promise.all([
      getHistoricalData(input.ticker, historyDays),
      getHistoricalData(benchmarkTicker, historyDays),
    ])

    if (priceHistory.length < 80) {
      return NextResponse.json(
        { error: `Insufficient daily history for ${input.ticker}.` },
        { status: 422 }
      )
    }

    const id = asString(payload.id) ?? undefined
    const createdAtRaw = asString(payload.createdAt)
    const createdAt = createdAtRaw && Number.isFinite(Date.parse(createdAtRaw)) ? createdAtRaw : undefined

    const model = buildModelRecordFromHistoricalData(input, priceHistory, benchmarkHistory, {
      id,
      createdAt,
    })

    return NextResponse.json({ model })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
