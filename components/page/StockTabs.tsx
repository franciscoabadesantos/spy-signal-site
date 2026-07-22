import StockResearchNav from '@/components/stocks/StockResearchNav'
import type { StockTabKey } from '@/components/stocks/stock-nav-config'
import type { InvestmentLensKey } from '@/lib/investment-lens'

type StockTabsProps = {
  ticker: string
  active: StockTabKey
  className?: string
  lens?: InvestmentLensKey
}

export type { StockTabKey }

export default function StockTabs({ ticker, active, className, lens }: StockTabsProps) {
  return (
    <div className={className} data-stock-tab-context={active}>
      <StockResearchNav ticker={ticker} initialLens={lens} />
    </div>
  )
}
