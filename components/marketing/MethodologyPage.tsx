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
    title: 'Read the tape',
    body: 'Trend, breadth, volatility, liquidity, and macro regime are reviewed together instead of in isolation.',
    icon: Database,
  },
  {
    title: 'Compress the noise',
    body: 'The framework reduces a lot of market information into a single weekly decision layer.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Publish before the open',
    body: 'The final bias is delivered before the week starts so execution stays calm and pre-committed.',
    icon: GitBranch,
  },
  {
    title: 'Protect capital',
    body: 'When the tape degrades, the system is built to reduce risk rather than rationalize exposure.',
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
          The signal feels simple
          <br />
          because the framework
          <br />
          <span className="text-[#0757ff]">does the compression for you.</span>
        </>
      }
      description="The method page now follows the homepage tone: electric blue emphasis, glass surfaces, and handwritten notes around a clear weekly workflow."
      primaryCta={{ label: 'See current signal', href: '/screener' }}
      secondaryCta={{ label: 'See performance', href: '/performance' }}
      heroAside={
        <GlassPanel className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">Signal recipe</p>
          <div className="mt-5 grid gap-3">
            {['Trend', 'Breadth', 'Volatility', 'Liquidity', 'Regime'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-950/8 bg-white/42 px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03]">
                {item}
              </div>
            ))}
          </div>
          <CircleHighlight className="mt-6" tone="blue">
            <HandScript className="text-[2.15rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">Live tape. No noise.</HandScript>
          </CircleHighlight>
          <ScribbleNote className="mt-6" tone="blue">
            Live tape.
            <br />
            Real time.
            <br />
            No noise.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Workflow"
          title="A fixed weekly process keeps emotion out of the execution layer."
          body="The old methodology content was dense and separated from the brand. This version keeps the process visible without breaking the homepage feel."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {methodSteps.map((step) => {
            const Icon = step.icon
            return (
              <GlassPanel key={step.title} className="p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.06] dark:text-[#f8f200]">
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
              body="Each dimension has one job in the weekly read: confirm trend, spot stress, or flag deteriorating participation."
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {dimensions.map((item) => {
              const Icon = item.icon
              return (
                <GlassPanel key={item.title} className="p-6">
                  <Icon className="size-6 text-[#0757ff] dark:text-[#f8f200]" />
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">Output</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">One weekly stance, not a thousand intraday temptations.</h2>
            <HandScript className="mt-4 block text-[2.15rem] leading-none text-[#ff8b2b]">
              Compress the noise.
            </HandScript>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-white/62">
              The final output is a clean bias and confidence view. That is why the product identity works when the design stays focused.
            </p>
          </div>
          <ScribbleNote tone="orange">
            One trade.
            <br />
            One edge.
          </ScribbleNote>
        </GlassPanel>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
