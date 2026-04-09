import { type ModelCondition, type ModelDraftInput } from '@/lib/model-builder'

export const SAMPLE_MODEL_ID = 'sample-trend-follower'

const SAMPLE_CONDITIONS: ModelCondition[] = [
  { id: 'sample_cond_1', metric: 'Trend', operator: 'above', value: 62 },
  { id: 'sample_cond_2', metric: 'Momentum', operator: 'above', value: 56 },
  { id: 'sample_cond_3', metric: 'Risk', operator: 'below', value: 48 },
]

export function buildSampleModelInput(): ModelDraftInput {
  return {
    name: 'Sample Trend Follower',
    universe: 'single-stock',
    ticker: 'SPY',
    lookbackDays: 252,
    benchmark: 'SPY',
    logicMode: 'all',
    conditions: SAMPLE_CONDITIONS.map((condition) => ({ ...condition })),
    validation: {
      holdingHorizonDays: 20,
      signalUpdateFrequency: 'daily',
      compareAgainstBenchmark: true,
      riskMode: 'balanced',
    },
    sourceKind: 'template',
    templateKey: 'sample-trend-follower',
    variationOfModelId: null,
    variationLabel: null,
  }
}

export function buildSampleModelDraftSeed(): {
  name: string
  universe: 'single-stock'
  ticker: string
  lookbackDays: number
  benchmark: string
  logicMode: 'all'
  conditions: ModelCondition[]
  holdingHorizonDays: number
  signalUpdateFrequency: 'daily'
  compareAgainstBenchmark: boolean
  riskMode: 'balanced'
  sourceKind: 'template'
  templateKey: 'sample-trend-follower'
  variationOfModelId: null
  variationLabel: null
} {
  const input = buildSampleModelInput()
  return {
    name: input.name,
    universe: 'single-stock',
    ticker: input.ticker ?? 'SPY',
    lookbackDays: input.lookbackDays,
    benchmark: input.benchmark,
    logicMode: 'all',
    conditions: input.conditions.map((condition) => ({ ...condition })),
    holdingHorizonDays: input.validation.holdingHorizonDays,
    signalUpdateFrequency: 'daily',
    compareAgainstBenchmark: input.validation.compareAgainstBenchmark,
    riskMode: 'balanced',
    sourceKind: 'template',
    templateKey: 'sample-trend-follower',
    variationOfModelId: null,
    variationLabel: null,
  }
}

