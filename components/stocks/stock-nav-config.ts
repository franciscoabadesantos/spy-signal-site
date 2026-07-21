import type { TabItem } from '@/components/ui/Tabs'

export type StockTabKey = 'overview' | 'relationships' | 'research'

export function stockTabItems(ticker: string): TabItem[] {
  const items: TabItem[] = [
    { key: 'overview', label: 'Overview', href: `/stocks/${ticker}` },
    { key: 'relationships', label: 'Relationships', href: `/stocks/${ticker}/relationships` },
  ]
  return items
}

export const stockResearchItems = [
  ['lens', 'Lens'],
  ['fundamentals', 'Fundamentals'],
  ['financials', 'Financial Statements'],
  ['valuation', 'Valuation History'],
  ['ownership', 'Ownership & Capital'],
  ['profile', 'Company Profile'],
  ['signals', 'Signal History'],
  ['indicators', 'Indicator Details'],
  ['events', 'Earnings & Events'],
  ['ai-research', 'AI Research'],
  ['methodology', 'Methodology'],
] as const
