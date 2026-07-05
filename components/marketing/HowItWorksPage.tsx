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
    title: 'Pick any company',
    body: 'Search a ticker and get the essentials in one glance: price context, a readable scorecard, and what the technicals are pressing toward.',
    icon: Sparkles,
  },
  {
    title: 'See what surrounds it',
    body: 'The relationship map shows which companies move together beyond the market, which share a theme, which tend to lead or follow — and which links are probably just noise.',
    icon: Clock3,
  },
  {
    title: 'Go as deep as you want',
    body: 'Every plain-language sentence sits on inspectable data. Zoom out to the whole market on the correlation network, or drill into the numbers behind any claim.',
    icon: Target,
  },
] as const

const whatYouGet = [
  'A relationship map for every covered company',
  'A scorecard you can read at a glance',
  'The full market correlation network',
] as const

export default function HowItWorksPage() {
  return (
    <MarketingPageShell
      activeHref="/how-it-works"
      eyebrow="How it works"
      title={
        <>
          Pick a company.
          <br />
          See its neighborhood.
          <br />
          <span className="text-[#0757ff]">Understand the map.</span>
        </>
      }
      description="Longbrunch shows you what surrounds any company — the relationships, themes and signals that context a price move — in plain language, never as tips."
      primaryCta={{ label: 'Explore a company', href: '/stocks' }}
      secondaryCta={{ label: 'Read the method', href: '/method' }}
      heroAside={
        <GlassPanel className="p-7">
          <div className="rounded-[26px] border border-[#6f79ff]/35 bg-[#6f79ff]/8 p-5 dark:bg-[#6f79ff]/10">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/70 text-[#6f79ff] dark:bg-white/[0.08]">
              <Zap className="size-6" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">The peer web.</h2>
            <HandScript className="mt-4 block text-xl leading-snug text-accent-text">
              Moves together beyond the market.
            </HandScript>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">
              Every relationship comes with strength, confidence, and an honest flag when a link is probably just market noise.
            </p>
          </div>
          <ScribbleNote className="mt-6" tone="blue">
            Same theme.
            <br />
            Tends to lead.
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
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="What you see"
              title="Clarity first: the strongest information surfaces before the rest."
              body="Every page leads with what matters — the grade, the strongest relationships, the clearest signals — and reveals detail only when you ask for it."
            />
            <CircleHighlight className="mt-5" tone="blue">
              <HandScript className="text-xl leading-snug text-accent-text">Read. Understand. Then decide.</HandScript>
            </CircleHighlight>
          </div>
          <GlassPanel className="p-7">
            <div className="space-y-3">
              {whatYouGet.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-950/8 bg-white/42 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0757ff] dark:text-[#d7dcff]" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#d7dcff]">
              See pricing <ArrowRight className="size-4" />
            </Link>
          </GlassPanel>
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
