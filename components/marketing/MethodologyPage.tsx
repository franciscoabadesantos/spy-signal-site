import { Activity, BarChart3, Database, GitBranch, ShieldCheck, SlidersHorizontal, Target, TrendingUp } from 'lucide-react'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
  ScribbleNote,
  SectionHeading,
} from '@/components/marketing/site-chrome'

const methodSteps = [
  {
    title: 'Canonical daily data',
    body: 'Prices, fundamentals, earnings and macro context are collected daily into one consistent dataset across US, European and Asia-Pacific markets.',
    icon: Database,
  },
  {
    title: 'Relationships, computed honestly',
    body: 'Co-movement is separated from what the whole market is doing, so a link means something specific — and likely-spurious links are flagged instead of hidden.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Readable scores',
    body: 'Technical pressure and the scorecard compress many indicators into a view you can read in seconds, with every input inspectable underneath.',
    icon: GitBranch,
  },
  {
    title: 'No black boxes',
    body: 'Every claim on the site traces back to data you can see. If the data is missing, we show nothing rather than something invented.',
    icon: ShieldCheck,
  },
] as const

const dimensions = [
  { title: 'Momentum', body: 'Strength and persistence of price trend.', icon: TrendingUp },
  { title: 'Macro regime', body: 'Growth, inflation, and policy backdrop.', icon: BarChart3 },
  { title: 'Volatility', body: 'Stress and compression across the tape.', icon: Activity },
  { title: 'Liquidity', body: 'Whether the market can support risk cleanly.', icon: Target },
] as const

export default function MethodologyPage() {
  return (
    <MarketingPageShell
      activeHref="/method"
      eyebrow="Method"
      title={
        <>
          The page feels simple
          <br />
          because the pipeline
          <br />
          <span className="text-[#0757ff]">does the hard work first.</span>
        </>
      }
      description="How Longbrunch turns daily market data into relationships, scores and plain-language context you can actually verify."
      primaryCta={{ label: 'Explore a company', href: '/stocks' }}
      secondaryCta={{ label: 'See the market map', href: '/markets/network' }}
      heroAside={
        <GlassPanel className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#d7dcff]">The pipeline</p>
          <div className="mt-5 grid gap-3">
            {['Daily market data', 'Reusable features', 'Relationship map', 'Readable scores'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-950/8 bg-white/42 px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03]">
                {item}
              </div>
            ))}
          </div>
          <CircleHighlight className="mt-6" tone="blue">
            <HandScript className="text-xl leading-snug text-accent-text">Data in. Clarity out.</HandScript>
          </CircleHighlight>
          <ScribbleNote className="mt-6" tone="blue">
            Inspectable.
            <br />
            End to end.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Pipeline"
          title="From raw prices to readable context, one honest step at a time."
          body="Each stage of the pipeline has one job, and each output stays inspectable — that is what makes plain language trustworthy."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {methodSteps.map((step) => {
            const Icon = step.icon
            return (
              <GlassPanel key={step.title} className="p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.06] dark:text-[#d7dcff]">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">{step.body}</p>
              </GlassPanel>
            )
          })}
        </div>
      </section>

      <section className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="Inputs"
              title="A handful of dimensions matter more than a wall of indicators."
              body="Each dimension has one job in the read: confirm trend, spot stress, or flag deteriorating participation."
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {dimensions.map((item) => {
              const Icon = item.icon
              return (
                <GlassPanel key={item.title} className="p-6">
                  <Icon className="size-6 text-[#0757ff] dark:text-[#d7dcff]" />
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">{item.body}</p>
                </GlassPanel>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <GlassPanel className="grid gap-6 p-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#d7dcff]">Output</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Context you can verify, not conclusions you must trust.</h2>
            <HandScript className="mt-4 block text-xl leading-snug text-accent-text">
              Every claim traces back to data.
            </HandScript>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-white/62">
              The output is a map of what surrounds a company — relationships with strength and confidence, scores with inputs you can open, and honest silence where data is missing.
            </p>
          </div>
          <ScribbleNote tone="blue">
            Strength.
            <br />
            Confidence.
          </ScribbleNote>
        </GlassPanel>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
