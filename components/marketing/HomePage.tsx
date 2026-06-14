import Link from 'next/link'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'

function HeroLink({ href, label, className }: { href: string; label: string; className: string }) {
  return <Link href={href} aria-label={label} className={`absolute z-20 ${className}`} />
}

function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden bg-[#02040a] text-white md:h-screen md:max-h-[960px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/marketing/signal-hero-scene.svg"
          alt="Signal before the open"
          className="h-full w-full object-cover object-center"
        />
      </div>

      <HeroLink href="/" label="Home" className="left-[3.4%] top-[2.6%] h-[6%] w-[12.6%]" />
      <HeroLink href="#how-it-works" label="How it works" className="left-[24.8%] top-[3.1%] h-[5.8%] w-[8.6%]" />
      <HeroLink href="#performance" label="Performance" className="left-[33.1%] top-[3.1%] h-[5.8%] w-[8.2%]" />
      <HeroLink href="#method" label="Method" className="left-[41%] top-[3.1%] h-[5.8%] w-[6.2%]" />
      <HeroLink href="#pricing" label="Pricing" className="left-[47.9%] top-[3.1%] h-[5.8%] w-[5.5%]" />
      <HeroLink href="#faq" label="FAQ" className="left-[54.1%] top-[3.1%] h-[5.8%] w-[4%]" />
      <HeroLink href="/sign-up" label="Join the lounge" className="right-[4.1%] top-[2.7%] h-[6.5%] w-[13.6%] rounded-full" />
      <HeroLink href="/screener" label="See this week's signal" className="left-[4.1%] top-[70.5%] h-[6.4%] w-[16.1%] rounded-xl" />
      <HeroLink href="#how-it-works" label="How it works" className="left-[22.6%] top-[70.8%] h-[6.2%] w-[9%]" />
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
            <p className="mt-6 text-lg leading-8 text-white/62">The hero is now an exported scene asset, so it stays composed like the reference design instead of reflowing into oversized separate pieces.</p>
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
