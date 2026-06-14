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
    className: 'h-full w-full object-cover object-[58%_50%] lg:object-contain lg:object-center',
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

function SignalPanel({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-sky-300/30 bg-white/26 p-2.5 text-slate-950 shadow-[0_22px_70px_rgba(14,47,82,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/28 dark:text-white dark:shadow-[0_22px_80px_rgba(0,0,0,0.42)] ${className}`}
    >
      <div className="rounded-[18px] border border-white/30 bg-white/24 p-4 shadow-inner dark:border-white/10 dark:bg-black/18 md:p-5">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600 dark:text-white/62">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#65ff00] shadow-[0_0_14px_rgba(101,255,0,0.72)]" />
            <span>This week</span>
            <span className="rounded-md border border-[#65ff00]/25 bg-[#65ff00]/12 px-2 py-0.5 text-[#167a00] dark:text-[#75ff17]">
              Long
            </span>
          </div>
          <span>Week 21</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <div className="flex items-end gap-2.5">
              <h3 className="text-3xl font-extrabold tracking-tight md:text-4xl">SPY</h3>
              <span className="pb-1.5 text-xs text-slate-500 dark:text-white/52 md:text-sm">S&amp;P 500</span>
            </div>
            <p className="mt-1 text-2xl font-light md:text-3xl">598.40</p>
            <p className="mt-3 inline-flex rounded-lg border border-[#65ff00]/25 bg-[#65ff00]/12 px-3 py-1.5 text-lg text-[#167a00] shadow-[0_0_20px_rgba(101,255,0,0.14)] dark:text-[#75ff17]">
              +1.2%
            </p>
          </div>

          <div className="relative min-h-32 overflow-visible md:min-h-36">
            <svg viewBox="0 0 390 190" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="heroSignalFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#65ff00" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#65ff00" stopOpacity="0" />
                </linearGradient>
                <filter id="heroSignalGlow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d="M18 132 L45 108 L70 115 L100 72 L130 82 L161 50 L192 58 L230 28 L263 38 L298 14 L338 25 L372 4 L372 148 L18 148 Z" fill="url(#heroSignalFill)" />
              <path d="M18 132 L45 108 L70 115 L100 72 L130 82 L161 50 L192 58 L230 28 L263 38 L298 14 L338 25 L372 4" fill="none" filter="url(#heroSignalGlow)" stroke="#65ff00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              <path d="M228 62 L348 18" fill="none" stroke="#ffb000" strokeLinecap="round" strokeWidth="5" />
              <ellipse cx="307" cy="28" rx="78" ry="23" transform="rotate(-11 307 28)" fill="none" stroke="#ffb000" strokeWidth="1.6" />
              <text x="264" y="40" fill="currentColor" fontSize="17" fontFamily="monospace" fontStyle="italic" transform="rotate(-11 264 40)">real signal.</text>
              {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
                <text key={`${day}-${index}`} x={55 + index * 70} y="180" fill="currentColor" fontSize="13" fontFamily="monospace">
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-950/8 bg-white/28 p-3 dark:border-white/8 dark:bg-white/[0.028]">
            <p className="text-sm text-slate-500 dark:text-white/52">Confidence</p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="h-2.5 w-2.5 rounded-sm bg-[#65ff00] shadow-[0_0_12px_rgba(101,255,0,0.32)]" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-950/8 bg-white/28 p-3 dark:border-white/8 dark:bg-white/[0.028]">
            <p className="text-sm text-slate-500 dark:text-white/52">Model</p>
            <p className="mt-2 text-lg md:text-xl">TrendFlowv2</p>
          </div>
        </div>
      </div>
    </div>
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
    <div className="absolute inset-x-6 bottom-5 z-20 hidden overflow-hidden rounded-full border border-white/35 bg-white/18 py-3 text-slate-950 shadow-[0_16px_56px_rgba(18,36,54,0.12)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.045] dark:text-white dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)] lg:block">
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
  )
}

function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#f1e9de] text-slate-950 dark:bg-[#00040a] dark:text-white">
      <HeroBackground />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(241,233,222,0.88)_0%,rgba(241,233,222,0.58)_32%,rgba(241,233,222,0.06)_58%,rgba(241,233,222,0)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,4,10,0.86)_0%,rgba(0,4,10,0.58)_34%,rgba(0,4,10,0.08)_62%,rgba(0,4,10,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#f1e9de] via-[#f1e9de]/48 to-transparent dark:from-[#00040a] dark:via-[#00040a]/58" />

      <header className="relative z-30 mx-auto flex max-w-[1500px] items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
        <Link href="/" className="flex items-center gap-3 text-xl font-extrabold tracking-tight md:text-2xl">
          <span>lb</span>
          <span className="text-[#ffb000]">/</span>
          <span>signal</span>
        </Link>
        <nav className="hidden text-sm font-medium text-slate-700 dark:text-[#efe5b8] md:flex md:items-center md:gap-8">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#0757ff] dark:hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/sign-up" className="hidden items-center gap-3 rounded-full border border-white/45 bg-white/24 px-5 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_34px_rgba(24,36,48,0.09)] backdrop-blur-2xl transition hover:bg-white/38 dark:border-white/14 dark:bg-white/9 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] dark:hover:bg-white/14 sm:flex md:text-base">
          Join the lounge <ArrowRight className="size-5" />
        </Link>
      </header>

      <div className="relative z-20 mx-auto grid max-w-[1500px] gap-8 px-6 pb-32 pt-10 sm:px-10 md:min-h-[720px] md:grid-cols-[0.78fr_1.22fr] md:items-center md:pb-28 md:pt-12 lg:px-14">
        <div className="max-w-[560px]">
          <h1 className="text-[clamp(3.4rem,8vw,6.5rem)] font-extrabold leading-[0.94] text-slate-950 drop-shadow-[0_8px_24px_rgba(255,255,255,0.18)] dark:text-white dark:drop-shadow-[0_8px_28px_rgba(255,255,255,0.08)]">
            Signal <span className="block text-[#0757ff]">before</span>
            <span className="block">the open<span className="text-[#0757ff]">.</span></span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-700 dark:text-[#fff4c8] md:text-xl">
            AI-driven signals. One trade.<br />
            Every Sunday before the market opens.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/screener" className="inline-flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#0757ff] px-6 font-semibold text-white shadow-[0_0_36px_rgba(7,87,255,0.3)] transition hover:scale-[1.02]">
              See this week&apos;s signal <ArrowRight className="size-5" />
            </Link>
            <Link href="#how-it-works" className="inline-flex h-[52px] items-center justify-center border-b-2 border-[#f8f200] px-1 text-base text-slate-950 transition hover:text-[#0757ff] dark:text-white dark:hover:text-[#fff4c8]">
              How it works
            </Link>
          </div>
        </div>

        <SignalPanel className="md:absolute md:right-[11.5%] md:top-[24%] md:w-[37%] md:max-w-[560px] md:rotate-[1.3deg]" />
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
