import { permanentRedirect } from 'next/navigation'

export default async function LegacySignalHistoryPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const { ticker } = await params
  permanentRedirect(`/stocks/${ticker.toUpperCase()}/signals`)
}
