'use client'

import { useMemo, useState } from 'react'
import StockChart, { type StockChartSignalMarker } from '@/components/StockChart'
import type { PricePoint } from '@/lib/finance'
import { SlidersHorizontal } from 'lucide-react'

type Timeframe = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

const TIMEFRAME_OPTIONS: Timeframe[] = ['1M', '3M', '6M', 'YTD', '1Y', '5Y', 'MAX']

function parseIsoDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`)
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000)
}

function getStartDate(timeframe: Timeframe, latestDate: Date): Date | null {
  switch (timeframe) {
    case '1M':
      return subtractDays(latestDate, 30)
    case '3M':
      return subtractDays(latestDate, 90)
    case '6M':
      return subtractDays(latestDate, 182)
    case 'YTD':
      return new Date(Date.UTC(latestDate.getUTCFullYear(), 0, 1))
    case '1Y':
      return subtractDays(latestDate, 365)
    case '5Y':
      return subtractDays(latestDate, 1825)
    case 'MAX':
    default:
      return null
  }
}

function buttonClass(active: boolean): string {
  if (active) {
    return 'px-2 py-1 text-[12px] font-semibold text-gray-900 border border-gray-300 bg-white rounded-md shadow-sm'
  }
  return 'px-2 py-1 text-[12px] font-medium text-gray-500 border border-transparent hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors'
}

export default function StockChartPanel({
  data,
  signalMarkers,
}: {
  data: PricePoint[]
  signalMarkers?: StockChartSignalMarker[]
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>('6M')
  const [showRegimes, setShowRegimes] = useState(true)
  const [showSignalMarkers, setShowSignalMarkers] = useState(true)

  const filteredData = useMemo(() => {
    if (data.length === 0) return []

    const latestPoint = data[data.length - 1]
    if (!latestPoint) return data

    const latestDate = parseIsoDate(latestPoint.date)
    const startDate = getStartDate(timeframe, latestDate)
    if (!startDate) return data

    const next = data.filter((point) => parseIsoDate(point.date) >= startDate)
    return next.length > 1 ? next : data
  }, [data, timeframe])

  const visibleDates = useMemo(() => new Set(filteredData.map((point) => point.date.slice(0, 10))), [filteredData])
  const filteredMarkers = useMemo(() => {
    if (!signalMarkers || signalMarkers.length === 0) return []
    return signalMarkers.filter((marker) => visibleDates.has(marker.date.slice(0, 10)))
  }, [signalMarkers, visibleDates])

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        {TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTimeframe(option)}
            className={buttonClass(option === timeframe)}
            aria-pressed={option === timeframe}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <StockChart
          data={filteredData}
          signalMarkers={filteredMarkers}
          showRegimes={showRegimes}
          showSignalMarkers={showSignalMarkers}
        />
      </div>

      <div className="mt-1 border-t border-border/70 pt-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-emerald-500/55 bg-emerald-500/20" />
              Bullish Regime
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-rose-500/55 bg-rose-500/20" />
              Bearish Regime
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Signal Marker
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRegimes((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showRegimes ? 'Hide Regimes' : 'Show Regimes'}
            </button>
            <button
              type="button"
              onClick={() => setShowSignalMarkers((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showSignalMarkers ? 'Hide Markers' : 'Show Markers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
