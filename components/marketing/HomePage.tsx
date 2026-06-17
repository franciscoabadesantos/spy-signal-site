import Link from 'next/link'
import { getImageProps } from 'next/image'
import { ArrowRight } from 'lucide-react'
import {
  CircleHighlight,
  HandScript,
  MarketingHeader,
} from '@/components/marketing/site-chrome'
import HomeTickerStory from '@/components/marketing/HomeTickerStory'

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
    </section>
  )
}

function Sections() {
  return (
    <div className="bg-white text-slate-950 dark:bg-[#00040a] dark:text-white">
      <div className="-mt-32 relative z-30 md:-mt-28">
        <HomeTickerStory />
      </div>

      <section id="pricing" className="border-t border-slate-950/10 bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.16),transparent_38%)] px-6 py-24 text-center dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(7,87,255,0.22),transparent_38%)] sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">Pricing</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Signals, research, and alerts in one workspace.</h2>
        <CircleHighlight className="mt-4" tone="orange">
          <HandScript className="text-[2.5rem] leading-none text-[#ff8b2b]">Open the product workspace.</HandScript>
        </CircleHighlight>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/62">Access the signal workspace, markets and ticker pages, watchlists, research context, alerts, and history views.</p>
        <Link href="/sign-up" className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]">
          Create account <ArrowRight className="size-5" />
        </Link>
        <div>
          <Link href="/pricing" className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#0757ff] dark:text-[#f8f200]">
            Open the full pricing page <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
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
