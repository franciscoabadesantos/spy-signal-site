import StockOwnershipResearch from '@/components/stocks/StockOwnershipResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function OwnershipPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ lens?: string | string[] }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const lens = parseInvestmentLens(singleParam(query.lens))
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockOwnershipResearch data={data} lens={lens} />
}
