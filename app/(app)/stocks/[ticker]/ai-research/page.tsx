import StockResearchDestination from '@/components/stocks/StockResearchDestination'
export default async function AiResearchPage({ params }: { params: Promise<{ ticker: string }> }) { const { ticker } = await params; return <StockResearchDestination ticker={ticker.toUpperCase()} kind="ai-research" /> }
