import { NextResponse } from 'next/server'

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  const secret = (
    process.env.BACKEND_SHARED_SECRET
    || process.env.FINANCE_BACKEND_SHARED_SECRET
    || ''
  ).trim()
  if (secret) headers['x-backend-shared-secret'] = secret
  return headers
}

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function POST(request: Request) {
  const base = backendBaseUrl()
  if (!base) {
    return NextResponse.json({ error: 'FINANCE_BACKEND_URL is not configured.' }, { status: 500 })
  }

  const body = (await request.json().catch(() => null)) as
    | { ticker?: string; region?: string; exchange?: string | null }
    | null
  const ticker = normalizeTicker(body?.ticker || '')
  const region = (body?.region || 'us').trim().toLowerCase()
  const exchange = (body?.exchange || '').trim() || undefined

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
  }
  if (!['us', 'eu', 'apac'].includes(region)) {
    return NextResponse.json({ error: 'region must be one of us, eu, apac' }, { status: 400 })
  }

  const upstream = await fetch(`${base}/tickers/request`, {
    method: 'POST',
    headers: backendHeaders(),
    body: JSON.stringify({
      ticker,
      region,
      exchange,
    }),
    cache: 'no-store',
  })

  const text = await upstream.text()
  const contentType = upstream.headers.get('content-type') || 'application/json'
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
}
