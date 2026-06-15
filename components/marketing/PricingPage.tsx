import { Bell, Check, Clock3, Grid3X3, ShieldCheck, TrendingUp } from 'lucide-react'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
  ScribbleNote,
  SectionHeading,
} from '@/components/marketing/site-chrome'
import { HOMEPAGE_FAQ_ITEMS } from '@/components/marketing/site-config'

const planFeatures = [
  'Weekly SPY signal before the open',
  'Full system view and confidence',
  'Condition readings and regime context',
  'Historical signal record',
  'Performance framing',
  'Email updates and alerts',
] as const

const included = [
  {
    title: 'The weekly signal',
    body: 'A single read on direction and posture before the market week begins.',
    icon: TrendingUp,
  },
  {
    title: 'Full system view',
    body: 'See the conditions, confidence, and supporting tape instead of a black box label.',
    icon: Grid3X3,
  },
  {
    title: 'Alerts and updates',
    body: 'Stay synced with the cadence without living inside a trading terminal.',
    icon: Bell,
  },
  {
    title: 'Risk-first design',
    body: 'The product is built to reduce noise, not to manufacture excitement.',
    icon: ShieldCheck,
  },
] as const

export default function PricingPage() {
  return (
    <MarketingPageShell
      activeHref="/pricing"
      eyebrow="Pricing"
      title={
        <>
          Simple access.
          <br />
          Clean workflow.
          <br />
          <span className="text-[#0757ff]">No bloated tiers.</span>
        </>
      }
      description="The pricing page now matches the homepage identity and points people to the weekly signal experience instead of the older Northline presentation."
      primaryCta={{ label: 'Join the lounge', href: '/sign-up' }}
      secondaryCta={{ label: 'Read the FAQ', href: '/faq' }}
      heroAside={
        <GlassPanel className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">Monthly access</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-6xl font-black leading-none">€49</span>
            <span className="pb-2 text-base text-slate-500 dark:text-white/52">/month</span>
          </div>
          <CircleHighlight className="mt-4" tone="orange">
            <HandScript className="text-[2.4rem] leading-none text-[#ff8b2b]">Simple pricing. Real edge.</HandScript>
          </CircleHighlight>
          <p className="mt-3 text-sm text-slate-600 dark:text-white/62">Cancel anytime. Built for one consistent weekly decision.</p>
          <ul className="mt-6 space-y-3">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-[#0757ff] dark:text-[#f8f200]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <ScribbleNote className="mt-6" tone="orange">
            Simple pricing.
            <br />
            Real edge.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Included"
          title="Everything is organized around the weekly signal, not around upsells."
          body="The pricing page now feels like the frontpage: tight message, clearer pathing, and a better visual hierarchy."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {included.map((item) => {
            const Icon = item.icon
            return (
              <GlassPanel key={item.title} className="p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.06] dark:text-[#f8f200]">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">{item.body}</p>
              </GlassPanel>
            )
          })}
        </div>
      </section>

      <section className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="Who it fits"
              title="Best for investors who want a system, not a content feed."
              body="This is a disciplined signal product, not a stream of intraday hot takes."
            />
            <HandScript className="mt-5 block text-[2.2rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
              Calm execution wins.
            </HandScript>
          </div>
          <GlassPanel className="p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-950/8 bg-white/42 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <Clock3 className="size-6 text-[#0757ff] dark:text-[#f8f200]" />
                <h3 className="mt-4 text-lg font-semibold">For calm execution</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">Read the signal before the week starts and avoid chasing the tape mid-session.</p>
              </div>
              <div className="rounded-2xl border border-slate-950/8 bg-white/42 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <ShieldCheck className="size-6 text-[#0757ff] dark:text-[#f8f200]" />
                <h3 className="mt-4 text-lg font-semibold">For risk-aware users</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">The product is centered on discipline and positioning, not on maximizing clicks.</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-6 py-20 sm:px-10">
        <SectionHeading
          eyebrow="Common questions"
          title="A few answers before you subscribe."
          body="The dedicated FAQ page holds the full set. These are the essentials."
          href="/faq"
          label="Open the full FAQ page"
        />
        <div className="mt-8 space-y-4">
          {HOMEPAGE_FAQ_ITEMS.map((item) => (
            <GlassPanel key={item.question} className="p-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 text-slate-600 dark:text-white/62">{item.answer}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
