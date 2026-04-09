'use client'

import Link from 'next/link'
import AppShell from '@/components/shells/AppShell'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import DismissibleLocalHint from '@/components/onboarding/DismissibleLocalHint'
import { buttonClass } from '@/components/ui/Button'
import { loadModelsFromStorage } from '@/lib/model-store-client'
import { modelSummaryResult, universeLabel } from '@/lib/model-builder'
import { buildSampleModelDraftSeed, SAMPLE_MODEL_ID } from '@/lib/model-samples'
import { trackEvent } from '@/lib/analytics'

function formatDate(value: string | null): string {
  if (!value) return 'Not run yet'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return 'Not run yet'
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ModelsHubClient() {
  const models = loadModelsFromStorage()
  const sampleDraftHref = `/models/new?draft=${encodeURIComponent(
    JSON.stringify(buildSampleModelDraftSeed())
  )}`
  const sampleModelHref = `/models/${SAMPLE_MODEL_ID}?from=models_hub`

  return (
    <AppShell active="models" container="md">
      <div className="section-gap">
        <PageHeader
          title="Models"
          subtitle="Build, test, and compare your investing systems."
          action={
            <Link href="/models/new" className={buttonClass({ variant: 'primary' })}>
              New model
            </Link>
          }
        />
        <DismissibleLocalHint
          storageKey="spy_signal_onboarding_loop_hint_dismissed_v1"
          text="Start here: Explore a model → tweak it → compare results"
        />

        {models.length === 0 ? (
          <Card>
            <EmptyState
              title="No models yet"
              description="Start with a template or explore a sample model."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href={sampleDraftHref} className={buttonClass({ variant: 'primary' })}>
                    Start with template
                  </Link>
                  <Link
                    href={sampleModelHref}
                    className={buttonClass({ variant: 'secondary' })}
                    onClick={() =>
                      trackEvent('click_sample_model', {
                        model_id: SAMPLE_MODEL_ID,
                        source: 'models_empty_state',
                        entry_source: 'models_hub',
                      })
                    }
                  >
                    Explore sample model
                  </Link>
                </div>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {models.map((model) => (
              <Card key={model.id} className="section-gap">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-card-title text-neutral-900 dark:text-neutral-100">{model.name}</div>
                    <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                      {universeLabel(model.universe)}
                      {model.ticker ? ` · ${model.ticker}` : ''}
                    </div>
                  </div>
                  <Badge variant={model.status === 'validated' ? 'success' : 'warning'}>
                    {model.status === 'validated' ? 'Validated' : 'Draft'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-1">
                    <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
                      Last run: {formatDate(model.lastRunAt)}
                    </div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{modelSummaryResult(model)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/models/${model.id}?from=models_hub`} className={buttonClass({ variant: 'secondary' })}>
                      Open
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
