import StockValuationResearch, {
  type ValuationMetric,
  type ValuationPeriod,
} from '@/components/stocks/StockValuationResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseMetric(value: string | undefined): ValuationMetric {
  if (value === 'ps' || value === 'pb' || value === 'pfcf' || value === 'ev-ebitda') return value
  return 'pe'
}

function parsePeriod(value: string | undefined): ValuationPeriod {
  return value === 'quarterly' ? 'quarterly' : 'annual'
}

export default async function ValuationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ lens?: string | string[]; metric?: string | string[]; period?: string | string[] }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const lens = parseInvestmentLens(singleParam(query.lens))
  const metric = parseMetric(singleParam(query.metric))
  const period = parsePeriod(singleParam(query.period))
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockValuationResearch data={data} lens={lens} metric={metric} period={period} />
}
