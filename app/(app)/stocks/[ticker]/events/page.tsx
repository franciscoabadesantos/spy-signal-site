import StockEventsResearch from '@/components/stocks/StockEventsResearch'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import { getTickerDisclosures, getTickerEvents } from '@/lib/canonical-research'
import { getStockResearchData } from '@/lib/stock-research'

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function eventWindow(view: string | undefined): { startDate: string; endDate: string } {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)
  if (view === 'recent') start.setUTCFullYear(start.getUTCFullYear() - 1)
  else if (view === 'history') start.setUTCFullYear(start.getUTCFullYear() - 10)
  else end.setUTCFullYear(end.getUTCFullYear() + 1)
  return { startDate: isoDate(start), endDate: isoDate(end) }
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { ticker } = await params
  const query = await searchParams
  const view = Array.isArray(query.view) ? query.view[0] : query.view

  const window = eventWindow(view)
  const [data, events, disclosures] = await Promise.all([
    getStockResearchData(ticker).catch(() => null),
    getTickerEvents(ticker, { ...window, latestOnly: true, limit: 200 }).catch(() => null),
    getTickerDisclosures(ticker, { latestOnly: true, limit: 100 }).catch(() => null),
  ])
  if (!data) return <ResearchUnavailable ticker={ticker.toUpperCase()} />
  return <StockEventsResearch data={data} view={view} events={events} disclosures={disclosures} />
}
