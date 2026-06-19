import StockTabsAuto from '@/components/stocks/StockTabsAuto'
import StockPageTheme from '@/components/stocks/StockPageTheme'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default async function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  return (
    <div className="container-lg space-y-3 py-4 pb-14 md:space-y-4">
      <StockPageTheme />
      <StockTabsAuto ticker={ticker} />
      <div>{children}</div>
    </div>
  )
}
