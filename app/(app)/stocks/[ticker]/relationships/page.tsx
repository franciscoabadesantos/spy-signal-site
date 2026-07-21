import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import RelationshipsList from '@/components/stocks/RelationshipsList'
import { hasRelationshipExperience } from '@/lib/relationship-visibility'
import { getTickerRelationships, type TickerRelationships } from '@/lib/relationships'
import { getTickerPageSummary } from '@/lib/ticker-data'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params
  return { title: `${ticker.toUpperCase()} Relationships - Longbrunch`, description: `Relationships and co-movement context for ${ticker.toUpperCase()}.` }
}

function emptyRelationships(ticker: string, window: 126 | 252): TickerRelationships {
  return {
    asOf: null,
    ticker,
    window,
    node: null,
    nodes: [],
    marketCoMovers: [],
    residualCoMovers: [],
    leadLag: { followers: [], leaders: [] },
    probableSpurious: [],
    themePeers: [],
  }
}

export default async function RelationshipsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  let summary: Awaited<ReturnType<typeof getTickerPageSummary>> | null
  let relationshipsByWindow: Record<126 | 252, TickerRelationships>
  try {
    const [loadedSummary, relationship126, relationship252] = await Promise.all([
      getTickerPageSummary(ticker).catch(() => null),
      getTickerRelationships(ticker, { window: 126, topK: 50 }).catch(() => emptyRelationships(ticker, 126)),
      getTickerRelationships(ticker, { window: 252, topK: 50 }),
    ])
    summary = loadedSummary
    relationshipsByWindow = { 126: relationship126, 252: relationship252 }
  } catch {
    return <EmptyState title="Relationships are temporarily unavailable" description="The canonical relationship data could not be loaded from finance-backend." action={<RetryButton>Retry</RetryButton>} />
  }
  if (!hasRelationshipExperience(relationshipsByWindow[252])) {
    return (
      <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--bg-surface)] p-6">
        <p className="text-caption uppercase tracking-[0.18em] text-content-muted">{ticker} · Relationships</p>
        <h1 className="text-page-title text-content-primary">Relationships</h1>
        <p className="max-w-xl text-body text-content-secondary">Partial coverage. Relationship evidence is not currently sufficient for a live comparison view.</p>
        <p className="text-body-sm text-content-muted">No live values shown until the canonical relationship dataset has adequate coverage.</p>
        <Link href={`/stocks/${ticker}`} className="action-link inline-flex">Back to overview →</Link>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Markets', href: '/markets' }, { label: ticker, href: `/stocks/${ticker}` }, { label: 'Relationships' }]} />
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-caption uppercase tracking-[0.18em] text-content-muted">{summary?.quote?.name ?? ticker}</div><h1 className="text-page-title text-content-primary">Relationships</h1><p className="mt-2 max-w-2xl text-body">Explore one relationship category at a time across the available windows.</p></div><Link href={`/stocks/${ticker}`} className="action-link">Back to overview →</Link></div>
      <RelationshipsList relationshipsByWindow={relationshipsByWindow} centerTicker={ticker} centerName={summary?.quote?.name ?? null} />
      <p className="text-caption text-content-muted">Strength describes the returned relationship magnitude; confidence describes how much weight to place on that relationship. Neither is a forecast or a trading instruction.</p>
    </div>
  )
}
