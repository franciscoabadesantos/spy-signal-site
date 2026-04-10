import Tabs from '@/components/ui/Tabs'
import { stockTabItems, type StockTabKey } from '@/components/stocks/stock-nav-config'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
}

export type { StockTabKey }

export default function StockTabs({ ticker, active, className }: StockTabsProps) {
  return <Tabs className={className} items={stockTabItems(ticker)} activeKey={active} />
}
