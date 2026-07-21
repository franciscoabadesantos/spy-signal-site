import Tabs from '@/components/ui/Tabs'
import StockResearchNav from '@/components/stocks/StockResearchNav'
import { stockTabItems, type StockTabKey } from '@/components/stocks/stock-nav-config'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
}

export type { StockTabKey }

export default function StockTabs({ ticker, active, className }: StockTabsProps) {
  return (
    <div className={className ? `flex flex-wrap items-end gap-x-6 ${className}` : 'flex flex-wrap items-end gap-x-6'}>
      <Tabs variant="underline" items={stockTabItems(ticker)} activeKey={active} />
      <StockResearchNav ticker={ticker} active={active === 'research'} />
    </div>
  )
}
