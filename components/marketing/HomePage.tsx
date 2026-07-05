import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'
import HeroSignalNetworkClient from '@/components/page/HeroSignalNetworkClient'
import MarketTicker from '@/components/marketing/MarketTicker'
import RelationshipOrbit from '@/components/RelationshipOrbit'
import ScorecardDisc from '@/components/stocks/ScorecardDisc'
import TickerCard from '@/components/ui/TickerCard'
import { CircleHighlight, HandScript, MarketingHeader } from '@/components/marketing/site-chrome'
import { BRAND_TAGLINE } from '@/components/marketing/site-config'
import { formatMoney } from '@/lib/currency'
import type { StockQuote } from '@/lib/finance'
import type { TickerRelationships } from '@/lib/relationships'
import type { Scorecard } from '@/lib/scorecard-types'
import type { ScreenerSignal } from '@/lib/signals'

export type HomeDemoData = {
  ticker: string
  relationships126: TickerRelationships
  relationships252: TickerRelationships
  scorecard: Scorecard | null
} | null

type MarketingHomePageProps = {
  quotes: StockQuote[]
  heroSignals: ScreenerSignal[]
  demo: HomeDemoData
}

function Hero({ quotes, heroSignals }: { quotes: StockQuote[]; heroSignals: ScreenerSignal[] }) {
  return (
    <section className="relative overflow-hidden bg-white text-slate-950 dark:bg-[#00040a] dark:text-white">
      <MarketingHeader activeHref="/" />
      <div className="h-[100px] md:h-[72px]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1500px] items-center gap-10 px-6 pb-16 pt-10 sm:px-10 md:min-h-[560px] md:grid-cols-[0.9fr_1.1fr] md:pt-14 lg:px-14">
        <div className="relative z-10 max-w-[560px]">
          <h1 className="text-[clamp(2.55rem,5.6vw,4.4rem)] font-black leading-[0.98] tracking-tight">
            See what <span className="block text-[#0757ff]">surrounds</span>
            <span className="block">
              any company<span className="text-[#0757ff]">.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-700 dark:text-white/85 md:text-lg">
            Relationships, themes, technical context and a readable scorecard — explained in plain language. Research,
            not tips.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/stocks"
              className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#0757ff] px-6 font-semibold text-white shadow-[0_0_36px_rgba(7,87,255,0.3)] transition duration-200 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:bg-[#1a66ff] active:translate-y-0 active:scale-[0.96]"
            >
              Explore a company
              <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex h-[52px] items-center justify-center border-b-2 border-slate-950/16 px-1 text-base transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0757ff]/28 hover:text-[#0757ff] dark:border-white/30 dark:hover:text-[#d7dcff]"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Ambient network animation: decorative, pointer-events off so no
            tooltips imply model signals. Static fallback for reduced motion. */}
        <div className="relative hidden min-h-[420px] md:block">
          <div className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
            <HeroSignalNetworkClient signals={heroSignals} />
          </div>
          <div
            className="absolute inset-0 hidden rounded-[32px] bg-[radial-gradient(circle_at_50%_40%,rgba(111,121,255,0.22),transparent_62%)] motion-reduce:block"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-8 sm:px-10 lg:px-14">
        <MarketTicker quotes={quotes} />
      </div>
    </section>
  )
}

function SectionShell({
  eyebrow,
  title,
  accent,
  children,
  className,
}: {
  eyebrow: string
  title: string
  accent?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className ?? 'border-t border-slate-950/10 dark:border-white/10'}>
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#d7dcff]">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">{title}</h2>
        {accent ? <HandScript className="mt-4 block text-xl leading-snug text-accent-text">{accent}</HandScript> : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}

function ActSee({ demo }: { demo: HomeDemoData }) {
  if (!demo) return null
  return (
    <SectionShell
      eyebrow="See"
      title="Every company has a neighborhood."
      accent="Moves together beyond the market."
    >
      <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/62">
        This is the live relationship map for {demo.ticker}. Toggle the layers: residual co-movers, theme peers,
        lead-lag pairs — and the links that are probably just market noise, flagged instead of hidden.
      </p>
      <div className="material-surface rounded-[var(--radius-2xl)] p-4 md:p-6">
        <RelationshipOrbit
          centerTicker={demo.ticker}
          centerName={null}
          relationshipsByWindow={{ 126: demo.relationships126, 252: demo.relationships252 }}
        />
      </div>
    </SectionShell>
  )
}

function ActUnderstand({ demo, quotes }: { demo: HomeDemoData; quotes: StockQuote[] }) {
  const cards = quotes.slice(0, 4)
  return (
    <SectionShell eyebrow="Understand" title="Insight, not prediction." accent={BRAND_TAGLINE}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-white/62">
            Longbrunch never tells you what to buy. It shows you what the data says — a scorecard you can read at a
            glance, technical pressure without the jargon, and a sentence of honest context wherever a number matters.
          </p>
          {demo?.scorecard ? (
            <div className="material-surface mt-8 inline-flex items-center gap-6 rounded-[var(--radius-2xl)] p-6">
              <ScorecardDisc scorecard={demo.scorecard} compact size={150} />
              <div className="max-w-[220px]">
                <div className="text-label-lg text-content-primary">
                  {demo.ticker} · Grade {demo.scorecard.overall.grade}
                </div>
                <p className="text-interpretive mt-2">
                  Each slice is an investment axis; the grade is the summary you can read in a second.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((quote) => (
              <TickerCard
                key={quote.ticker}
                ticker={quote.ticker}
                name={quote.name}
                price={formatMoney(quote.price, 'USD')}
                changePercent={quote.changePercent}
                href={`/stocks/${quote.ticker}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

function ActExperiment() {
  return (
    <SectionShell
      eyebrow="Experiment"
      title="Test your own market theories."
      accent="The lab is where opinions meet data."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-white/62">
          Behind the observatory sits a research lab: define a theory, pick a universe, and let the data answer.
          Experiments come back as readable stories — what you asked, what ran, and what actually happened — with the
          full configuration one click away.
        </p>
        <div className="material-glass relative rounded-[var(--radius-2xl)] p-6">
          <span className="absolute right-4 top-4 rounded-full border border-primary/30 bg-accent-tint px-2.5 py-1 text-micro font-semibold uppercase tracking-wide text-accent-text">
            Preview
          </span>
          <div className="flex items-center gap-2 text-label-md text-content-primary">
            <FlaskConical className="size-4 text-accent-text" aria-hidden="true" />
            Theory
          </div>
          <p className="text-interpretive mt-1.5">Does momentum carry European banks?</p>
          <div className="mt-4 text-label-md text-content-primary">Test</div>
          <p className="text-body-sm mt-1 text-content-secondary">
            38 European banks · 2019–2025 · monthly rebalance · full config inspectable
          </p>
          <div className="mt-4 text-label-md text-content-primary">Verdict</div>
          <p className="text-interpretive mt-1.5">It did — until 2022. Then the pattern quietly broke.</p>
        </div>
      </div>
      <div className="mt-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#d7dcff]"
        >
          Become a member <ArrowRight className="size-4" />
        </Link>
      </div>
    </SectionShell>
  )
}

function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-t border-slate-950/10 bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.16),transparent_38%)] px-6 py-24 text-center dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.22),transparent_38%)] sm:px-10"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#d7dcff]">Pricing</p>
      <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
        Relationships, research, and alerts in one workspace.
      </h2>
      <CircleHighlight className="mt-4" tone="blue">
        <HandScript className="text-xl leading-snug text-accent-text">{BRAND_TAGLINE}</HandScript>
      </CircleHighlight>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/62">
        Full ticker coverage, the relationship map and market network, watchlists, alerts, and research context — in
        plain language, never as tips.
      </p>
      <Link
        href="/sign-up"
        className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]"
      >
        Create account <ArrowRight className="size-5" />
      </Link>
      <div>
        <Link
          href="/pricing"
          className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#d7dcff]"
        >
          Open the full pricing page <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export default function MarketingHomePage({ quotes, heroSignals, demo }: MarketingHomePageProps) {
  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-[#00040a] dark:text-white">
      <Hero quotes={quotes} heroSignals={heroSignals} />
      <ActSee demo={demo} />
      <ActUnderstand demo={demo} quotes={quotes} />
      <ActExperiment />
      <PricingSection />
    </main>
  )
}
