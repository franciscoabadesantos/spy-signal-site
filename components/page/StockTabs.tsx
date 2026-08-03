import StockResearchNav from '@/components/stocks/StockResearchNav'
import type { StockTabKey } from '@/components/stocks/stock-nav-config'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
}

export type { StockTabKey }

export default function StockTabs({ ticker, active, className }: StockTabsProps) {
  return (
    <div className={className} data-stock-tab-context={active}>
      <StockResearchNav ticker={ticker} />
    </div>
  )
}
