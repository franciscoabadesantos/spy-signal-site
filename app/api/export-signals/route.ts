import { NextRequest, NextResponse } from 'next/server'
import { getViewerUserId } from '@/lib/auth'
import { getSignalHistoryForTicker } from '@/lib/signals'
import type { Signal } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeTicker(value: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  return normalized.length > 0 ? normalized : null
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function formatCsvPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return (value * 100).toFixed(2)
}

function toCsv(signals: Signal[]): string {
  const header = [
    'signal_date',
    'direction',
    'conviction_pct',
    'prediction_horizon_days',
    'episode_return_pct',
    'episode_status',
  ]

  const rows = signals.map((signal) => {
    const episodeReturn =
      signal.live_episode_return_to_date ?? signal.live_flat_episode_spy_move_to_date
    const episodeStatus =
      signal.live_episode_status ?? signal.live_flat_episode_status ?? ''
    const record = [
      signal.signal_date.slice(0, 10),
      signal.direction,
      formatCsvPercent(signal.prob_side),
      String(signal.prediction_horizon),
      formatCsvPercent(episodeReturn),
      episodeStatus,
    ]
    return record.map(escapeCsvCell).join(',')
  })

  return [header.join(','), ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  const userId = await getViewerUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const ticker = normalizeTicker(request.nextUrl.searchParams.get('ticker'))
  if (!ticker) {
    return NextResponse.json({ error: 'ticker query param is required.' }, { status: 400 })
  }

  const signals = await getSignalHistoryForTicker(ticker, 1000)
  if (signals.length === 0) {
    return NextResponse.json(
      { error: `No signal history is available for ${ticker}.` },
      { status: 404 }
    )
  }

  const csv = toCsv(signals)
  const filename = `${ticker.toLowerCase()}-signals.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
