import { permanentRedirect } from 'next/navigation'

export default async function LegacyFinancialsPage({
  params,
}: {
  params: Promise<{ ticker: string; statement: string }>
}) {
  const { ticker, statement } = await params
  void statement
  permanentRedirect(`/stocks/${ticker.toUpperCase()}/financials`)
}
