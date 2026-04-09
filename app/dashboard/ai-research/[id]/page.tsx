import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Card from '@/components/ui/Card'
import { buttonClass } from '@/components/ui/Button'
import AppShell from '@/components/shells/AppShell'
import { getViewerUserId } from '@/lib/auth'
import { getAiResearchRunById } from '@/lib/ai-research'

export const dynamic = 'force-dynamic'

function formatDateTime(value: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return 'Recent'
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusTone(status: 'started' | 'completed' | 'failed'): string {
  if (status === 'completed') return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
  if (status === 'failed') return 'bg-red-500/10 text-red-700 border border-red-500/20'
  return 'bg-slate-500/10 text-slate-700 border border-slate-400/20'
}

function asRunId(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed)
}

function buildRerunHref(ticker: string, question: string | null, promptLabel: string | null): string {
  const params = new URLSearchParams()
  if (question) params.set('aiQuestion', question)
  if (promptLabel) params.set('aiPromptLabel', promptLabel)
  const query = params.toString()
  return query ? `/stocks/${ticker}?${query}` : `/stocks/${ticker}`
}

export default async function AiResearchRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const runId = asRunId(id)
  const userId = await getViewerUserId()

  if (!runId || !userId) notFound()

  const run = await getAiResearchRunById({ userId, runId })
  if (!run) notFound()

  return (
    <AppShell active="dashboard" container="md">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'AI Research', href: '/dashboard' },
            { label: `Run #${run.id}` },
          ]}
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-page-title tracking-tight text-gray-900">
                {run.ticker} AI Research Run
              </h1>
              <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusTone(run.status)}`}>
                {run.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Saved on {formatDateTime(run.createdAt)}
            </p>
          </div>

          <Link
            href={buildRerunHref(run.ticker, run.question, run.promptLabel)}
            className={buttonClass({ variant: 'primary' })}
          >
            Re-run This Prompt
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <h2 className="text-[15px] font-bold text-gray-900">Run Metadata</h2>
              </div>
              <div className="px-5 py-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Ticker</span>
                  <span className="font-semibold text-gray-900">{run.ticker}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Prompt</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[180px] truncate">
                    {run.promptLabel ?? 'Custom'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Signal Date</span>
                  <span className="font-semibold text-gray-900">{run.signalDate ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Direction</span>
                  <span className="font-semibold text-gray-900">{run.signalDirection.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Conviction</span>
                  <span className="font-semibold text-gray-900">
                    {run.conviction === null ? '—' : `${Math.round(run.conviction * 100)}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Horizon</span>
                  <span className="font-semibold text-gray-900">
                    {run.predictionHorizon === null ? '—' : `${run.predictionHorizon}d`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-semibold text-gray-900">{run.provider ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-semibold text-gray-900">{run.model ?? '—'}</span>
                </div>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <h2 className="text-[15px] font-bold text-gray-900">Question</h2>
              </div>
              <div className="px-5 py-4 text-sm leading-6 text-gray-700">
                {run.question ?? run.promptLabel ?? 'No question saved for this run.'}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <h2 className="text-[15px] font-bold text-gray-900">Saved Response</h2>
              </div>
              <div className="px-5 py-5">
                <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-gray-800">
                  {run.responseExcerpt || run.errorMessage || 'No response excerpt was stored for this run.'}
                </pre>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <h2 className="text-[15px] font-bold text-gray-900">Sources</h2>
              </div>
              <div className="px-5 py-4">
                {run.citations.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No sources were saved for this run.</div>
                ) : (
                  <div className="space-y-2">
                    {run.citations.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm text-primary hover:underline"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
    </AppShell>
  )
}
