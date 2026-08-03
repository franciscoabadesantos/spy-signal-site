import type { Metadata } from 'next'
import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'
import ResearchViewShell from '@/components/stocks/ResearchViewShell'
import ResearchUnavailable from '@/components/stocks/ResearchUnavailable'
import RelationshipsList from '@/components/stocks/RelationshipsList'
import type { RelationshipWindow, ToggleLayer } from '@/components/RelationshipOrbit'
import { hasRelationshipExperience } from '@/lib/relationship-visibility'
import { getTickerRelationships, type TickerRelationships } from '@/lib/relationships'
import { getStockResearchData } from '@/lib/stock-research'

export const dynamic = 'force-dynamic'

type QueryValue = string | string[] | undefined

function singleParam(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseWindow(value: string | undefined): RelationshipWindow {
  return value === '126' ? 126 : 252
}

function parseLayer(value: string | undefined): ToggleLayer | undefined {
  if (value === 'residual' || value === 'theme' || value === 'leadLag' || value === 'market') return value
  return undefined
}

function emptyRelationships(ticker: string, window: RelationshipWindow): TickerRelationships {
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

async function loadRelationships(ticker: string, window: RelationshipWindow) {
  try {
    return { data: await getTickerRelationships(ticker, { window, topK: 50 }), failed: false }
  } catch {
    return { data: emptyRelationships(ticker, window), failed: true }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params
  return {
    title: `${ticker.toUpperCase()} Relationships - Longbrunch`,
    description: `Observed relationship evidence and co-movement context for ${ticker.toUpperCase()}.`,
  }
}

export default async function RelationshipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<Record<string, QueryValue>>
}) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  const query = await searchParams
  const initialWindow = parseWindow(singleParam(query.window))
  const initialLayer = parseLayer(singleParam(query.layer))
  const [researchResult, relationship126, relationship252] = await Promise.all([
    getStockResearchData(ticker).catch(() => null),
    loadRelationships(ticker, 126),
    loadRelationships(ticker, 252),
  ])

  if (!researchResult) return <ResearchUnavailable ticker={ticker} />
  if (relationship126.failed && relationship252.failed) {
    return <EmptyState title="Relationships are temporarily unavailable" description="The canonical relationship data could not be loaded from finance-backend." action={<RetryButton>Retry</RetryButton>} />
  }

  const relationshipsByWindow = { 126: relationship126.data, 252: relationship252.data } as Record<RelationshipWindow, TickerRelationships>
  const hasAnyExperience = hasRelationshipExperience(relationshipsByWindow[126]) || hasRelationshipExperience(relationshipsByWindow[252])
  const selected = relationshipsByWindow[initialWindow]

  return (
    <ResearchViewShell data={researchResult} title="Relationships">
      <div className="space-y-6" data-relationship-page="">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-caption uppercase tracking-[0.16em] text-content-muted">Observed relationship evidence</p>
            <p className="mt-2 text-body-sm text-content-secondary">{researchResult.kind === 'fund' ? 'Fund relationships' : 'Asset relationships'} · {ticker}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-caption text-content-muted sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">Dataset as of {selected.asOf ?? '—'}</span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">Window {selected.window}</span>
          </div>
        </header>

        {hasAnyExperience ? (
          <RelationshipsList
            relationshipsByWindow={relationshipsByWindow}
            centerTicker={ticker}
            centerName={researchResult.name}
            initialWindow={initialWindow}
            initialLayer={initialLayer}
          />
        ) : (
          <section className="border-y border-border py-6" aria-labelledby="relationship-coverage-heading">
            <p className="text-caption uppercase tracking-[0.14em] text-content-muted">Partial coverage</p>
            <h2 id="relationship-coverage-heading" className="mt-2 text-section-title text-content-primary">No usable relationships for this asset</h2>
            <p className="mt-2 max-w-xl text-body-sm text-content-secondary">The relationship endpoint did not return enough identified associations for a live comparison view.</p>
            {researchResult.kind === 'fund' ? (
              <p className="mt-2 max-w-xl text-body-sm text-content-muted">Holdings and fund structure remain available in their research views.</p>
            ) : null}
          </section>
        )}

        <section className="border-t border-border pt-5" aria-labelledby="relationship-method-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="relationship-method-heading" className="text-section-title text-content-primary">How to read relationships</h2>
            <a href={`/stocks/${ticker}/methodology#relationships`} className="action-link text-caption">Methodology →</a>
          </div>
          <p className="mt-2 max-w-3xl text-body-sm text-content-secondary">These are observed associations returned by finance-backend. An association does not establish causality, influence, prediction, or a business relationship.</p>
          <div className="mt-4 flex min-w-0 flex-col gap-2 text-caption text-content-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">Dataset as of {selected.asOf ?? '—'}</span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">Observed window {selected.window}</span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">Coverage: {researchResult.coverageLabel}</span>
          </div>
        </section>
      </div>
    </ResearchViewShell>
  )
}
