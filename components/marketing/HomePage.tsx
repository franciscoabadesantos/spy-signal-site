import Link from 'next/link'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'

const heroDesktopImage =
  'https://images.pexels.com/photos/10922371/pexels-photo-10922371.jpeg?auto=compress&cs=tinysrgb&w=2400'
const heroMobileImage =
  'https://images.pexels.com/photos/30768276/pexels-photo-30768276.jpeg?auto=compress&cs=tinysrgb&w=1400'

const navItems = [
  ['How it works', '#how-it-works'],
  ['Performance', '#performance'],
  ['Method', '#method'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
] as const

function SignalMonitor() {
  return (
    <div className="relative w-full max-w-[690px] rotate-[-2deg] rounded-[34px] border border-[#f59e0b]/35 bg-[#020711]/90 p-3 shadow-[0_42px_140px_rgba(0,0,0,0.72),0_0_80px_rgba(245,158,11,0.14)] backdrop-blur-md">
      <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_78%_18%,rgba(40,92,255,0.18),transparent_35%),linear-gradient(135deg,rgba(5,12,27,0.98),rgba(1,4,10,0.92))] p-7 text-white shadow-inner md:p-9">
        <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.16em] text-white/78 md:text-sm">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-[#6dff23] shadow-[0_0_18px_rgba(109,255,35,0.78)]" />
            <span>This week</span>
            <span className="rounded-md bg-[#153b10] px-2 py-1 text-[#75ff17]">Long</span>
          </div>
          <span>Week 21</span>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black tracking-tight md:text-5xl">SPY</h3>
              <span className="pb-2 text-sm text-white/62 md:text-base">S&amp;P 500</span>
            </div>
            <p className="mt-2 text-3xl font-light text-white/90">598.40</p>
            <p className="mt-4 inline-flex rounded-lg bg-[#14380d] px-3 py-2 text-xl text-[#75ff17] shadow-[0_0_24px_rgba(117,255,23,0.18)]">+1.2%</p>
          </div>

          <div className="relative min-h-44 overflow-visible">
            <svg viewBox="0 0 390 190" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="heroChartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6eff00" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#6eff00" stopOpacity="0" />
                </linearGradient>
                <filter id="heroChartGlow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d="M18 132 L45 108 L70 115 L100 72 L130 82 L161 50 L192 58 L230 28 L263 38 L298 14 L338 25 L372 4 L372 148 L18 148 Z" fill="url(#heroChartFill)" />
              <path d="M18 132 L45 108 L70 115 L100 72 L130 82 L161 50 L192 58 L230 28 L263 38 L298 14 L338 25 L372 4" fill="none" filter="url(#heroChartGlow)" stroke="#65ff00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              <path d="M228 62 L348 18" fill="none" stroke="#ffb000" strokeLinecap="round" strokeWidth="5" />
              <ellipse cx="307" cy="28" rx="78" ry="23" transform="rotate(-11 307 28)" fill="none" stroke="#ffb000" strokeWidth="1.6" />
              <text x="264" y="40" fill="#fff" fontSize="17" fontFamily="monospace" fontStyle="italic" transform="rotate(-11 264 40)">real signal.</text>
              {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
                <text key={`${day}-${index}`} x={55 + index * 70} y="180" fill="#fbf7e8" fontSize="13" fontFamily="monospace">
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
            <p className="text-sm text-white/58">Confidence</p>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="h-3 w-2.5 rounded-sm bg-[#75ff17] shadow-[0_0_12px_rgba(117,255,23,0.35)]" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
            <p className="text-sm text-white/58">Model</p>
            <p className="mt-3 text-xl text-white">TrendFlowv2</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-white/8 bg-white/[0.028] p-5">
            <p className="text-sm text-white/58">Market bias</p>
            <p className="mt-3 text-2xl text-[#75ff17]">BULLISH</p>
          </div>
          <div className="relative hidden min-h-24 overflow-hidden rounded-2xl border border-[#75ff17]/10 bg-[#75ff17]/[0.025] md:block">
            <span className="absolute left-7 top-7 size-4 rounded-full bg-[#75ff17] shadow-[0_0_18px_rgba(117,255,23,0.7)]" />
            <span className="absolute bottom-7 right-12 size-3 rounded-full bg-[#75ff17] shadow-[0_0_18px_rgba(117,255,23,0.7)]" />
            <span className="absolute inset-6 rounded-full border border-[#75ff17]/12" />
            <span className="absolute inset-11 rounded-full border border-[#75ff17]/14" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TickerTape() {
  const tickers = [
    ['SPY', '598.40', '+1.2%', 'text-[#75ff17]'],
    ['QQQ', '511.82', '+0.8%', 'text-[#75ff17]'],
    ['VIX', '14.3', '−1.8%', 'text-[#ff7a1a]'],
    ['TLT', '88.22', '−0.5%', 'text-[#ff7a1a]'],
    ['GLD', '318.90', '+0.1%', 'text-[#75ff17]'],
  ] as const

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-5 z-30 hidden rounded-full border border-white/18 bg-white/[0.075] px-6 py-4 text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:block">
      <div className="flex items-center justify-between gap-8 text-sm xl:text-base">
        {tickers.map(([symbol, price, move, moveClass]) => (
          <div key={symbol} className="flex items-center gap-4 whitespace-nowrap">
            <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.9)]" />
            <span className="font-medium tracking-wide">{symbol}</span>
            <span className="text-white/58">{price}</span>
            <span className={moveClass}>{move}</span>
          </div>
        ))}
        <span className="rounded-full border border-white/10 bg-white/8 px-5 py-2 text-white/86">Live now</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative isolate min-h-[820px] overflow-hidden bg-[#02040a] text-white md:h-screen md:max-h-[980px]">
      <picture className="absolute inset-0 -z-20 block">
        <source media="(max-width: 767px)" srcSet={heroMobileImage} />
        <img
          src={heroDesktopImage}
          alt="Dark desk workspace used as the Signal hero background"
          className="h-full w-full object-cover object-[62%_50%] opacity-70 saturate-[0.95] md:object-center"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_7%,rgba(7,87,255,0.3),transparent_34%),linear-gradient(90deg,#02040a_0%,rgba(2,4,10,0.96)_25%,rgba(2,4,10,0.34)_63%,rgba(2,4,10,0.72)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,4,10,0.15),rgba(2,4,10,0.05)_58%,#03050b_100%)]" />
      <div className="absolute right-[7%] top-8 -z-10 hidden h-72 w-[44rem] bg-[radial-gradient(circle,#0757ff_1px,transparent_1.5px)] bg-[length:14px_14px] opacity-35 md:block" />

      <header className="relative z-30 mx-auto flex max-w-[1500px] items-center justify-between px-6 py-7 sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-4 text-2xl font-black tracking-tight">
          <span>lb</span>
          <span className="text-[#ffb000]">/</span>
          <span>signal</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-[#efe5b8] md:flex">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/sign-up" className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur transition hover:bg-white/16 sm:flex">
          Join the lounge <ArrowRight className="size-5" />
        </Link>
      </header>

      <div className="relative z-20 mx-auto grid max-w-[1500px] gap-12 px-6 pb-32 pt-16 sm:px-10 md:grid-cols-[0.88fr_1.12fr] md:items-center md:pt-24 lg:px-16">
        <div>
          <h1 className="max-w-[620px] text-[clamp(4.6rem,12vw,8.6rem)] font-black leading-[0.88] tracking-[-0.09em] text-white drop-shadow-[0_8px_28px_rgba(255,255,255,0.16)]">
            Signal <span className="block bg-gradient-to-b from-[#1e66ff] to-[#003cff] bg-clip-text text-transparent">before</span>
            <span className="block">the open<span className="text-[#0d57ff]">.</span></span>
          </h1>
          <p className="mt-8 max-w-lg text-xl leading-8 text-[#fff4c8] md:text-2xl">
            AI-driven signals. One trade.<br />
            Every Sunday before the market opens.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/screener" className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#0757ff] px-7 font-semibold shadow-[0_0_42px_rgba(7,87,255,0.48)] transition hover:scale-[1.02]">
              See this week’s signal <ArrowRight className="size-5" />
            </Link>
            <Link href="#how-it-works" className="inline-flex h-14 items-center justify-center border-b-2 border-[#f8f200] px-1 text-lg text-white transition hover:text-[#fff4c8]">
              How it works
            </Link>
          </div>
        </div>

        <div className="relative hidden justify-end md:flex">
          <SignalMonitor />
        </div>
      </div>

      <TickerTape />
    </section>
  )
}

function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#0757ff]/15 text-[#3d82ff]">{icon}</div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-7 text-white/62">{children}</p>
    </div>
  )
}

function PriceChart() {
  return (
    <svg viewBox="0 0 390 160" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="sectionSignalFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6eff00" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#6eff00" stopOpacity="0" />
        </linearGradient>
        <filter id="sectionChartGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M18 124 L43 105 L66 112 L88 80 L112 88 L136 60 L162 70 L186 45 L212 54 L238 31 L262 48 L292 20 L320 28 L354 7 L376 14 L376 140 L18 140 Z" fill="url(#sectionSignalFill)" />
      <path d="M18 124 L43 105 L66 112 L88 80 L112 88 L136 60 L162 70 L186 45 L212 54 L238 31 L262 48 L292 20 L320 28 L354 7 L376 14" fill="none" filter="url(#sectionChartGlow)" stroke="#65ff00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <path d="M228 55 L348 14" fill="none" stroke="#ffb000" strokeLinecap="round" strokeWidth="5" />
      {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
        <text key={`${day}-${index}`} x={58 + index * 68} y="152" fill="#fbf7e8" fontSize="13" fontFamily="monospace">
          {day}
        </text>
      ))}
    </svg>
  )
}

function Sections() {
  return (
    <div className="bg-[#03050b] text-white">
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f8f200]">How it works</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">A weekly signal designed for calm execution.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FeatureCard icon={<Sparkles className="size-6" />} title="Model reads the tape">Trend, breadth, volatility, liquidity, and regime context are compressed into a simple market bias.</FeatureCard>
          <FeatureCard icon={<Zap className="size-6" />} title="Published before the open">You get the trade direction before Monday opens, so you are not chasing noise in real time.</FeatureCard>
          <FeatureCard icon={<Check className="size-6" />} title="One clear action">Long, defensive, or neutral. The page is built around clarity rather than another crowded dashboard.</FeatureCard>
        </div>
      </section>

      <section id="performance" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-24 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f8f200]">Performance</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Built to make the big weeks obvious.</h2>
            <p className="mt-6 text-lg leading-8 text-white/62">The hero now uses a commercial-safe photo base with custom Signal UI layered in real HTML, so the page is no longer dependent on a generated scene SVG.</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-[#060b16] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-center justify-between text-sm text-white/55">
              <span>Weekly signal curve</span>
              <span className="text-[#75ff17]">Bullish week</span>
            </div>
            <div className="h-72"><PriceChart /></div>
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

      <section id="pricing" className="border-t border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.22),transparent_38%)] px-6 py-24 text-center sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f8f200]">Pricing</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Join the lounge before next Sunday.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/62">Keep the paid flow connected to your existing sign-up and screener pages.</p>
        <Link href="/sign-up" className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 font-semibold text-[#03050b] transition hover:scale-[1.02]">
          Join the lounge <ArrowRight className="size-5" />
        </Link>
      </section>

      <section id="faq" className="mx-auto max-w-[980px] px-6 py-24 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f8f200]">FAQ</p>
        <div className="mt-8 space-y-4">
          {[
            ['When is the signal sent?', 'Every Sunday before the market opens, matching the promise in the hero.'],
            ['What does the signal show?', 'Direction, confidence, model version, market bias, and the current weekly tape.'],
            ['Can I still use the app?', 'Yes — the main CTA routes to your screener and the account CTA routes to sign-up.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold">{q}</h3>
              <p className="mt-2 text-white/62">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#03050b]">
      <Hero />
      <Sections />
    </main>
  )
}
