import { NextResponse } from 'next/server'

type AnalyticsEventBody = {
  event_name?: string
  payload?: Record<string, unknown>
  occurred_at?: string
  timestamp?: string
  pathname?: string
  referrer?: string | null
  session_id?: string
  anonymous_id?: string
}

type AnalyticsInsertRow = {
  id?: number
  event_name: string
  payload: Record<string, unknown>
  occurred_at: string
  pathname: string
  referrer: string | null
  session_id: string
  anonymous_id: string
  user_agent: string | null
}

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function safeIsoTimestamp(value: unknown): string {
  if (typeof value !== 'string') return new Date().toISOString()
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
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

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return String(error)
}

export async function POST(request: Request) {
  let body: AnalyticsEventBody = {}
  try {
    body = (await request.json()) as AnalyticsEventBody
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const eventName = sanitizeString(body.event_name, 'unknown_event')
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
  const occurredAt = safeIsoTimestamp(body.occurred_at ?? body.timestamp)
  const pathname = sanitizeString(body.pathname, '/')
  const referrer = typeof body.referrer === 'string' ? body.referrer : null
  const sessionId = sanitizeString(body.session_id, 'unknown_session')
  const anonymousId = sanitizeString(body.anonymous_id, 'unknown_anon')
  const userAgent = request.headers.get('user-agent')
  const insertPayload: AnalyticsInsertRow = {
    event_name: eventName,
    payload,
    occurred_at: occurredAt,
    pathname,
    referrer,
    session_id: sessionId,
    anonymous_id: anonymousId,
    user_agent: userAgent,
  }

  try {
    const base = backendBaseUrl()
    if (!base) {
      return NextResponse.json(
        { ok: false, stored: 'none', error: 'finance_backend_url_missing' },
        { status: 500 }
      )
    }
    const upstream = await fetch(`${base}/site/analytics/events`, {
      method: 'POST',
      headers: backendHeaders(),
      body: JSON.stringify(insertPayload),
      cache: 'no-store',
    })
    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
  } catch (error) {
    const detail = errorMessage(error)
    console.error('[analytics] insert failed', {
      event_name: eventName,
      pathname,
      session_id: sessionId,
      error: detail,
    })
    return NextResponse.json(
      { ok: false, stored: 'none', error: 'supabase_insert_exception', detail },
      { status: 500 }
    )
  }
}
