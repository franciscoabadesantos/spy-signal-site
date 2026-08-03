import type { LatestFundamentalsRow } from '@/lib/ticker-data'

export type StockAssetKind = 'equity' | 'fund'

const FUND_TICKERS = new Set(['SPY', 'QQQ', 'DIA', 'IWM', 'VOO', 'IVV', 'VTI', 'XLK', 'XLF', 'XLE'])

export function stockAssetKind({
  ticker,
  name,
  latestFundamentals,
}: {
  ticker: string
  name: string
  latestFundamentals: LatestFundamentalsRow[]
}): StockAssetKind {
  if (FUND_TICKERS.has(ticker)) return 'fund'
  if (/\b(etf|trust|fund|portfolio|index|spdr|ishares|vanguard|invesco|proshares|direxion|ark)\b/i.test(name)) {
    return 'fund'
  }
  return latestFundamentals.some((row) =>
    /(expense ratio|number of holdings|top holdings|inception date|turnover rate|fund family|fund category|portfolio p\/?e)/i.test(
      `${row.metricLabel} ${row.metric}`,
    ),
  )
    ? 'fund'
    : 'equity'
}
