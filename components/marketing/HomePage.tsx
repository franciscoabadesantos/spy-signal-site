import Link from 'next/link'
import { getImageProps } from 'next/image'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'
import {
  BrandSummary,
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingHeader,
  MarketingPageOutro,
  ScribbleNote,
  SectionHeading,
} from '@/components/marketing/site-chrome'
import { HOMEPAGE_FAQ_ITEMS } from '@/components/marketing/site-config'

function HeroBackground() {
  const common = {
    alt: '',
    className: 'h-full w-full object-cover object-[58%_0%] lg:object-cover lg:object-[72%_0%]',
    priority: true,
    sizes: '100vw',
  }
  const {
    props: { srcSet: dark },
  } = getImageProps({
    ...common,
    width: 1672,
    height: 941,
    src: '/marketing/hero-background-dark.png',
  })
  const {
    props: { srcSet: light, ...rest },
  } = getImageProps({
    ...common,
    width: 1672,
    height: 941,
    src: '/marketing/hero-background-light.png',
  })

  return (
    <picture className="absolute inset-0 z-0 block">
      <source media="(prefers-color-scheme: dark)" srcSet={dark} />
      <source media="(prefers-color-scheme: light)" srcSet={light} />
      <img {...rest} alt="" aria-hidden="true" />
    </picture>
  )
}

function TickerTape() {
  const tickers = [
    ['SPY', '598.40', '+1.2%', 'text-[#167a00] dark:text-[#75ff17]'],
    ['QQQ', '511.82', '+0.8%', 'text-[#167a00] dark:text-[#75ff17]'],
    ['VIX', '14.3', '-1.8%', 'text-[#d85a1d]'],
    ['TLT', '88.22', '-0.5%', 'text-[#d85a1d]'],
    ['GLD', '318.90', '+0.1%', 'text-[#167a00] dark:text-[#75ff17]'],
  ] as const

  return (
    <div className="absolute inset-x-6 bottom-8 z-20 hidden overflow-hidden rounded-full border border-white/44 bg-white/[0.12] py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_56px_rgba(18,36,54,0.1)] backdrop-blur-[30px] saturate-[1.8] dark:border-white/14 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_70px_rgba(0,0,0,0.34)] lg:block">
      <div className="mr-36 overflow-hidden">
        <div className="marketing-ticker-track flex w-max items-center gap-9 whitespace-nowrap px-6 text-sm xl:text-base">
          {[...tickers, ...tickers].map(([symbol, price, move, moveClass], index) => (
            <div key={`${symbol}-${index}`} className="flex items-center gap-4 whitespace-nowrap">
              <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.9)]" />
              <span className="font-medium tracking-wide">{symbol}</span>
              <span className="text-slate-500 dark:text-white/52">{price}</span>
              <span className={moveClass}>{move}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/34 bg-white/[0.16] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-[26px] dark:border-white/12 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.28)]">
        <Activity className="size-4" aria-hidden="true" />
        <span>Live now</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#00040a] dark:text-white">
      <HeroBackground />
      <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.52)_28%,rgba(255,255,255,0.12)_54%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,4,10,0.7)_0%,rgba(0,4,10,0.34)_28%,rgba(0,4,10,0.06)_56%,rgba(0,4,10,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-white via-white/36 to-transparent dark:from-[#00040a] dark:via-[#00040a]/34" />

      <MarketingHeader activeHref="/" />
      <div className="h-[100px] md:h-[72px]" aria-hidden="true" />

      <div className="relative z-20 mx-auto grid max-w-[1760px] gap-8 px-6 pb-32 pt-10 sm:px-10 md:min-h-[600px] md:grid-cols-[0.78fr_1.22fr] md:items-start md:pb-24 md:pt-16 lg:px-14">
        <div className="max-w-[520px]">
          <h1 className="marketing-hero-type text-[clamp(2.55rem,5.6vw,4.55rem)] leading-[0.98] text-slate-950 drop-shadow-[0_8px_24px_rgba(255,255,255,0.18)] dark:text-white dark:drop-shadow-[0_8px_28px_rgba(255,255,255,0.08)]">
            Signal <span className="block text-[#0757ff]">before</span>
            <span className="block">the open<span className="text-[#0757ff]">.</span></span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-700 dark:text-white md:text-lg">
            AI-driven signals. One trade.<br />
            Every Sunday before the market opens.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/screener" className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#0757ff] px-6 font-semibold text-white shadow-[0_0_36px_rgba(7,87,255,0.3)] transition duration-200 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:bg-[#1a66ff] hover:shadow-[0_18px_52px_rgba(7,87,255,0.38)] active:translate-y-0 active:scale-[0.96]">
              See this week&apos;s signal <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>
            <Link href="/how-it-works" className="inline-flex h-[52px] items-center justify-center border-b-2 border-slate-950/16 px-1 text-base text-slate-950 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0757ff]/28 hover:text-[#0757ff] active:translate-y-0 active:scale-[0.97] dark:border-[#f8f200] dark:text-white dark:hover:text-[#fff4c8]">
              How it works
            </Link>
          </div>
        </div>
        <div className="hidden md:block" />
      </div>

      <TickerTape />
    </section>
  )
}

function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <GlassPanel className="rounded-3xl p-6">
      <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#0757ff]/15 text-[#3d82ff]">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600 dark:text-white/62">{children}</p>
    </GlassPanel>
  )
}

function Sections() {
  return (
    <div className="bg-white text-slate-950 dark:bg-[#00040a] dark:text-white">
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="How it works"
          title="A weekly signal designed for calm execution."
          body="The homepage now introduces the system, while the full process lives on a dedicated page."
          href="/how-it-works"
          label="Open the full flow"
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FeatureCard icon={<Sparkles className="size-6" />} title="Model reads the tape">Trend, breadth, volatility, liquidity, and regime context are compressed into a simple market bias.</FeatureCard>
          <FeatureCard icon={<Zap className="size-6" />} title="Published before the open">You get the trade direction before Monday opens, so you are not chasing noise in real time.</FeatureCard>
          <FeatureCard icon={<Check className="size-6" />} title="One clear action">Long, defensive, or neutral. The page is built around clarity rather than another crowded dashboard.</FeatureCard>
        </div>
      </section>

      <section id="performance" className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-24 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
          <div>
            <SectionHeading
              eyebrow="Performance"
              title="Built to make the big weeks obvious."
              body="The full performance page now carries the same tone as the frontpage instead of the older Northline layout."
              href="/performance"
              label="See the full performance page"
            />
          </div>
          <GlassPanel className="rounded-[32px] p-8 dark:bg-[#060b16]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">Composed in code</p>
            <h3 className="mt-5 text-3xl font-black tracking-tight">Backgrounds carry the environment.</h3>
            <HandScript className="mt-4 block text-[2.4rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
              Signal before the open.
            </HandScript>
            <p className="mt-5 leading-7 text-slate-600 dark:text-white/62">
              Performance, method, pricing, FAQ, and about now share the same visual language: desk-light atmosphere, electric blue CTA rhythm, and handwritten callouts.
            </p>
            <ScribbleNote className="mt-8" tone="blue">
              Live tape.
              <br />
              Real time.
              <br />
              No noise.
            </ScribbleNote>
          </GlassPanel>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="Method"
          title="The weekly read is simple because the framework is not."
          body="The top navigation now opens a real method page instead of jumping to this section."
          href="/method"
          label="Read the method"
        />
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard icon={<Activity className="size-6" />} title="Signal discipline">A fixed publication cadence keeps the decision process separate from intraday emotion.</FeatureCard>
          <FeatureCard icon={<BarChart3 className="size-6" />} title="Market context">The screen emphasizes confidence and bias instead of burying the signal in dozens of indicators.</FeatureCard>
          <FeatureCard icon={<CircleDollarSign className="size-6" />} title="Trade simplicity">Optimized for one high-conviction weekly decision rather than constant tinkering.</FeatureCard>
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-950/10 bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.16),transparent_38%)] px-6 py-24 text-center dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.22),transparent_38%)] sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">Pricing</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Join the lounge before next Sunday.</h2>
        <CircleHighlight className="mt-4" tone="orange">
          <HandScript className="text-[2.5rem] leading-none text-[#ff8b2b]">Simple pricing. Real edge.</HandScript>
        </CircleHighlight>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/62">Pricing now has its own page, and the homepage section acts as the teaser instead of the destination.</p>
        <Link href="/sign-up" className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]">
          Join the lounge <ArrowRight className="size-5" />
        </Link>
        <div>
          <Link href="/pricing" className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#f8f200]">
            Open the full pricing page <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[980px] px-6 py-24 sm:px-10">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions answered before the week starts."
          body="There is now a dedicated FAQ page instead of a footer dead-end or another homepage anchor."
          href="/faq"
          label="Read all FAQs"
        />
        <div className="mt-8 space-y-4">
          {HOMEPAGE_FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-950/10 bg-white/42 p-6 dark:border-white/10 dark:bg-white/[0.04]">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 text-slate-600 dark:text-white/62">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-24 sm:px-10 lg:px-16">
        <BrandSummary />
      </section>

      <MarketingPageOutro />
    </div>
  )
}

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#00040a]">
      <Hero />
      <Sections />
    </main>
  )
}
