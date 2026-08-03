import StockProfileResearch from '@/components/stocks/StockProfileResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getStockResearchData } from '@/lib/stock-research'

export default async function ProfilePage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockProfileResearch data={data} />
}
