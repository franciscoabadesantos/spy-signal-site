import Link from 'next/link'
import type { AiResearchRun } from '@/lib/ai-research'

type RecentAiResearchRunsProps = {
  title: string
  runs: AiResearchRun[]
  emptyMessage: string
  compact?: boolean
}

function formatDateTime(value: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return 'Recent'
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusTone(status: AiResearchRun['status']): string {
  if (status === 'completed') return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
  if (status === 'failed') return 'bg-red-500/10 text-red-700 border border-red-500/20'
  return 'bg-slate-500/10 text-slate-700 border border-slate-400/20'
}

function excerptText(run: AiResearchRun): string {
  if (run.responseExcerpt) return run.responseExcerpt
  if (run.errorMessage) return run.errorMessage
  return 'Run created. Waiting for final response content.'
}

function questionText(run: AiResearchRun): string {
  return run.promptLabel ?? run.question ?? 'Untitled AI research run'
}

function buildRerunHref(run: AiResearchRun): string {
  const params = new URLSearchParams()
  const question = run.question ?? run.promptLabel ?? ''
  if (question) params.set('aiQuestion', question)
  if (run.promptLabel) params.set('aiPromptLabel', run.promptLabel)
  const query = params.toString()
  return query.length > 0 ? `/stocks/${run.ticker}?${query}` : `/stocks/${run.ticker}`
}

export default function RecentAiResearchRuns({
  title,
  runs,
  emptyMessage,
  compact = false,
}: RecentAiResearchRunsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      </div>

      {runs.length === 0 ? (
        <div className="px-5 py-5 text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className={compact ? 'divide-y divide-border' : 'divide-y divide-border'}>
          {runs.map((run) => (
            <div key={run.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/stocks/${run.ticker}`}
                      className="text-[13px] font-semibold text-primary hover:underline"
                    >
                      {run.ticker}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(run.status)}`}>
                      {run.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-[14px] font-semibold leading-snug text-gray-900">
                    {questionText(run)}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] font-medium text-muted-foreground">
                  {formatDateTime(run.createdAt)}
                </div>
              </div>

              <div className={`mt-3 text-sm leading-6 text-muted-foreground ${compact ? 'line-clamp-3' : 'line-clamp-4'}`}>
                {excerptText(run)}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                {run.signalDate ? <span>Signal date {run.signalDate}</span> : null}
                {run.predictionHorizon !== null ? <span>{run.predictionHorizon}d horizon</span> : null}
                {run.citations.length > 0 ? <span>{run.citations.length} sources</span> : null}
                {run.provider ? <span>{run.provider}</span> : null}
              </div>

              <div className="mt-3 flex items-center gap-3 text-[12px] font-semibold">
                <Link href={`/dashboard/ai-research/${run.id}`} className="text-primary hover:underline">
                  View Run
                </Link>
                <Link href={buildRerunHref(run)} className="text-gray-700 hover:text-primary hover:underline">
                  Re-run Prompt
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
