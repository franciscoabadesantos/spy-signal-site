import Tabs from '@/components/ui/Tabs'
import { stockTabItems, type StockTabKey, type StockTabOptions } from '@/components/stocks/stock-nav-config'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
} & StockTabOptions

export type { StockTabKey }

export default function StockTabs({ ticker, active, className, includeHoldings }: StockTabsProps) {
  return <Tabs className={className} items={stockTabItems(ticker, { includeHoldings })} activeKey={active} />
}
