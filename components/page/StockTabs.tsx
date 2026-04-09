import Tabs, { type TabItem } from '@/components/ui/Tabs'

export type StockTabKey = 'overview' | 'financials' | 'holdings-dividends' | 'signal-history'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
}

function buildItems(ticker: string): TabItem[] {
  return [
    { key: 'overview', label: 'Overview', href: `/stocks/${ticker}` },
    { key: 'financials', label: 'Financials', href: `/stocks/${ticker}/financials/fund-profile` },
    { key: 'holdings-dividends', label: 'Holdings & Dividends', href: `/stocks/${ticker}/holdings-dividends` },
    { key: 'signal-history', label: 'Signal History', href: `/stocks/${ticker}/signal-history` },
  ]
}

export default function StockTabs({ ticker, active, className }: StockTabsProps) {
  return <Tabs className={className} items={buildItems(ticker)} activeKey={active} />
}
