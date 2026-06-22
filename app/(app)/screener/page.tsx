import { Filter, Lock } from 'lucide-react'
import Link from 'next/link'
import TrackedLink from '@/components/analytics/TrackedLink'
import ScreenerSignalCard from '@/components/ScreenerSignalCard'
import OrbitMini from '@/components/stocks/OrbitMini'
import ActionBar from '@/components/page/ActionBar'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import DismissibleLocalHint from '@/components/onboarding/DismissibleLocalHint'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FilterChip from '@/components/ui/FilterChip'
import SignalBlock from '@/components/ui/SignalBlock'
import PremiumPreviewCallout from '@/components/ui/PremiumPreviewCallout'
import PageHeader from '@/components/ui/PageHeader'
import { buttonClass } from '@/components/ui/Button'
import RetryButton from '@/components/ui/RetryButton'
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
import { getScreenerSignals, type ScreenerSort } from '@/lib/signals'
import { getTickerScorecards } from '@/lib/scorecard'
import type { Scorecard } from '@/lib/scorecard-types'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'
import {
  rowSignalQualityLabel,
  shortSignalHeadline,
  signalHeadlineFromInputs,
} from '@/lib/signalSummary'

export const dynamic = 'force-dynamic'

type ScreenerSearchParams = {
  signal?: string | string[]
  minConviction?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  maxAgeDays?: string | string[]
}

type SignalDirection = 'all' | 'bullish' | 'neutral' | 'bearish'

type ScreenerRowWithScorecard = Awaited<ReturnType<typeof getScreenerSignals>>['rows'][number] & {
  scorecard: Scorecard
}

type QuickFilterPreset = {
  label: string
  signal: SignalDirection
  minConviction: number
  sortBy: ScreenerSort
  maxAgeDays: number
  textQuery?: string
}

const QUICK_FILTER_PRESETS: QuickFilterPreset[] = [
  {
    label: 'High Conviction Bulls',
    signal: 'bullish',
    minConviction: 70,
    sortBy: 'conviction',
    maxAgeDays: 0,
  },
  {
    label: 'Fresh Signals',
    signal: 'all',
    minConviction: 0,
    sortBy: 'latest',
    maxAgeDays: 5,
  },
  {
    label: 'Bearish Momentum',
    signal: 'bearish',
    minConviction: 55,
    sortBy: 'latest',
    maxAgeDays: 21,
  },
  {
    label: 'Big Movers',
    signal: 'all',
    minConviction: 0,
    sortBy: 'movers',
    maxAgeDays: 7,
  },
]

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseSignalFilter(raw: string | undefined): SignalDirection {
  if (raw === 'bullish' || raw === 'neutral' || raw === 'bearish') return raw
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
  minConviction,
  textQuery,
  sortBy,
  maxAgeDays,
}: {
  signal: SignalDirection
  minConviction: number
  textQuery: string
  sortBy: ScreenerSort
  maxAgeDays: number
}): string {
  const params = new URLSearchParams()
  if (signal !== 'all') params.set('signal', signal)
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

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<ScreenerSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const signal = parseSignalFilter(singleParam(resolvedSearchParams.signal))
  const minConviction = parseMinConviction(singleParam(resolvedSearchParams.minConviction))
  const textQuery = parseTextQuery(singleParam(resolvedSearchParams.q))
  const sortBy = parseSort(singleParam(resolvedSearchParams.sort))
  const maxAgeDays = parseMaxAgeDays(singleParam(resolvedSearchParams.maxAgeDays))
  const viewer = await getViewerAccess()

  let rowsError: string | null = null
  let rows: Awaited<ReturnType<typeof getScreenerSignals>>['rows'] = []

  try {
    const result = await getScreenerSignals({
      signal: signal === 'all' ? undefined : signal,
      minConvictionPct: minConviction,
      textQuery: textQuery || undefined,
      maxSignalAgeDays: maxAgeDays > 0 ? maxAgeDays : undefined,
      sortBy,
      limit: 200,
    })
    rows = result.rows
  } catch (error) {
    rowsError = error instanceof Error ? error.message : 'Failed to load screener data.'
  }

  const previewLimit = 3
  const scorecardsByTicker = await getTickerScorecards(rows.map((row) => row.ticker))
  const rowsWithScorecards: ScreenerRowWithScorecard[] = rows.map((row) => ({
    ...row,
    scorecard: scorecardsByTicker[row.ticker],
  })).filter((row): row is ScreenerRowWithScorecard => Boolean(row.scorecard))
  const previewRows = viewer.isPro ? rowsWithScorecards : rowsWithScorecards.slice(0, previewLimit)
  const hiddenCount = viewer.isPro ? 0 : Math.max(0, rows.length - previewLimit)
  const upgradeUrl = getStripeUpgradeUrl(viewer.userId)
  const upgradeHref = viewer.isSignedIn ? upgradeUrl ?? '/dashboard' : '/sign-up?redirect_url=/screener'
  const openUpgradeInNewTab = upgradeHref.startsWith('http')

  return (
    <div className="container-lg">
      <div className="section-gap">
        <PageHeader
          title="Signals"
          subtitle="Rank the strongest live signals, filter the tape, and drill into what changed."
          meta={
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Live ranking
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

        {rowsError ? (
          <EmptyState
            title="Signal data is temporarily unavailable"
            description="The frontend could not load live signal rows from finance-backend. Try again shortly."
            action={<RetryButton>Retry</RetryButton>}
          />
        ) : (
          <>
            <TrackEventOnMount
              eventName="use_screener"
              payload={{
                result_count: rows.length,
                signal_filter: signal,
              }}
            />
            <DismissibleLocalHint
              storageKey="spy_signal_onboarding_loop_hint_dismissed_v1"
              text="Start here: rank the tape → open a ticker → add it to watchlist"
            />

            <div className="emphasis-secondary p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-filter-label">Quick Filters</span>
                {QUICK_FILTER_PRESETS.map((preset) => (
                  <Link
                    key={preset.label}
                    href={buildScreenerHref({
                      signal: preset.signal,
                      minConviction: preset.minConviction,
                      textQuery: preset.textQuery ?? '',
                      sortBy: preset.sortBy,
                      maxAgeDays: preset.maxAgeDays,
                    })}
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  >
                    {preset.label}
                  </Link>
                ))}
              </div>
            </div>

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
                        minConviction,
                        textQuery,
                        sortBy,
                        maxAgeDays,
                      })}
                    />
                  ))}
                </div>
                <span className="text-body">
                  {viewer.isPro
                    ? `Showing ${rows.length} of ${rows.length} rows`
                    : `Showing ${previewRows.length} preview rows, ${hiddenCount} blurred`}
                </span>
              </ActionBar>

              <form method="GET" className="grid grid-cols-1 card-gap xl:grid-cols-[2fr_1fr_1fr_auto]">
                <input type="hidden" name="signal" value={signal} />
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

                <div className="flex items-end gap-2 xl:col-span-4">
                  <button type="submit" className={buttonClass({ variant: 'primary' })}>
                    Apply
                  </button>
                  <Link href="/screener" className={buttonClass({ variant: 'ghost' })}>
                    Reset
                  </Link>
                </div>
              </form>
            </Card>

            {rows.length === 0 ? (
              <EmptyState
                title="No signals found"
                description="finance-backend returned no live rows for the current filters."
              />
            ) : (
              <>
                <div className="relative hidden md:block">
                  <TableShell contentClassName="max-h-[740px]">
                    <TableBase className="whitespace-nowrap text-body-sm">
                      <TableHead sticky>
                        <tr>
                          <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'ticker')}>
                            Ticker
                          </TableHeaderCell>
                          <TableHeaderCell>Signal</TableHeaderCell>
                          <TableHeaderCell sortable sortDirection={sortDirectionFor(sortBy, 'conviction')}>
                            Conviction
                          </TableHeaderCell>
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
                        {rowsWithScorecards.map((row, index) => {
                          const isBlurredRow = !viewer.isPro && index >= previewLimit
                          const shortHeadline = shortSignalHeadline(row.direction, row.conviction)
                          const fullHeadline = signalHeadlineFromInputs(row.direction, row.conviction)
                          const screenerHref = buildStockHref(row.ticker, shortHeadline)
                          return (
                            <TableRow
                              key={`${row.ticker}-${row.signalDate ?? ''}`}
                              index={index}
                              className={isBlurredRow ? 'pointer-events-none select-none' : undefined}
                            >
                              <TableCell className="text-label-lg min-w-[170px]">
                                <TrackedLink
                                  href={screenerHref}
                                  className="state-interactive rounded-[var(--radius-xs)] text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 focus-visible:ring-offset-page-bg"
                                  eventName="click_stock_from_screener"
                                  eventPayload={{
                                    ticker: row.ticker,
                                    direction: row.direction,
                                    entry_source: 'screener',
                                    source: 'screener_table_ticker',
                                  }}
                                >
                                  {row.ticker}
                                </TrackedLink>
                                {row.name ? <div className="text-caption text-content-muted">{row.name}</div> : null}
                              </TableCell>
                              <TableCell className="min-w-[220px]">
                                <div className="space-y-1">
                                  <div className={cn(isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                                    <SignalBlock
                                      direction={row.direction}
                                      conviction={row.conviction}
                                      compact
                                      showLabel={false}
                                    />
                                  </div>
                                  <TrackedLink
                                    href={screenerHref}
                                    className="state-interactive text-label-md rounded-[var(--radius-xs)] text-content-primary hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 focus-visible:ring-offset-page-bg"
                                    eventName="click_stock_from_screener"
                                    eventPayload={{
                                      ticker: row.ticker,
                                      direction: row.direction,
                                      entry_source: 'screener',
                                      source: 'screener_table_signal',
                                    }}
                                  >
                                    {shortHeadline}
                                  </TrackedLink>
                                  <div className={cn('text-caption text-content-muted', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                                    {fullHeadline} · {rowSignalQualityLabel(row.direction, row.conviction)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[140px]">
                                <span className={cn('text-data-sm numeric-tabular text-content-primary', isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                                  {formatConviction(row.conviction)}
                                </span>
                              </TableCell>
                              <TableCell className="min-w-[126px]">
                                <div className={cn('space-y-1', isBlurredRow ? 'blur-[2px] opacity-65' : undefined)}>
                                  <OrbitMini scorecard={row.scorecard} size={40} />
                                  <div className="text-micro text-content-muted">Scorecard</div>
                                </div>
                              </TableCell>
                              <TableCell muted>
                                <span className={cn('numeric-tabular', isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                                  {row.predictionHorizon === null ? '—' : `${row.predictionHorizon}d`}
                                </span>
                              </TableCell>
                              <TableCell muted>
                                <span className={cn('numeric-tabular', isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                                  {formatSignalDate(row.signalDate)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={cn('numeric-tabular', isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
                                  {formatPrice(row.price)}
                                </span>
                              </TableCell>
                              <TableCell
                                className={
                                  row.changePercent === null
                                    ? 'text-content-muted'
                                    : row.changePercent >= 0
                                      ? 'signal-bullish'
                                      : 'signal-bearish'
                                }
                              >
                                <span className={cn('numeric-tabular', isBlurredRow ? 'inline-block blur-[2px] opacity-65' : undefined)}>
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
                      <PremiumPreviewCallout
                        className="pointer-events-auto section-gap w-full max-w-md text-center"
                        title="Unlock full signal details"
                        description={`See full system profiles, validate these signals, and interact with all ${rows.length} rows.`}
                        details="Derived profile · Full row access · Export deeper research"
                        ctaHref={upgradeHref}
                        ctaLabel={viewer.isSignedIn ? 'Upgrade Now' : 'Create Free Account'}
                        openInNewTab={openUpgradeInNewTab}
                      />
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
              <PremiumPreviewCallout
                className="section-gap text-center md:hidden"
                title="Unlock full signal details"
                description={`You are viewing ${previewRows.length} preview rows. Upgrade to unlock ${hiddenCount} additional tickers and full row access.`}
                details="Derived profile · Full row access"
                ctaHref={upgradeHref}
                ctaLabel={viewer.isSignedIn ? 'Upgrade Now' : 'Create Free Account'}
                openInNewTab={openUpgradeInNewTab}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
