'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/shells/AppShell'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FilterChip from '@/components/ui/FilterChip'
import Badge from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import {
  BENCHMARK_OPTIONS,
  HOLDING_HORIZON_OPTIONS,
  LOGIC_OPTIONS,
  LOOKBACK_OPTIONS,
  METRIC_OPTIONS,
  MODEL_UNIVERSE_OPTIONS,
  OPERATOR_OPTIONS,
  RISK_MODE_OPTIONS,
  UPDATE_FREQUENCY_OPTIONS,
  buildModelSystemDescription,
  buildModelRecord,
  defaultCondition,
  deriveModelQualitativeState,
  type LogicMode,
  type ModelCondition,
  type ModelDraftInput,
  type ModelQualitativeState,
  type ModelSourceKind,
  type RiskMode,
  type SignalUpdateFrequency,
  type ModelUniverse,
  universeLabel,
} from '@/lib/model-builder'
import { createValidatedModel, saveDraftModel } from '@/lib/model-store-client'

type BuilderStep = 1 | 2 | 3
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

function sanitizeTicker(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 10)
}

const VALIDATION_RUN_STAGES = [
  'Analyzing signals…',
  'Evaluating stability…',
  'Comparing to baseline…',
] as const

const OPERATOR_SYMBOL: Record<ModelCondition['operator'], string> = {
  above: '>',
  below: '<',
}

const METRIC_HELP_TEXT: Record<ModelCondition['metric'], string> = {
  Trend: 'Direction persistence over the selected lookback window.',
  Momentum: 'Speed and follow-through of recent directional moves.',
  Risk: 'Volatility and drawdown pressure in the signal regime.',
  Yield: 'Income contribution profile of the selected universe.',
  Stability: 'How consistently the signal holds without flipping.',
  Conviction: 'Model confidence behind each directional stance.',
  'Flip rate': 'How often signal direction changes in sequence.',
  Confirmation: 'Secondary evidence supporting primary direction.',
}

type StarterTemplate = {
  key: string
  label: string
  blurb: string
  name: string
  universe: ModelUniverse
  conditions: Array<Pick<ModelCondition, 'metric' | 'operator' | 'value'>>
  lookbackDays: number
  holdingHorizonDays: number
  signalUpdateFrequency: SignalUpdateFrequency
  riskMode: RiskMode
}

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: 'trend-follower',
    label: 'Trend follower',
    blurb: 'Ride persistent direction with moderate risk control.',
    name: 'Trend follower',
    universe: 'watchlist',
    conditions: [
      { metric: 'Trend', operator: 'above', value: 62 },
      { metric: 'Stability', operator: 'above', value: 56 },
      { metric: 'Risk', operator: 'below', value: 48 },
    ],
    lookbackDays: 252,
    holdingHorizonDays: 30,
    signalUpdateFrequency: 'daily',
    riskMode: 'balanced',
  },
  {
    key: 'momentum-continuation',
    label: 'Momentum continuation',
    blurb: 'Prioritize follow-through once momentum is active.',
    name: 'Momentum continuation',
    universe: 'watchlist',
    conditions: [
      { metric: 'Momentum', operator: 'above', value: 64 },
      { metric: 'Confirmation', operator: 'above', value: 55 },
      { metric: 'Conviction', operator: 'above', value: 58 },
    ],
    lookbackDays: 126,
    holdingHorizonDays: 20,
    signalUpdateFrequency: 'daily',
    riskMode: 'aggressive',
  },
  {
    key: 'defensive-stability',
    label: 'Defensive stability',
    blurb: 'Favor stable behavior and downside control.',
    name: 'Defensive stability',
    universe: 'watchlist',
    conditions: [
      { metric: 'Stability', operator: 'above', value: 62 },
      { metric: 'Risk', operator: 'below', value: 44 },
      { metric: 'Flip rate', operator: 'below', value: 45 },
    ],
    lookbackDays: 504,
    holdingHorizonDays: 30,
    signalUpdateFrequency: 'weekly',
    riskMode: 'conservative',
  },
  {
    key: 'balanced-confirmation',
    label: 'Balanced confirmation',
    blurb: 'Blend trend, momentum, and confirmation quality.',
    name: 'Balanced confirmation',
    universe: 'watchlist',
    conditions: [
      { metric: 'Trend', operator: 'above', value: 56 },
      { metric: 'Momentum', operator: 'above', value: 54 },
      { metric: 'Confirmation', operator: 'above', value: 52 },
    ],
    lookbackDays: 252,
    holdingHorizonDays: 20,
    signalUpdateFrequency: 'daily',
    riskMode: 'balanced',
  },
]

function qualitativeStateVariant(state: ModelQualitativeState): 'success' | 'neutral' | 'warning' {
  if (state === 'Constructive') return 'success'
  if (state === 'Mixed') return 'neutral'
  return 'warning'
}

function metricBarClass(label: string): string {
  if (label === 'Trend') return 'bg-sky-500'
  if (label === 'Momentum') return 'bg-indigo-500'
  if (label === 'Risk') return 'bg-rose-500'
  if (label === 'Yield') return 'bg-amber-500'
  return 'bg-emerald-500'
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export default function ModelBuilderClient({
  initialTicker = null,
  initialDraft = null,
}: {
  initialTicker?: string | null
  initialDraft?: BuilderDraftSeed | null
}) {
  const router = useRouter()
  const seedDraft = initialDraft ?? null
  const seedTickerFromDraft =
    seedDraft && seedDraft.universe === 'single-stock' && typeof seedDraft.ticker === 'string'
      ? sanitizeTicker(seedDraft.ticker)
      : ''
  const seedTickerFromQuery = initialTicker ? sanitizeTicker(initialTicker) : ''
  const seedTicker = seedTickerFromDraft || seedTickerFromQuery
  const seedUniverse: ModelUniverse =
    seedDraft?.universe ?? (seedTicker ? 'single-stock' : 'watchlist')
  const seedConditions =
    seedDraft?.conditions && seedDraft.conditions.length > 0
      ? seedDraft.conditions.map((condition, index) => ({
          id: condition.id || `seed_condition_${index + 1}`,
          metric: condition.metric,
          operator: condition.operator,
          value: Math.max(0, Math.min(100, Math.round(condition.value))),
        }))
      : [defaultCondition()]
  const [step, setStep] = useState<BuilderStep>(1)
  const [modelName, setModelName] = useState(
    seedDraft?.name?.trim() || (seedTicker ? `${seedTicker} system` : 'My model')
  )
  const [universe, setUniverse] = useState<ModelUniverse>(seedUniverse)
  const [ticker, setTicker] = useState(seedTicker || 'SPY')
  const [lookbackDays, setLookbackDays] = useState(
    seedDraft?.lookbackDays && Number.isFinite(seedDraft.lookbackDays)
      ? seedDraft.lookbackDays
      : 252
  )
  const [benchmark, setBenchmark] = useState(seedDraft?.benchmark || 'SPY')
  const [logicMode, setLogicMode] = useState<LogicMode>(seedDraft?.logicMode || 'all')
  const [conditions, setConditions] = useState<ModelCondition[]>(seedConditions)
  const [holdingHorizonDays, setHoldingHorizonDays] = useState(
    seedDraft?.holdingHorizonDays && Number.isFinite(seedDraft.holdingHorizonDays)
      ? seedDraft.holdingHorizonDays
      : 20
  )
  const [signalUpdateFrequency, setSignalUpdateFrequency] = useState<SignalUpdateFrequency>(
    seedDraft?.signalUpdateFrequency || 'daily'
  )
  const [compareAgainstBenchmark, setCompareAgainstBenchmark] = useState(
    seedDraft?.compareAgainstBenchmark ?? true
  )
  const [riskMode, setRiskMode] = useState<RiskMode>(seedDraft?.riskMode || 'balanced')
  const [sourceKind, setSourceKind] = useState<ModelSourceKind>(seedDraft?.sourceKind || 'manual')
  const [templateKey, setTemplateKey] = useState<string | null>(seedDraft?.templateKey ?? null)
  const [variationOfModelId, setVariationOfModelId] = useState<string | null>(
    seedDraft?.variationOfModelId ?? null
  )
  const [variationLabel, setVariationLabel] = useState<string | null>(seedDraft?.variationLabel ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [runStageIndex, setRunStageIndex] = useState<number | null>(null)

  const scopeReady = modelName.trim().length >= 3 && (universe !== 'single-stock' || ticker.trim().length > 0)
  const logicReady = conditions.length > 0 && conditions.every((condition) => Number.isFinite(condition.value))
  const validationReady = holdingHorizonDays > 0 && (signalUpdateFrequency === 'daily' || signalUpdateFrequency === 'weekly')
  const allReady = scopeReady && logicReady && validationReady

  const draftInput: ModelDraftInput = useMemo(
    () => ({
      name: modelName.trim(),
      universe,
      ticker: universe === 'single-stock' ? sanitizeTicker(ticker) : null,
      lookbackDays,
      benchmark,
      logicMode,
      conditions: conditions.map((condition) => ({
        ...condition,
        value: Math.max(0, Math.min(100, Math.round(condition.value))),
      })),
      validation: {
        holdingHorizonDays,
        signalUpdateFrequency,
        compareAgainstBenchmark,
        riskMode,
      },
      sourceKind,
      templateKey,
      variationOfModelId,
      variationLabel,
    }),
    [
      modelName,
      universe,
      ticker,
      lookbackDays,
      benchmark,
      logicMode,
      conditions,
      holdingHorizonDays,
      signalUpdateFrequency,
      compareAgainstBenchmark,
      riskMode,
      sourceKind,
      templateKey,
      variationOfModelId,
      variationLabel,
    ]
  )

  const previewModel = useMemo(() => buildModelRecord(draftInput, { status: 'draft' }), [draftInput])
  const previewState = useMemo(
    () => deriveModelQualitativeState(previewModel.profileDimensions),
    [previewModel.profileDimensions]
  )
  const previewDescription = useMemo(
    () => buildModelSystemDescription({ conditions: draftInput.conditions, logicMode: draftInput.logicMode }),
    [draftInput.conditions, draftInput.logicMode]
  )

  const handleConditionChange = (id: string, patch: Partial<ModelCondition>) => {
    setConditions((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
  }

  const handleAddCondition = () => {
    setConditions((rows) => [...rows, defaultCondition()])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions((rows) => {
      if (rows.length <= 1) return rows
      return rows.filter((row) => row.id !== id)
    })
  }

  const applyTemplate = (template: StarterTemplate) => {
    setModelName(template.name)
    setUniverse(template.universe)
    if (template.universe === 'single-stock' && !ticker.trim()) {
      setTicker(seedTicker || 'SPY')
    }
    setLookbackDays(template.lookbackDays)
    setLogicMode('all')
    setConditions(
      template.conditions.map((condition, index) => ({
        id: `template_${template.key}_${index + 1}`,
        metric: condition.metric,
        operator: condition.operator,
        value: condition.value,
      }))
    )
    setHoldingHorizonDays(template.holdingHorizonDays)
    setSignalUpdateFrequency(template.signalUpdateFrequency)
    setCompareAgainstBenchmark(true)
    setRiskMode(template.riskMode)
    setSourceKind('template')
    setTemplateKey(template.key)
    setVariationOfModelId(null)
    setVariationLabel(null)
    setStep(2)
  }

  const handleSaveDraft = () => {
    if (!scopeReady || isSaving) return
    setIsSaving(true)
    setRunStageIndex(null)
    const model = saveDraftModel(draftInput)
    router.push(`/models/${model.id}`)
  }

  const handleRunValidation = async () => {
    if (!allReady || isSaving) return
    setIsSaving(true)
    for (let index = 0; index < VALIDATION_RUN_STAGES.length; index += 1) {
      setRunStageIndex(index)
      await wait(360)
    }
    const model = await createValidatedModel(draftInput)
    router.push(`/models/${model.id}`)
  }

  return (
    <AppShell active="models" container="lg">
      <div className="section-gap">
        <PageHeader
          title="New model"
          subtitle="Create a simple system in three guided steps, then run validation."
          action={
            <Link href="/models" className={buttonClass({ variant: 'ghost' })}>
              Back to models
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="section-gap">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Starter templates</h2>
                  <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                    Start from a proven structure, then tune conditions.
                  </p>
                </div>
                <Badge variant="neutral">1-click setup</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {STARTER_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-xl border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary/40 dark:hover:bg-primary/10"
                  >
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{template.label}</div>
                    <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{template.blurb}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className={step === 1 ? 'border-primary/40' : undefined}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Step 1 · Scope</h2>
                <Badge variant={scopeReady ? 'success' : 'neutral'}>{scopeReady ? 'Ready' : 'In progress'}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-filter-label mb-2 block">Model name</label>
                  <Input value={modelName} onChange={(event) => setModelName(event.target.value)} />
                </div>

                <div>
                  <label className="text-filter-label mb-2 block">Universe</label>
                  <Select
                    value={universe}
                    onChange={(event) => setUniverse(event.target.value as ModelUniverse)}
                  >
                    {MODEL_UNIVERSE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {universe === 'single-stock' ? (
                  <div>
                    <label className="text-filter-label mb-2 block">Ticker</label>
                    <Input
                      value={ticker}
                      onChange={(event) => setTicker(sanitizeTicker(event.target.value))}
                      placeholder="SPY"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="text-filter-label mb-2 block">Lookback period</label>
                  <Select
                    value={String(lookbackDays)}
                    onChange={(event) => setLookbackDays(Number(event.target.value))}
                  >
                    {LOOKBACK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} days
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-filter-label mb-2 block">Benchmark</label>
                  <Select value={benchmark} onChange={(event) => setBenchmark(event.target.value)}>
                    {BENCHMARK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className={buttonClass({ variant: 'secondary' })}
                  onClick={() => setStep(2)}
                  disabled={!scopeReady}
                >
                  Continue to logic
                </button>
              </div>
            </Card>

            <Card className={step === 2 ? 'border-primary/40' : 'opacity-80'}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Step 2 · Logic</h2>
                <Badge variant={logicReady ? 'success' : 'neutral'}>{logicReady ? 'Ready' : 'In progress'}</Badge>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-filter-label mb-2 block">Global logic mode</label>
                  <div className="flex flex-wrap gap-2">
                    {LOGIC_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.value}
                        label={option.label}
                        active={logicMode === option.value}
                        onClick={() => setLogicMode(option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div
                      key={condition.id}
                      className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-3 dark:border-neutral-800 dark:from-neutral-950 dark:to-neutral-900"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
                          Rule {index + 1}
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                          {condition.metric} {OPERATOR_SYMBOL[condition.operator]} {condition.value}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">When</span>
                        <Select
                          value={condition.metric}
                          onChange={(event) =>
                            handleConditionChange(condition.id, {
                              metric: event.target.value as ModelCondition['metric'],
                            })
                          }
                          className="h-9 w-auto min-w-[130px] rounded-full bg-white px-3 text-[13px] dark:bg-neutral-900"
                        >
                          {METRIC_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={condition.operator}
                          onChange={(event) =>
                            handleConditionChange(condition.id, {
                              operator: event.target.value as ModelCondition['operator'],
                            })
                          }
                          className="h-9 w-auto min-w-[96px] rounded-full bg-white px-3 text-[13px] dark:bg-neutral-900"
                        >
                          {OPERATOR_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={condition.value}
                          onChange={(event) =>
                            handleConditionChange(condition.id, {
                              value: Number(event.target.value),
                            })
                          }
                          className="h-9 w-20 rounded-full text-center text-[13px]"
                        />
                        <button
                          type="button"
                          className={buttonClass({ variant: 'ghost' })}
                          onClick={() => handleRemoveCondition(condition.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={condition.value}
                          onChange={(event) =>
                            handleConditionChange(condition.id, {
                              value: Number(event.target.value),
                            })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                      <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {METRIC_HELP_TEXT[condition.metric]}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className={buttonClass({ variant: 'secondary' })} onClick={handleAddCondition}>
                  Add condition
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button type="button" className={buttonClass({ variant: 'ghost' })} onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className={buttonClass({ variant: 'secondary' })}
                  onClick={() => setStep(3)}
                  disabled={!logicReady}
                >
                  Continue to validate
                </button>
              </div>
            </Card>

            <Card className={step === 3 ? 'border-primary/40' : 'opacity-80'}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Step 3 · Validate</h2>
                <Badge variant={validationReady ? 'success' : 'neutral'}>{validationReady ? 'Ready' : 'In progress'}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-filter-label mb-2 block">Holding horizon</label>
                  <Select
                    value={String(holdingHorizonDays)}
                    onChange={(event) => setHoldingHorizonDays(Number(event.target.value))}
                  >
                    {HOLDING_HORIZON_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} days
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-filter-label mb-2 block">Signal update frequency</label>
                  <Select
                    value={signalUpdateFrequency}
                    onChange={(event) =>
                      setSignalUpdateFrequency(event.target.value as 'daily' | 'weekly')
                    }
                  >
                    {UPDATE_FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-filter-label mb-2 block">Risk mode</label>
                  <div className="flex flex-wrap gap-2">
                    {RISK_MODE_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.value}
                        label={option.label}
                        active={riskMode === option.value}
                        onClick={() => setRiskMode(option.value)}
                      />
                    ))}
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={compareAgainstBenchmark}
                    onChange={(event) => setCompareAgainstBenchmark(event.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  Compare against benchmark
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <button type="button" className={buttonClass({ variant: 'ghost' })} onClick={() => setStep(2)}>
                  Back
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass({ variant: 'secondary' })}
                    onClick={handleSaveDraft}
                    disabled={isSaving || !scopeReady}
                  >
                    Save draft
                  </button>
                <button
                  type="button"
                  className={buttonClass({ variant: 'primary' })}
                  onClick={handleRunValidation}
                  disabled={isSaving || !allReady}
                >
                  {runStageIndex !== null ? VALIDATION_RUN_STAGES[runStageIndex] : 'Run validation'}
                </button>
                </div>
              </div>
              {runStageIndex !== null ? (
                <div className="mt-3 text-[12px] font-medium text-primary">
                  {VALIDATION_RUN_STAGES[runStageIndex]}
                </div>
              ) : null}
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 section-gap">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-filter-label">Live summary</div>
                  <h3 className="mt-1 text-card-title text-neutral-900 dark:text-neutral-100">
                    {draftInput.name || 'Untitled model'}
                  </h3>
                  <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                    {universeLabel(draftInput.universe)}
                    {draftInput.ticker ? ` · ${draftInput.ticker}` : ''}
                  </p>
                </div>
                <Badge variant={allReady ? 'success' : 'warning'}>
                  {allReady ? 'Ready to run' : 'Needs input'}
                </Badge>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-filter-label">Predicted state</div>
                  <Badge variant={qualitativeStateVariant(previewState)}>{previewState}</Badge>
                </div>
                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{previewDescription}</p>
                <div className="mt-3 space-y-2">
                  {previewModel.profileDimensions.map((dimension) => (
                    <div key={dimension.label}>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>{dimension.label}</span>
                        <span>{Math.round(dimension.score)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className={`h-1.5 rounded-full ${metricBarClass(dimension.label)}`}
                          style={{ width: `${Math.round(dimension.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-filter-label">Conditions</div>
                <ul className="mt-2 flex flex-wrap gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {draftInput.conditions.map((condition) => (
                    <li
                      key={condition.id}
                      className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      {condition.metric} {OPERATOR_SYMBOL[condition.operator]} {condition.value}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-filter-label">Validation settings</div>
                <div className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                  <div>Horizon: {draftInput.validation.holdingHorizonDays}d</div>
                  <div>Update: {draftInput.validation.signalUpdateFrequency}</div>
                  <div>Risk: {draftInput.validation.riskMode}</div>
                  <div>Benchmark: {draftInput.validation.compareAgainstBenchmark ? draftInput.benchmark : 'Off'}</div>
                </div>
              </div>

              <div>
                <div className="text-filter-label">Readiness</div>
                <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                  Scope {scopeReady ? '✓' : '•'} · Logic {logicReady ? '✓' : '•'} · Validate {validationReady ? '✓' : '•'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass({ variant: 'primary' })}
                  onClick={handleRunValidation}
                  disabled={isSaving || !allReady}
                >
                  {runStageIndex !== null ? VALIDATION_RUN_STAGES[runStageIndex] : 'Run validation'}
                </button>
                <button
                  type="button"
                  className={buttonClass({ variant: 'secondary' })}
                  onClick={handleSaveDraft}
                  disabled={isSaving || !scopeReady}
                >
                  Save draft
                </button>
              </div>
              {runStageIndex !== null ? (
                <div className="text-[12px] font-medium text-primary">{VALIDATION_RUN_STAGES[runStageIndex]}</div>
              ) : null}

              <div className="rounded-lg border border-neutral-200 p-3 text-[12px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                Preview score (draft): {Math.round(
                  previewModel.profileDimensions.reduce((sum, row) => sum + row.score, 0) /
                    previewModel.profileDimensions.length
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
