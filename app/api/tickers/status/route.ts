import { NextResponse } from 'next/server'
import { backendBaseUrl, backendConfigSnapshot, backendHeaders } from '@/lib/backend'

export const runtime = 'nodejs'

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function GET(request: Request) {
  const config = backendConfigSnapshot()
  console.info('[api/tickers/status] config', config)

  try {
    const base = backendBaseUrl()
    if (!base) {
      return NextResponse.json({ status: 'backend_unconfigured' })
    }
    if (!config.hasBackendSharedSecret) {
      return NextResponse.json({ status: 'backend_unconfigured' })
    }

    const { searchParams } = new URL(request.url)
    const ticker = normalizeTicker(searchParams.get('ticker') || '')
    const region = (searchParams.get('region') || 'us').trim().toLowerCase()
    const exchange = (searchParams.get('exchange') || '').trim()

    if (!ticker) {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
    }
    if (!['us', 'eu', 'apac'].includes(region)) {
      return NextResponse.json({ error: 'region must be one of us, eu, apac' }, { status: 400 })
    }

    const upstreamUrl = new URL(`${base}/tickers/status`)
    upstreamUrl.searchParams.set('ticker', ticker)
    upstreamUrl.searchParams.set('region', region)
    if (exchange) upstreamUrl.searchParams.set('exchange', exchange)

    const upstream = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: backendHeaders(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })

    console.info('[api/tickers/status] upstream status', { status: upstream.status })

    if (upstream.status === 404 || upstream.status === 405) {
      return NextResponse.json({ status: 'unsupported_by_backend' })
    }

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json'
    if (!upstream.ok) {
      return NextResponse.json({ status: 'backend_unavailable' })
    }

    return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
  } catch (error) {
    console.error('[api/tickers/status] proxy failed', {
      hasBackendBaseUrl: config.hasBackendBaseUrl,
      hasBackendSharedSecret: config.hasBackendSharedSecret,
      message: error instanceof Error ? error.message : 'Unknown proxy error',
    })
    return NextResponse.json({ status: 'backend_unreachable' })
  }
}
