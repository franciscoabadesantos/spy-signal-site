import StockOwnershipResearch from '@/components/stocks/StockOwnershipResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getStockResearchData } from '@/lib/stock-research'

export default async function OwnershipPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockOwnershipResearch data={data} />
}
