import { NextResponse } from 'next/server'
import { backendBaseUrl, backendConfigSnapshot, backendHeaders } from '@/lib/backend'

export const runtime = 'nodejs'

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function POST(request: Request) {
  const config = backendConfigSnapshot()
  console.info('[api/tickers/request] config', config)

  try {
    const base = backendBaseUrl()
    if (!base) {
      return NextResponse.json({ error: 'BACKEND_BASE_URL is not configured.' }, { status: 500 })
    }
    if (!config.hasBackendSharedSecret) {
      return NextResponse.json({ error: 'BACKEND_SHARED_SECRET is not configured.' }, { status: 500 })
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
      headers: backendHeaders({ includeContentType: true }),
      body: JSON.stringify({
        ticker,
        region,
        exchange,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })

    console.info('[api/tickers/request] upstream status', { status: upstream.status })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
  } catch (error) {
    console.error('[api/tickers/request] proxy failed', {
      hasBackendBaseUrl: config.hasBackendBaseUrl,
      hasBackendSharedSecret: config.hasBackendSharedSecret,
      message: error instanceof Error ? error.message : 'Unknown proxy error',
    })
    return NextResponse.json(
      {
        error: 'BACKEND_PROXY_FAILED',
        message: 'The site could not reach finance-backend for ticker requests.',
      },
      { status: 502 }
    )
  }
}
