import Link from 'next/link'
import {
  Bell,
  BookOpenText,
  Check,
  LineChart,
  ListFilter,
  PanelsTopLeft,
} from 'lucide-react'
import {
  CircleHighlight,
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
  SectionHeading,
} from '@/components/marketing/site-chrome'
import { getStripeUpgradeUrl, getViewerAccess } from '@/lib/billing'

const planFeatures = [
  'Signal workspace access',
  'Markets and ticker coverage',
  'Signals screener and saved watchlist',
  'Research context and AI research surfaces',
  'Alerts and updates',
  'Signal history views',
] as const

const includedCards = [
  {
    title: 'Signals',
    body: 'Open ranked signals, inspect direction and conviction, and move from the screener into individual names.',
    icon: PanelsTopLeft,
  },
  {
    title: 'Markets',
    body: 'Browse discovery lanes, market context, and ticker pages with signal summaries, charts, and fundamentals.',
    icon: LineChart,
  },
  {
    title: 'Screener & watchlist',
    body: 'Filter the tape, save names, and track stance changes across the assets you follow.',
    icon: ListFilter,
  },
  {
    title: 'Research & history',
    body: 'Review saved research runs, supporting context, and historical signal views inside the workspace.',
    icon: BookOpenText,
  },
  {
    title: 'Quiet by design',
    body: 'Email when it matters, nothing when it does not. The product is built to remove noise, not add to it.',
    icon: Bell,
  },
] as const

type AccessState = {
  accessBody: string
  accessLabel: string
  ctaHref: string
  ctaLabel: string
  ctaOpenInNewTab: boolean
  finalCtaBody: string
}

async function getAccessState(): Promise<AccessState> {
  const viewer = await getViewerAccess()

  if (viewer.isPro) {
    return {
      accessBody: 'Your account already has Pro access. Opening the CTA takes you straight into the workspace.',
      accessLabel: 'Current state: Pro access active',
      ctaHref: '/dashboard',
      ctaLabel: 'Open workspace',
      ctaOpenInNewTab: false,
      finalCtaBody: 'Your workspace is already unlocked.',
    }
  }

  if (viewer.isSignedIn) {
    const upgradeUrl = getStripeUpgradeUrl(viewer.userId)
    if (upgradeUrl) {
      return {
        accessBody:
          'Clicking the CTA opens the current Stripe checkout link. After successful checkout, the account is marked as Pro and the gated product surfaces unlock.',
        accessLabel: 'Current state: signed in, upgrade available',
        ctaHref: upgradeUrl,
        ctaLabel: 'Upgrade to Pro',
        ctaOpenInNewTab: true,
        finalCtaBody: 'Upgrade your existing account and continue in the workspace.',
      }
    }

    return {
      accessBody:
        'You already have an account. This page does not expose a live checkout link in the current environment, so the CTA returns you to the workspace.',
      accessLabel: 'Current state: signed in',
      ctaHref: '/dashboard',
      ctaLabel: 'Open workspace',
      ctaOpenInNewTab: false,
      finalCtaBody: 'Open your account and continue from the workspace.',
    }
  }

  return {
    accessBody:
      'Clicking the CTA starts with account creation. After sign-up, you continue into the product workspace from there.',
    accessLabel: 'Current state: account required first',
    ctaHref: '/sign-up?redirect_url=/dashboard',
    ctaLabel: 'Create account',
    ctaOpenInNewTab: false,
    finalCtaBody: 'Create your account first, then continue into the workspace.',
  }
}

export default async function PricingPage() {
  const accessState = await getAccessState()

  return (
    <MarketingPageShell
      activeHref="/pricing"
      eyebrow="Pricing"
      title={
        <>
          One plan.
          <br />
          Unlock the signal workspace.
          <br />
          <span className="text-[#0757ff]">Everything in one place.</span>
        </>
      }
      description="A single Pro plan gives you the full product workspace: signals, markets, ticker pages, watchlists, research context, alerts, and history."
      heroAccent={false}
      primaryCta={{
        label: accessState.ctaLabel,
        href: accessState.ctaHref,
        openInNewTab: accessState.ctaOpenInNewTab,
      }}
      secondaryCta={{ label: 'Read the FAQ', href: '/faq' }}
      heroAside={
        <GlassPanel className="p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">
                Pro
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-black leading-none tracking-tight">€49</span>
                <span className="pb-2 text-base text-slate-500 dark:text-white/52">/month</span>
              </div>
            </div>
            <div className="rounded-full border border-slate-950/10 bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/58">
              One plan
            </div>
          </div>
          <CircleHighlight className="mt-4" tone="orange">
            <HandScript className="text-[2.1rem] leading-none text-[#ff8b2b]">Simple pricing. Real edge.</HandScript>
          </CircleHighlight>
          <ul className="mt-7 space-y-3.5">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[0.97rem] leading-6">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.08] dark:text-[#f8f200]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-slate-950/8 bg-white/42 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/62">
            {accessState.accessLabel}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-white/45">
            Cancel anytime. No tiers, no add-ons.
          </p>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16">
        <SectionHeading
          eyebrow="What&apos;s included"
          title="The product surfaces that come with Pro."
          body="Access stays focused on the workspace itself rather than add-on tiers or marketing extras."
          accent={false}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {includedCards.map((item) => {
            const Icon = item.icon
            return (
              <GlassPanel key={item.title} className="p-6 sm:p-7">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.06] dark:text-[#f8f200]">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/62">{item.body}</p>
              </GlassPanel>
            )
          })}
        </div>
      </section>

      <section className="border-y border-slate-950/10 bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
          <SectionHeading
            eyebrow="Access flow"
            title="The CTA follows the access path that exists today."
            body={accessState.accessBody}
            accent={false}
          />
          <GlassPanel className="p-7">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-950/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">Step 1</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">
                  {accessState.ctaLabel === 'Create account'
                    ? 'Create your account first.'
                    : accessState.ctaLabel === 'Upgrade to Pro'
                      ? 'Use your existing account and continue to upgrade.'
                      : 'Open the account you already have.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-950/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">Step 2</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">
                  {accessState.ctaLabel === 'Upgrade to Pro'
                    ? 'Stripe checkout runs through the current payment link when it is configured.'
                    : 'Continue into the workspace from the authenticated product flow.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-950/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">Step 3</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">
                  Use Signals, Markets, Watchlist, Research, Alerts, and History from the same workspace.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-600 dark:text-white/62">
              Questions?{' '}
              <Link href="/faq" className="font-semibold text-[#0757ff] dark:text-[#f8f200]">
                Read the FAQ.
              </Link>
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-6 py-16 sm:px-10">
        <GlassPanel className="grid gap-5 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">
              Start access
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Start using the signal workspace.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-white/62">
              {accessState.finalCtaBody}
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-white/52">
              Information only. Not financial advice. Markets involve risk.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={accessState.ctaHref}
              target={accessState.ctaOpenInNewTab ? '_blank' : undefined}
              rel={accessState.ctaOpenInNewTab ? 'noopener noreferrer' : undefined}
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]"
            >
              {accessState.ctaLabel}
            </Link>
            <Link
              href="/screener"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-950/10 bg-white/45 px-6 text-sm font-semibold text-slate-950 transition hover:bg-white/68 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.1]"
            >
              Browse signals
            </Link>
          </div>
        </GlassPanel>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
