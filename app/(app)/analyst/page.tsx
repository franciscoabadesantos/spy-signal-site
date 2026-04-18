'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import {
  createAnalystJob,
  fetchAnalystJob,
  listAnalystJobs,
  type AnalysisJobStatus,
  type AnalystJob,
} from '@/lib/analyst-jobs'

const POLL_INTERVAL_MS = 3000

function statusVariant(status: AnalysisJobStatus): 'neutral' | 'primary' | 'success' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'primary'
  return 'neutral'
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderItem(item: unknown, index: number): ReactNode {
  if (item && typeof item === 'object' && 'key' in (item as Record<string, unknown>)) {
    const record = item as { key?: unknown; value?: unknown }
    return (
      <li key={`kv-${index}`} className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
        <span className="text-content-secondary">{String(record.key ?? 'item')}</span>
        <span className="text-right text-content-primary">{String(record.value ?? '—')}</span>
      </li>
    )
  }
  return (
    <li key={`raw-${index}`} className="border-b border-border py-2 text-content-primary last:border-b-0">
      {typeof item === 'string' ? item : JSON.stringify(item)}
    </li>
  )
}

export default function AnalystPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [region, setRegion] = useState('us')
  const [exchange, setExchange] = useState('')
  const [analysisType] = useState<'ticker_snapshot'>('ticker_snapshot')

  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<AnalystJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<AnalystJob[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshRecent = useCallback(async () => {
    const payload = await listAnalystJobs({ limit: 25 })
    setRecentJobs(Array.isArray(payload.jobs) ? payload.jobs : [])
  }, [])

  const refreshCurrent = useCallback(
    async (jobId: string) => {
      setLoadingCurrent(true)
      try {
        const payload = await fetchAnalystJob(jobId)
        setCurrentJob(payload)
        setCurrentJobId(payload.job_id)
      } finally {
        setLoadingCurrent(false)
      }
    },
    []
  )

  const activeStatus = currentJob?.status || null
  const isPolling = activeStatus === 'queued' || activeStatus === 'running'

  useEffect(() => {
    void refreshRecent().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load recent analyses.')
    })
  }, [refreshRecent])

  useEffect(() => {
    if (!currentJobId || !isPolling) return
    const timer = setInterval(() => {
      void refreshCurrent(currentJobId)
        .then(() => refreshRecent())
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'Polling failed.')
        })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [currentJobId, isPolling, refreshCurrent, refreshRecent])

  const recentJobRows = useMemo(() => recentJobs.slice(0, 20), [recentJobs])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedTicker = ticker.trim().toUpperCase()
    if (!normalizedTicker) {
      setErrorMessage('Ticker is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await createAnalystJob({
        ticker: normalizedTicker,
        region,
        exchange: exchange.trim() || null,
        analysis_type: analysisType,
      })
      setCurrentJobId(created.job_id)
      await refreshCurrent(created.job_id)
      await refreshRecent()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create analysis job.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openFromHistory = async (jobId: string) => {
    setErrorMessage(null)
    try {
      await refreshCurrent(jobId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open analysis job.')
    }
  }

  return (
    <div className="container-lg section-gap">
      <PageHeader
        title="Analyst"
        subtitle="Submit ticker_snapshot jobs, track execution, and reopen persisted reports."
      />

      <Card className="section-gap surface-primary">
        <h2 className="text-card-title text-content-primary">Request Analysis</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-caption text-content-muted">Ticker</label>
            <Input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="AAPL" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-content-muted">Region (optional)</label>
            <Select value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="us">us</option>
              <option value="eu">eu</option>
              <option value="apac">apac</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-content-muted">Exchange (optional)</label>
            <Input value={exchange} onChange={(event) => setExchange(event.target.value)} placeholder="NASDAQ" />
          </div>
          <div>
            <label className="mb-1 block text-caption text-content-muted">Analysis Type</label>
            <Select value={analysisType} disabled>
              <option value="ticker_snapshot">ticker_snapshot</option>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={isSubmitting || loadingCurrent}>
              {isSubmitting ? 'Submitting…' : 'Submit Job'}
            </Button>
          </div>
        </form>
        {errorMessage ? <p className="text-body-sm signal-bearish">{errorMessage}</p> : null}
      </Card>

      <Card className="section-gap surface-primary">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-card-title text-content-primary">Current Job</h2>
          {currentJob?.status ? <Badge variant={statusVariant(currentJob.status)}>{currentJob.status}</Badge> : null}
        </div>

        {currentJob ? (
          <div className="grid gap-2 text-body-sm text-content-secondary md:grid-cols-2">
            <div>Job ID: <span className="numeric-tabular text-content-primary">{currentJob.job_id}</span></div>
            <div>Ticker: <span className="text-content-primary">{currentJob.ticker}</span></div>
            <div>Analysis: <span className="text-content-primary">{currentJob.analysis_type}</span></div>
            <div>Created: <span className="text-content-primary">{formatDateTime(currentJob.created_at)}</span></div>
            <div>Started: <span className="text-content-primary">{formatDateTime(currentJob.started_at)}</span></div>
            <div>Finished: <span className="text-content-primary">{formatDateTime(currentJob.finished_at)}</span></div>
            <div>Worker Job: <span className="numeric-tabular text-content-primary">{currentJob.worker_job_id || '—'}</span></div>
            <div>
              Current Step:{' '}
              <span className="text-content-primary">
                {currentJob.status === 'queued' ? 'queued' : currentJob.status === 'running' ? 'running' : 'done'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-body text-content-secondary">Submit an analysis job to see status and result here.</p>
        )}

        {currentJob?.error_message ? (
          <p className="text-body-sm signal-bearish">Failure reason: {currentJob.error_message}</p>
        ) : null}
      </Card>

      <Card className="section-gap surface-primary">
        <h2 className="text-card-title text-content-primary">Result</h2>
        {currentJob?.result ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-label-lg text-content-primary">Summary</h3>
              <p className="mt-1 text-body-sm text-content-secondary">{currentJob.result.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {currentJob.result.sections.map((section) => (
                <div key={section.title} className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-4">
                  <h4 className="text-label-lg text-content-primary">{section.title}</h4>
                  <ul className="mt-2 text-body-sm">
                    {section.items.map((item, index) => renderItem(item, index))}
                  </ul>
                </div>
              ))}
            </div>

            {currentJob.result.warnings.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--bear-200)] bg-[var(--bear-50)] p-4 text-body-sm">
                <h4 className="text-label-lg text-content-primary">Warnings</h4>
                <ul className="mt-2 list-disc pl-5 text-content-secondary">
                  {currentJob.result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="text-caption text-content-muted">
              Generated: {formatDateTime(currentJob.result.metadata.generated_at)} · Source: persisted backend result
            </div>
          </div>
        ) : (
          <p className="text-body text-content-secondary">
            {currentJob && (currentJob.status === 'queued' || currentJob.status === 'running')
              ? 'Waiting for persisted result…'
              : 'No persisted result selected yet.'}
          </p>
        )}
      </Card>

      <Card className="section-gap surface-primary">
        <h2 className="text-card-title text-content-primary">Recent Analyses</h2>
        {recentJobRows.length === 0 ? (
          <p className="text-body text-content-secondary">No prior analysis jobs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-content-muted">
                  <th className="px-2 py-2">Ticker</th>
                  <th className="px-2 py-2">Analysis Type</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Created At</th>
                  <th className="px-2 py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {recentJobRows.map((job) => (
                  <tr key={job.job_id} className="border-b border-border/70">
                    <td className="px-2 py-2 text-content-primary">{job.ticker}</td>
                    <td className="px-2 py-2 text-content-secondary">{job.analysis_type}</td>
                    <td className="px-2 py-2">
                      <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                    </td>
                    <td className="px-2 py-2 text-content-secondary">{formatDateTime(job.created_at)}</td>
                    <td className="px-2 py-2">
                      <Button size="sm" variant="secondary" onClick={() => void openFromHistory(job.job_id)}>
                        Open Result
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
