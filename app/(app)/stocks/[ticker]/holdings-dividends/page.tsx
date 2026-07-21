import { permanentRedirect } from 'next/navigation'

export default async function LegacyHoldingsDividendsPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const { ticker } = await params
  permanentRedirect(`/stocks/${ticker.toUpperCase()}/fundamentals`)
}
