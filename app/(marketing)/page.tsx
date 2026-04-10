import Link from 'next/link'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import TrackedLink from '@/components/analytics/TrackedLink'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import SectionHeader from '@/components/ui/SectionHeader'
import HeroSignalNetworkClient from '@/components/page/HeroSignalNetworkClient'
import { SAMPLE_MODEL_ID } from '@/lib/model-samples'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
  TableEmptyRow,
} from '@/components/ui/DataTable'
import { getScreenerSignals } from '@/lib/signals'

export const dynamic = 'force-dynamic'

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

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function signalMeta(direction: 'bullish' | 'neutral' | 'bearish'): { label: string; variant: 'success' | 'danger' | 'neutral' } {
  if (direction === 'bullish') return { label: 'Bullish', variant: 'success' }
  if (direction === 'bearish') return { label: 'Bearish', variant: 'danger' }
  return { label: 'Neutral', variant: 'neutral' }
}

const HERO_COPY = {
  headline: 'Catch regime shifts before they hit your allocation',
  body: 'Monitor conviction, stability, and confirmation in one workflow built for position timing.',
}

/*
  Hero copy options explored:
  1) "Validate systems with live conviction signals"
     "Inspect a stock, understand regime behavior, and verify price confirmation before allocating capital."
  2) "Inspect market systems, not stock stories"
     "Read stance shifts, stability, and validation evidence in one workflow built for model decisions."
  3) "SpySignal for system builders"
     "Track conviction, test behavior, and pressure-test signal quality before committing risk."
*/

export default async function Home() {
  const { rows } = await getScreenerSignals({ sortBy: 'latest', limit: 320 })
  const networkRows = rows.slice(0, 260)
  const visibleRows = rows.slice(0, 12)

  return (
    <>
      <section className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.5fr)] lg:items-center">
        <TrackEventOnMount eventName="view_homepage" />
        <div className="surface-primary section-gap">
          <div>
            <h1 className="text-heading-xl text-content-primary">
              {HERO_COPY.headline}
            </h1>
            <p className="text-body-md mt-3 max-w-[58ch] text-content-secondary">
              {HERO_COPY.body}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className={buttonClass({ variant: 'primary' })}>
              Create free account
            </Link>
            <TrackedLink
              href={`/models/${SAMPLE_MODEL_ID}?from=homepage_sample`}
              className={buttonClass({ variant: 'secondary' })}
              eventName="click_sample_model"
              eventPayload={{ model_id: SAMPLE_MODEL_ID, source: 'homepage', entry_source: 'homepage_sample' }}
            >
              Try a sample model
            </TrackedLink>
            <Link href="/screener" className={buttonClass({ variant: 'ghost' })}>
              Inspect live systems
            </Link>
          </div>
        </div>

        <div className="lg:-mr-16 xl:-mr-28">
          <HeroSignalNetworkClient signals={networkRows} />
        </div>
      </section>

      <section className="section-gap rounded-[var(--radius-xl)] border border-border bg-[radial-gradient(circle_at_top_right,var(--brand-electric-glow),transparent_70%)] p-6">
        <SectionHeader
          title="How It Works"
          description="From ticker inspection to signal validation and model iteration."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Inspect a stock',
              body: 'Read live price structure, latest stance, and conviction without changing views.',
            },
            {
              title: 'Understand behavior',
              body: 'See flip cadence, regime stability, and system profile dimensions in context.',
            },
            {
              title: 'Validate the signal',
              body: 'Use backtest evidence and confirmation checks before increasing exposure.',
            },
            {
              title: 'Build your model',
              body: 'Custom model workflows are expanding; validate ideas with today’s tooling first.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-card-title text-content-primary">{item.title}</h3>
              <p className="text-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-gap-product py-5">
        <SectionHeader
          title="Product Pillars"
          description="Core surfaces for system inspection, validation, and model-building direction."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Signal inspection',
              body: 'Unified view of chart context, stance shifts, and conviction state.',
            },
            {
              title: 'System behavior',
              body: 'Track flip cadence, regime persistence, and stability signals over time.',
            },
            {
              title: 'Validation surfaces',
              body: 'Use backtests, performance snapshots, and exports to challenge assumptions.',
            },
            {
              title: 'Model builder direction',
              body: 'Builder tooling is being expanded for custom systems and richer test workflows.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-card-title text-content-primary">{item.title}</h3>
              <p className="text-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-gap-product py-4">
        <SectionHeader
          title="Live Tracked Assets"
          description="Latest stance and conviction across actively tracked instruments."
          action={
            <Link href="/screener" className={buttonClass({ variant: 'secondary' })}>
              Explore More
            </Link>
          }
        />

        <TableShell>
          <TableBase className="whitespace-nowrap">
            <TableHead sticky>
              <tr>
                <TableHeaderCell>Ticker</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Signal</TableHeaderCell>
                <TableHeaderCell>Conviction</TableHeaderCell>
                <TableHeaderCell>Last Signal</TableHeaderCell>
                <TableHeaderCell>% Chg</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableEmptyRow colSpan={6} title="No tracked assets available yet." />
              ) : (
                visibleRows.map((row, index) => {
                  const signal = signalMeta(row.direction)
                  return (
                    <TableRow key={`${row.ticker}-${row.signalDate ?? ''}`} index={index}>
                      <TableCell className="text-label-lg">
                        <Link href={`/stocks/${row.ticker}`} className="text-accent-text hover:underline">
                          {row.ticker}
                        </Link>
                      </TableCell>
                      <TableCell muted>{row.name ?? 'Tracked asset'}</TableCell>
                      <TableCell>
                        <Badge variant={signal.variant}>{signal.label}</Badge>
                      </TableCell>
                      <TableCell>{formatConviction(row.conviction)}</TableCell>
                      <TableCell muted>{formatSignalDate(row.signalDate)}</TableCell>
                      <TableCell
                        className={
                          row.changePercent === null
                            ? 'text-content-muted'
                            : row.changePercent >= 0
                              ? 'signal-bullish'
                              : 'signal-bearish'
                        }
                      >
                        {formatPct(row.changePercent)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </TableBase>
        </TableShell>
      </section>

      <section className="section-gap rounded-[var(--radius-xl)] border border-border bg-[radial-gradient(circle_at_bottom_left,var(--signal-bullish-glow),transparent_68%)] p-6">
        <SectionHeader title="Free vs Pro" description="Free gives full discovery and core validation; Pro scales the workflow." />
        <p className="text-body">
          Discovery is not paywalled: Free users can inspect assets, read signals, and run meaningful early validation.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-card-title text-content-primary">Free</h3>
            <ul className="text-body mt-3 space-y-2">
              <li>Browse tracked assets and inspect live stance/conviction</li>
              <li>Create up to 2 models/day</li>
              <li>Watchlist and core system context</li>
              <li>Starter backtest and validation views</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-card-title text-content-primary">Pro</h3>
            <ul className="text-body mt-3 space-y-2">
              <li>Higher model and workflow scale</li>
              <li>AI analyst and deeper thesis review</li>
              <li>Advanced validation depth and history access</li>
              <li>Alerts, exports, and operational tooling</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="section-gap-marketing py-8">
        <Card className="section-gap text-center" padding="lg">
          <h2 className="text-section-title text-content-primary">Start Building Your System</h2>
          <p className="text-body mx-auto max-w-[62ch]">
            Create an account, inspect your first ticker, and validate system behavior with live evidence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonClass({ variant: 'primary' })}>
              Create free account
            </Link>
            <Link href="/screener" className={buttonClass({ variant: 'ghost' })}>
              Inspect live systems
            </Link>
          </div>
        </Card>
      </section>
    </>
  )
}
