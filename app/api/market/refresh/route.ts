import { refreshTickerMarketData } from '@/lib/finance'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseTickers(request: NextRequest): string[] {
  const fromQuery = request.nextUrl.searchParams.get('tickers')
  if (!fromQuery) return ['SPY']

  const parsed = fromQuery
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : ['SPY']
}

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.MARKET_REFRESH_TOKEN
  if (!token) return true

  const auth = request.headers.get('authorization')
  return auth === `Bearer ${token}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const tickers = parseTickers(request)
  const periodDaysParam = request.nextUrl.searchParams.get('periodDays')
  const periodDays = Number.parseInt(periodDaysParam || '120', 10)
  const safePeriodDays = Number.isFinite(periodDays) && periodDays > 10 ? periodDays : 120

  const results = []
  for (const ticker of tickers) {
    const refreshed = await refreshTickerMarketData(ticker, safePeriodDays)
    results.push(refreshed)
  }

  return NextResponse.json({
    ok: true,
    tickers,
    periodDays: safePeriodDays,
    refreshedAt: new Date().toISOString(),
    results,
  })
}
