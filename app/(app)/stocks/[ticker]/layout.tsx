import StockHeader from '@/components/page/StockHeader'
import StockTabsAuto from '@/components/stocks/StockTabsAuto'
import { getStockQuote } from '@/lib/finance'
import { getSignalHistoryForTicker } from '@/lib/signals'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default async function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  const [quote, signals] = await Promise.all([
    getStockQuote(ticker),
    getSignalHistoryForTicker(ticker, 1, { allowSyntheticFallback: false }),
  ])

  const latestSignal = signals[0] ?? null
  const signalTone =
    latestSignal?.direction === 'bullish'
      ? 'bullish'
      : latestSignal?.direction === 'bearish'
        ? 'bearish'
        : 'neutral'

  return (
    <div className="container-lg py-6 pb-20 section-gap">
      <StockHeader
        ticker={quote?.ticker || ticker}
        companyName={quote?.name}
        price={quote?.price ?? null}
        dailyMove={{
          amount: quote?.change ?? null,
          percent: quote?.changePercent ?? null,
        }}
        signal={
          latestSignal
            ? {
                label: latestSignal.direction.toUpperCase(),
                tone: signalTone,
              }
            : undefined
        }
        subtitle="Research-ready snapshot with model context and supporting market data."
      />
      <StockTabsAuto ticker={ticker} />
      <div>{children}</div>
    </div>
  )
}
