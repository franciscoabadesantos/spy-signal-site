import Link from 'next/link'
import MarketingShell from '@/components/shells/MarketingShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import SectionHeader from '@/components/ui/SectionHeader'
import HeroProductPreview from '@/components/page/HeroProductPreview'
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

export default async function Home() {
  const { rows } = await getScreenerSignals({ sortBy: 'latest', limit: 60 })
  const visibleRows = rows.slice(0, 12)

  return (
    <MarketingShell active="stocks">
      <section className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="section-gap">
          <div>
            <h1 className="text-page-title text-neutral-900 dark:text-neutral-100 sm:text-4xl">
              Build and test your own investing systems
            </h1>
            <p className="text-body mt-3 max-w-[58ch] text-base">
              Research stocks, explore signals, and validate your ideas with visual backtesting tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className={buttonClass({ variant: 'primary' })}>
              Create free account
            </Link>
            <Link href="/screener" className={buttonClass({ variant: 'secondary' })}>
              Explore stocks
            </Link>
          </div>
        </div>

        <HeroProductPreview />
      </section>

      <section className="section-gap py-4">
        <SectionHeader
          title="How It Works"
          description="A simple workflow from idea generation to repeatable model validation."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              title: 'Research a stock',
              body: 'Inspect price action, signal stance, key metrics, and market context in one place.',
            },
            {
              title: 'Build your model',
              body: 'Define your prompt or signal logic and iterate on what matters for your thesis.',
            },
            {
              title: 'Test and improve it',
              body: 'Validate behavior with backtests and refine assumptions before committing capital.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">{item.title}</h3>
              <p className="text-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-gap py-4">
        <SectionHeader
          title="Product Pillars"
          description="Core surfaces for idea discovery, model building, and evidence-based iteration."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Visual stock research',
              body: 'Unified view of chart context, stance shifts, and key company/fund details.',
            },
            {
              title: 'Screener and signals',
              body: 'Filter assets by conviction, signal type, recency, and market move behavior.',
            },
            {
              title: 'Custom models',
              body: 'Run and compare your own model ideas with repeatable testing workflows.',
            },
            {
              title: 'AI analysis (Pro)',
              body: 'Generate structured catalyst/risk analysis and source-backed research follow-ups.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">{item.title}</h3>
              <p className="text-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-gap py-4">
        <SectionHeader
          title="Live Tracked Assets"
          description="Latest model outputs across currently tracked instruments."
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
                      <TableCell className="font-semibold">
                        <Link href={`/stocks/${row.ticker}`} className="text-primary hover:underline">
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
                            ? 'text-neutral-500'
                            : row.changePercent >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
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

      <section className="section-gap py-4">
        <SectionHeader title="Free vs Pro" description="Choose the right level for your current workflow." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Free</h3>
            <ul className="text-body mt-3 space-y-2">
              <li>Browse all stocks</li>
              <li>Create up to 2 models/day</li>
              <li>Basic watchlist</li>
              <li>Limited backtests</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Pro</h3>
            <ul className="text-body mt-3 space-y-2">
              <li>Unlimited models</li>
              <li>AI analysis</li>
              <li>Advanced backtests</li>
              <li>Exports and alerts</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <Card className="section-gap text-center">
          <h2 className="text-section-title text-neutral-900 dark:text-neutral-100">Start Building Your System</h2>
          <p className="text-body mx-auto max-w-[62ch]">
            Create an account, pick your first ticker, and begin testing how your ideas behave under real market conditions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonClass({ variant: 'primary' })}>
              Create free account
            </Link>
            <Link href="/screener" className={buttonClass({ variant: 'ghost' })}>
              Explore stocks
            </Link>
          </div>
        </Card>
      </section>
    </MarketingShell>
  )
}
