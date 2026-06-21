import type { Metadata } from 'next'
import Link from 'next/link'
import MarketCorrelationNetwork from '@/components/MarketCorrelationNetwork'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import RetryButton from '@/components/ui/RetryButton'
import { buttonClass } from '@/components/ui/Button'
import { getMarketNetwork } from '@/lib/network'

export const metadata: Metadata = {
  title: 'Market Correlation Network - Longbrunch',
  description: 'Explore the global market correlation graph by region, backbone edge, and ticker neighborhood.',
}

function singleSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

function parseNumberParam(value: string | null, min: number, max: number): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(min, Math.min(max, parsed))
}

export default async function MarketNetworkPage({
  searchParams,
}: {
  searchParams: Promise<{
    window?: string | string[]
    minAbsCorrelation?: string | string[]
    topK?: string | string[]
  }>
}) {
  const resolvedSearchParams = await searchParams
  const window = singleSearchParam(resolvedSearchParams.window) ?? undefined
  const minAbsCorrelation = parseNumberParam(singleSearchParam(resolvedSearchParams.minAbsCorrelation), 0.2, 0.95)
  const topK = parseNumberParam(singleSearchParam(resolvedSearchParams.topK), 2, 10)

  const graph = await getMarketNetwork({ window, minAbsCorrelation, topK }).catch(() => null)

  if (!graph) {
    return (
      <EmptyState
        title="Network is temporarily unavailable"
        description="The frontend could not load the precomputed market correlation graph from finance-backend."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  return (
    <div className="container-lg section-gap">
      <PageHeader
        title="Correlation network"
        subtitle="A precomputed market graph where force-directed position comes from return correlations, while country and sector metadata are overlaid as colour and spotlight views."
        action={
          <Link href="/markets" className={buttonClass({ variant: 'secondary' })}>
            Back to Markets
          </Link>
        }
      />

      <MarketCorrelationNetwork graph={graph} />
    </div>
  )
}
