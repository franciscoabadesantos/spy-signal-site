import { NextRequest, NextResponse } from 'next/server'
import { getRelationshipAtlasNeighborhood, type AtlasView } from '@/lib/network'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VIEWS = new Set<AtlasView>(['market', 'residual', 'timing', 'theme'])
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,20}$/

function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await params
  const ticker = decodeURIComponent(rawTicker || '').trim().toUpperCase()
  const requestedView = request.nextUrl.searchParams.get('view') as AtlasView | null
  const view = requestedView && VIEWS.has(requestedView) ? requestedView : 'market'
  const window = boundedInteger(request.nextUrl.searchParams.get('window'), 252, 2, 5000)
  const limit = boundedInteger(request.nextUrl.searchParams.get('limit'), 28, 4, 80)
  if (!TICKER_PATTERN.test(ticker)) {
    return NextResponse.json({ error: 'A valid ticker is required.' }, { status: 400 })
  }
  try {
    const detail = await getRelationshipAtlasNeighborhood(ticker, { window, view, limit })
    return NextResponse.json(detail, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'This ticker neighborhood is temporarily unavailable.' }, { status: 502 })
  }
}
