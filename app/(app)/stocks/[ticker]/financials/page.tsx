import StockFinancialStatementsResearch, {
  type StatementKey,
  type StatementPeriod,
} from '@/components/stocks/StockFinancialStatementsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { parseInvestmentLens } from '@/lib/investment-lens'
import { getStockResearchData } from '@/lib/stock-research'

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseStatement(value: string | undefined, lens: ReturnType<typeof parseInvestmentLens>): StatementKey {
  if (value === 'income' || value === 'balance-sheet' || value === 'cash-flow') return value
  return lens === 'long' ? 'balance-sheet' : 'income'
}

function parsePeriod(value: string | undefined): StatementPeriod {
  return value === 'quarterly' ? 'quarterly' : 'annual'
}

export default async function FinancialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{
    lens?: string | string[]
    statement?: string | string[]
    period?: string | string[]
  }>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const lens = parseInvestmentLens(singleParam(query.lens))
  const statement = parseStatement(singleParam(query.statement), lens)
  const period = parsePeriod(singleParam(query.period))
  const data = await getStockResearchData(ticker).catch(() => null)
  if (!data) return <ResearchUnavailable ticker={ticker} />
  return <StockFinancialStatementsResearch data={data} lens={lens} statement={statement} period={period} />
}
