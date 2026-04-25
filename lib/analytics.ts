'use client'

export type AnalyticsEventName =
  | 'view_homepage'
  | 'view_pricing'
  | 'view_about'
  | 'click_sample_model'
  | 'view_stock'
  | 'click_stock_from_screener'
  | 'view_model'
  | 'click_modify_model'
  | 'run_validation'
  | 'create_model'
  | 'apply_template'
  | 'click_compare'
  | 'complete_compare'
  | 'use_screener'
  | 'apply_bias_filter'

type AnalyticsPayloadValue = string | number | boolean | null | undefined
export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>

type AnalyticsEnvelope = {
  event_name: AnalyticsEventName
  payload: AnalyticsPayload
  occurred_at: string
  timestamp: string
  pathname: string
  referrer: string | null
  session_id: string
  anonymous_id: string
}

declare global {
  interface Window {
    __spySignalAnalyticsQueue?: AnalyticsEnvelope[]
  }
}

const ANON_KEY = 'spy_signal_analytics_anon_v1'
const SESSION_KEY = 'spy_signal_analytics_session_v1'
const DEBUG_KEY = 'spy_signal_analytics_debug'

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function getOrCreateStorageId(key: string, prefix: string): string {
  try {
    const existing = window.localStorage.getItem(key)
    if (existing && existing.length > 0) return existing
    const created = makeId(prefix)
    window.localStorage.setItem(key, created)
    return created
  } catch {
    return makeId(prefix)
  }
}

function buildEnvelope(eventName: AnalyticsEventName, payload: AnalyticsPayload): AnalyticsEnvelope {
  const timestamp = new Date().toISOString()
  return {
    event_name: eventName,
    payload,
    occurred_at: timestamp,
    timestamp,
    pathname: window.location.pathname,
    referrer: document.referrer || null,
    session_id: getOrCreateStorageId(SESSION_KEY, 'sess'),
    anonymous_id: getOrCreateStorageId(ANON_KEY, 'anon'),
  }
}

function analyticsDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const debugParam = new URL(window.location.href).searchParams.get('analytics_debug')
    if (debugParam === '1') {
      window.localStorage.setItem(DEBUG_KEY, '1')
      return true
    }
    if (debugParam === '0') {
      window.localStorage.removeItem(DEBUG_KEY)
    }
  } catch {
    // Ignore URL parsing failures.
  }

  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1') return true

  try {
    const stored = window.localStorage.getItem(DEBUG_KEY)
    return stored === '1' || stored === 'true'
  } catch {
    return false
  }
}

export function trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return

  const envelope = buildEnvelope(eventName, payload)
  if (analyticsDebugEnabled()) {
    console.info('[analytics:event]', envelope)
  }

  window.__spySignalAnalyticsQueue = window.__spySignalAnalyticsQueue ?? []
  window.__spySignalAnalyticsQueue.push(envelope)

  const body = JSON.stringify(envelope)
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/event', blob)
      return
    }
  } catch {
    // Fall through to fetch keepalive.
  }

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Avoid surfacing analytics failures to product flows.
  })
}
