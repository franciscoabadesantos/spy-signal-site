import ModelDetailClient from '@/components/models/ModelDetailClient'

export const dynamic = 'force-dynamic'

export default async function ModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string | string[] }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const from = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from[0] ?? null
    : resolvedSearchParams.from ?? null
  return <ModelDetailClient modelId={resolvedParams.id} entrySourceHint={from} />
}
