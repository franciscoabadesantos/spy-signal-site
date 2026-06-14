import Link from 'next/link'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'

const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Performance', href: '#performance' },
  { label: 'Method', href: '#method' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const tickerTape = [
  ['SPY', '598.40', '+1.2%', 'up'],
  ['QQQ', '511.82', '+0.8%', 'up'],
  ['VIX', '14.3', '-1.8%', 'down'],
  ['TLT', '88.22', '-0.5%', 'down'],
  ['GLD', '318.90', '+0.1%', 'up'],
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
      <span className={compact ? 'text-3xl' : 'text-[1.72rem]'}>lb</span>
      <span className="text-3xl font-light leading-none text-[#ffb000]">/</span>
      {!compact ? <span className="text-[1.72rem]">signal</span> : null}
    </Link>
  )
}

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-24 w-full max-w-[1800px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <Logo />
        <nav className="hidden items-center gap-9 text-[15px] text-[#efe5b8] md:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative transition hover:text-white"
            >
              {item.label}
              {index === 0 ? (
                <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-[#f8f200] shadow-[0_0_14px_rgba(248,242,0,0.8)]" />
              ) : null}
            </Link>
          ))}
        </nav>
        <Link
          href="/sign-up"
          className="group hidden items-center gap-4 rounded-full border border-white/15 bg-white/[0.08] px-7 py-3 text-sm font-medium text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.08),0_0_24px_rgba(255,255,255,0.1)] backdrop-blur transition hover:border-white/30 hover:bg-white/[0.12] sm:flex"
        >
          Join the lounge
          <ArrowRight className="size-5 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </header>
  )
}

function PriceChart() {
  return (
    <svg viewBox="0 0 420 170" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="signalFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6eff00" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#6eff00" stopOpacity="0" />
        </linearGradient>
        <filter id="chartGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M18 132 L46 112 L70 120 L92 84 L119 93 L145 64 L174 76 L199 44 L230 57 L260 34 L284 52 L316 20 L344 29 L376 5 L404 14 L404 150 L18 150 Z" fill="url(#signalFill)" />
      <path d="M18 132 L46 112 L70 120 L92 84 L119 93 L145 64 L174 76 L199 44 L230 57 L260 34 L284 52 L316 20 L344 29 L376 5 L404 14" fill="none" filter="url(#chartGlow)" stroke="#65ff00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
        <text key={`${day}-${index}`} x={58 + index * 74} y="164" fill="#fbf7e8" fontSize="14" fontFamily="monospace">
          {day}
        </text>
      ))}
    </svg>
  )
}

function Radar() {
  return (
    <div className="relative grid size-36 place-items-center rounded-full bg-[radial-gradient(circle,rgba(103,255,0,0.12),rgba(103,255,0,0)_64%)]">
      <span className="absolute size-32 rounded-full border border-[#5cff00]/15" />
      <span className="absolute size-20 rounded-full border border-[#5cff00]/20" />
      <span className="absolute size-9 rounded-full border border-[#5cff00]/20" />
      <span className="absolute left-4 top-8 size-5 rounded-full bg-[#63ff00] shadow-[0_0_24px_rgba(99,255,0,0.9)]" />
      <span className="absolute size-4 rounded-full bg-[#63ff00] shadow-[0_0_18px_rgba(99,255,0,0.9)]" />
    </div>
  )
}

function SignalScreen() {
  return (
    <div className="relative mx-auto w-full max-w-[730px] rotate-[-4deg] rounded-[34px] border border-[#e49b22]/50 bg-[#030914] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,188,33,0.18)]">
      <div className="rounded-[24px] border border-white/5 bg-[radial-gradient(circle_at_78%_20%,rgba(0,94,255,0.22),transparent_26%),linear-gradient(145deg,rgba(9,17,31,0.98),rgba(2,6,13,0.98))] p-6 text-white shadow-[inset_0_0_50px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between font-mono text-sm uppercase tracking-wide text-white/85">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-[#61ff00] shadow-[0_0_12px_rgba(97,255,0,0.9)]" />
            This week
            <span className="rounded-md bg-[#19330c] px-3 py-1 text-[#75ff17]">Long</span>
          </div>
          <div>Week 21 ⛶</div>
        </div>

        <div className="relative mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.3fr]">
          <div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-black tracking-tight">SPY</div>
              <div className="pb-1 text-sm text-white/72">S&amp;P 500</div>
            </div>
            <div className="mt-2 text-3xl font-light">598.40</div>
            <div className="mt-3 inline-flex rounded-md bg-[#14340a] px-3 py-1 text-xl text-[#6cff13]">+1.2%</div>
          </div>
          <div className="relative min-h-[180px]">
            <div className="absolute right-0 top-0 -rotate-12 rounded-[50%] border border-[#ffb000] px-8 py-2 font-mono text-lg italic text-white shadow-[0_0_14px_rgba(255,176,0,0.42)]">
              real signal.
              <span className="absolute -bottom-2 left-8 h-1 w-32 rotate-[-3deg] rounded-full bg-[#ffb000]" />
            </div>
            <PriceChart />
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 lg:grid-cols-2">
          <div>
            <div className="text-sm text-white/65">Confidence</div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="h-3 w-2.5 rounded-[2px] bg-[#65ff00] shadow-[0_0_10px_rgba(101,255,0,0.5)]" />
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div className="text-sm text-white/65">Model</div>
            <div className="mt-4 text-lg">TrendFlowv2</div>
          </div>
        </div>

        <div className="mt-3 grid items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm text-white/65">Market bias</div>
            <div className="mt-3 text-2xl text-[#65ff00]">BULLISH</div>
          </div>
          <Radar />
        </div>
      </div>
    </div>
  )
}

function DeskProps() {
  return (
    <div className="pointer-events-none absolute bottom-20 right-4 hidden w-[420px] items-end justify-end gap-5 xl:flex">
      <div className="grid size-36 place-items-center rounded-[22px] border border-[#e6ff00]/70 bg-[#05070a] text-5xl font-bold text-white shadow-[0_0_30px_rgba(226,255,0,0.45)]">
        <Logo compact />
      </div>
      <div className="rounded-full border border-[#ffb000]/60 bg-[#030303] px-10 py-8 text-xl text-white shadow-[0_0_35px_rgba(255,176,0,0.28)]">
        Long<span className="font-serif italic text-[#ffb000]">brunch</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-[940px] overflow-hidden bg-[#03050b] text-white">
      <Header />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_10%,rgba(0,93,255,0.27),transparent_26%),radial-gradient(circle_at_12%_55%,rgba(0,20,80,0.35),transparent_33%),linear-gradient(180deg,#03050b_0%,#02040a_70%,#080403_100%)]" />
      <div className="absolute right-0 top-0 hidden h-[520px] w-[760px] opacity-60 [background-image:radial-gradient(rgba(0,92,255,0.9)_1px,transparent_1px)] [background-size:13px_13px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] lg:block" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(90,39,0,0.18)_44%,rgba(13,5,0,0.9))]" />

      <div className="relative mx-auto grid w-full max-w-[1800px] gap-12 px-6 pb-40 pt-40 sm:px-10 lg:grid-cols-[0.86fr_1.14fr] lg:px-16 lg:pt-48">
        <div className="z-10 flex flex-col justify-center">
          <h1 className="max-w-[620px] text-[clamp(4.2rem,8.4vw,9.2rem)] font-black leading-[0.92] tracking-[-0.08em] text-white drop-shadow-[0_8px_20px_rgba(255,255,255,0.16)]">
            <span className="block">Signal</span>
            <span className="block bg-[linear-gradient(180deg,#1c73ff,#003cff)] bg-clip-text text-transparent">before</span>
            <span className="block">the open<span className="text-[#0d57ff]">.</span></span>
          </h1>
          <p className="mt-8 max-w-[560px] text-xl leading-8 text-[#fff4c8] md:text-2xl">
            AI-driven signals. One trade.<br />Every Sunday before the market opens.
          </p>
          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link
              href="/screener"
              className="group inline-flex h-16 items-center justify-center gap-4 rounded-xl bg-[#0757ff] px-8 text-lg font-medium text-white shadow-[0_0_40px_rgba(7,87,255,0.42)] transition hover:bg-[#1a67ff]"
            >
              See this week&apos;s signal
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </Link>
            <Link href="#how-it-works" className="relative inline-flex h-16 items-center text-lg text-white transition hover:text-[#fff6a8]">
              How it works
              <span className="absolute bottom-2 left-0 h-0.5 w-full rounded-full bg-[#f8f200] shadow-[0_0_12px_rgba(248,242,0,0.8)]" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 min-h-[540px] lg:min-h-[700px]">
          <div className="absolute -right-8 top-12 w-full max-w-[790px] lg:right-0">
            <SignalScreen />
          </div>
          <DeskProps />
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-8 z-30 mx-auto max-w-[1680px] rounded-full border border-white/25 bg-white/[0.07] px-5 py-3 text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.08),0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur md:px-9">
        <div className="flex items-center gap-8 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
          {tickerTape.map(([symbol, price, change, direction]) => (
            <div key={symbol} className="flex shrink-0 items-center gap-4 text-lg">
              <span className="size-2.5 rounded-full bg-[#0757ff]" />
              <span>{symbol}</span>
              <span className="text-white/68">{price}</span>
              <span className={direction === 'up' ? 'text-[#75ff17]' : 'text-[#ff7a22]'}>{change}</span>
            </div>
          ))}
          <span className="ml-auto hidden shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-5 py-2 text-base text-white/90 md:inline-flex">▥ Live now</span>
        </div>
      </div>
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
            <p className="mt-6 text-lg leading-8 text-white/62">The visual system from your mockup is now the front door: live-looking signal state, confidence, model, bias, and a market tape.</p>
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
          {[['When is the signal sent?', 'Every Sunday before the market opens, matching the promise in the hero.'], ['What does the signal show?', 'Direction, confidence, model version, market bias, and the current weekly tape.'], ['Can I still use the app?', 'Yes — the main CTA routes to your screener and the account CTA routes to sign-up.']].map(([q, a]) => (
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
