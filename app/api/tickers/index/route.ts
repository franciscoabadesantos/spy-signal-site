import { NextResponse } from 'next/server'
import { backendBaseUrl, backendConfigSnapshot, backendHeaders } from '@/lib/backend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function passthroughHeaders(upstream: Response): Headers {
  const headers = new Headers()
  const etag = upstream.headers.get('etag')
  const cacheControl = upstream.headers.get('cache-control')
  const contentType = upstream.headers.get('content-type')

  if (etag) headers.set('etag', etag)
  if (cacheControl) headers.set('cache-control', cacheControl)
  if (contentType) headers.set('content-type', contentType)

  return headers
}

export async function GET(request: Request) {
  const config = backendConfigSnapshot()

  try {
    const base = backendBaseUrl()
    if (!base || !config.hasBackendSharedSecret) {
      return NextResponse.json({ error: 'backend_unconfigured' }, { status: 503 })
    }

    const ifNoneMatch = request.headers.get('if-none-match')
    const upstream = await fetch(`${base}/tickers/index`, {
      method: 'GET',
      headers: backendHeaders({
        headers: ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : undefined,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })

    if (upstream.status === 304) {
      return new Response(null, {
        status: 304,
        headers: passthroughHeaders(upstream),
      })
    }

    const text = await upstream.text()
    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'backend_unavailable', status: upstream.status },
        { status: 502 }
      )
    }

    return new Response(text, {
      status: upstream.status,
      headers: passthroughHeaders(upstream),
    })
  } catch (error) {
    console.error('[api/tickers/index] proxy failed', {
      hasBackendBaseUrl: config.hasBackendBaseUrl,
      hasBackendSharedSecret: config.hasBackendSharedSecret,
      message: error instanceof Error ? error.message : 'Unknown proxy error',
    })
    return NextResponse.json({ error: 'backend_unreachable' }, { status: 502 })
  }
}
