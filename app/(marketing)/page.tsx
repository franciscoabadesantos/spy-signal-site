import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import MarketingHomePage, { type HomeDemoData } from '@/components/marketing/HomePage'
import { getStockQuote, type StockQuote } from '@/lib/finance'
import { getTickerRelationships } from '@/lib/relationships'
import { getTickerScorecard } from '@/lib/scorecard'
import type { ScreenerSignal } from '@/lib/signals'

export const revalidate = 300

const HERO_TICKERS = ['SPY', 'QQQ', 'NVDA', 'MSFT', 'AAPL', 'AMZN', 'META', 'TSM', 'JPM', 'TLT', 'GLD', 'XOM'] as const

const DEMO_TICKER = 'NVDA'

async function loadQuotes(): Promise<StockQuote[]> {
  const settled = await Promise.allSettled(HERO_TICKERS.map((ticker) => getStockQuote(ticker)))
  return settled
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter((quote): quote is StockQuote => quote !== null && Number.isFinite(quote.price))
}

/**
 * The hero animation is decorative; its direction/intensity derive from the
 * real daily move (not model output — none is public yet). Tooltips are
 * disabled on the hero, so nothing reads as a recommendation.
 */
function heroSignalsFromQuotes(quotes: StockQuote[]): ScreenerSignal[] {
  const today = new Date().toISOString().slice(0, 10)
  return quotes.map((quote) => ({
    ticker: quote.ticker,
    name: quote.name,
    direction: quote.changePercent > 0.15 ? 'bullish' : quote.changePercent < -0.15 ? 'bearish' : 'neutral',
    conviction: Math.min(0.92, Math.max(0.2, Math.abs(quote.changePercent) / 3)),
    signalDate: today,
    predictionHorizon: null,
    price: quote.price,
    changePercent: quote.changePercent,
  }))
}

async function loadDemo(): Promise<HomeDemoData> {
  try {
    const [relationships126, relationships252, scorecard] = await Promise.all([
      getTickerRelationships(DEMO_TICKER, { window: 126 }),
      getTickerRelationships(DEMO_TICKER, { window: 252 }),
      getTickerScorecard(DEMO_TICKER).catch(() => null),
    ])
    return { ticker: DEMO_TICKER, relationships126, relationships252, scorecard }
  } catch {
    // Backend unreachable: the demo sections simply don't render.
    return null
  }
}

export default async function Home() {
  const [quotes, demo] = await Promise.all([loadQuotes().catch(() => []), loadDemo()])

  return (
    <>
      <TrackEventOnMount eventName="view_homepage" />
      <MarketingHomePage quotes={quotes} heroSignals={heroSignalsFromQuotes(quotes)} demo={demo} />
    </>
  )
}
