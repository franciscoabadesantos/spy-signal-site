import StockAiResearch from '@/components/stocks/StockAiResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

export default async function AiResearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ lens?: string | string[] }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const lensValue = Array.isArray(query.lens) ? query.lens[0] : query.lens
  const lens = parseInvestmentLens(lensValue)
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockAiResearch data={data} lens={lens} />
}
