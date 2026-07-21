import StockResearchDestination from '@/components/stocks/StockResearchDestination'

export default async function FundamentalsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  return <StockResearchDestination ticker={ticker.toUpperCase()} kind="fundamentals" />
}
