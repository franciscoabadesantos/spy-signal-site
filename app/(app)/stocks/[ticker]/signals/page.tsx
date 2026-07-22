import StockSignalsResearch from '@/components/stocks/StockSignalsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getSignalResearchData } from '@/lib/signal-research'
import { parseInvestmentLens } from '@/lib/investment-lens'

export default async function SignalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { ticker } = await params
  const query = await searchParams
  const lensValue = Array.isArray(query.lens) ? query.lens[0] : query.lens
  const familyValue = Array.isArray(query.family) ? query.family[0] : query.family
  const lens = parseInvestmentLens(lensValue)

  let data: Awaited<ReturnType<typeof getSignalResearchData>> | null = null
  try {
    data = await getSignalResearchData(ticker)
  } catch {
    return <ResearchUnavailable ticker={ticker.toUpperCase()} />
  }
  return <StockSignalsResearch data={data} lens={lens} family={familyValue} />
}
