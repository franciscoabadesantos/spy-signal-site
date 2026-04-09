import { Filter, Lock } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/shells/AppShell'
import TrackedLink from '@/components/analytics/TrackedLink'
import ScreenerSignalCard from '@/components/ScreenerSignalCard'
import ActionBar from '@/components/page/ActionBar'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import DismissibleLocalHint from '@/components/onboarding/DismissibleLocalHint'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FilterChip from '@/components/ui/FilterChip'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from '@/components/ui/DataTable'
import {
  getScreenerSignals,
  getSignalCompositionByTicker,
  type ScreenerSignalComposition,
  type ScreenerSort,
} from '@/lib/signals'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import {
  convictionPercent,
  rowSignalQualityLabel,
  shortSignalHeadline,
  signalHeadlineFromInputs,
} from '@/lib/signalSummary'

export const dynamic = 'force-dynamic'

type ScreenerSearchParams = {
  signal?: string | string[]
  bias?: string | string[]
  minConviction?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  maxAgeDays?: string | string[]
}

type SignalDirection = 'all' | 'bullish' | 'neutral' | 'bearish'
type RowSignalDirection = Exclude<SignalDirection, 'all'>
type BubbleRank = 'dominant' | 'secondary' | 'minor'
type BiasFilter = 'all' | 'bullish-biased' | 'balanced' | 'neutral-heavy' | 'bearish-biased'
type RowBiasCategory = Exclude<BiasFilter, 'all'>

type RowBiasSnapshot = {
  bullishPct: number
  neutralPct: number
  bearishPct: number
  dominant: RowSignalDirection
  secondary: RowSignalDirection
  minor: RowSignalDirection
  biasCategory: RowBiasCategory
  biasLabel: string
  description: string
  activePct: number
}

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseSignalFilter(raw: string | undefined): SignalDirection {
  if (raw === 'bullish' || raw === 'neutral' || raw === 'bearish') return raw
  return 'all'
}

function parseBiasFilter(raw: string | undefined): BiasFilter {
  if (
    raw === 'bullish-biased' ||
    raw === 'balanced' ||
    raw === 'neutral-heavy' ||
    raw === 'bearish-biased'
  ) {
    return raw
  }
  return 'all'
}

function parseMinConviction(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, Math.round(parsed)))
}

function parseTextQuery(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim().slice(0, 80)
}

function parseSort(raw: string | undefined): ScreenerSort {
  if (raw === 'latest' || raw === 'movers' || raw === 'ticker') return raw
  return 'conviction'
}

function parseMaxAgeDays(raw: string | undefined): number {
  if (!raw || raw.trim().length === 0) return 0
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(3650, Math.round(parsed)))
}

function buildScreenerHref({
  signal,
  bias,
  minConviction,
  textQuery,
  sortBy,
  maxAgeDays,
}: {
  signal: SignalDirection
  bias: BiasFilter
  minConviction: number
  textQuery: string
  sortBy: ScreenerSort
  maxAgeDays: number
}): string {
  const params = new URLSearchParams()
  if (signal !== 'all') params.set('signal', signal)
  if (bias !== 'all') params.set('bias', bias)
  if (minConviction > 0) params.set('minConviction', String(minConviction))
  if (textQuery) params.set('q', textQuery)
  if (sortBy !== 'conviction') params.set('sort', sortBy)
  if (maxAgeDays > 0) params.set('maxAgeDays', String(maxAgeDays))
  const query = params.toString()
  return query ? `/screener?${query}` : '/screener'
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function formatSignalDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function convictionToneClass(direction: Exclude<SignalDirection, 'all'>): string {
  if (direction === 'bullish') return 'bg-emerald-500'
  if (direction === 'bearish') return 'bg-rose-500'
  return 'bg-amber-500'
}

function signalBadge(direction: Exclude<SignalDirection, 'all'>): {
  label: string
  variant: 'success' | 'danger' | 'neutral'
} {
  if (direction === 'bullish') return { label: 'Bullish', variant: 'success' }
  if (direction === 'bearish') return { label: 'Bearish', variant: 'danger' }
  return { label: 'Neutral', variant: 'neutral' }
}

function sortDirectionFor(
  sortBy: ScreenerSort,
  column: 'ticker' | 'conviction' | 'signal-date' | 'change'
): 'asc' | 'desc' | undefined {
  if (sortBy === 'ticker' && column === 'ticker') return 'asc'
  if (sortBy === 'conviction' && column === 'conviction') return 'desc'
  if (sortBy === 'latest' && column === 'signal-date') return 'desc'
  if (sortBy === 'movers' && column === 'change') return 'desc'
  return undefined
}

function buildStockHref(ticker: string, screenerSignal: string): string {
  const params = new URLSearchParams({
    from: 'screener',
    screenerSignal,
  })
  return `/stocks/${ticker}?${params.toString()}`
}

function miniProfileBars({
  direction,
  conviction,
  predictionHorizon,
  changePercent,
}: {
  direction: Exclude<SignalDirection, 'all'>
  conviction: number | null
  predictionHorizon: number | null
  changePercent: number | null
}): number[] {
  const convictionScore = convictionPercent(conviction) ?? 38
  const moveMag = Math.min(8, Math.abs(changePercent ?? 0))
  const horizonTarget = predictionHorizon ?? 20
  const horizonScore = Math.max(28, 100 - Math.abs(horizonTarget - 20) * 2.1)
  const trendBase = direction === 'bullish' ? 58 : direction === 'bearish' ? 44 : 50
  const trend = Math.max(22, Math.min(96, trendBase + convictionScore * 0.32))
  const momentum = Math.max(22, Math.min(96, convictionScore * 0.88 + moveMag * 4.4))
  const risk = Math.max(22, Math.min(96, 68 - moveMag * 4.6))
  const yieldScore = Math.max(22, Math.min(96, 34 + convictionScore * 0.26))
  const stability = Math.max(22, Math.min(96, convictionScore * 0.8 - moveMag * 3.7 + horizonScore * 0.08))
  return [trend, momentum, risk, yieldScore, stability].map((value) => Math.round(value))
}

function normalizePct(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function fallbackCompositionFromRow({
  direction,
  conviction,
}: {
  direction: RowSignalDirection
  conviction: number | null
}): ScreenerSignalComposition {
  const convictionPct = convictionPercent(conviction) ?? 48
  const highConviction = convictionPct >= 70
  const mediumConviction = convictionPct >= 50 && convictionPct < 70

  let bullishPct = 0.33
  let neutralPct = 0.34
  let bearishPct = 0.33

  if (direction === 'bullish') {
    bullishPct = highConviction ? 0.66 : mediumConviction ? 0.56 : 0.48
    neutralPct = highConviction ? 0.22 : 0.28
    bearishPct = 1 - bullishPct - neutralPct
  } else if (direction === 'bearish') {
    bearishPct = highConviction ? 0.66 : mediumConviction ? 0.56 : 0.48
    neutralPct = highConviction ? 0.22 : 0.28
    bullishPct = 1 - bearishPct - neutralPct
  } else {
    neutralPct = highConviction ? 0.62 : mediumConviction ? 0.56 : 0.5
    bullishPct = mediumConviction ? 0.24 : 0.25
    bearishPct = 1 - neutralPct - bullishPct
  }

  bullishPct = normalizePct(bullishPct)
  neutralPct = normalizePct(neutralPct)
  bearishPct = normalizePct(bearishPct)
  const totalPct = bullishPct + neutralPct + bearishPct || 1
  bullishPct /= totalPct
  neutralPct /= totalPct
  bearishPct /= totalPct

  const scale = 100
  const bullishCount = Math.round(bullishPct * scale)
  const neutralCount = Math.round(neutralPct * scale)
  const bearishCount = Math.max(0, scale - bullishCount - neutralCount)

  return {
    bullishCount,
    neutralCount,
    bearishCount,
    total: bullishCount + neutralCount + bearishCount,
    bullishPct,
    neutralPct,
    bearishPct,
    activePct: Math.round((bullishPct + bearishPct) * 100),
  }
}

function buildRowBiasSnapshot({
  direction,
  conviction,
  composition,
}: {
  direction: RowSignalDirection
  conviction: number | null
  composition?: ScreenerSignalComposition
}): RowBiasSnapshot {
  const source =
    composition && composition.total > 0
      ? composition
      : fallbackCompositionFromRow({ direction, conviction })
  const bullishPct = normalizePct(source.bullishPct)
  const neutralPct = normalizePct(source.neutralPct)
  const bearishPct = normalizePct(source.bearishPct)

  const ranked = (
    [
      { direction: 'bullish' as const, value: bullishPct },
      { direction: 'neutral' as const, value: neutralPct },
      { direction: 'bearish' as const, value: bearishPct },
    ] satisfies Array<{ direction: RowSignalDirection; value: number }>
  ).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value
    const tieBreakOrder: RowSignalDirection[] = ['bullish', 'neutral', 'bearish']
    return tieBreakOrder.indexOf(a.direction) - tieBreakOrder.indexOf(b.direction)
  })
  const bullishLead = bullishPct - Math.max(neutralPct, bearishPct)
  const bearishLead = bearishPct - Math.max(neutralPct, bullishPct)

  let biasCategory: RowBiasCategory = 'balanced'
  let biasLabel = 'Balanced system'
  let description = 'Distribution is mixed with no dominant directional pressure.'

  if (neutralPct >= 0.46) {
    biasCategory = 'neutral-heavy'
    biasLabel = 'Neutral-heavy system'
    description = 'Neutral regimes dominate and limit directional edge.'
  } else if (bullishPct >= 0.42 && bullishLead >= 0.1) {
    biasCategory = 'bullish-biased'
    biasLabel = 'Bullish-biased system'
    description = 'Bullish regimes dominate, with limited downside pressure.'
  } else if (bearishPct >= 0.42 && bearishLead >= 0.1) {
    biasCategory = 'bearish-biased'
    biasLabel = 'Bearish-biased system'
    description = 'Bearish regimes dominate, with limited upside relief.'
  } else if (Math.abs(bullishPct - bearishPct) <= 0.12) {
    biasCategory = 'balanced'
    biasLabel = 'Balanced system'
    description = 'Bullish and bearish pressure are balanced across observations.'
  }

  return {
    bullishPct,
    neutralPct,
    bearishPct,
    dominant: ranked[0]?.direction ?? 'neutral',
    secondary: ranked[1]?.direction ?? 'bullish',
    minor: ranked[2]?.direction ?? 'bearish',
    biasCategory,
    biasLabel,
    description,
    activePct: Math.round((bullishPct + bearishPct) * 100),
  }
}

function bubbleFill(direction: RowSignalDirection): string {
  if (direction === 'bullish') return 'rgba(16, 185, 129, 0.75)'
  if (direction === 'bearish') return 'rgba(244, 63, 94, 0.75)'
  return 'rgba(148, 163, 184, 0.72)'
}

function bubbleRadius(rank: BubbleRank): number {
  if (rank === 'dominant') return 6.6
  if (rank === 'secondary') return 4.4
  return 2.9
}

function bubblePosition(rank: BubbleRank): { cx: number; cy: number } {
  if (rank === 'dominant') return { cx: 17, cy: 11 }
  if (rank === 'secondary') return { cx: 9, cy: 8 }
  return { cx: 25, cy: 15 }
}

function biasFilterLabel(bias: BiasFilter): string {
  if (bias === 'bullish-biased') return 'Bullish-biased'
  if (bias === 'balanced') return 'Balanced'
  if (bias === 'neutral-heavy') return 'Neutral-heavy'
  if (bias === 'bearish-biased') return 'Bearish-biased'
  return 'All'
}

function biasChipActiveClass(bias: BiasFilter): string | undefined {
  if (bias === 'bullish-biased') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (bias === 'balanced') {
    return 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
  }
  if (bias === 'neutral-heavy') {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
  }
  if (bias === 'bearish-biased') {
    return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
  }
  return undefined
}

function MicroBiasBubble({ snapshot }: { snapshot: RowBiasSnapshot }) {
  const byRank: Array<{ direction: RowSignalDirection; rank: BubbleRank }> = [
    { direction: snapshot.minor, rank: 'minor' },
    { direction: snapshot.secondary, rank: 'secondary' },
    { direction: snapshot.dominant, rank: 'dominant' },
  ]
  const tooltip = `${snapshot.biasLabel} · Active ${snapshot.activePct}% · ${snapshot.description}`

  return (
    <div className="inline-flex items-center" title={tooltip} aria-label={tooltip}>
      <svg width="34" height="22" viewBox="0 0 34 22" role="img" aria-hidden="true">
        {byRank.map(({ direction, rank }) => {
          const position = bubblePosition(rank)
          return (
            <circle
              key={`${direction}-${rank}`}
              cx={position.cx}
              cy={position.cy}
              r={bubbleRadius(rank)}
              fill={bubbleFill(direction)}
            />
          )
        })}
      </svg>
    </div>
  )
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<ScreenerSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const signal = parseSignalFilter(singleParam(resolvedSearchParams.signal))
  const bias = parseBiasFilter(singleParam(resolvedSearchParams.bias))
  const minConviction = parseMinConviction(singleParam(resolvedSearchParams.minConviction))
  const textQuery = parseTextQuery(singleParam(resolvedSearchParams.q))
  const sortBy = parseSort(singleParam(resolvedSearchParams.sort))
  const maxAgeDays = parseMaxAgeDays(singleParam(resolvedSearchParams.maxAgeDays))

  const [{ rows, source }, viewer] = await Promise.all([
    getScreenerSignals({
      signal: signal === 'all' ? undefined : signal,
      minConvictionPct: minConviction,
      textQuery: textQuery || undefined,
      maxSignalAgeDays: maxAgeDays > 0 ? maxAgeDays : undefined,
      sortBy,
      limit: 200,
    }),
    getViewerAccess(),
  ])
  const signalCompositionByTicker =
    rows.length > 0 ? await getSignalCompositionByTicker(rows.map((row) => row.ticker), 90) : {}
  const biasByTicker = new Map(
    rows.map((row) => [
      row.ticker,
      buildRowBiasSnapshot({
        direction: row.direction,
        conviction: row.conviction,
        composition: signalCompositionByTicker[row.ticker],
      }),
    ])
  )
  const filteredRows =
    bias === 'all'
      ? rows
      : rows.filter((row) => {
          const snapshot =
            biasByTicker.get(row.ticker) ??
            buildRowBiasSnapshot({ direction: row.direction, conviction: row.conviction })
          return snapshot.biasCategory === bias
        })

  const previewLimit = 3
  const previewRows = viewer.isPro ? filteredRows : filteredRows.slice(0, previewLimit)
  const hiddenCount = viewer.isPro ? 0 : Math.max(0, filteredRows.length - previewLimit)
  const isSpyOnlySource = source === 'spy_signals_live'
  const upgradeUrl = getStripeUpgradeUrl(viewer.userId)
  const upgradeHref = viewer.isSignedIn
    ? upgradeUrl ?? '/dashboard'
    : '/sign-up?redirect_url=/screener'
  const openUpgradeInNewTab = upgradeHref.startsWith('http')

  return (
    <AppShell active="screener" container="lg">
      <div className="section-gap">
        <PageHeader
          title="Signal Screener"
          subtitle="Filter and discover proprietary signals across tracked assets."
          meta={
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Market Scanner
            </span>
          }
          action={
            viewer.isPro ? (
              <FilterChip label="Pro Active" active />
            ) : (
              <a
                href={upgradeHref}
                target={openUpgradeInNewTab ? '_blank' : undefined}
                rel={openUpgradeInNewTab ? 'noopener noreferrer' : undefined}
                className={buttonClass({ variant: 'primary' })}
              >
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {viewer.isSignedIn ? 'Upgrade to Pro' : 'Create Free Account'}
                </span>
              </a>
            )
          }
        />

        {isSpyOnlySource ? (
          <Card>
            <p className="text-body">
              Data source is currently SPY-only. Point your Supabase source to a multi-ticker signals view for full market coverage.
            </p>
          </Card>
        ) : null}
        <TrackEventOnMount
          eventName="use_screener"
          payload={{
            result_count: filteredRows.length,
            signal_filter: signal,
            bias_filter: bias,
          }}
        />
        {bias !== 'all' ? (
          <TrackEventOnMount
            eventName="apply_bias_filter"
            payload={{ bias_type: bias, result_count: filteredRows.length }}
          />
        ) : null}
        <DismissibleLocalHint
          storageKey="spy_signal_onboarding_loop_hint_dismissed_v1"
          text="Start here: Explore a model → tweak it → compare results"
        />
        <DismissibleLocalHint
          storageKey="spy_signal_screener_bias_hint_dismissed_v1"
          text="Use Bias to find systems that match your style"
        />

        <Card className="section-gap" padding="lg">
          <ActionBar align="between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'bullish', 'neutral', 'bearish'] as const).map((chipSignal) => (
                <FilterChip
                  key={chipSignal}
                  label={chipSignal === 'all' ? 'All' : chipSignal[0].toUpperCase() + chipSignal.slice(1)}
                  active={signal === chipSignal}
                  href={buildScreenerHref({
                    signal: chipSignal,
                    bias,
                    minConviction,
                    textQuery,
                    sortBy,
                    maxAgeDays,
                  })}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'bullish-biased', 'balanced', 'neutral-heavy', 'bearish-biased'] as const).map(
                (chipBias) => (
                  <FilterChip
                    key={chipBias}
                    label={biasFilterLabel(chipBias)}
                    active={bias === chipBias}
                    className={bias === chipBias ? biasChipActiveClass(chipBias) : undefined}
                    href={buildScreenerHref({
                      signal,
                      bias: chipBias,
                      minConviction,
                      textQuery,
                      sortBy,
                      maxAgeDays,
                    })}
                  />
                )
              )}
            </div>
            <span className="text-body">
              {viewer.isPro
                ? `Showing ${filteredRows.length} of ${filteredRows.length} rows`
                : `Showing ${previewRows.length} preview rows, ${hiddenCount} blurred`}
            </span>
          </ActionBar>

          <form method="GET" className="grid grid-cols-1 card-gap xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <input type="hidden" name="signal" value={signal} />
            <input type="hidden" name="bias" value={bias} />
            <div>
              <label className="text-filter-label mb-2 block">Ticker or Name</label>
              <Input
                type="text"
                name="q"
                defaultValue={textQuery}
                placeholder="AAPL, QQQ, semiconductors..."
              />
            </div>

            <div>
              <label className="text-filter-label mb-2 block">Min Conviction</label>
              <Input
                type="number"
                min={0}
                max={100}
                name="minConviction"
                defaultValue={minConviction}
              />
            </div>

            <div>
              <label className="text-filter-label mb-2 block">Max Age (days)</label>
              <Input
                type="number"
                min={0}
                max={3650}
                name="maxAgeDays"
                defaultValue={maxAgeDays > 0 ? maxAgeDays : ''}
                placeholder="Any"
              />
            </div>

            <div>
              <label className="text-filter-label mb-2 block">Sort By</label>
              <Select name="sort" defaultValue={sortBy}>
                <option value="conviction">Conviction (High → Low)</option>
                <option value="latest">Most Recent Signal</option>
                <option value="movers">Biggest Daily Movers</option>
                <option value="ticker">Ticker (A → Z)</option>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" className={buttonClass({ variant: 'primary' })}>
                Apply
              </button>
              <Link href="/screener" className={buttonClass({ variant: 'ghost' })}>
                Reset
              </Link>
            </div>
          </form>
        </Card>

        {filteredRows.length === 0 ? (
          <EmptyState
            title={
              bias !== 'all'
                ? `No ${biasFilterLabel(bias).toLowerCase()} systems match your filters.`
                : 'No screener rows found'
            }
            description={
              bias !== 'all'
                ? 'Try clearing the bias filter or broadening your conviction and age filters.'
                : 'Adjust filters or lower the conviction threshold to see matching assets.'
            }
            action={
              bias !== 'all' ? (
                <Link
                  href={buildScreenerHref({
                    signal,
                    bias: 'all',
                    minConviction,
                    textQuery,
                    sortBy,
                    maxAgeDays,
                  })}
                  className={buttonClass({ variant: 'ghost' })}
                >
                  Clear Bias Filter
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <div className="relative hidden md:block">
              <TableShell contentClassName="max-h-[740px]">
                <TableBase className="whitespace-nowrap text-[13px]">
                  <TableHead sticky>
                    <tr>
                      <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'ticker')}>
                        Ticker
                      </TableHeaderCell>
                      <TableHeaderCell>Signal</TableHeaderCell>
                      <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'conviction')}>
                        Conviction
                      </TableHeaderCell>
                      <TableHeaderCell>Bias</TableHeaderCell>
                      <TableHeaderCell>Profile</TableHeaderCell>
                      <TableHeaderCell>Horizon</TableHeaderCell>
                      <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'signal-date')}>
                        Last Signal
                      </TableHeaderCell>
                      <TableHeaderCell>Price</TableHeaderCell>
                      <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'change')}>
                        % Chg
                      </TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row, index) => {
                      const badge = signalBadge(row.direction)
                      const isBlurredRow = !viewer.isPro && index >= previewLimit
                      const shortHeadline = shortSignalHeadline(row.direction, row.conviction)
                      const fullHeadline = signalHeadlineFromInputs(row.direction, row.conviction)
                      const screenerHref = buildStockHref(row.ticker, shortHeadline)
                      const convictionWidth = convictionPercent(row.conviction) ?? 0
                      const profileBars = miniProfileBars({
                        direction: row.direction,
                        conviction: row.conviction,
                        predictionHorizon: row.predictionHorizon,
                        changePercent: row.changePercent,
                      })
                      const biasSnapshot =
                        biasByTicker.get(row.ticker) ??
                        buildRowBiasSnapshot({
                          direction: row.direction,
                          conviction: row.conviction,
                        })
                      return (
                        <TableRow
                          key={`${row.ticker}-${row.signalDate ?? ''}`}
                          index={index}
                          className={isBlurredRow ? 'pointer-events-none select-none' : undefined}
                        >
                          <TableCell className="min-w-[170px] font-semibold">
                            <TrackedLink
                              href={screenerHref}
                              className="text-primary hover:underline"
                              eventName="click_stock_from_screener"
                              eventPayload={{
                                ticker: row.ticker,
                                direction: row.direction,
                                bias_type: bias,
                                entry_source: 'screener',
                                source: 'screener_table_ticker',
                              }}
                            >
                              {row.ticker}
                            </TrackedLink>
                            {row.name ? <div className="text-[12px] text-content-muted">{row.name}</div> : null}
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                                <TrackedLink
                                  href={screenerHref}
                                  className="text-[13px] font-semibold text-neutral-900 hover:text-primary dark:text-neutral-100"
                                  eventName="click_stock_from_screener"
                                  eventPayload={{
                                    ticker: row.ticker,
                                    direction: row.direction,
                                    bias_type: bias,
                                    entry_source: 'screener',
                                    source: 'screener_table_signal',
                                  }}
                                >
                                  {shortHeadline}
                                </TrackedLink>
                              </div>
                              <div className={cn('text-[12px] text-neutral-500 dark:text-neutral-400', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                                {fullHeadline} · {rowSignalQualityLabel(row.direction, row.conviction)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            <div className={cn('space-y-1', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                              <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                <div
                                  className={`h-full rounded-full ${convictionToneClass(row.direction)}`}
                                  style={{ width: `${Math.max(6, convictionWidth)}%` }}
                                />
                              </div>
                              <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatConviction(row.conviction)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[88px]">
                            <div className={cn('inline-flex', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                              <MicroBiasBubble snapshot={biasSnapshot} />
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[126px]">
                            <div className={cn('space-y-1', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                              <div className="flex h-8 items-end gap-1">
                                {profileBars.map((score, profileIndex) => (
                                  <span
                                    key={`${row.ticker}-profile-${profileIndex}`}
                                    className="w-1.5 rounded-t-sm bg-primary/75"
                                    style={{ height: `${Math.max(4, Math.round(score * 0.3))}px` }}
                                  />
                                ))}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">System profile</div>
                            </div>
                          </TableCell>
                          <TableCell muted>
                            <span className={cn(isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                              {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
                            </span>
                          </TableCell>
                          <TableCell muted>
                            <span className={cn(isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                              {formatSignalDate(row.signalDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn(isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                              {formatPrice(row.price)}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              row.changePercent === null
                                ? 'text-content-muted'
                                : row.changePercent >= 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                            }
                          >
                            <span className={cn(isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                              {formatPct(row.changePercent)}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </TableBase>
              </TableShell>

              {!viewer.isPro && hiddenCount > 0 ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background via-background/94 to-transparent px-6 pb-6 pt-28">
                  <Card className="pointer-events-auto section-gap w-full max-w-md text-center">
                    <div className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary">
                      <Lock className="h-3.5 w-3.5" />
                      Premium Preview
                    </div>
                    <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Unlock full signal details</h3>
                    <p className="text-body">
                      See full system profiles, validate these signals, and interact with all {filteredRows.length} rows.
                    </p>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                      See full system profile · Validate these signals · Export deeper research
                    </p>
                    <div>
                      <a
                        href={upgradeHref}
                        target={openUpgradeInNewTab ? '_blank' : undefined}
                        rel={openUpgradeInNewTab ? 'noopener noreferrer' : undefined}
                        className={buttonClass({ variant: 'primary' })}
                      >
                        {viewer.isSignedIn ? 'Upgrade Now' : 'Create Free Account'}
                      </a>
                    </div>
                  </Card>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {previewRows.map((row) => (
                <ScreenerSignalCard key={`${row.ticker}-${row.signalDate ?? ''}`} row={row} />
              ))}
            </div>
          </>
        )}

        {!viewer.isPro && hiddenCount > 0 ? (
          <Card className="section-gap text-center md:hidden">
            <div className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary">
              <Lock className="h-3.5 w-3.5" />
              Premium Preview
            </div>
            <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Unlock full signal details</h3>
            <p className="text-body">
              You are viewing {previewRows.length} preview rows. Upgrade to unlock {hiddenCount} additional tickers and full system profiles.
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              See full system profile · Validate these signals
            </p>
            <div>
              <a
                href={upgradeHref}
                target={openUpgradeInNewTab ? '_blank' : undefined}
                rel={openUpgradeInNewTab ? 'noopener noreferrer' : undefined}
                className={buttonClass({ variant: 'primary' })}
              >
                {viewer.isSignedIn ? 'Upgrade Now' : 'Create Free Account'}
              </a>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  )
}
