import { NextResponse } from 'next/server'
import { getViewerUserId } from '@/lib/auth'
import { recordAiResearchFeedback } from '@/lib/ai-research'

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asTicker(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  const ticker = raw.toUpperCase()
  if (!/^[A-Z0-9.\-]{1,10}$/.test(ticker)) return null
  return ticker
}

function asRunId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function POST(request: Request) {
  const userId = await getViewerUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const ticker = asTicker(payload.ticker)
  const category = asString(payload.category)
  const note = asString(payload.note)
  const runId = asRunId(payload.runId)

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required.' }, { status: 400 })
  }

  if (!category) {
    return NextResponse.json({ error: 'category is required.' }, { status: 400 })
  }

  const result = await recordAiResearchFeedback({
    runId,
    userId,
    ticker,
    category,
    note,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to record feedback.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
