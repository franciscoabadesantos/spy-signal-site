import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
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
  const occurredAt = sanitizeString(body.occurred_at ?? body.timestamp, new Date().toISOString())
  const pathname = sanitizeString(body.pathname, '/')
  const referrer = typeof body.referrer === 'string' ? body.referrer : null
  const sessionId = sanitizeString(body.session_id, 'unknown_session')
  const anonymousId = sanitizeString(body.anonymous_id, 'unknown_anon')
  const userAgent = request.headers.get('user-agent')

  const insertPayload = {
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
    const { error } = await supabase.from('analytics_events').insert(insertPayload)
    if (error) {
      console.warn('[analytics] insert failed, falling back to server log:', error.message)
      console.info('[analytics:event]', JSON.stringify(insertPayload))
      return NextResponse.json({ ok: true, stored: 'log' })
    }
    return NextResponse.json({ ok: true, stored: 'supabase' })
  } catch {
    console.info('[analytics:event]', JSON.stringify(insertPayload))
    return NextResponse.json({ ok: true, stored: 'log' })
  }
}
