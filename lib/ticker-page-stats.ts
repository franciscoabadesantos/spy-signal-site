export type CanonicalTickerStatInputs = {
  snapshotProfileMarketCap: number | null | undefined
  fundamentalsMarketCap: number | null | undefined
  quoteMarketCapText: string | null | undefined
  fundamentalsTrailingPe: number | null | undefined
  profileTrailingPe: number | null | undefined
  marketStatsVolume: number | null | undefined
}

function finiteNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Select only snapshot/PIT-safe ticker-summary fields for overview cards. Do
 * not substitute latest metadata or fuzzy latest-fundamental matching here:
 * P/E must be canonical or render as —.
 */
export function canonicalTickerStats(input: CanonicalTickerStatInputs) {
  return {
    marketCap: finiteNumber(input.snapshotProfileMarketCap) ?? finiteNumber(input.fundamentalsMarketCap),
    marketCapText: input.quoteMarketCapText ?? null,
    trailingPe: finiteNumber(input.fundamentalsTrailingPe) ?? finiteNumber(input.profileTrailingPe),
    volume: finiteNumber(input.marketStatsVolume),
  }
}
