import StockValuationResearch, {
  type ValuationMetric,
  type ValuationPeriod,
} from '@/components/stocks/StockValuationResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getTickerMarketMetrics } from '@/lib/canonical-research'
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

const MARKET_METRICS: Record<ValuationMetric, string> = {
  pe: 'trailing_pe',
  ps: 'price_to_sales',
  pb: 'price_to_book',
  pfcf: 'price_to_free_cash_flow',
  'ev-ebitda': 'enterprise_value_to_ebitda',
}

export default async function ValuationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ metric?: string | string[]; period?: string | string[] }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const metric = parseMetric(singleParam(query.metric))
  const period = parsePeriod(singleParam(query.period))
  const [data, observations] = await Promise.all([
    getStockResearchData(ticker).catch(() => null),
    getTickerMarketMetrics(ticker, {
      metric: MARKET_METRICS[metric],
      latestOnly: false,
      limit: 250,
    }).catch(() => null),
  ])
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockValuationResearch data={data} metric={metric} period={period} observations={observations} />
}
