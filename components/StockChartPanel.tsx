'use client'

import { useMemo, useState } from 'react'
import StockChart, { type StockChartSignalMarker } from '@/components/StockChart'
import type { PricePoint } from '@/lib/finance'

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
        <StockChart data={filteredData} signalMarkers={filteredMarkers} />
      </div>
    </div>
  )
}
