import { NextResponse } from 'next/server'

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(): HeadersInit {
  const headers: Record<string, string> = {}
  const secret = (process.env.FINANCE_BACKEND_SHARED_SECRET || '').trim()
  if (secret) headers['x-shared-secret'] = secret
  return headers
}

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const base = backendBaseUrl()
  if (!base) {
    return NextResponse.json({ error: 'FINANCE_BACKEND_URL is not configured.' }, { status: 500 })
  }

  const params = await context.params
  const jobId = String(params.jobId || '').trim()
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const upstream = await fetch(`${base}/analyst/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: backendHeaders(),
    cache: 'no-store',
  })

  const text = await upstream.text()
  const contentType = upstream.headers.get('content-type') || 'application/json'
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': contentType } })
}
