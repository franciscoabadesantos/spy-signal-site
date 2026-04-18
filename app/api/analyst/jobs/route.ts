import { NextResponse } from 'next/server'

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(contentType: boolean): HeadersInit {
  const headers: Record<string, string> = {}
  if (contentType) headers['content-type'] = 'application/json'
  const secret = (process.env.FINANCE_BACKEND_SHARED_SECRET || '').trim()
  if (secret) headers['x-shared-secret'] = secret
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
    | { ticker?: string; region?: string | null; exchange?: string | null; analysis_type?: string }
    | null

  const ticker = normalizeTicker(body?.ticker || '')
  const region = (body?.region || 'us').trim().toLowerCase()
  const exchange = (body?.exchange || '').trim() || undefined
  const analysisType = (body?.analysis_type || 'ticker_snapshot').trim()

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
  }
  if (analysisType !== 'ticker_snapshot') {
    return NextResponse.json({ error: 'analysis_type must be ticker_snapshot' }, { status: 400 })
  }
  if (!['us', 'eu', 'apac'].includes(region)) {
    return NextResponse.json({ error: 'region must be one of us, eu, apac' }, { status: 400 })
  }

  const upstream = await fetch(`${base}/analyst/jobs`, {
    method: 'POST',
    headers: backendHeaders(true),
    body: JSON.stringify({
      ticker,
      region,
      exchange,
      analysis_type: analysisType,
    }),
    cache: 'no-store',
  })

  const text = await upstream.text()
  const contentType = upstream.headers.get('content-type') || 'application/json'
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
}

export async function GET(request: Request) {
  const base = backendBaseUrl()
  if (!base) {
    return NextResponse.json({ error: 'FINANCE_BACKEND_URL is not configured.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const ticker = normalizeTicker(searchParams.get('ticker') || '')
  const limitRaw = searchParams.get('limit') || '25'
  const limit = Math.max(1, Math.min(200, Number.parseInt(limitRaw, 10) || 25))

  const upstreamUrl = new URL(`${base}/analyst/jobs`)
  upstreamUrl.searchParams.set('limit', String(limit))
  if (ticker) upstreamUrl.searchParams.set('ticker', ticker)

  const upstream = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    headers: backendHeaders(false),
    cache: 'no-store',
  })

  const text = await upstream.text()
  const contentType = upstream.headers.get('content-type') || 'application/json'
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
}
