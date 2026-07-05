import type { TabItem } from '@/components/ui/Tabs'
import { modelSignalsEnabled } from '@/lib/flags'

export type StockTabKey = 'overview' | 'financials' | 'holdings-dividends' | 'signal-history' | 'performance'

export type StockTabOptions = {
  /** Only funds/ETFs with holdings data get the Holdings tab. */
  includeHoldings?: boolean
}

export function stockTabItems(ticker: string, options: StockTabOptions = {}): TabItem[] {
  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', href: `/stocks/${ticker}` },
    { key: 'financials', label: 'Financials', href: `/stocks/${ticker}/financials/fund-profile` },
  ]
  if (options.includeHoldings) {
    tabs.push({ key: 'holdings-dividends', label: 'Holdings', href: `/stocks/${ticker}/holdings-dividends` })
  }
  if (modelSignalsEnabled()) {
    tabs.push({ key: 'signal-history', label: 'Signals', href: `/stocks/${ticker}/signal-history` })
  }
  return tabs
}
