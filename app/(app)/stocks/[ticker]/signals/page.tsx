import StockSignalsResearch from '@/components/stocks/StockSignalsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getSignalResearchData } from '@/lib/signal-research'

export default async function SignalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { ticker } = await params
  const query = await searchParams
  const familyValue = Array.isArray(query.family) ? query.family[0] : query.family

  let data: Awaited<ReturnType<typeof getSignalResearchData>> | null = null
  try {
    data = await getSignalResearchData(ticker)
  } catch {
    return <ResearchUnavailable ticker={ticker.toUpperCase()} />
  }
  return <StockSignalsResearch data={data} family={familyValue} />
}
