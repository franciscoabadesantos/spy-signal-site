import { createClient } from '@supabase/supabase-js'

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

let missingTableLogged = false

function getWriteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function isMissingTableError(message: string): boolean {
  return message.toLowerCase().includes('does not exist')
}

function logMissingTableOnce(message: string) {
  if (missingTableLogged) return
  missingTableLogged = true
  console.warn(message)
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeStatus(value: unknown): ResearchRunStatus {
  if (value === 'completed' || value === 'failed' || value === 'started') return value
  return 'started'
}

function parseCitations(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item))
    .filter((item) => item.startsWith('http'))
}

function parseAiResearchRun(row: unknown): AiResearchRun | null {
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>

  const id = asNumber(record.id)
  const ticker = asString(record.ticker)
  const signalDirection = record.signal_direction
  const createdAt = asString(record.created_at)
  if (
    id === null ||
    !ticker ||
    (signalDirection !== 'bullish' && signalDirection !== 'neutral' && signalDirection !== 'bearish') ||
    !createdAt
  ) {
    return null
  }

  return {
    id,
    userId: asString(record.user_id),
    ticker: normalizeTicker(ticker),
    promptLabel: asString(record.prompt_label),
    question: asString(record.question),
    signalDirection,
    conviction: asNumber(record.conviction),
    predictionHorizon: asNumber(record.prediction_horizon),
    signalDate: asString(record.signal_date),
    provider: asString(record.provider),
    model: asString(record.model),
    status: normalizeStatus(record.status),
    responseExcerpt: asString(record.response_excerpt),
    citations: parseCitations(record.citations),
    errorMessage: asString(record.error_message),
    createdAt,
    completedAt: asString(record.completed_at),
  }
}

export async function createAiResearchRun(input: CreateAiResearchRunInput): Promise<number | null> {
  const client = getWriteClient()
  if (!client) return null

  const { data, error } = await client
    .from('ai_research_runs')
    .insert({
      user_id: input.userId,
      ticker: normalizeTicker(input.ticker),
      prompt_label: input.promptLabel,
      question: input.question,
      signal_direction: input.signal.direction,
      conviction: input.signal.conviction,
      prediction_horizon: input.signal.predictionHorizon,
      signal_date: input.signal.signalDate ? input.signal.signalDate.slice(0, 10) : null,
      status: 'started',
    })
    .select('id')
    .limit(1)
    .single()

  if (!error) {
    const runId = typeof data?.id === 'number' ? data.id : Number(data?.id)
    return Number.isFinite(runId) ? runId : null
  }

  if (isMissingTableError(error.message)) {
    logMissingTableOnce('AI research tables were not found. Run supabase/sql/ai_research.sql to enable persistence.')
    return null
  }

  console.warn('Failed to create AI research run:', error.message)
  return null
}

export async function finalizeAiResearchRun(input: FinalizeAiResearchRunInput): Promise<void> {
  const client = getWriteClient()
  if (!client) return

  const { error } = await client
    .from('ai_research_runs')
    .update({
      status: input.status,
      provider: input.provider,
      model: input.model,
      response_excerpt: input.responseExcerpt ?? null,
      citations: input.citations ?? [],
      error_message: input.errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', input.runId)

  if (!error) return
  if (isMissingTableError(error.message)) {
    logMissingTableOnce('AI research tables were not found. Run supabase/sql/ai_research.sql to enable persistence.')
    return
  }

  console.warn('Failed to finalize AI research run:', error.message)
}

export async function recordAiResearchFeedback(
  input: RecordAiResearchFeedbackInput
): Promise<{ ok: boolean; error?: string }> {
  const client = getWriteClient()
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }
  }

  const { error } = await client.from('ai_research_feedback').insert({
    run_id: input.runId,
    user_id: input.userId,
    ticker: normalizeTicker(input.ticker),
    category: input.category,
    note: input.note,
  })

  if (!error) return { ok: true }
  if (isMissingTableError(error.message)) {
    logMissingTableOnce('AI research tables were not found. Run supabase/sql/ai_research.sql to enable persistence.')
    return { ok: false, error: 'AI research tables are not installed yet.' }
  }

  return { ok: false, error: error.message }
}

export async function getRecentAiResearchRuns(
  input: GetRecentAiResearchRunsInput
): Promise<AiResearchRun[]> {
  if (!input.userId) return []

  const client = getWriteClient()
  if (!client) return []

  let query = client
    .from('ai_research_runs')
    .select('*')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(input.limit ?? 5, 20)))

  if (input.ticker) {
    query = query.eq('ticker', normalizeTicker(input.ticker))
  }

  const { data, error } = await query
  if (!error) {
    return (data ?? [])
      .map((row) => parseAiResearchRun(row))
      .filter((row): row is AiResearchRun => row !== null)
  }

  if (isMissingTableError(error.message)) {
    logMissingTableOnce('AI research tables were not found. Run supabase/sql/ai_research.sql to enable persistence.')
    return []
  }

  console.warn('Failed to read AI research runs:', error.message)
  return []
}

export async function getAiResearchRunById(
  input: GetAiResearchRunByIdInput
): Promise<AiResearchRun | null> {
  if (!input.userId) return null

  const client = getWriteClient()
  if (!client) return null

  const { data, error } = await client
    .from('ai_research_runs')
    .select('*')
    .eq('id', input.runId)
    .eq('user_id', input.userId)
    .limit(1)
    .single()

  if (!error) {
    return parseAiResearchRun(data)
  }

  if (isMissingTableError(error.message)) {
    logMissingTableOnce('AI research tables were not found. Run supabase/sql/ai_research.sql to enable persistence.')
    return null
  }

  console.warn('Failed to read AI research run:', error.message)
  return null
}
