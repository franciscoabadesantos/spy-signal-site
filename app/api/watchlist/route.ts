import { NextResponse } from 'next/server'
import { getViewerUserId } from '@/lib/auth'
import { addTickerToWatchlist, removeTickerFromWatchlist } from '@/lib/watchlist'

function parseTickerFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const ticker = (body as { ticker?: unknown }).ticker
  if (typeof ticker !== 'string') return null
  const normalized = ticker.trim().toUpperCase()
  return normalized || null
}

export async function POST(request: Request) {
  const userId = await getViewerUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const ticker = parseTickerFromBody(payload)
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required.' }, { status: 400 })
  }

  let result
  try {
    result = await addTickerToWatchlist(userId, ticker)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add ticker.' },
      { status: 502 }
    )
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to add ticker.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ticker })
}

export async function DELETE(request: Request) {
  const userId = await getViewerUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const ticker = parseTickerFromBody(payload)
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required.' }, { status: 400 })
  }

  let result
  try {
    result = await removeTickerFromWatchlist(userId, ticker)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove ticker.' },
      { status: 502 }
    )
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to remove ticker.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ticker })
}
