import { NextRequest, NextResponse } from 'next/server'
import {
  deriveFallbackAtlas,
  getMarketNetwork,
  getRelationshipAtlasCommunity,
  type AtlasView,
} from '@/lib/network'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VIEWS = new Set<AtlasView>(['market', 'residual', 'timing', 'theme'])

function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId: rawCommunityId } = await params
  const communityId = decodeURIComponent(rawCommunityId || '').trim()
  const requestedView = request.nextUrl.searchParams.get('view') as AtlasView | null
  const view = requestedView && VIEWS.has(requestedView) ? requestedView : 'market'
  const window = boundedInteger(request.nextUrl.searchParams.get('window'), 252, 2, 5000)
  const limit = boundedInteger(request.nextUrl.searchParams.get('limit'), 64, 4, 120)
  if (!communityId || !/^[a-z0-9_-]{3,96}$/i.test(communityId)) {
    return NextResponse.json({ error: 'A valid community id is required.' }, { status: 400 })
  }
  try {
    const detail = await getRelationshipAtlasCommunity(communityId, { window, view, limit })
    return NextResponse.json(detail, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' },
    })
  } catch {
    const legacy = await getMarketNetwork({ window: String(window), minAbsCorrelation: 0.28, topK: 8 }).catch(() => null)
    const detail = legacy ? deriveFallbackAtlas(legacy, view).details[communityId] : null
    if (!detail) return NextResponse.json({ error: 'This market community is temporarily unavailable.' }, { status: 502 })
    return NextResponse.json(detail, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  }
}
