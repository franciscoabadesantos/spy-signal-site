import 'server-only'

import { getOhlcData } from '@/lib/finance'
import { getCachedLatestScreenerRow, getCachedSignalHistoryForTicker } from '@/lib/signals'
import type { Signal } from '@/lib/types'
import type { OhlcLoadResult } from '@/lib/ohlc-data'
import { getStockResearchData, type StockResearchData } from '@/lib/stock-research'

export type SignalObservation = {
  id: number
  signalDate: string
  direction: Signal['direction']
  horizon: number | null
}

export type CurrentSignalEvidence = {
  direction: Signal['direction']
  signalDate: string | null
  horizon: number | null
  price: number | null
  coverage: boolean | null
}

export type SignalResearchData = {
  research: StockResearchData
  observations: SignalObservation[]
  currentSignal: CurrentSignalEvidence | null
  ohlc: OhlcLoadResult
}

function emptyOhlcResult(): OhlcLoadResult {
  return {
    status: 'empty',
    rows: [],
    reason: 'ohlc_not_available_for_research_view',
    cacheKey: 'stock-ohlc-cache-v2',
    backendStatus: null,
    rawRows: null,
    validRows: 0,
  }
}

function isSignalDirection(value: unknown): value is Signal['direction'] {
  return value === 'bullish' || value === 'bearish' || value === 'neutral'
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeSignalHistory(rows: Signal[]): SignalObservation[] {
  return rows
    .filter((row) => Number.isInteger(row.id) && typeof row.signal_date === 'string' && isSignalDirection(row.direction))
    .map((row) => ({
      id: row.id,
      signalDate: row.signal_date,
      direction: row.direction,
      horizon: finiteNumber(row.prediction_horizon),
    }))
    .sort((left, right) => {
      const dateDelta = Date.parse(right.signalDate) - Date.parse(left.signalDate)
      return dateDelta || right.id - left.id
    })
}

function coverageExpectsPrices(research: StockResearchData): boolean {
  const coverage = research.summary.coverage
  return coverage.hasPrices === true || (typeof coverage.priceRows === 'number' && coverage.priceRows > 0)
}

function latestCurrentSignal(
  research: StockResearchData,
  observations: SignalObservation[],
  screenerRows: Awaited<ReturnType<typeof getCachedLatestScreenerRow>>,
): CurrentSignalEvidence | null {
  const screener = screenerRows[0]
  const history = observations[0]
  if (!screener && !history) return null

  return {
    direction: screener?.direction ?? history!.direction,
    signalDate: screener?.signalDate ?? history?.signalDate ?? null,
    horizon: screener?.predictionHorizon ?? history?.horizon ?? null,
    price: screener?.price ?? research.summary.quote?.price ?? null,
    coverage: research.summary.coverage.hasSignals,
  }
}

export async function getSignalResearchData(ticker: string): Promise<SignalResearchData> {
  const research = await getStockResearchData(ticker)
  const [rawHistory, screenerRows, ohlc] = await Promise.all([
    getCachedSignalHistoryForTicker(research.ticker, 250).catch(() => []),
    getCachedLatestScreenerRow(research.ticker).catch(() => []),
    getOhlcData(research.ticker, 3650, coverageExpectsPrices(research)).catch(() => emptyOhlcResult()),
  ])
  const observations = normalizeSignalHistory(rawHistory)

  return {
    research,
    observations,
    currentSignal: latestCurrentSignal(research, observations, screenerRows),
    ohlc,
  }
}
