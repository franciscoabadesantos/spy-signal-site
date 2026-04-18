'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCcw, XCircle } from 'lucide-react'
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
  type AnalysisType,
  type AnalysisJobStatus,
  type AnalystJob,
} from '@/lib/analyst-jobs'

const POLL_INTERVAL_MS = 3000
const QUEUED_STUCK_MINUTES = 10
const RUNNING_STUCK_MINUTES = 20

type StatusMeta = {
  label: string
  variant: 'neutral' | 'primary' | 'success' | 'danger'
}

type StuckInfo = {
  isStuck: boolean
  message: string | null
}

function statusMeta(status: AnalysisJobStatus): StatusMeta {
  if (status === 'completed') return { label: 'Completed', variant: 'success' }
  if (status === 'failed') return { label: 'Failed', variant: 'danger' }
  if (status === 'running') return { label: 'Running', variant: 'primary' }
  return { label: 'Queued', variant: 'neutral' }
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

function minutesSince(value: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  const diffMs = Date.now() - parsed
  if (diffMs < 0) return 0
  return Math.floor(diffMs / 60000)
}

function stuckInfo(job: AnalystJob | null): StuckInfo {
  if (!job) return { isStuck: false, message: null }

  if (job.status === 'queued') {
    const age = minutesSince(job.created_at)
    if (age !== null && age >= QUEUED_STUCK_MINUTES) {
      return {
        isStuck: true,
        message: `Queued for ${age}m. This may be delayed.`,
      }
    }
  }

  if (job.status === 'running') {
    const age = minutesSince(job.started_at || job.created_at)
    if (age !== null && age >= RUNNING_STUCK_MINUTES) {
      return {
        isStuck: true,
        message: `Running for ${age}m. This may be stuck.`,
      }
    }
  }

  return { isStuck: false, message: null }
}

function renderItem(item: unknown, index: number): ReactNode {
  if (item && typeof item === 'object' && 'key' in (item as Record<string, unknown>)) {
    const record = item as { key?: unknown; value?: unknown }
    return (
      <li
        key={`kv-${index}`}
        className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0"
      >
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
  const [analysisType, setAnalysisType] = useState<AnalysisType>('ticker_snapshot')

  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<AnalystJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<AnalystJob[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshingCurrent, setIsRefreshingCurrent] = useState(false)
  const [isRetryingJobId, setIsRetryingJobId] = useState<string | null>(null)
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultActionMessage, setResultActionMessage] = useState<string | null>(null)
  const [historyTickerFilter, setHistoryTickerFilter] = useState('')
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | AnalysisType>('all')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | AnalysisJobStatus>('all')
  const [latestOnly, setLatestOnly] = useState(true)

  const refreshRecent = useCallback(async () => {
    const payload = await listAnalystJobs({ limit: 200 })
    setRecentJobs(Array.isArray(payload.jobs) ? payload.jobs : [])
  }, [])

  const refreshCurrent = useCallback(async (jobId: string) => {
    setIsRefreshingCurrent(true)
    try {
      const payload = await fetchAnalystJob(jobId)
      setCurrentJob(payload)
      setCurrentJobId(payload.job_id)
      setLastPolledAt(new Date().toISOString())
    } finally {
      setIsRefreshingCurrent(false)
    }
  }, [])

  const activeStatus = currentJob?.status || null
  const isPolling = activeStatus === 'queued' || activeStatus === 'running'
  const currentStatusMeta = currentJob ? statusMeta(currentJob.status) : null
  const currentStuckInfo = stuckInfo(currentJob)

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

  const recentJobRows = useMemo(() => {
    const tickerFilter = historyTickerFilter.trim().toUpperCase()
    const byCreatedDesc = [...recentJobs].sort((left, right) => {
      const leftTs = Date.parse(left.created_at || '') || 0
      const rightTs = Date.parse(right.created_at || '') || 0
      return rightTs - leftTs
    })

    let filtered = byCreatedDesc
    if (tickerFilter) {
      filtered = filtered.filter((job) => String(job.ticker || '').toUpperCase().includes(tickerFilter))
    }
    if (historyTypeFilter !== 'all') {
      filtered = filtered.filter((job) => job.analysis_type === historyTypeFilter)
    }
    if (historyStatusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === historyStatusFilter)
    }
    if (latestOnly) {
      const latestByKey = new Map<string, AnalystJob>()
      for (const job of filtered) {
        const key = `${job.ticker}|${job.analysis_type}`
        if (!latestByKey.has(key)) {
          latestByKey.set(key, job)
        }
      }
      filtered = Array.from(latestByKey.values())
    }
    return filtered.slice(0, 50)
  }, [historyStatusFilter, historyTickerFilter, historyTypeFilter, latestOnly, recentJobs])
  const operatorStats = useMemo(() => {
    const stats = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      snapshot: 0,
      coverage: 0,
    }
    for (const job of recentJobRows) {
      stats[job.status] += 1
      if (job.analysis_type === 'coverage_report') {
        stats.coverage += 1
      } else {
        stats.snapshot += 1
      }
      if (stuckInfo(job).isStuck) stats.delayed += 1
    }
    return stats
  }, [recentJobRows])

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

  const retryJob = async (job: AnalystJob) => {
    setErrorMessage(null)
    setIsRetryingJobId(job.job_id)
    try {
      const created = await createAnalystJob({
        ticker: job.ticker,
        region: job.region ?? 'us',
        exchange: job.exchange,
        analysis_type: job.analysis_type,
      })
      setCurrentJobId(created.job_id)
      await refreshCurrent(created.job_id)
      await refreshRecent()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to retry analysis job.')
    } finally {
      setIsRetryingJobId(null)
    }
  }

  const handleCopySummary = async () => {
    const summary = currentJob?.result?.summary
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setResultActionMessage('Summary copied to clipboard.')
    } catch {
      setResultActionMessage('Failed to copy summary.')
    }
  }

  const handleCopyJson = async () => {
    const payload = currentJob?.result
    if (!payload) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setResultActionMessage('Result JSON copied to clipboard.')
    } catch {
      setResultActionMessage('Failed to copy JSON.')
    }
  }

  const handleExportJson = () => {
    const payload = currentJob?.result
    if (!payload || !currentJob) return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeJobId = currentJob.job_id.replace(/[^a-zA-Z0-9-_]/g, '_')
    anchor.href = href
    anchor.download = `analyst-${safeJobId}-${currentJob.analysis_type}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(href)
    setResultActionMessage('Result exported as JSON.')
  }

  return (
    <div className="container-lg section-gap">
      <PageHeader
        title="Analyst"
        subtitle="Submit ticker_snapshot or coverage_report jobs, track execution, retry failed runs, and reopen persisted reports."
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
            <Select value={analysisType} onChange={(event) => setAnalysisType(event.target.value as AnalysisType)}>
              <option value="ticker_snapshot">ticker_snapshot</option>
              <option value="coverage_report">coverage_report</option>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={isSubmitting || isRefreshingCurrent || isRetryingJobId !== null}>
              {isSubmitting ? 'Submitting…' : 'Submit Job'}
            </Button>
          </div>
        </form>
        {errorMessage ? <p className="text-body-sm signal-bearish">{errorMessage}</p> : null}
      </Card>

      <Card className="section-gap surface-primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title text-content-primary">Operator Snapshot</h2>
          <span className="text-caption text-content-muted">Recent window: {recentJobRows.length} jobs</span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3 text-body-sm">
            <div className="text-content-muted">Queued</div>
            <div className="text-label-lg text-content-primary">{operatorStats.queued}</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3 text-body-sm">
            <div className="text-content-muted">Running</div>
            <div className="text-label-lg text-content-primary">{operatorStats.running}</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3 text-body-sm">
            <div className="text-content-muted">Completed</div>
            <div className="text-label-lg text-content-primary">{operatorStats.completed}</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3 text-body-sm">
            <div className="text-content-muted">Failed</div>
            <div className="text-label-lg text-content-primary">{operatorStats.failed}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-body-sm text-content-secondary">
          <Badge variant={operatorStats.delayed > 0 ? 'warning' : 'neutral'}>Delayed: {operatorStats.delayed}</Badge>
          <Badge variant="neutral">ticker_snapshot: {operatorStats.snapshot}</Badge>
          <Badge variant="neutral">coverage_report: {operatorStats.coverage}</Badge>
        </div>
      </Card>

      <Card className="section-gap surface-primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title text-content-primary">Current Job</h2>
          <div className="flex items-center gap-2">
            {currentStatusMeta ? <Badge variant={currentStatusMeta.variant}>{currentStatusMeta.label}</Badge> : null}
            {currentStuckInfo.isStuck ? <Badge variant="warning">Potentially Stuck</Badge> : null}
          </div>
        </div>

        {currentJob ? (
          <>
            <div className="grid gap-2 text-body-sm text-content-secondary md:grid-cols-2">
              <div>
                Job ID: <span className="numeric-tabular text-content-primary">{currentJob.job_id}</span>
              </div>
              <div>
                Ticker: <span className="text-content-primary">{currentJob.ticker}</span>
              </div>
              <div>
                Region: <span className="text-content-primary">{currentJob.region || '—'}</span>
              </div>
              <div>
                Exchange: <span className="text-content-primary">{currentJob.exchange || '—'}</span>
              </div>
              <div>
                Analysis Type: <span className="text-content-primary">{currentJob.analysis_type}</span>
              </div>
              <div>
                Worker Job: <span className="numeric-tabular text-content-primary">{currentJob.worker_job_id || '—'}</span>
              </div>
              <div>
                Created: <span className="text-content-primary">{formatDateTime(currentJob.created_at)}</span>
              </div>
              <div>
                Started: <span className="text-content-primary">{formatDateTime(currentJob.started_at)}</span>
              </div>
              <div>
                Finished: <span className="text-content-primary">{formatDateTime(currentJob.finished_at)}</span>
              </div>
              <div>
                Polling: <span className="text-content-primary">{isPolling ? `every ${POLL_INTERVAL_MS / 1000}s` : 'stopped'}</span>
              </div>
            </div>

            {isPolling ? (
              <div className="flex items-center gap-2 text-body-sm text-content-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Polling for updates. Last check: {formatDateTime(lastPolledAt)}
              </div>
            ) : null}

            {currentStuckInfo.message ? (
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--warn-200)] bg-[var(--warn-50)] p-3 text-body-sm text-content-primary">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{currentStuckInfo.message}</span>
              </div>
            ) : null}

            {currentJob.status === 'failed' ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--bear-200)] bg-[var(--bear-50)] p-4 text-body-sm">
                <div className="flex items-center gap-2 text-content-primary">
                  <XCircle className="h-4 w-4" />
                  Failed job details
                </div>
                <p className="signal-bearish">{currentJob.error_message || 'No failure reason provided.'}</p>
                <div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isRetryingJobId !== null}
                    onClick={() => void retryJob(currentJob)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      {isRetryingJobId === currentJob.job_id ? 'Retrying…' : 'Retry Failed Job'}
                    </span>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-body text-content-secondary">Submit an analysis job to see status and result here.</p>
        )}
      </Card>

      <Card className="section-gap surface-primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title text-content-primary">Result</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={!currentJob?.result} onClick={() => void handleCopySummary()}>
              Copy Summary
            </Button>
            <Button size="sm" variant="secondary" disabled={!currentJob?.result} onClick={() => void handleCopyJson()}>
              Copy JSON
            </Button>
            <Button size="sm" variant="secondary" disabled={!currentJob?.result} onClick={handleExportJson}>
              Export JSON
            </Button>
          </div>
        </div>
        {resultActionMessage ? <p className="text-caption text-content-muted">{resultActionMessage}</p> : null}
        {currentJob?.result ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary/10 p-4">
              <h3 className="text-label-lg text-content-primary">Summary</h3>
              <p className="mt-1 text-body-sm text-content-primary">{currentJob.result.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {currentJob.result.sections.map((section) => (
                <div key={section.title} className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-4">
                  <h4 className="text-label-lg text-content-primary">{section.title}</h4>
                  <ul className="mt-2 text-body-sm">{section.items.map((item, index) => renderItem(item, index))}</ul>
                </div>
              ))}
            </div>

            {currentJob.result.warnings.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--warn-200)] bg-[var(--warn-50)] p-4 text-body-sm">
                <h4 className="inline-flex items-center gap-1 text-label-lg text-content-primary">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h4>
                <ul className="mt-2 list-disc pl-5 text-content-secondary">
                  {currentJob.result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3">
              <div className="mb-2 text-caption text-content-muted">Metadata</div>
              <div className="flex flex-wrap gap-2 text-body-sm">
                <span className="rounded-full border border-border bg-surface-card px-2 py-0.5">Ticker: {currentJob.result.metadata.ticker}</span>
                <span className="rounded-full border border-border bg-surface-card px-2 py-0.5">Region: {currentJob.result.metadata.region}</span>
                <span className="rounded-full border border-border bg-surface-card px-2 py-0.5">Exchange: {currentJob.result.metadata.exchange || '—'}</span>
                <span className="rounded-full border border-border bg-surface-card px-2 py-0.5">Type: {currentJob.result.metadata.analysis_type}</span>
                <span className="rounded-full border border-border bg-surface-card px-2 py-0.5">Generated: {formatDateTime(currentJob.result.metadata.generated_at)}</span>
              </div>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title text-content-primary">Recent Analyses</h2>
          <label className="inline-flex items-center gap-2 text-body-sm text-content-secondary">
            <input
              type="checkbox"
              checked={latestOnly}
              onChange={(event) => setLatestOnly(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Latest only
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-caption text-content-muted">Filter ticker</label>
            <Input
              value={historyTickerFilter}
              onChange={(event) => setHistoryTickerFilter(event.target.value)}
              placeholder="AAPL"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption text-content-muted">Filter analysis type</label>
            <Select value={historyTypeFilter} onChange={(event) => setHistoryTypeFilter(event.target.value as 'all' | AnalysisType)}>
              <option value="all">all</option>
              <option value="ticker_snapshot">ticker_snapshot</option>
              <option value="coverage_report">coverage_report</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-caption text-content-muted">Filter status</label>
            <Select
              value={historyStatusFilter}
              onChange={(event) => setHistoryStatusFilter(event.target.value as 'all' | AnalysisJobStatus)}
            >
              <option value="all">all</option>
              <option value="queued">queued</option>
              <option value="running">running</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </Select>
          </div>
          <div className="flex items-end text-body-sm text-content-secondary">
            Showing {recentJobRows.length} job{recentJobRows.length === 1 ? '' : 's'} from {recentJobs.length}
          </div>
        </div>
        {recentJobRows.length === 0 ? (
          <p className="text-body text-content-secondary">No prior analysis jobs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-content-muted">
                  <th className="px-2 py-2">Ticker</th>
                  <th className="px-2 py-2">Analysis Type</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentJobRows.map((job) => {
                  const meta = statusMeta(job.status)
                  const stuck = stuckInfo(job)
                  return (
                    <tr key={job.job_id} className={job.status === 'failed' ? 'border-b border-[var(--bear-200)] bg-[var(--bear-50)]/40' : 'border-b border-border/70'}>
                      <td className="px-2 py-2 text-content-primary">
                        <div>{job.ticker}</div>
                        <div className="text-caption text-content-muted">
                          {job.region || '—'} / {job.exchange || '—'}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-content-secondary">{job.analysis_type}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {stuck.isStuck ? <Badge variant="warning">Delayed</Badge> : null}
                        </div>
                        {job.status === 'failed' ? (
                          <div className="mt-1 max-w-[360px] text-caption signal-bearish">{job.error_message || 'No failure reason provided.'}</div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 text-content-secondary">{formatDateTime(job.created_at)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => void openFromHistory(job.job_id)}>
                            Open Result
                          </Button>
                          {job.status === 'failed' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={isRetryingJobId !== null}
                              onClick={() => void retryJob(job)}
                            >
                              {isRetryingJobId === job.job_id ? 'Retrying…' : 'Retry'}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="surface-secondary">
        <div className="flex items-center gap-2 text-body-sm text-content-secondary">
          {isPolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>
            {isPolling
              ? `Polling active every ${POLL_INTERVAL_MS / 1000}s. Last check: ${formatDateTime(lastPolledAt)}`
              : `Polling idle. Last check: ${formatDateTime(lastPolledAt)}`}
          </span>
          <Clock3 className="ml-1 h-4 w-4" />
        </div>
      </Card>
    </div>
  )
}
