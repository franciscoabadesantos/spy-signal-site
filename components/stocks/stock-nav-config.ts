import type { TabItem } from '@/components/ui/Tabs'

export type StockTabKey = 'overview' | 'financials' | 'holdings-dividends' | 'signal-history' | 'performance'

export function stockTabItems(ticker: string): TabItem[] {
  return [
    { key: 'overview', label: 'Overview', href: `/stocks/${ticker}` },
    { key: 'financials', label: 'Financials', href: `/stocks/${ticker}/financials/fund-profile` },
    { key: 'holdings-dividends', label: 'Holdings & Dividends', href: `/stocks/${ticker}/holdings-dividends` },
    { key: 'signal-history', label: 'Signal History', href: `/stocks/${ticker}/signal-history` },
    { key: 'performance', label: 'Performance', href: `/stocks/${ticker}/performance` },
  ]
}
