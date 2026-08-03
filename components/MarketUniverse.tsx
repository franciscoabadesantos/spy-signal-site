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
  market: 'See which parts of the market tend to move together.',
  residual: 'See what stays connected after broad market movement is removed.',
  timing: 'See where movement has tended to appear earlier or later.',
  theme: 'See companies connected through concentrated investment themes.',
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

function StaticUniverse({ atlas, onSelect }: { atlas: RelationshipAtlas; onSelect: (community: AtlasCommunity) => void }) {
  return (
    <div className={styles.staticUniverse} aria-label="Static market universe">
      {atlas.communities.slice(0, 18).map((community, index) => {
        const angle = index * 2.399963229728653
        const radius = 12 + Math.sqrt(index) * 9
        return (
          <button
            key={community.id}
            type="button"
            onClick={() => onSelect(community)}
            style={{
              left: `${50 + Math.cos(angle) * radius}%`,
              top: `${50 + Math.sin(angle) * radius * 0.72}%`,
              width: `${28 + Math.min(34, Math.log2(community.memberCount + 1) * 6)}px`,
              height: `${28 + Math.min(34, Math.log2(community.memberCount + 1) * 6)}px`,
              opacity: 0.38 + community.averageConfidence * 0.58,
            }}
            aria-label={`${community.label}, ${community.memberCount} companies`}
          >
            <span>{community.label}</span>
          </button>
        )
      })}
    </div>
  )
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

function formatConfidence(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function formatMarketCap(value: number | null): string | null {
  if (!value || !Number.isFinite(value)) return null
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return null
}

function UniverseLegend({ view }: { view: AtlasView }) {
  return (
    <div className={styles.legend} aria-label="How to read the market universe">
      <span><i data-kind="size" />More connected</span>
      <span><i data-kind="line" />Stronger relationship</span>
      <span><i data-kind="fade" />Lower confidence fades</span>
      {view === 'timing' ? <span><i data-kind="timing" />Flow shows timing</span> : null}
    </div>
  )
}

function CommunityIndex({
  communities,
  selectedId,
  onSelect,
}: {
  communities: AtlasCommunity[]
  selectedId: string | null
  onSelect: (community: AtlasCommunity) => void
}) {
  return (
    <div className={styles.index} aria-label="Market communities">
      {communities.slice(0, 7).map((community) => (
        <button
          key={community.id}
          type="button"
          aria-pressed={selectedId === community.id}
          onClick={() => onSelect(community)}
        >
          <i style={{ opacity: 0.35 + community.averageConfidence * 0.65 }} />
          <span>{community.label}</span>
          <small>{community.memberCount}</small>
        </button>
      ))}
    </div>
  )
}

function Inspector({
  community,
  detail,
  activeNode,
  loading,
  onBack,
  onSelectNode,
}: {
  community: AtlasCommunity
  detail: RelationshipAtlasDetail | null
  activeNode: AtlasNode | null
  loading: boolean
  onBack: () => void
  onSelectNode: (node: AtlasNode) => void
}) {
  return (
    <motion.aside
      className={styles.inspector}
      initial={{ opacity: 0, x: 22, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 14, filter: 'blur(6px)' }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Universe
      </button>
      <div className={styles.inspectorHeading}>
        <p>Constellation</p>
        <h2>{community.label}</h2>
        <div>
          <span>{community.memberCount} companies</span>
          <span>{formatConfidence(community.averageConfidence)} average confidence</span>
        </div>
      </div>

      {loading ? <UniverseWait /> : null}
      {!loading && detail ? (
        <>
          {activeNode ? (
            <motion.div
              key={activeNode.symbol}
              className={styles.companyFocus}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span>{activeNode.symbol}</span>
              <h3>{activeNode.name}</h3>
              <p>{[activeNode.industry, activeNode.sector, formatMarketCap(activeNode.marketCap)].filter(Boolean).join(' · ')}</p>
              <Link href={`/stocks/${activeNode.symbol}`}>Explore company <ArrowUpRight aria-hidden="true" /></Link>
            </motion.div>
          ) : null}

          <div className={styles.companyGrid}>
            {detail.nodes.slice(0, 24).map((node) => (
              <button
                key={node.symbol}
                type="button"
                aria-pressed={activeNode?.symbol === node.symbol}
                onClick={() => onSelectNode(node)}
              >
                <span>{node.symbol}</span>
                <small>{node.name}</small>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </motion.aside>
  )
}

export default function MarketUniverse({
  initialAtlas,
  fallbackDetails = {},
}: {
  initialAtlas: RelationshipAtlas
  fallbackDetails?: Record<string, RelationshipAtlasDetail>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reducedMotion = Boolean(useReducedMotion())
  const mobile = useMobileScene()
  const [atlas, setAtlas] = useState(initialAtlas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RelationshipAtlasDetail | null>(null)
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null)
  const [loadingAtlas, setLoadingAtlas] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [requestError, setRequestError] = useState(false)
  const [cache] = useState(() => new Map<string, RelationshipAtlas>([[`${initialAtlas.window}:${initialAtlas.view}`, initialAtlas]]))
  const [detailCache] = useState(() => new Map<string, RelationshipAtlasDetail>(Object.entries(fallbackDetails)))

  const selectedCommunity = useMemo(
    () => atlas.communities.find((community) => community.id === selectedId) ?? null,
    [atlas.communities, selectedId],
  )
  const activeNode = detail?.nodes.find((node) => node.symbol === activeSymbol) ?? null

  function syncUrl(window: number, view: AtlasView) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('window', String(window))
    params.set('view', view)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function selectAtlas(window: number, view: AtlasView) {
    setSelectedId(null)
    setDetail(null)
    setActiveSymbol(null)
    setRequestError(false)
    syncUrl(window, view)
    const key = `${window}:${view}`
    const cached = cache.get(key)
    if (cached) {
      setAtlas(cached)
      return
    }
    setLoadingAtlas(true)
    try {
      const response = await fetch(`/api/network/atlas?window=${window}&view=${view}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Atlas unavailable')
      const next = await response.json() as RelationshipAtlas
      cache.set(key, next)
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
    setDetail(null)
    setRequestError(false)
    const cached = detailCache.get(community.id)
    if (cached) {
      setDetail(cached)
      setActiveSymbol(cached.nodes[0]?.symbol ?? null)
      return
    }
    setLoadingDetail(true)
    try {
      const response = await fetch(
        `/api/network/atlas/communities/${encodeURIComponent(community.id)}?window=${atlas.window}&view=${atlas.view}&limit=${mobile ? 36 : 64}`,
        { cache: 'no-store' },
      )
      if (!response.ok) throw new Error('Community unavailable')
      const next = await response.json() as RelationshipAtlasDetail
      detailCache.set(community.id, next)
      setDetail(next)
      setActiveSymbol(next.nodes[0]?.symbol ?? null)
    } catch {
      setRequestError(true)
    } finally {
      setLoadingDetail(false)
    }
  }

  function clearFocus() {
    setSelectedId(null)
    setDetail(null)
    setActiveSymbol(null)
    setRequestError(false)
  }

  function selectNode(node: AtlasNode) {
    setActiveSymbol(node.symbol)
  }

  return (
    <section className={styles.root} aria-labelledby="market-universe-title">
      <div className={styles.chrome}>
        <div className={styles.intro}>
          <p>Market universe</p>
          <h1 id="market-universe-title">Move through the market.</h1>
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

      <div className={styles.stage} data-focused={selectedId ? 'true' : 'false'}>
        <UniverseBoundary fallback={<StaticUniverse atlas={atlas} onSelect={(community) => void selectCommunity(community)} />}>
          <MarketUniverseScene
            atlas={atlas}
            detail={detail}
            selectedCommunityId={selectedId}
            activeSymbol={activeSymbol}
            reducedMotion={reducedMotion}
            mobile={mobile}
            onSelectCommunity={(community) => void selectCommunity(community)}
            onSelectNode={selectNode}
          />
        </UniverseBoundary>

        {loadingAtlas ? <div className={styles.loadingVeil}><UniverseWait /></div> : null}
        {!selectedId ? (
          <CommunityIndex communities={atlas.communities} selectedId={selectedId} onSelect={(community) => void selectCommunity(community)} />
        ) : null}
        <UniverseLegend view={atlas.view} />
        <div className={styles.snapshot}>
          <span>{atlas.asOf ? `As of ${atlas.asOf}` : 'Latest snapshot'}</span>
          {!atlas.materialized ? <small>Preview topology</small> : null}
        </div>

        <AnimatePresence>
          {selectedCommunity ? (
            <Inspector
              community={selectedCommunity}
              detail={detail}
              activeNode={activeNode}
              loading={loadingDetail}
              onBack={clearFocus}
              onSelectNode={selectNode}
            />
          ) : null}
        </AnimatePresence>

        {requestError ? (
          <button type="button" className={styles.errorToast} onClick={() => setRequestError(false)}>
            That part of the universe is not available yet.
          </button>
        ) : null}
      </div>
    </section>
  )
}
