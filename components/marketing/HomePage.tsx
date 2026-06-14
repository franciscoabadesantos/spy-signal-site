import Link from 'next/link'
import { getImageProps } from 'next/image'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'

const navItems = [
  ['How it works', '#how-it-works'],
  ['Performance', '#performance'],
  ['Method', '#method'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
] as const

function HeroBackground() {
  const common = {
    alt: '',
    className: 'h-full w-full object-cover object-[58%_0%] lg:object-contain lg:object-top',
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
    <picture className="absolute inset-0 -z-20 block">
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
    <div className="absolute inset-x-6 bottom-8 z-20 hidden overflow-hidden rounded-full border border-white/35 bg-white/18 py-3 text-slate-950 shadow-[0_16px_56px_rgba(18,36,54,0.12)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.045] dark:text-white dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)] lg:block">
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
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/28 bg-white/24 px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.38)]">
        <Activity className="size-4" aria-hidden="true" />
        <span>Live now</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#f1e9de] text-slate-950 dark:bg-[#00040a] dark:text-white">
      <HeroBackground />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(241,233,222,0.88)_0%,rgba(241,233,222,0.58)_32%,rgba(241,233,222,0.06)_58%,rgba(241,233,222,0)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,4,10,0.86)_0%,rgba(0,4,10,0.58)_34%,rgba(0,4,10,0.08)_62%,rgba(0,4,10,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#f1e9de] via-[#f1e9de]/48 to-transparent dark:from-[#00040a] dark:via-[#00040a]/58" />

      <header className="relative z-30 mx-auto flex max-w-[1500px] items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
        <Link href="/" className="marketing-logo-type flex items-center gap-3 text-xl tracking-normal md:text-2xl">
          <span>lb</span>
          <span className="text-[#ffb000]">/</span>
          <span>signal</span>
        </Link>
        <nav className="hidden text-sm font-medium text-slate-950 dark:text-white md:flex md:items-center md:gap-8">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:opacity-70">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/sign-up" className="group hidden items-center gap-3 rounded-full border border-white/45 bg-white/24 px-5 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_34px_rgba(24,36,48,0.09)] backdrop-blur-2xl transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/38 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_18px_42px_rgba(24,36,48,0.14)] active:translate-y-0 active:scale-[0.97] dark:border-white/14 dark:bg-white/9 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] dark:hover:bg-white/14 sm:flex md:text-base">
          Join the lounge <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </header>

      <div className="relative z-20 mx-auto grid max-w-[1760px] gap-8 px-6 pb-32 pt-2 sm:px-10 md:min-h-[600px] md:grid-cols-[0.78fr_1.22fr] md:items-start md:pb-24 md:pt-8 lg:px-14">
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
            <Link href="#how-it-works" className="inline-flex h-[52px] items-center justify-center border-b-2 border-[#f8f200] px-1 text-base text-slate-950 transition duration-200 ease-out hover:-translate-y-0.5 hover:text-[#0757ff] active:translate-y-0 active:scale-[0.97] dark:text-white dark:hover:text-[#fff4c8]">
              How it works
            </Link>
          </div>
        </div>

      </div>

      <TickerTape />
    </section>
  )
}

function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-950/10 bg-white/42 p-6 shadow-[0_20px_80px_rgba(20,33,51,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#0757ff]/15 text-[#3d82ff]">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600 dark:text-white/62">{children}</p>
    </div>
  )
}

function Sections() {
  return (
    <div className="bg-[#f1e9de] text-slate-950 dark:bg-[#00040a] dark:text-white">
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">How it works</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">A weekly signal designed for calm execution.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FeatureCard icon={<Sparkles className="size-6" />} title="Model reads the tape">Trend, breadth, volatility, liquidity, and regime context are compressed into a simple market bias.</FeatureCard>
          <FeatureCard icon={<Zap className="size-6" />} title="Published before the open">You get the trade direction before Monday opens, so you are not chasing noise in real time.</FeatureCard>
          <FeatureCard icon={<Check className="size-6" />} title="One clear action">Long, defensive, or neutral. The page is built around clarity rather than another crowded dashboard.</FeatureCard>
        </div>
      </section>

      <section id="performance" className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-24 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">Performance</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Built to make the big weeks obvious.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-white/62">The hero now uses the supplied desk scenes as light and dark backgrounds, with the product messaging and glass interface rendered by the app.</p>
          </div>
          <div className="rounded-[32px] border border-slate-950/10 bg-white/42 p-8 shadow-[0_30px_90px_rgba(20,33,51,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#060b16] dark:shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">Composed in code</p>
            <h3 className="mt-5 text-3xl font-black tracking-tight">Backgrounds carry the environment.</h3>
            <p className="mt-5 leading-7 text-slate-600 dark:text-white/62">
              The page controls the copy, CTAs, navigation, liquid glass panel, ticker, and surrounding color system so the scene can flex across themes and breakpoints.
            </p>
          </div>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard icon={<Activity className="size-6" />} title="Signal discipline">A fixed publication cadence keeps the decision process separate from intraday emotion.</FeatureCard>
          <FeatureCard icon={<BarChart3 className="size-6" />} title="Market context">The screen emphasizes confidence and bias instead of burying the signal in dozens of indicators.</FeatureCard>
          <FeatureCard icon={<CircleDollarSign className="size-6" />} title="Trade simplicity">Optimized for one high-conviction weekly decision rather than constant tinkering.</FeatureCard>
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-950/10 bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.16),transparent_38%)] px-6 py-24 text-center dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.22),transparent_38%)] sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">Pricing</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Join the lounge before next Sunday.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/62">Keep the paid flow connected to your existing sign-up and screener pages.</p>
        <Link href="/sign-up" className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]">
          Join the lounge <ArrowRight className="size-5" />
        </Link>
      </section>

      <section id="faq" className="mx-auto max-w-[980px] px-6 py-24 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">FAQ</p>
        <div className="mt-8 space-y-4">
          {[
            ['When is the signal sent?', 'Every Sunday before the market opens, matching the promise in the hero.'],
            ['What does the signal show?', 'Direction, confidence, model version, market bias, and the current weekly tape.'],
            ['Can I still use the app?', 'Yes — the main CTA routes to your screener and the account CTA routes to sign-up.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-slate-950/10 bg-white/42 p-6 dark:border-white/10 dark:bg-white/[0.04]">
              <h3 className="text-lg font-semibold">{q}</h3>
              <p className="mt-2 text-slate-600 dark:text-white/62">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#f1e9de] dark:bg-[#00040a]">
      <Hero />
      <Sections />
    </main>
  )
}
