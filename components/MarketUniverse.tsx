'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import React, { useEffect, useMemo, useState, type ReactNode } from 'react'
import ExpandingSelector from '@/components/ui/ExpandingSelector'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type {
  AtlasCommunity,
  AtlasEdge,
  AtlasNode,
  AtlasView,
  RelationshipAtlas,
  RelationshipAtlasDetail,
} from '@/lib/network'
import styles from './MarketUniverse.module.css'

const MarketUniverseScene = dynamic(() => import('./MarketUniverseScene'), {
  ssr: false,
  loading: () => <UniverseWait />,
})

const VIEW_OPTIONS = [
  { value: 'market', label: 'Market movement' },
  { value: 'residual', label: 'Beyond the market' },
  { value: 'timing', label: 'Timing' },
  { value: 'theme', label: 'Shared themes' },
] as const

const VIEW_COPY: Record<AtlasView, string> = {
  market: 'See the economic centres, bridges and relationships that move together.',
  residual: 'Reveal connections that remain after broad market movement is removed.',
  timing: 'Follow where movement has tended to appear earlier or later.',
  theme: 'Trace companies connected through concentrated investment themes.',
}

function UniverseWait() {
  return (
    <div className={styles.wait} aria-label="Loading market universe" role="status">
      <i /><i /><i /><i /><i />
    </div>
  )
}

class UniverseBoundary extends React.Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function useMobileScene(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return mobile
}

function formatConfidence(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unknown'
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function formatVolatility(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function formatMarketCap(value: number | null | undefined): string {
  if (!value || !Number.isFinite(value)) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${Math.round(value).toLocaleString()}`
}

function edgeForNode(edges: AtlasEdge[], symbol: string): AtlasEdge[] {
  return edges
    .filter((edge) => edge.source === symbol || edge.target === symbol)
    .sort((left, right) => right.score - left.score)
}

function clientAtlas(payload: RelationshipAtlas): RelationshipAtlas {
  return {
    ...payload,
    communities: payload.communities ?? [],
    links: payload.links ?? [],
    landmarks: payload.landmarks ?? [],
    backbone: payload.backbone ?? [],
  }
}

function clientDetail(payload: RelationshipAtlasDetail): RelationshipAtlasDetail {
  return {
    ...payload,
    nodes: (payload.nodes ?? []).map((node) => ({
      ...node,
      centrality: node.centrality ?? node.importance ?? 0,
      bridgeScore: node.bridgeScore ?? 0,
      volatility: node.volatility ?? null,
      country: node.country ?? null,
      region: node.region ?? null,
      context: node.context === true || node.isBoundary === true,
    })),
    edges: payload.edges ?? [],
  }
}

function StaticUniverse({ atlas, onSelectNode }: { atlas: RelationshipAtlas; onSelectNode: (node: AtlasNode) => void }) {
  const nodes = atlas.landmarks.slice(0, 32)
  const xs = nodes.map((node) => node.position.x)
  const ys = nodes.map((node) => node.position.y)
  const minX = Math.min(...xs, -1)
  const maxX = Math.max(...xs, 1)
  const minY = Math.min(...ys, -1)
  const maxY = Math.max(...ys, 1)
  return (
    <div className={styles.staticUniverse} aria-label="Accessible market atlas">
      {nodes.map((node) => (
        <button
          key={node.symbol}
          type="button"
          onClick={() => onSelectNode(node)}
          style={{
            left: `${12 + ((node.position.x - minX) / Math.max(1, maxX - minX)) * 76}%`,
            top: `${14 + ((maxY - node.position.y) / Math.max(1, maxY - minY)) * 68}%`,
            width: `${24 + node.centrality * 30}px`,
            height: `${24 + node.centrality * 30}px`,
          }}
          aria-label={`${node.name}, ${node.symbol}`}
        >
          <span>{node.symbol}</span>
        </button>
      ))}
    </div>
  )
}

function UniverseLegend({ view }: { view: AtlasView }) {
  return (
    <div className={styles.legend} aria-label="How to read the economic atlas">
      <span><i data-kind="mass" />Core: market value</span>
      <span><i data-kind="halo" />Halo: systemic reach</span>
      <span><i data-kind="line" />Line: relationship strength</span>
      <span><i data-kind="fade" />Fade: confidence</span>
      {view === 'timing' ? <span><i data-kind="timing" />Pulse: direction</span> : null}
    </div>
  )
}

function LandmarkIndex({ nodes, activeSymbol, onSelect }: {
  nodes: AtlasNode[]
  activeSymbol: string | null
  onSelect: (node: AtlasNode) => void
}) {
  return (
    <div className={styles.index} aria-label="Systemic market landmarks">
      <p>Systemic landmarks</p>
      {nodes.slice(0, 6).map((node) => (
        <button key={node.symbol} type="button" aria-pressed={activeSymbol === node.symbol} onClick={() => onSelect(node)}>
          <i style={{ opacity: 0.28 + node.centrality * 0.72 }} />
          <span>{node.symbol}</span>
          <small>{node.country || node.sector || 'Global'}</small>
        </button>
      ))}
    </div>
  )
}

function AccessibleNavigator({
  communities,
  nodes,
  selectedId,
  activeSymbol,
  onSelectCommunity,
  onSelectNode,
}: {
  communities: AtlasCommunity[]
  nodes: AtlasNode[]
  selectedId: string | null
  activeSymbol: string | null
  onSelectCommunity: (community: AtlasCommunity) => void
  onSelectNode: (node: AtlasNode) => void
}) {
  return (
    <details className={styles.accessibleNavigator}>
      <summary>Browse atlas</summary>
      <div className={styles.navigatorPanel}>
        <section aria-labelledby="atlas-community-list">
          <h2 id="atlas-community-list">Economic fields</h2>
          {communities.length ? communities.map((community) => (
            <button
              key={community.id}
              type="button"
              aria-pressed={selectedId === community.id}
              onClick={() => onSelectCommunity(community)}
            >
              <span>{community.label}</span>
              <small>{community.memberCount} companies · {community.dominantRegion || community.dominantCountry || 'Global'}</small>
            </button>
          )) : <p>No materialized fields are available in this preview.</p>}
        </section>
        <section aria-labelledby="atlas-landmark-list">
          <h2 id="atlas-landmark-list">Company landmarks</h2>
          {nodes.map((node) => (
            <button
              key={node.symbol}
              type="button"
              aria-pressed={activeSymbol === node.symbol}
              onClick={() => onSelectNode(node)}
            >
              <span>{node.name}</span>
              <small>{node.symbol} · {node.country || node.sector || 'Global'}</small>
            </button>
          ))}
        </section>
      </div>
    </details>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className={styles.metric}><span>{label}</span><strong>{value}</strong></div>
}

function Inspector({
  community,
  detail,
  neighborhood,
  activeNode,
  loading,
  onBack,
  onSelectNode,
}: {
  community: AtlasCommunity | null
  detail: RelationshipAtlasDetail | null
  neighborhood: RelationshipAtlasDetail | null
  activeNode: AtlasNode | null
  loading: boolean
  onBack: () => void
  onSelectNode: (node: AtlasNode) => void
}) {
  const source = neighborhood ?? detail
  const relationships = activeNode && source ? edgeForNode(source.edges, activeNode.symbol) : []
  const nodeBySymbol = new Map(source?.nodes.map((node) => [node.symbol, node]) ?? [])
  const members = detail?.nodes.filter((node) => !node.context && node.communityId === community?.id) ?? []
  const location = activeNode ? [activeNode.country, activeNode.region].filter(Boolean).join(' · ') : ''

  return (
    <motion.aside
      className={styles.inspector}
      initial={{ opacity: 0, x: 22, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 14, filter: 'blur(6px)' }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      aria-label={activeNode ? `${activeNode.name} relationship context` : `${community?.label ?? 'Market'} context`}
    >
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Full economy
      </button>

      {activeNode ? (
        <>
          <div className={styles.inspectorHeading}>
            <p>{activeNode.symbol}</p>
            <h2>{activeNode.name}</h2>
            <div>
              <span>{activeNode.sector || 'Cross-market'}</span>
              {location ? <span>{location}</span> : null}
            </div>
          </div>
          <div className={styles.metrics}>
            <Metric label="Market value" value={formatMarketCap(activeNode.marketCap)} />
            <Metric label="Systemic reach" value={formatPercent(activeNode.centrality)} />
            <Metric label="Bridge role" value={formatPercent(activeNode.bridgeScore)} />
            <Metric label="20d volatility" value={formatVolatility(activeNode.volatility)} />
          </div>
          {loading ? <UniverseWait /> : null}
          {!loading ? (
            <div className={styles.relations}>
              <div className={styles.sectionLabel}><span>Strongest visible links</span><small>strength · confidence</small></div>
              {relationships.slice(0, 6).map((edge) => {
                const peerSymbol = edge.source === activeNode.symbol ? edge.target : edge.source
                const peer = nodeBySymbol.get(peerSymbol)
                return (
                  <button key={`${edge.source}:${edge.target}`} type="button" onClick={() => peer && onSelectNode(peer)} disabled={!peer}>
                    <span><strong>{peerSymbol}</strong><small>{peer?.name ?? 'Connected company'}</small></span>
                    <span><b>{Math.abs(edge.strength).toFixed(2)}</b><small>{formatConfidence(edge.confidence)}</small></span>
                  </button>
                )
              })}
              {relationships.length === 0 ? <p className={styles.emptyCopy}>No detailed neighborhood is available for this landmark yet.</p> : null}
            </div>
          ) : null}
          <Link className={styles.exploreLink} href={`/stocks/${activeNode.symbol}`}>Explore {activeNode.symbol} <ArrowUpRight aria-hidden="true" /></Link>
        </>
      ) : community ? (
        <>
          <div className={styles.inspectorHeading}>
            <p>Economic field</p>
            <h2>{community.label}</h2>
            <div>
              <span>{community.memberCount} companies</span>
              <span>{formatConfidence(community.averageConfidence)} confidence</span>
            </div>
          </div>
          <div className={styles.metrics}>
            <Metric label="Economic mass" value={formatMarketCap(community.marketCapTotal)} />
            <Metric label="External bridges" value={String(community.bridgeCount || 0)} />
            <Metric label="Primary sector" value={community.dominantSector || 'Mixed'} />
            <Metric label="Primary region" value={community.dominantRegion || community.dominantCountry || 'Global'} />
          </div>
          {loading ? <UniverseWait /> : null}
          {!loading && members.length ? (
            <div className={styles.companyGrid}>
              {members.slice(0, 12).map((node) => (
                <button key={node.symbol} type="button" onClick={() => onSelectNode(node)}>
                  <span>{node.symbol}</span><small>{node.name}</small>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </motion.aside>
  )
}

export default function MarketUniverse({ initialAtlas }: { initialAtlas: RelationshipAtlas }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reducedMotion = Boolean(useReducedMotion())
  const mobile = useMobileScene()
  const [atlas, setAtlas] = useState(initialAtlas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RelationshipAtlasDetail | null>(null)
  const [neighborhood, setNeighborhood] = useState<RelationshipAtlasDetail | null>(null)
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)
  const [loadingAtlas, setLoadingAtlas] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [requestError, setRequestError] = useState(false)
  const [atlasCache] = useState(() => new Map<string, RelationshipAtlas>([[`${initialAtlas.window}:${initialAtlas.view}`, initialAtlas]]))
  const [detailCache] = useState(() => new Map<string, RelationshipAtlasDetail>())
  const [neighborhoodCache] = useState(() => new Map<string, RelationshipAtlasDetail>())

  const selectedCommunity = useMemo(
    () => atlas.communities.find((community) => community.id === selectedId) ?? null,
    [atlas.communities, selectedId],
  )
  const allVisibleNodes = useMemo(() => {
    const bySymbol = new Map<string, AtlasNode>()
    for (const node of atlas.landmarks) bySymbol.set(node.symbol, node)
    for (const node of detail?.nodes ?? []) bySymbol.set(node.symbol, node)
    for (const node of neighborhood?.nodes ?? []) bySymbol.set(node.symbol, node)
    return bySymbol
  }, [atlas.landmarks, detail?.nodes, neighborhood?.nodes])
  const activeNode = activeSymbol ? allVisibleNodes.get(activeSymbol) ?? null : null

  function syncUrl(window: number, view: AtlasView) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('window', String(window))
    params.set('view', view)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function selectAtlas(window: number, view: AtlasView) {
    setSelectedId(null)
    setDetail(null)
    setNeighborhood(null)
    setActiveSymbol(null)
    setRequestError(false)
    syncUrl(window, view)
    const key = `${window}:${view}`
    const cached = atlasCache.get(key)
    if (cached) { setAtlas(cached); return }
    setLoadingAtlas(true)
    try {
      const response = await fetch(`/api/network/atlas?window=${window}&view=${view}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Atlas unavailable')
      const next = clientAtlas(await response.json() as RelationshipAtlas)
      atlasCache.set(key, next)
      setAtlas(next)
    } catch {
      setRequestError(true)
    } finally {
      setLoadingAtlas(false)
    }
  }

  async function selectCommunity(community: AtlasCommunity) {
    setSelectedId(community.id)
    setActiveSymbol(null)
    setNeighborhood(null)
    setRequestError(false)
    const key = `${atlas.asOf}:${atlas.window}:${atlas.view}:${community.id}`
    const cached = detailCache.get(key)
    if (cached) { setDetail(cached); return }
    setLoadingDetail(true)
    try {
      const params = new URLSearchParams({
        window: String(atlas.window),
        view: atlas.view,
        limit: String(mobile ? 44 : 84),
      })
      if (atlas.asOf) params.set('asOf', atlas.asOf)
      const response = await fetch(
        `/api/network/atlas/communities/${encodeURIComponent(community.id)}?${params.toString()}`,
        { cache: 'no-store' },
      )
      if (!response.ok) throw new Error('Community unavailable')
      const next = clientDetail(await response.json() as RelationshipAtlasDetail)
      detailCache.set(key, next)
      setDetail(next)
    } catch {
      setRequestError(true)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function selectNode(node: AtlasNode) {
    setActiveSymbol(node.symbol)
    setSelectedId(node.communityId || selectedId)
    setRequestError(false)
    const key = `${atlas.asOf}:${atlas.window}:${atlas.view}:${node.symbol}`
    const cached = neighborhoodCache.get(key)
    if (cached) { setNeighborhood(cached); return }
    setLoadingDetail(true)
    try {
      const params = new URLSearchParams({
        window: String(atlas.window),
        view: atlas.view,
        limit: String(mobile ? 18 : 32),
      })
      if (atlas.asOf) params.set('asOf', atlas.asOf)
      const response = await fetch(
        `/api/network/atlas/neighborhoods/${encodeURIComponent(node.symbol)}?${params.toString()}`,
        { cache: 'no-store' },
      )
      if (!response.ok) throw new Error('Neighborhood unavailable')
      const next = clientDetail(await response.json() as RelationshipAtlasDetail)
      neighborhoodCache.set(key, next)
      setNeighborhood(next)
    } catch {
      setNeighborhood(null)
      setRequestError(true)
    } finally {
      setLoadingDetail(false)
    }
  }

  function clearFocus() {
    setSelectedId(null)
    setDetail(null)
    setNeighborhood(null)
    setActiveSymbol(null)
    setRequestError(false)
  }

  return (
    <section className={styles.root} aria-labelledby="market-universe-title">
      <div className={styles.chrome}>
        <div className={styles.intro}>
          <p>Economic atlas</p>
          <h1 id="market-universe-title">The world economy, connected.</h1>
          <span>{VIEW_COPY[atlas.view]}</span>
        </div>
        <div className={styles.controls}>
          <ExpandingSelector
            label="View"
            ariaLabel="Choose how relationships are interpreted"
            value={atlas.view}
            options={VIEW_OPTIONS}
            onValueChange={(value) => void selectAtlas(atlas.window, value as AtlasView)}
          />
          <div className={styles.windowControl}>
            <span>Window</span>
            <SegmentedControl
              options={['126', '252'] as const}
              value={String(atlas.window) as '126' | '252'}
              onChange={(value) => void selectAtlas(Number(value), atlas.view)}
              ariaLabel="Evidence window"
            />
          </div>
        </div>
      </div>

      <div className={styles.stage} data-focused={selectedId || activeSymbol ? 'true' : 'false'}>
        <UniverseBoundary fallback={<StaticUniverse atlas={atlas} onSelectNode={(node) => void selectNode(node)} />}>
          <MarketUniverseScene
            atlas={atlas}
            detail={detail}
            neighborhood={neighborhood}
            selectedCommunityId={selectedId}
            activeSymbol={activeSymbol}
            reducedMotion={reducedMotion}
            mobile={mobile}
            onSelectCommunity={(community) => void selectCommunity(community)}
            onSelectNode={(node) => void selectNode(node)}
          />
        </UniverseBoundary>

        {loadingAtlas ? <div className={styles.loadingVeil}><UniverseWait /></div> : null}
        {!selectedId && !activeSymbol ? <LandmarkIndex nodes={atlas.landmarks} activeSymbol={activeSymbol} onSelect={(node) => void selectNode(node)} /> : null}
        <AccessibleNavigator
          communities={atlas.communities}
          nodes={atlas.landmarks}
          selectedId={selectedId}
          activeSymbol={activeSymbol}
          onSelectCommunity={(community) => void selectCommunity(community)}
          onSelectNode={(node) => void selectNode(node)}
        />
        <UniverseLegend view={atlas.view} />
        <div className={styles.snapshot}>
          <span>{atlas.asOf ? `As of ${atlas.asOf}` : 'Latest snapshot'}</span>
          {!atlas.materialized ? <small>Live relationship preview</small> : <small>Materialized topology</small>}
        </div>

        <AnimatePresence>
          {selectedCommunity || activeNode ? (
            <Inspector
              community={selectedCommunity}
              detail={detail}
              neighborhood={neighborhood}
              activeNode={activeNode}
              loading={loadingDetail}
              onBack={clearFocus}
              onSelectNode={(node) => void selectNode(node)}
            />
          ) : null}
        </AnimatePresence>

        {requestError ? (
          <button type="button" className={styles.errorToast} onClick={() => setRequestError(false)}>
            Some deeper context is not available yet. The atlas remains interactive.
          </button>
        ) : null}
      </div>
    </section>
  )
}
