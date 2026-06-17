import StockHeader from '@/components/page/StockHeader'
import StockTabsAuto from '@/components/stocks/StockTabsAuto'
import { getStockQuote } from '@/lib/finance'
import { getScreenerSignals } from '@/lib/signals'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default async function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  let quote = null
  let latestSignal: Awaited<ReturnType<typeof getScreenerSignals>>['rows'][number] | null = null

  const [quoteResult, screenerResult] = await Promise.allSettled([
    getStockQuote(ticker),
    getScreenerSignals({ tickers: [ticker], limit: 1 }),
  ])
  quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
  latestSignal = screenerResult.status === 'fulfilled' ? screenerResult.value.rows[0] ?? null : null

  const signalTone =
    latestSignal?.direction === 'bullish'
      ? 'bullish'
      : latestSignal?.direction === 'bearish'
        ? 'bearish'
        : 'neutral'

  return (
    <div className="container-lg space-y-4 py-5 pb-16 md:space-y-5">
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
        subtitle={
          quote
            ? 'Price, regime, and supporting market context.'
            : 'Market data is temporarily unavailable from finance-backend.'
        }
      />
      <StockTabsAuto ticker={ticker} />
      <div>{children}</div>
    </div>
  )
}
