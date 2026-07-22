import type { InvestmentLensKey } from '@/lib/investment-lens'

export type StockTabKey = 'overview' | 'relationships' | 'research'
export type StockResearchNavKey =
  | 'overview'
  | 'fundamentals'
  | 'financials'
  | 'valuation'
  | 'signals'
  | 'events'
  | 'relationships'
  | 'profile'
  | 'more'

export type StockResearchLink = {
  key: string
  label: string
  slug: string
  query?: string
}

export type StockResearchNavItem = StockResearchLink & {
  subitems?: readonly StockResearchLink[]
}

export const stockResearchPrimaryItems: readonly StockResearchNavItem[] = [
  { key: 'overview', label: 'Overview', slug: '' },
  { key: 'fundamentals', label: 'Fundamentals', slug: 'fundamentals' },
  {
    key: 'financials',
    label: 'Financials',
    slug: 'financials',
    subitems: [
      { key: 'income', label: 'Income Statement', slug: 'financials', query: 'statement=income&period=annual' },
      { key: 'balance-sheet', label: 'Balance Sheet', slug: 'financials', query: 'statement=balance-sheet&period=annual' },
      { key: 'cash-flow', label: 'Cash Flow', slug: 'financials', query: 'statement=cash-flow&period=annual' },
    ],
  },
  { key: 'valuation', label: 'Valuation', slug: 'valuation' },
  {
    key: 'signals',
    label: 'Signals',
    slug: 'signals',
    subitems: [
      { key: 'current-signal', label: 'Current Signal', slug: 'signals' },
      { key: 'signal-history', label: 'Signal History', slug: 'signal-history' },
      { key: 'indicators', label: 'Indicator Details', slug: 'indicators' },
    ],
  },
  { key: 'events', label: 'Events', slug: 'events' },
  { key: 'relationships', label: 'Relationships', slug: 'relationships' },
  { key: 'profile', label: 'Profile', slug: 'profile' },
] as const

export const stockResearchMoreItems: readonly StockResearchLink[] = [
  { key: 'ownership', label: 'Ownership & Capital', slug: 'ownership' },
  { key: 'ai-research', label: 'AI Research', slug: 'ai-research' },
  { key: 'methodology', label: 'Methodology', slug: 'methodology' },
] as const

export const stockResearchItems: readonly StockResearchLink[] = [
  ...stockResearchPrimaryItems.flatMap((item) => [item, ...(item.subitems ?? [])]),
  ...stockResearchMoreItems,
]

export function stockResearchHref(
  ticker: string,
  item: Pick<StockResearchLink, 'slug' | 'query'>,
  lens?: InvestmentLensKey,
): string {
  const pathname = item.slug ? `/stocks/${ticker}/${item.slug}` : `/stocks/${ticker}`
  const params = new URLSearchParams(item.query)
  if (lens) params.set('lens', lens)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
