import { Bell, Check, Clock3, Eye, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
} from '@/components/marketing/site-chrome'

const planFeatures = [
  'Weekly SPY signal before the open',
  'Full system view and confidence',
  'Condition readings and regime context',
  'Historical signal record',
  'Email updates and alerts',
] as const

const valuePillars = [
  {
    title: 'Before the open, every week',
    body: 'The signal lands every Sunday so your decision is made ahead of the week, not chased mid-session.',
    icon: Clock3,
  },
  {
    title: 'The whole system, not a label',
    body: 'See the direction, the confidence, and the supporting tape — never a black-box one-word call.',
    icon: Eye,
  },
  {
    title: 'A record you can check',
    body: 'Every past signal stays on file, so the track record is something you read, not something we claim.',
    icon: ShieldCheck,
  },
  {
    title: 'Quiet by design',
    body: 'Email when it matters, nothing when it does not. The product is built to remove noise, not add to it.',
    icon: Bell,
  },
] as const

export default function PricingPage() {
  return (
    <MarketingPageShell
      activeHref="/pricing"
      eyebrow="Pricing"
      title={
        <>
          One plan.
          <br />
          One price.
          <br />
          <span className="text-[#0757ff]">Everything in it.</span>
        </>
      }
      description="Longbrunch is a single subscription with a single job: the weekly signal, before the open. No tiers to compare, nothing to upsell."
      primaryCta={{ label: 'Join the lounge', href: '/sign-up' }}
      secondaryCta={{ label: 'Read the FAQ', href: '/faq' }}
      heroAside={
        <GlassPanel className="p-7 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">
            Monthly access
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-6xl font-black leading-none tracking-tight">€49</span>
            <span className="pb-2 text-base text-slate-500 dark:text-white/52">/month</span>
          </div>
          <CircleHighlight className="mt-4" tone="orange">
            <HandScript className="text-[2.1rem] leading-none text-[#ff8b2b]">Simple pricing. Real edge.</HandScript>
          </CircleHighlight>
          <ul className="mt-7 space-y-3.5">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[0.97rem] leading-6">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.08] dark:text-[#f8f200]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="group mt-7 inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0757ff] px-6 font-semibold text-white shadow-[0_0_36px_rgba(7,87,255,0.26)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#1a66ff] active:translate-y-0 active:scale-[0.99]"
          >
            Start this Sunday
            <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-white/45">
            Cancel anytime. No tiers, no add-ons.
          </p>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1100px] px-6 py-20 sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">
            What you get
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">What the forty-nine euros buys.</h2>
          <HandScript className="mt-4 block text-[2.15rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
            Everything. One price.
          </HandScript>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {valuePillars.map((item) => {
            const Icon = item.icon
            return (
              <GlassPanel key={item.title} className="p-6 sm:p-7">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.06] dark:text-[#f8f200]">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">{item.body}</p>
              </GlassPanel>
            )
          })}
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
