import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Sora, JetBrains_Mono, Inter } from 'next/font/google'
import { MarketingHeader } from '@/components/marketing/site-chrome'
import HomeTickerStory from '@/components/marketing/HomeTickerStory'
import HeroConstellation from '@/components/marketing/HeroConstellation'
import DockingSearch from '@/components/marketing/DockingSearch'

const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap' })
const inter = Inter({ subsets: ['latin'], display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' })

function Sections() {
  return (
    <div className="relative z-30 text-content-primary">
      <div className="-mt-32 md:-mt-28">
        <HomeTickerStory />
      </div>

      <section
        id="pricing"
        className="relative overflow-hidden border-t border-border px-6 py-28 text-center sm:px-10"
      >
        {/* momento de marca — spark teal usado com parcimónia */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brand-spark),transparent)] opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[440px] w-[860px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--brand-spark)_14%,transparent),transparent)] blur-2xl"
        />

        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs uppercase tracking-[0.28em] text-brand-spark"
        >
          Pricing
        </p>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl"
        >
          Signals, research, and alerts in one workspace.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-content-secondary">
          Access the signal workspace, markets and ticker pages, watchlists, research context, alerts, and the
          weekly signal that sets the tone before Monday starts.
        </p>

        <Link
          href="/sign-up"
          className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-spark px-8 font-semibold text-[color:var(--brand-spark-on)] shadow-[0_18px_50px_-12px_var(--brand-spark)] transition hover:brightness-110"
        >
          Create account <ArrowRight className="size-5" />
        </Link>
        <div>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-content-secondary transition hover:text-brand-spark"
          >
            Open the full pricing page <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default function MarketingHomePage() {
  return (
    <main
      data-theme="light"
      style={{
        ['--font-display' as never]: sora.style.fontFamily,
        ['--font-body' as never]: inter.style.fontFamily,
        ['--font-mono' as never]: mono.style.fontFamily,
        fontFamily: 'var(--font-body)',
      }}
      className="marketing-home relative min-h-screen bg-[var(--page-bg)] text-content-primary"
    >
      <MarketingHeader activeHref="/" />
      <DockingSearch />
      <HeroConstellation />
      <Sections />
    </main>
  )
}
