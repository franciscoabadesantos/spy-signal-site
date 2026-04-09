import ModelBuilderClient from '@/components/models/ModelBuilderClient'
import {
  type LogicMode,
  type ModelCondition,
  type ModelSourceKind,
  type ModelUniverse,
  type RiskMode,
  type SignalUpdateFrequency,
} from '@/lib/model-builder'

export const dynamic = 'force-dynamic'

function singleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

type BuilderDraftSeed = {
  name?: string
  universe?: ModelUniverse
  ticker?: string | null
  lookbackDays?: number
  benchmark?: string
  logicMode?: LogicMode
  conditions?: ModelCondition[]
  holdingHorizonDays?: number
  signalUpdateFrequency?: SignalUpdateFrequency
  compareAgainstBenchmark?: boolean
  riskMode?: RiskMode
  sourceKind?: ModelSourceKind
  templateKey?: string | null
  variationOfModelId?: string | null
  variationLabel?: string | null
}

function parseDraftSeed(value: string | null): BuilderDraftSeed | null {
  if (!value) return null

  const parseObject = (raw: string): BuilderDraftSeed | null => {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>

    const draft: BuilderDraftSeed = {}
    if (typeof obj.name === 'string') draft.name = obj.name
    if (
      obj.universe === 'single-stock' ||
      obj.universe === 'watchlist' ||
      obj.universe === 'screener-results'
    ) {
      draft.universe = obj.universe
    }
    if (typeof obj.ticker === 'string' || obj.ticker === null) draft.ticker = obj.ticker
    if (typeof obj.lookbackDays === 'number' && Number.isFinite(obj.lookbackDays)) {
      draft.lookbackDays = obj.lookbackDays
    }
    if (typeof obj.benchmark === 'string') draft.benchmark = obj.benchmark
    if (obj.logicMode === 'all' || obj.logicMode === 'any') draft.logicMode = obj.logicMode
    if (typeof obj.holdingHorizonDays === 'number' && Number.isFinite(obj.holdingHorizonDays)) {
      draft.holdingHorizonDays = obj.holdingHorizonDays
    }
    if (obj.signalUpdateFrequency === 'daily' || obj.signalUpdateFrequency === 'weekly') {
      draft.signalUpdateFrequency = obj.signalUpdateFrequency
    }
    if (typeof obj.compareAgainstBenchmark === 'boolean') {
      draft.compareAgainstBenchmark = obj.compareAgainstBenchmark
    }
    if (
      obj.riskMode === 'conservative' ||
      obj.riskMode === 'balanced' ||
      obj.riskMode === 'aggressive'
    ) {
      draft.riskMode = obj.riskMode
    }
    if (obj.sourceKind === 'manual' || obj.sourceKind === 'template' || obj.sourceKind === 'variation') {
      draft.sourceKind = obj.sourceKind
    }
    if (typeof obj.templateKey === 'string' || obj.templateKey === null) {
      draft.templateKey = obj.templateKey
    }
    if (typeof obj.variationOfModelId === 'string' || obj.variationOfModelId === null) {
      draft.variationOfModelId = obj.variationOfModelId
    }
    if (typeof obj.variationLabel === 'string' || obj.variationLabel === null) {
      draft.variationLabel = obj.variationLabel
    }
    if (Array.isArray(obj.conditions)) {
      draft.conditions = obj.conditions
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const item = row as Record<string, unknown>
          if (
            (item.metric !== 'Trend' &&
              item.metric !== 'Momentum' &&
              item.metric !== 'Risk' &&
              item.metric !== 'Yield' &&
              item.metric !== 'Stability' &&
              item.metric !== 'Conviction' &&
              item.metric !== 'Flip rate' &&
              item.metric !== 'Confirmation') ||
            (item.operator !== 'above' && item.operator !== 'below') ||
            typeof item.value !== 'number' ||
            !Number.isFinite(item.value)
          ) {
            return null
          }
          return {
            id: typeof item.id === 'string' ? item.id : `cond_${Math.random().toString(36).slice(2, 8)}`,
            metric: item.metric,
            operator: item.operator,
            value: item.value,
          } satisfies ModelCondition
        })
        .filter((row): row is ModelCondition => row !== null)
    }

    return draft
  }

  try {
    return parseObject(value)
  } catch {
    try {
      return parseObject(decodeURIComponent(value))
    } catch {
      return null
    }
  }
}

export default async function NewModelPage({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string | string[]; draft?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const initialTicker = singleParam(resolvedSearchParams.ticker)
  const initialDraft = parseDraftSeed(singleParam(resolvedSearchParams.draft))

  return <ModelBuilderClient initialTicker={initialTicker} initialDraft={initialDraft} />
}
