import StockFundamentalsResearch from '@/components/stocks/StockFundamentalsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

export default async function FundamentalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ lens?: string | string[] }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const lens = parseInvestmentLens(Array.isArray(query.lens) ? query.lens[0] : query.lens)
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockFundamentalsResearch data={data} lens={lens} />
}
