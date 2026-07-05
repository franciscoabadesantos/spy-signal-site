import StockTabsAuto from '@/components/stocks/StockTabsAuto'
import StockPageTheme from '@/components/stocks/StockPageTheme'
import { getTickerFundamentals } from '@/lib/finance'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default async function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  let includeHoldings = false
  try {
    const fundamentals = await getTickerFundamentals(ticker)
    includeHoldings = fundamentals.holdings.length > 0 || fundamentals.sectorWeights.length > 0
  } catch {
    // Holdings tab simply stays hidden when fundamentals are unavailable.
  }

  return (
    <div className="container-lg space-y-3 py-4 pb-14 md:space-y-4">
      <StockPageTheme />
      <StockTabsAuto ticker={ticker} includeHoldings={includeHoldings} />
      <div>{children}</div>
    </div>
  )
}
