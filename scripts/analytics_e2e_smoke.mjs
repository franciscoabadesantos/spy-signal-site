#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sessionId = `sess_e2e_${Date.now().toString(36)}`
const anonymousId = `anon_e2e_${Math.random().toString(36).slice(2, 10)}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const events = [
  { event_name: 'view_homepage', payload: {}, pathname: '/' },
  { event_name: 'click_sample_model', payload: { source: 'hero_secondary_cta' }, pathname: '/' },
  {
    event_name: 'view_model',
    payload: { model_id: 'sample-trend-follower', is_sample: true, entry_source: 'homepage_sample' },
    pathname: '/models/sample-trend-follower',
  },
  {
    event_name: 'run_validation',
    payload: { model_id: 'sample-trend-follower', is_sample: true, condition_count: 3, has_changes: false },
    pathname: '/models/sample-trend-follower',
  },
  {
    event_name: 'click_compare',
    payload: {
      model_id: 'sample-trend-follower',
      compare_to_model_id: 'sample-trend-follower',
      source: 'model_header_compare',
    },
    pathname: '/models/sample-trend-follower',
  },
  {
    event_name: 'complete_compare',
    payload: { left_model_id: 'sample-trend-follower', right_model_id: 'sample-trend-follower' },
    pathname: '/models/compare',
  },
]

for (const event of events) {
  const occurredAt = new Date().toISOString()
  const response = await fetch(`${appUrl}/api/analytics/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...event,
      occurred_at: occurredAt,
      referrer: 'https://example.test',
      session_id: sessionId,
      anonymous_id: anonymousId,
    }),
  })
  const body = await response.json().catch(() => ({}))
  console.log(`[${event.event_name}] status=${response.status} ok=${response.ok} body=${JSON.stringify(body)}`)
  await sleep(12)
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await client
  .from('analytics_events')
  .select('id,event_name,pathname,session_id,anonymous_id,occurred_at')
  .eq('session_id', sessionId)
  .order('occurred_at', { ascending: true })

if (error) {
  console.error('[analytics_events query failed]', error.message)
  process.exit(1)
}

console.log(`Stored rows: ${data?.length ?? 0}`)
for (const row of data ?? []) {
  console.log(
    `${row.id} | ${row.event_name} | ${row.pathname} | ${row.session_id} | ${row.anonymous_id} | ${row.occurred_at}`
  )
}
