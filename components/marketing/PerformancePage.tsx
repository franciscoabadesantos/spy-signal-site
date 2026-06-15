import { Activity, ArrowUpRight, CalendarDays, ShieldCheck, Target } from 'lucide-react'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
  ScribbleNote,
  SectionHeading,
} from '@/components/marketing/site-chrome'

const proofStats = [
  { label: 'Live since', value: 'Jan 2018', icon: CalendarDays },
  { label: 'Signal cadence', value: 'Weekly before the open', icon: Activity },
  { label: 'Risk posture', value: 'Capital first', icon: ShieldCheck },
  { label: 'Decision style', value: 'One clear trade view', icon: Target },
] as const

const metrics = [
  { label: 'Annualized return', system: '17.3%', benchmark: '9.1%' },
  { label: 'Max drawdown', system: '-20.2%', benchmark: '-33.9%' },
  { label: 'Sharpe ratio', system: '0.95', benchmark: '0.55' },
  { label: 'Average exposure', system: '45%', benchmark: '100%' },
] as const

const cycleCards = [
  { phase: '2020 crash', takeaway: 'De-risked faster than buy and hold.', tone: 'text-[#ff8b2b]' },
  { phase: '2022 inflation shock', takeaway: 'Stayed disciplined while volatility expanded.', tone: 'text-[#ff8b2b]' },
  { phase: 'Current regime', takeaway: 'Reads the weekly tape without intraday churn.', tone: 'text-[#0757ff]' },
] as const

export default function PerformancePage() {
  return (
    <MarketingPageShell
      activeHref="/performance"
      eyebrow="Performance"
      title={
        <>
          The edge is not
          <br />
          trading more.
          <br />
          <span className="text-[#0757ff]">It is seeing the week clearly.</span>
        </>
      }
      description="Longbrunch is built to identify the important weeks, step back when conditions worsen, and avoid turning the product into another live-noise dashboard."
      primaryCta={{ label: 'View current signal', href: '/screener' }}
      secondaryCta={{ label: 'Read the method', href: '/method' }}
      heroAside={
        <GlassPanel className="p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {proofStats.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-slate-950/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <Icon className="size-5 text-[#0757ff] dark:text-[#f8f200]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                </div>
              )
            })}
          </div>
          <CircleHighlight className="mt-6" tone="orange">
            <HandScript className="text-[2.2rem] leading-none text-[#ff8b2b]">Big weeks. Clear bias.</HandScript>
          </CircleHighlight>
          <ScribbleNote className="mt-6" tone="blue">
            Big weeks.
            <br />
            Calm execution.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Performance frame"
          title="A system should outperform by avoiding bad participation, not by forcing activity."
          body="These numbers come from the older performance page, but the presentation now matches the frontpage identity."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <GlassPanel key={item.label} className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">{item.label}</p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-3xl font-black text-[#0757ff]">{item.system}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-white/62">Longbrunch</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-slate-500 dark:text-white/54">{item.benchmark}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-white/48">Buy &amp; hold</div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="Cycle behavior"
              title="The behavior matters more than a headline number."
              body="The value is in how the signal behaves during expansion, stress, and recovery."
            />
          </div>
          <div className="grid gap-5">
            {cycleCards.map((item) => (
              <GlassPanel key={item.phase} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">{item.phase}</p>
                    <p className="mt-3 text-xl font-semibold">{item.takeaway}</p>
                  </div>
                  <ArrowUpRight className={`size-6 ${item.tone}`} />
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <GlassPanel className="grid gap-6 p-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">What to expect</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Not constant action. Cleaner participation.</h2>
            <HandScript className="mt-4 block text-[2.2rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
              Less churn. Better timing.
            </HandScript>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-white/62">
              The product is designed around a single weekly signal, not endless switches. That is part of the edge and part of the brand.
            </p>
          </div>
          <ScribbleNote tone="orange">
            Fewer decisions.
            <br />
            Better timing.
          </ScribbleNote>
        </GlassPanel>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
