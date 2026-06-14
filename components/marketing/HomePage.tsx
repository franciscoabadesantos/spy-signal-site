import Link from 'next/link'
import { getImageProps } from 'next/image'
import type React from 'react'
import { Activity, ArrowRight, BarChart3, Check, CircleDollarSign, Sparkles, Zap } from 'lucide-react'

const heroLinks = [
  {
    label: 'Home',
    href: '/',
    className: 'left-[4%] top-[5.8%] h-[3.4%] w-[12%] md:left-[3.7%] md:top-[3.9%] md:h-[4%] md:w-[10.6%]',
  },
  {
    label: 'How it works',
    href: '#how-it-works',
    className: 'left-[24%] top-[6.2%] h-[2.4%] w-[8%] md:left-[24%] md:top-[4.5%] md:h-[3.5%] md:w-[7.6%]',
  },
  {
    label: 'Performance',
    href: '#performance',
    className: 'left-[32%] top-[6.2%] h-[2.4%] w-[9%] md:left-[32.3%] md:top-[4.5%] md:h-[3.5%] md:w-[7.4%]',
  },
  {
    label: 'Method',
    href: '#method',
    className: 'left-[41%] top-[6.2%] h-[2.4%] w-[7%] md:left-[40.4%] md:top-[4.5%] md:h-[3.5%] md:w-[5.3%]',
  },
  {
    label: 'Pricing',
    href: '#pricing',
    className: 'left-[48%] top-[6.2%] h-[2.4%] w-[6%] md:left-[47.1%] md:top-[4.5%] md:h-[3.5%] md:w-[5%]',
  },
  {
    label: 'FAQ',
    href: '#faq',
    className: 'left-[55%] top-[6.2%] h-[2.4%] w-[5%] md:left-[52.5%] md:top-[4.5%] md:h-[3.5%] md:w-[4.1%]',
  },
  {
    label: 'Join the lounge',
    href: '/sign-up',
    className: 'left-[83.6%] top-[5.8%] h-[3.7%] w-[13.8%] md:left-[83.6%] md:top-[2.6%] md:h-[6.4%] md:w-[14.2%]',
  },
  {
    label: "See this week's signal",
    href: '/screener',
    className: 'left-[4%] top-[35%] h-[3.2%] w-[16.4%] md:left-[3.8%] md:top-[68%] md:h-[6.3%] md:w-[16.4%]',
  },
  {
    label: 'How it works',
    href: '#how-it-works',
    className: 'left-[22%] top-[35.6%] h-[3%] w-[11%] md:left-[22.1%] md:top-[70.1%] md:h-[5.2%] md:w-[9.6%]',
  },
] as const

function HeroLink({ href, label, className }: (typeof heroLinks)[number]) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`absolute z-10 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f8f200] ${className}`}
    >
      <span className="sr-only">{label}</span>
    </Link>
  )
}

function Hero() {
  const common = {
    alt: 'Signal before the open weekly market signal hero artwork',
    className: 'h-full w-full object-cover',
    priority: true,
    sizes: '100vw',
  }
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    width: 1920,
    height: 1080,
    src: '/marketing/hero-desktop.webp',
  })
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    width: 1080,
    height: 1350,
    src: '/marketing/hero-mobile.webp',
  })

  return (
    <section className="relative isolate aspect-[4/5] overflow-hidden bg-[#02040a] text-white md:aspect-[16/9]">
      <picture className="absolute inset-0 block">
        <source media="(min-width: 768px)" srcSet={desktop} />
        <source media="(max-width: 767px)" srcSet={mobile} />
        <img {...rest} alt={common.alt} />
      </picture>
      {heroLinks.map((link, index) => (
        <HeroLink key={`${link.href}-${link.label}-${index}`} {...link} />
      ))}
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
            <p className="mt-6 text-lg leading-8 text-white/62">The hero uses the supplied rendered artwork directly, keeping the marketing composition consistent across the page.</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-[#060b16] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f8f200]">Asset-first hero</p>
            <h3 className="mt-5 text-3xl font-black tracking-tight text-white">The product scene is the artwork.</h3>
            <p className="mt-5 leading-7 text-white/62">
              Navigation and calls to action remain interactive, but the monitor, ticker, desk, lighting, and signal interface stay inside the rendered image.
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
