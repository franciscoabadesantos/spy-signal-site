import ModelDetailClient from '@/components/models/ModelDetailClient'

export const dynamic = 'force-dynamic'

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <ModelDetailClient modelId={resolvedParams.id} />
}
