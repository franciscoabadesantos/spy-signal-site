export type AnalysisType = 'ticker_snapshot' | 'coverage_report'
export type AnalysisJobStatus = 'queued' | 'running' | 'completed' | 'failed'

export type AnalystResultSection = {
  title: string
  items: Array<{ key?: string; value?: unknown } | unknown>
}

export type AnalystResultPayload = {
  summary: string
  sections: AnalystResultSection[]
  warnings: string[]
  metadata: {
    ticker: string
    region: string
    exchange: string | null
    analysis_type: AnalysisType
    generated_at: string
  }
}

export type AnalystJob = {
  job_id: string
  status: AnalysisJobStatus
  ticker: string
  region: string | null
  exchange: string | null
  analysis_type: AnalysisType
  created_at: string | null
  started_at: string | null
  finished_at: string | null
  error_message: string | null
  worker_job_id: string | null
  result: AnalystResultPayload | null
}

export type CreateAnalystJobInput = {
  ticker: string
  region?: string | null
  exchange?: string | null
  analysis_type?: AnalysisType
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function createAnalystJob(input: CreateAnalystJobInput): Promise<AnalystJob> {
  const response = await fetch('/api/analyst/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ticker: input.ticker,
      region: input.region ?? 'us',
      exchange: input.exchange ?? null,
      analysis_type: input.analysis_type ?? 'ticker_snapshot',
    }),
  })
  if (!response.ok) {
    const payload = await parseJsonSafe<{ error?: string; detail?: string }>(response)
    throw new Error(payload?.detail || payload?.error || `Create analysis job failed (${response.status})`)
  }
  return (await response.json()) as AnalystJob
}

export async function fetchAnalystJob(jobId: string): Promise<AnalystJob> {
  const response = await fetch(`/api/analyst/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    const payload = await parseJsonSafe<{ error?: string; detail?: string }>(response)
    throw new Error(payload?.detail || payload?.error || `Get analysis job failed (${response.status})`)
  }
  return (await response.json()) as AnalystJob
}

export async function listAnalystJobs(params?: {
  ticker?: string
  limit?: number
}): Promise<{ jobs: AnalystJob[] }> {
  const query = new URLSearchParams()
  if (params?.ticker) query.set('ticker', params.ticker.trim().toUpperCase())
  query.set('limit', String(params?.limit ?? 25))

  const response = await fetch(`/api/analyst/jobs?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    const payload = await parseJsonSafe<{ error?: string; detail?: string }>(response)
    throw new Error(payload?.detail || payload?.error || `List analysis jobs failed (${response.status})`)
  }
  return (await response.json()) as { jobs: AnalystJob[] }
}
