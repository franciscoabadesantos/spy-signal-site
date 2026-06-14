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
      <span className={compact ? 'text-2xl' : 'text-[1.45rem]'}>lb</span>
      <span className={compact ? 'text-2xl font-light leading-none text-[#ffb000]' : 'text-[1.65rem] font-light leading-none text-[#ffb000]'}>/</span>
      {!compact ? <span className="text-[1.45rem]">signal</span> : null}
    </Link>
  )
}

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-[72px] w-full max-w-[1510px] items-center justify-between px-6 sm:px-10 xl:px-14">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-[#efe5b8] md:flex lg:gap-10">
          {navItems.map((item, index) => (
            <Link key={item.href} href={item.href} className="relative transition hover:text-white">
              {item.label}
              {index === 0 ? <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-[#f8f200] shadow-[0_0_14px_rgba(248,242,0,0.8)]" /> : null}
            </Link>
          ))}
        </nav>
        <Link
          href="/sign-up"
          className="group hidden items-center gap-4 rounded-full border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-medium text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.08),0_0_24px_rgba(255,255,255,0.1)] backdrop-blur transition hover:border-white/30 hover:bg-white/[0.12] sm:flex"
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
    <svg viewBox="0 0 390 160" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="signalFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6eff00" stopOpacity="0.38" />
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
      <path d="M18 124 L43 105 L66 112 L88 80 L112 88 L136 60 L162 70 L186 45 L212 54 L238 31 L262 48 L292 20 L320 28 L354 7 L376 14 L376 140 L18 140 Z" fill="url(#signalFill)" />
      <path d="M18 124 L43 105 L66 112 L88 80 L112 88 L136 60 L162 70 L186 45 L212 54 L238 31 L262 48 L292 20 L320 28 L354 7 L376 14" fill="none" filter="url(#chartGlow)" stroke="#65ff00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <path d="M228 55 L348 14" fill="none" stroke="#ffb000" strokeLinecap="round" strokeWidth="5" />
      {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
        <text key={`${day}-${index}`} x={58 + index * 68} y="152" fill="#fbf7e8" fontSize="13" fontFamily="monospace">
          {day}
        </text>
      ))}
    </svg>
  )
}

function Radar() {
  return (
    <div className="relative grid size-28 place-items-center rounded-full bg-[radial-gradient(circle,rgba(103,255,0,0.12),rgba(103,255,0,0)_64%)]">
      <span className="absolute size-24 rounded-full border border-[#5cff00]/15" />
      <span className="absolute size-16 rounded-full border border-[#5cff00]/20" />
      <span className="absolute size-8 rounded-full border border-[#5cff00]/20" />
      <span className="absolute left-3 top-6 size-4 rounded-full bg-[#63ff00] shadow-[0_0_24px_rgba(99,255,0,0.9)]" />
      <span className="absolute size-3 rounded-full bg-[#63ff00] shadow-[0_0_18px_rgba(99,255,0,0.9)]" />
    </div>
  )
}

function SignalScreen() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] rotate-[-4deg] rounded-[30px] border border-[#e49b22]/45 bg-[#030914] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,188,33,0.16)] lg:max-w-[640px]">
      <div className="rounded-[22px] border border-white/5 bg-[radial-gradient(circle_at_78%_20%,rgba(0,94,255,0.22),transparent_26%),linear-gradient(145deg,rgba(9,17,31,0.98),rgba(2,6,13,0.98))] p-5 text-white shadow-[inset_0_0_48px_rgba(0,0,0,0.7)] lg:p-6">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wide text-white/85 lg:text-sm">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-[#61ff00] shadow-[0_0_12px_rgba(97,255,0,0.9)]" />
            This week
            <span className="rounded-md bg-[#19330c] px-3 py-1 text-[#75ff17]">Long</span>
          </div>
          <div>Week 21 ⛶</div>
        </div>

        <div className="relative mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.25fr]">
          <div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-black tracking-tight lg:text-4xl">SPY</div>
              <div className="pb-1 text-xs text-white/72 lg:text-sm">S&amp;P 500</div>
            </div>
            <div className="mt-2 text-3xl font-light lg:text-4xl">598.40</div>
            <div className="mt-3 inline-flex rounded-md bg-[#14340a] px-3 py-1 text-xl text-[#6cff13]">+1.2%</div>
          </div>
          <div className="relative min-h-[145px]">
            <div className="absolute right-0 top-0 z-10 -rotate-12 rounded-[50%] border border-[#ffb000] px-7 py-2 font-mono text-base italic text-white shadow-[0_0_14px_rgba(255,176,0,0.42)] lg:text-lg">
              real signal.
            </div>
            <PriceChart />
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 lg:grid-cols-2">
          <div>
            <div className="text-sm text-white/65">Confidence</div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="h-3 w-2 rounded-[2px] bg-[#65ff00] shadow-[0_0_10px_rgba(101,255,0,0.5)]" />
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
      <div className="absolute -bottom-12 left-1/2 h-14 w-44 -translate-x-1/2 rounded-b-2xl bg-gradient-to-b from-[#141722] to-[#07080c] shadow-[0_24px_36px_rgba(0,0,0,0.55)]" />
      <div className="absolute -bottom-16 left-1/2 h-5 w-64 -translate-x-1/2 rounded-full bg-[#08090d] shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />
    </div>
  )
}

function DeskScene() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[84px] hidden h-[210px] lg:block">
      <div className="absolute bottom-3 left-[18%] grid size-[92px] place-items-center rounded-[18px] border border-[#e6ff00]/70 bg-[#05070a] text-white shadow-[0_0_30px_rgba(226,255,0,0.45),inset_0_0_18px_rgba(255,255,255,0.06)]">
        <Logo compact />
      </div>
      <div className="absolute bottom-2 right-[16%] h-[86px] w-[140px] rounded-b-[38px] rounded-t-lg border border-[#ffb000]/55 bg-[#040404] shadow-[0_0_32px_rgba(255,176,0,0.25)]">
        <div className="grid h-full place-items-center text-base text-white">Long<span className="-ml-1 font-serif italic text-[#ffb000]">brunch</span></div>
        <span className="absolute -right-9 top-5 size-12 rounded-full border-[10px] border-[#070707] shadow-[0_0_0_1px_rgba(255,176,0,0.3)]" />
      </div>
      <div className="absolute bottom-8 right-[6%] h-12 w-16 rotate-6 rounded-sm bg-[#c88b38] p-2 text-[12px] leading-3 text-[#2b1600] shadow-[0_0_18px_rgba(255,176,0,0.22)]">Live<br />now</div>
      <div className="absolute bottom-6 right-[2%] h-40 w-32">
        <div className="absolute bottom-0 right-2 h-24 w-2 rotate-[28deg] bg-[#1c1f27]" />
        <div className="absolute right-8 top-4 h-20 w-24 rotate-[18deg] rounded-b-full rounded-t-[42px] bg-[#050506] shadow-[inset_18px_-12px_20px_rgba(255,176,0,0.16),0_0_28px_rgba(255,176,0,0.2)]" />
        <div className="absolute right-12 top-[70px] h-9 w-20 rotate-[18deg] rounded-full bg-[#ffd891] blur-sm" />
      </div>
      <div className="absolute bottom-1 right-[25%] h-28 w-20">
        <div className="absolute bottom-0 left-5 h-14 w-12 rounded-b-xl bg-[#3c2417]" />
        {[-42, -22, 0, 24, 45].map((angle) => (
          <span key={angle} className="absolute bottom-12 left-8 h-20 w-3 origin-bottom rounded-full bg-[#163914]" style={{ transform: `rotate(${angle}deg)` }} />
        ))}
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-[820px] overflow-hidden bg-[#03050b] text-white lg:h-screen lg:min-h-[760px] lg:max-h-[960px]">
      <Header />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_6%,rgba(0,76,255,0.23),transparent_28%),radial-gradient(circle_at_10%_55%,rgba(0,20,80,0.32),transparent_32%),linear-gradient(180deg,#06071b_0%,#03050b_48%,#080403_100%)]" />
      <div className="absolute right-[2%] top-[7%] hidden h-[310px] w-[720px] opacity-65 [background-image:radial-gradient(rgba(0,92,255,0.9)_1px,transparent_1px)] [background-size:13px_13px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] lg:block" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(90,39,0,0.18)_44%,rgba(13,5,0,0.9))]" />
      <div className="absolute inset-x-0 bottom-[76px] hidden h-16 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.22),transparent_70%)] lg:block" />

      <div className="relative mx-auto grid h-full w-full max-w-[1510px] gap-7 px-6 pb-32 pt-28 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-14 lg:pb-28 lg:pt-20">
        <div className="z-10 flex flex-col justify-center lg:pt-16">
          <h1 className="max-w-[570px] text-[clamp(3.8rem,6.7vw,7.15rem)] font-black leading-[0.93] tracking-[-0.08em] text-white drop-shadow-[0_8px_20px_rgba(255,255,255,0.14)]">
            <span className="block">Signal</span>
            <span className="block bg-[linear-gradient(180deg,#5b73ff,#063dff)] bg-clip-text text-transparent">before</span>
            <span className="block">the open<span className="text-[#1556ff]">.</span></span>
          </h1>
          <p className="mt-7 max-w-[470px] text-lg leading-7 text-[#fff4c8] md:text-xl">
            AI-driven signals. One trade.<br />Every Sunday before the market opens.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/screener" className="group inline-flex h-14 items-center justify-center gap-4 rounded-xl bg-[#0757ff] px-7 text-base font-medium text-white shadow-[0_0_36px_rgba(7,87,255,0.42)] transition hover:bg-[#1a67ff]">
              See this week&apos;s signal
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </Link>
            <Link href="#how-it-works" className="relative inline-flex h-14 items-center text-base text-white transition hover:text-[#fff6a8]">
              How it works
              <span className="absolute bottom-2 left-0 h-0.5 w-full rounded-full bg-[#f8f200] shadow-[0_0_12px_rgba(248,242,0,0.8)]" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 min-h-[440px] lg:h-[590px]">
          <div className="absolute right-0 top-[9%] w-full max-w-[640px] xl:right-6">
            <SignalScreen />
          </div>
        </div>
      </div>

      <DeskScene />

      <div className="absolute inset-x-6 bottom-5 z-30 mx-auto max-w-[1400px] rounded-full border border-white/25 bg-white/[0.07] px-5 py-3 text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.08),0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur md:px-8">
        <div className="flex items-center gap-7 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
          {tickerTape.map(([symbol, price, change, direction]) => (
            <div key={symbol} className="flex shrink-0 items-center gap-3 text-base">
              <span className="size-2.5 rounded-full bg-[#0757ff]" />
              <span>{symbol}</span>
              <span className="text-white/68">{price}</span>
              <span className={direction === 'up' ? 'text-[#75ff17]' : 'text-[#ff7a22]'}>{change}</span>
            </div>
          ))}
          <span className="ml-auto hidden shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-5 py-2 text-sm text-white/90 md:inline-flex">▥ Live now</span>
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
            <p className="mt-6 text-lg leading-8 text-white/62">The page now keeps the full scene from the concept while fitting inside a normal laptop viewport.</p>
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
