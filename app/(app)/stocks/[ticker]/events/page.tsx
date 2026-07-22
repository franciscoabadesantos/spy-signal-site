import StockEventsResearch from '@/components/stocks/StockEventsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { ticker } = await params
  const query = await searchParams
  const lensValue = Array.isArray(query.lens) ? query.lens[0] : query.lens
  const view = Array.isArray(query.view) ? query.view[0] : query.view
  const lens = parseInvestmentLens(lensValue)

  let data: Awaited<ReturnType<typeof getStockResearchData>> | null = null
  try {
    data = await getStockResearchData(ticker)
  } catch {
    return <ResearchUnavailable ticker={ticker.toUpperCase()} />
  }
  return <StockEventsResearch data={data} lens={lens} view={view} />
}
