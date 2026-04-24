type SignalDirection = 'bullish' | 'neutral' | 'bearish'
type ResearchRunStatus = 'started' | 'completed' | 'failed'

type CreateAiResearchRunInput = {
  userId: string | null
  ticker: string
  promptLabel: string | null
  question: string | null
  signal: {
    direction: SignalDirection
    conviction: number | null
    predictionHorizon: number | null
    signalDate: string | null
  }
}

type FinalizeAiResearchRunInput = {
  runId: number
  status: 'completed' | 'failed'
  provider: string | null
  model: string | null
  responseExcerpt?: string | null
  citations?: string[]
  errorMessage?: string | null
}

type RecordAiResearchFeedbackInput = {
  runId: number | null
  userId: string | null
  ticker: string
  category: string
  note: string | null
}

type GetRecentAiResearchRunsInput = {
  userId: string | null
  ticker?: string | null
  limit?: number
}

type GetAiResearchRunByIdInput = {
  userId: string | null
  runId: number
}

export type AiResearchRun = {
  id: number
  userId: string | null
  ticker: string
  promptLabel: string | null
  question: string | null
  signalDirection: SignalDirection
  conviction: number | null
  predictionHorizon: number | null
  signalDate: string | null
  provider: string | null
  model: string | null
  status: ResearchRunStatus
  responseExcerpt: string | null
  citations: string[]
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  }
  const secret = (
    process.env.BACKEND_SHARED_SECRET ||
    process.env.FINANCE_BACKEND_SHARED_SECRET ||
    ''
  ).trim()
  if (secret) headers['x-backend-shared-secret'] = secret
  return headers
}

async function backendJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = backendBaseUrl()
  if (!base) return null
  const response = await fetch(`${base}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...backendHeaders(),
      ...(init?.headers ?? {}),
    },
  }).catch(() => null)
  if (!response || !response.ok) return null
  return (await response.json().catch(() => null)) as T | null
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export async function createAiResearchRun(input: CreateAiResearchRunInput): Promise<number | null> {
  const payload = await backendJson<{ runId?: number | null }>('/site/ai-research/runs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return typeof payload?.runId === 'number' ? payload.runId : null
}

export async function finalizeAiResearchRun(input: FinalizeAiResearchRunInput): Promise<void> {
  await backendJson(`/site/ai-research/runs/${input.runId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function recordAiResearchFeedback(
  input: RecordAiResearchFeedbackInput
): Promise<{ ok: boolean; error?: string }> {
  const payload = await backendJson<{ ok?: boolean; error?: string }>('/site/ai-research/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!payload?.ok) return { ok: false, error: payload?.error || 'Failed to record feedback.' }
  return { ok: true }
}

export async function getRecentAiResearchRuns(
  input: GetRecentAiResearchRunsInput
): Promise<AiResearchRun[]> {
  if (!input.userId) return []
  const params = new URLSearchParams()
  params.set('user_id', input.userId)
  if (input.ticker) params.set('ticker', normalizeTicker(input.ticker))
  params.set('limit', String(Math.max(1, Math.min(input.limit ?? 5, 20))))
  const payload = await backendJson<{ runs?: AiResearchRun[] }>(`/site/ai-research/runs?${params.toString()}`)
  return Array.isArray(payload?.runs) ? payload!.runs : []
}

export async function getAiResearchRunById(
  input: GetAiResearchRunByIdInput
): Promise<AiResearchRun | null> {
  if (!input.userId) return null
  const payload = await backendJson<{ run?: AiResearchRun | null }>(
    `/site/ai-research/runs/${input.runId}?user_id=${encodeURIComponent(input.userId)}`
  )
  return payload?.run ?? null
}
