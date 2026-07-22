import 'server-only'

import type { EarningsHistoryRow } from '@/lib/ticker-data'

export type SafeEarningsObservation = {
  earningsDate: string
  fiscalPeriod: string | null
  epsActual: number | null
  epsEstimate: number | null
  epsSurprisePct: number | null
  revenueActual: number | null
  revenueEstimate: number | null
  revenueSurprisePct: number | null
}

export type EarningsHistoryNormalization = {
  rows: SafeEarningsObservation[]
  duplicateKeys: string[]
  rawRows: number
}

function finiteNumber(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function normalizeEarningsHistory(rows: EarningsHistoryRow[]): EarningsHistoryNormalization {
  const duplicateKeys = new Set<string>()
  const seen = new Set<string>()
  const normalized = rows.flatMap((row) => {
    if (!row.earningsDate || Number.isNaN(Date.parse(row.earningsDate))) return []
    const key = `${row.earningsDate.slice(0, 10)}|${row.fiscalPeriod ?? ''}`
    if (seen.has(key)) duplicateKeys.add(key)
    seen.add(key)
    return [{
      earningsDate: row.earningsDate,
      fiscalPeriod: row.fiscalPeriod,
      epsActual: finiteNumber(row.epsActual),
      epsEstimate: finiteNumber(row.epsEstimate),
      epsSurprisePct: finiteNumber(row.epsSurprisePct),
      revenueActual: finiteNumber(row.revenueActual),
      revenueEstimate: finiteNumber(row.revenueEstimate),
      revenueSurprisePct: finiteNumber(row.revenueSurprisePct),
    }]
  })

  normalized.sort((left, right) => Date.parse(right.earningsDate) - Date.parse(left.earningsDate))

  return {
    rows: duplicateKeys.size > 0 ? [] : normalized,
    duplicateKeys: [...duplicateKeys],
    rawRows: rows.length,
  }
}
