export const INVESTMENT_LENSES = [
  { key: 'trade', label: 'Trade', compactLabel: 'Trade' },
  { key: 'short', label: 'Short term', compactLabel: 'Short' },
  { key: 'medium', label: 'Medium term', compactLabel: 'Medium' },
  { key: 'long', label: 'Long term', compactLabel: 'Long' },
] as const

export type InvestmentLensKey = (typeof INVESTMENT_LENSES)[number]['key']

export function parseInvestmentLens(value: string | null | undefined): InvestmentLensKey {
  return INVESTMENT_LENSES.some((lens) => lens.key === value) ? (value as InvestmentLensKey) : 'trade'
}

export const LENS_CHART_TIMEFRAME = {
  trade: '1M',
  short: '3M',
  medium: '1Y',
  long: '5Y',
} as const satisfies Record<InvestmentLensKey, '1M' | '3M' | '1Y' | '5Y'>

export const LENS_TECHNICAL_TIMEFRAME = {
  trade: '1D',
  short: '1D',
  medium: '1W',
  long: '1M',
} as const satisfies Record<InvestmentLensKey, '1D' | '1W' | '1M'>
