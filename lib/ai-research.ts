import { fetchBackendJson } from './backend'

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

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export async function createAiResearchRun(input: CreateAiResearchRunInput): Promise<number | null> {
  const payload = await fetchBackendJson<{ runId?: number | null }>('/site/ai-research/runs', {
    context: 'backend.site.ai_research.create',
    init: {
      method: 'POST',
      body: JSON.stringify(input),
    },
  })
  return typeof payload?.runId === 'number' ? payload.runId : null
}

export async function finalizeAiResearchRun(input: FinalizeAiResearchRunInput): Promise<void> {
  await fetchBackendJson(`/site/ai-research/runs/${input.runId}`, {
    context: 'backend.site.ai_research.finalize',
    allowEmptyBody: true,
    init: {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  })
}

export async function recordAiResearchFeedback(
  input: RecordAiResearchFeedbackInput
): Promise<{ ok: boolean; error?: string }> {
  const payload = await fetchBackendJson<{ ok?: boolean; error?: string }>('/site/ai-research/feedback', {
    context: 'backend.site.ai_research.feedback',
    init: {
      method: 'POST',
      body: JSON.stringify(input),
    },
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
  const payload = await fetchBackendJson<{ runs?: AiResearchRun[] }>(`/site/ai-research/runs?${params.toString()}`, {
    context: 'backend.site.ai_research.recent_runs',
  })
  return Array.isArray(payload?.runs) ? payload!.runs : []
}

export async function getAiResearchRunById(
  input: GetAiResearchRunByIdInput
): Promise<AiResearchRun | null> {
  if (!input.userId) return null
  const payload = await fetchBackendJson<{ run?: AiResearchRun | null }>(
    `/site/ai-research/runs/${input.runId}?user_id=${encodeURIComponent(input.userId)}`,
    { context: 'backend.site.ai_research.run_detail' }
  )
  return payload?.run ?? null
}
