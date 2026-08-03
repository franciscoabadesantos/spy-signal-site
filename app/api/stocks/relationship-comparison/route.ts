import { getHistoricalData } from '@/lib/finance'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,14}$/

function tickerParam(request: NextRequest, key: 'base' | 'peer'): string | null {
  const value = request.nextUrl.searchParams.get(key)?.trim().toUpperCase() ?? ''
  return TICKER_PATTERN.test(value) ? value : null
}

function periodDaysParam(request: NextRequest): number {
  const requested = Number.parseInt(request.nextUrl.searchParams.get('periodDays') ?? '365', 10)
  return Number.isFinite(requested) ? Math.max(90, Math.min(requested, 730)) : 365
}

export async function GET(request: NextRequest) {
  const base = tickerParam(request, 'base')
  const peer = tickerParam(request, 'peer')
  if (!base || !peer || base === peer) {
    return NextResponse.json(
      { error: 'Two different valid ticker symbols are required.' },
      { status: 400 },
    )
  }

  const periodDays = periodDaysParam(request)
  try {
    const [basePoints, peerPoints] = await Promise.all([
      getHistoricalData(base, periodDays),
      getHistoricalData(peer, periodDays),
    ])

    return NextResponse.json(
      {
        base: { ticker: base, points: basePoints },
        peer: { ticker: peer, points: peerPoints },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=900',
        },
      },
    )
  } catch {
    return NextResponse.json(
      { error: 'Price comparison is temporarily unavailable.' },
      { status: 502 },
    )
  }
}
