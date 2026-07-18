export type CanonicalTickerStatInputs = {
  profileMarketCap: number | null | undefined
  fundamentalsMarketCap: number | null | undefined
  quoteMarketCapText: string | null | undefined
  fundamentalsTrailingPe: number | null | undefined
  profileTrailingPe: number | null | undefined
  marketStatsVolume: number | null | undefined
}

function finiteNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Select only the canonical ticker-summary fields used by the overview cards. */
export function canonicalTickerStats(input: CanonicalTickerStatInputs) {
  return {
    marketCap: finiteNumber(input.profileMarketCap) ?? finiteNumber(input.fundamentalsMarketCap),
    marketCapText: input.quoteMarketCapText ?? null,
    trailingPe: finiteNumber(input.fundamentalsTrailingPe) ?? finiteNumber(input.profileTrailingPe),
    volume: finiteNumber(input.marketStatsVolume),
  }
}
