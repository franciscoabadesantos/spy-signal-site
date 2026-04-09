'use client'

import { useMemo, useState } from 'react'
import StockChart, { type StockChartSignalMarker } from '@/components/StockChart'
import type { PricePoint } from '@/lib/finance'
import FilterChip from '@/components/ui/FilterChip'

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
    <div className="h-full section-gap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TIMEFRAME_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={option === timeframe}
              onClick={() => setTimeframe(option)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label={showRegimes ? 'Regimes On' : 'Regimes Off'}
            active={showRegimes}
            onClick={() => setShowRegimes((value) => !value)}
          />
          <FilterChip
            label={showSignalMarkers ? 'Markers On' : 'Markers Off'}
            active={showSignalMarkers}
            onClick={() => setShowSignalMarkers((value) => !value)}
          />
        </div>
      </div>

      <div className="h-[320px]">
        <StockChart
          data={filteredData}
          signalMarkers={filteredMarkers}
          showRegimes={showRegimes}
          showSignalMarkers={showSignalMarkers}
        />
      </div>
    </div>
  )
}
