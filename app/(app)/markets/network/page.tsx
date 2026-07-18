import type { Metadata } from 'next'
import Link from 'next/link'
import MarketCorrelationNetwork from '@/components/MarketCorrelationNetwork'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import RetryButton from '@/components/ui/RetryButton'
import { buttonClass } from '@/components/ui/Button'
import { getMarketNetwork } from '@/lib/network'

export const metadata: Metadata = {
  title: 'Market Relationship Map - Longbrunch',
  description: 'Explore the global market relationship graph by layer, region, and ticker neighborhood.',
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
  const minAbsCorrelation = parseNumberParam(singleSearchParam(resolvedSearchParams.minAbsCorrelation), 0, 1)
  const topK = parseNumberParam(singleSearchParam(resolvedSearchParams.topK), 1, 50)
  const requestedMinAbsCorrelation = minAbsCorrelation ?? 0.3
  const requestedTopK = topK ?? 6

  const graph = await getMarketNetwork({
    window,
    minAbsCorrelation: requestedMinAbsCorrelation,
    topK: requestedTopK,
  }).catch(() => null)

  if (!graph) {
    return (
      <EmptyState
        title="Network is temporarily unavailable"
        description="The frontend could not load the precomputed market relationship graph from finance-backend."
        action={<RetryButton>Retry</RetryButton>}
      />
    )
  }

  return (
    <div className="container-lg section-gap">
      <PageHeader
        title="Market relationship map"
        subtitle="A precomputed, layer-separated graph. Position reflects relationship strength; line thickness and opacity reflect reliability when the backend provides confidence."
        action={
          <Link href="/markets" className={buttonClass({ variant: 'secondary' })}>
            Back to Markets
          </Link>
        }
      />

      <MarketCorrelationNetwork
        key={`${requestedMinAbsCorrelation}:${requestedTopK}`}
        graph={graph}
        initialMinAbsCorrelation={requestedMinAbsCorrelation}
        initialTopK={requestedTopK}
      />
    </div>
  )
}
