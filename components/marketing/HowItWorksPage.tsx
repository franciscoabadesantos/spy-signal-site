import { ArrowRight, CheckCircle2, Clock3, Sparkles, Target, Zap } from 'lucide-react'
import Link from 'next/link'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
  ScribbleNote,
  SectionHeading,
} from '@/components/marketing/site-chrome'

const steps = [
  {
    title: 'The model reads the weekly tape',
    body: 'Longbrunch pulls market context into one framework instead of forcing you to read five different dashboards.',
    icon: Sparkles,
  },
  {
    title: 'The signal is published before the open',
    body: 'You get the weekly view before the market starts instead of while the tape is already moving.',
    icon: Clock3,
  },
  {
    title: 'You execute one clear stance',
    body: 'Long, defensive, or neutral. The goal is a cleaner decision, not more interaction.',
    icon: Target,
  },
] as const

const whatYouGet = [
  'Weekly direction and confidence',
  'Market bias and supporting context',
  'A calmer workflow before Monday starts',
] as const

export default function HowItWorksPage() {
  return (
    <MarketingPageShell
      activeHref="/how-it-works"
      eyebrow="How it works"
      title={
        <>
          Read the tape.
          <br />
          Get the signal.
          <br />
          <span className="text-[#0757ff]">Start the week prepared.</span>
        </>
      }
      description="Longbrunch turns a broad weekly market read into one SPY signal, supporting context, and a calmer execution workflow."
      primaryCta={{ label: 'View current signal', href: '/screener' }}
      secondaryCta={{ label: 'Read the method', href: '/method' }}
      heroAside={
        <GlassPanel className="p-7">
          <div className="rounded-[26px] border border-[#ff8b2b]/35 bg-[#ff8b2b]/8 p-5 dark:bg-[#ff8b2b]/10">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/70 text-[#ff8b2b] dark:bg-white/[0.08]">
              <Zap className="size-6" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">One trade card.</h2>
            <HandScript className="mt-4 block text-[2.2rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
              Start the week prepared.
            </HandScript>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">
              The product is built to keep the weekly decision clear, documented, and easy to review.
            </p>
          </div>
          <ScribbleNote className="mt-6" tone="orange">
            One trade.
            <br />
            One edge.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Weekly flow"
          title="Three steps. One decision layer."
          body="The full product flow is simple on purpose. Complexity belongs inside the system, not in the user’s execution loop."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => {
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
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="What you see"
              title="The interface is supposed to clarify the call, not compete with it."
              body="The interface keeps the weekly signal, context, and next step visible without turning the workflow into a constant feed."
            />
            <CircleHighlight className="mt-5" tone="blue">
              <HandScript className="text-[2.1rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">Read. Decide. Move.</HandScript>
            </CircleHighlight>
          </div>
          <GlassPanel className="p-7">
            <div className="space-y-3">
              {whatYouGet.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-950/8 bg-white/42 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0757ff] dark:text-[#f8f200]" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#f8f200]">
              See pricing <ArrowRight className="size-4" />
            </Link>
          </GlassPanel>
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
