import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

function getAnalyticsWriteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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
  const client = getAnalyticsWriteClient()

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

  if (!client) {
    console.error('[analytics] insert failed: supabase_write_client_missing', {
      event_name: eventName,
      pathname,
    })
    return NextResponse.json(
      { ok: false, stored: 'none', error: 'supabase_write_client_missing' },
      { status: 500 }
    )
  }

  try {
    const { data, error } = await client
      .from('analytics_events')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      console.error('[analytics] insert failed', {
        event_name: eventName,
        pathname,
        session_id: sessionId,
        error: error.message,
      })
      return NextResponse.json(
        { ok: false, stored: 'none', error: 'supabase_insert_failed', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, stored: 'supabase', id: data?.id ?? null })
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
