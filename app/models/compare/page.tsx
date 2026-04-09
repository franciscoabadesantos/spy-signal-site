import ModelCompareClient from '@/components/models/ModelCompareClient'

export const dynamic = 'force-dynamic'

function singleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

export default async function ModelsComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string | string[]; right?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <ModelCompareClient
      initialLeftId={singleParam(resolvedSearchParams.left)}
      initialRightId={singleParam(resolvedSearchParams.right)}
    />
  )
}
