import StockTabsAuto from '@/components/stocks/StockTabsAuto'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default async function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()
  return (
    <div className="container-lg space-y-3 pt-2 pb-14 md:space-y-4 md:pt-0">
      <StockTabsAuto ticker={ticker} />
      <div>{children}</div>
    </div>
  )
}
