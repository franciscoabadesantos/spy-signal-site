import { permanentRedirect } from 'next/navigation'

export default async function IndicatorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { ticker } = await params
  const query = await searchParams
  const next = new URLSearchParams()
  for (const key of ['family']) {
    const value = Array.isArray(query[key]) ? query[key][0] : query[key]
    if (typeof value === 'string' && value.trim()) next.set(key, value)
  }
  next.set('family', next.get('family') ?? 'oscillators')
  permanentRedirect(`/stocks/${ticker.toUpperCase()}/signals?${next.toString()}`)
}
