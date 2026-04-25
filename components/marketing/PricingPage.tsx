import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock3,
  Grid3X3,
  LineChart,
  Lock,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'How it works', href: '/#problem' },
  { label: 'Performance', href: '/performance' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

const planFeatures = [
  'Daily exposure signal (S&P 500)',
  'Full system view',
  'Condition readings & regime position',
  'Logic chain & reasoning',
  'Historical signal record',
  'Performance track record',
  'Email updates & alerts',
  'Access on web & mobile',
]

const included = [
  {
    title: 'The daily exposure signal',
    body: 'A single, clear answer on how much exposure to hold in the S&P 500.',
    icon: LineChart,
  },
  {
    title: 'Full system view',
    body: 'See the conditions, logic, and regime position behind the signal.',
    icon: Grid3X3,
  },
  {
    title: 'Historical record',
    body: 'Review how the system has performed across every market cycle.',
    icon: Clock3,
  },
  {
    title: 'Updates & alerts',
    body: 'Daily updates after market close and important system alerts.',
    icon: Bell,
  },
]

const reasons = [
  {
    title: 'Rule-based process',
    body: 'No opinions. No overrides.',
    icon: Target,
    values: ['Yes', 'No', 'Partial', 'Unclear'],
  },
  {
    title: 'Consistent through cycles',
    body: 'Same rules in every market.',
    icon: RefreshCw,
    values: ['Yes', 'No', 'No', 'Unclear'],
  },
  {
    title: 'Built for risk management',
    body: 'Designed to protect capital.',
    icon: ShieldCheck,
    values: ['Yes', 'No', 'No', 'Unclear'],
  },
  {
    title: 'Transparency',
    body: 'See the why behind every signal.',
    icon: TrendingUp,
    values: ['Yes', 'No', 'No', 'Unclear'],
  },
]

const faqItems = [
  {
    question: 'How often is the signal updated?',
    answer: 'The system updates daily after market close when new inputs are processed.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. The plan is monthly, and you can cancel before the next billing cycle.',
  },
  {
    question: 'What markets does this cover?',
    answer: 'The current signal focuses on S&P 500 exposure through SPY.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. Northline Signal provides systematic research and market exposure data, not individualized financial advice.',
  },
]

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-6 items-center justify-center rounded-full border-2 border-[var(--nl-green)]',
        className
      )}
      aria-hidden="true"
    >
      <span className="size-2.5 rounded-full bg-[var(--nl-green)]" />
    </span>
  )
}

function PricingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#01131b]/96 text-white backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between gap-5 px-5 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-sm font-semibold uppercase">
          <LogoMark />
          <span>Northline Signal</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'border-b-2 border-transparent py-6 transition hover:text-white',
                item.label === 'Pricing' && 'border-[var(--nl-green)] text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-up"
            className="hidden h-10 items-center rounded-[4px] bg-[var(--nl-green)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--nl-green-strong)] sm:inline-flex"
          >
            Get access
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center rounded-[4px] border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-[var(--nl-green)]"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroRings() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden lg:block" aria-hidden="true">
      <div className="absolute -right-40 top-0 size-[720px] rounded-full border border-[var(--nl-border)] opacity-80" />
      <div className="absolute -right-20 top-24 size-[520px] rounded-full border-[64px] border-[var(--nl-ring-muted)] opacity-20" />
      <div className="absolute right-28 top-52 size-[250px] rounded-full border-[58px] border-[var(--nl-green)] opacity-10" />
      <div className="absolute right-[220px] top-[330px] size-12 rounded-full bg-[var(--nl-green)] opacity-25" />
      <div className="absolute -right-40 top-0 size-[720px] rounded-full bg-[repeating-radial-gradient(circle,rgba(14,122,53,0.12)_0_1px,transparent_1px_6px)] opacity-35" />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--nl-border)]">
      <HeroRings />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 py-9 md:px-10 md:py-12">
        <div className="max-w-[620px]">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Pricing</div>
          <h1 className="mt-5 text-4xl font-medium leading-tight text-[var(--nl-text)] md:text-5xl">
            <span className="block">Simple pricing.</span>
            <span className="block text-[var(--nl-green)]">One system. Full access.</span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-lg leading-8 text-[var(--nl-muted)]">
            Get the same systematic signal trusted by investors every day with everything you need.
          </p>
          <div className="mt-8 grid max-w-[420px] grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]">
                <Clock3 className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-sm font-semibold text-[var(--nl-text)]">Updated daily</div>
                <div className="mt-1 text-sm text-[var(--nl-muted)]">After market close</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]">
                <ShieldCheck className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-sm font-semibold text-[var(--nl-text)]">Built for discipline</div>
                <div className="mt-1 text-sm text-[var(--nl-muted)]">Not speculation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlanCard() {
  return (
    <div className="rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-card)] p-6 shadow-none">
      <div className="text-sm font-semibold uppercase text-[var(--nl-green)]">Monthly plan</div>
      <div className="mt-4 flex items-end gap-2 text-[var(--nl-text)]">
        <span className="text-6xl font-medium leading-none">€49</span>
        <span className="pb-2 text-base text-[var(--nl-muted)]">/month</span>
      </div>
      <p className="mt-3 text-sm text-[var(--nl-muted)]">Cancel anytime.</p>
      <ul className="mt-5 space-y-3 border-t border-[var(--nl-border)] pt-5">
        {planFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-[var(--nl-text)]">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--nl-green)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/sign-up"
        className="mt-6 flex h-12 items-center justify-center gap-3 rounded-[4px] bg-[var(--nl-green)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--nl-green-strong)]"
      >
        Get access now
        <ArrowRight className="size-4" />
      </Link>
      <p className="mt-5 text-center text-sm text-[var(--nl-muted)]">30-day satisfaction guarantee</p>
    </div>
  )
}

function IncludedSection() {
  return (
    <div>
      <h2 className="text-2xl font-medium text-[var(--nl-text)]">What&apos;s included</h2>
      <div className="mt-6 grid gap-6">
        {included.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="grid grid-cols-[52px_1fr] gap-5">
              <span className="grid size-12 place-items-center rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-card)] text-[var(--nl-text)]">
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
              <div className="pt-1">
                <h3 className="text-sm font-semibold text-[var(--nl-text)]">{item.title}</h3>
                <p className="mt-2 max-w-[25rem] text-sm leading-6 text-[var(--nl-muted)]">{item.body}</p>
              </div>
            </div>
          )
        })}
        <div className="mt-1 flex items-center gap-5 rounded-[5px] bg-[var(--nl-callout)] px-5 py-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-text)]">
            <Lock className="size-5" strokeWidth={1.7} />
          </span>
          <div>
            <div className="text-base font-semibold text-[var(--nl-text)]">Secure. Private. Yours.</div>
            <div className="mt-1 text-sm text-[var(--nl-muted)]">Your data is encrypted and never shared.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[760px] gap-10 px-5 py-5 md:px-10 lg:max-w-[820px] lg:grid-cols-[330px_1fr] lg:py-5 xl:max-w-[820px]">
        <PlanCard />
        <IncludedSection />
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-10">
      <div className="grid overflow-hidden rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-panel)] lg:grid-cols-[360px_1fr]">
        <div className="p-8">
          <h2 className="text-xl font-medium text-[var(--nl-text)]">Why investors choose Northline Signal</h2>
          <div className="mt-7 grid gap-5">
            {reasons.map((reason) => {
              const Icon = reason.icon
              return (
                <div key={reason.title} className="flex gap-4">
                  <Icon className="mt-1 size-6 shrink-0 text-[var(--nl-green)]" strokeWidth={1.6} />
                  <div>
                    <div className="text-sm font-semibold text-[var(--nl-text)]">{reason.title}</div>
                    <div className="mt-1 text-sm text-[var(--nl-muted)]">{reason.body}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="overflow-x-auto border-t border-[var(--nl-border)] lg:border-l lg:border-t-0">
          <table className="min-w-[640px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-[var(--nl-text)]">
                {['Northline Signal', 'Typical Investor', 'Buy & Hold', 'Other Signals'].map((heading) => (
                  <th key={heading} className="border-b border-[var(--nl-border)] px-6 py-5 text-center font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reasons.map((reason) => (
                <tr key={reason.title}>
                  {reason.values.map((value, index) => (
                    <td key={`${reason.title}-${value}-${index}`} className="border-b border-r border-[var(--nl-border)] px-6 py-5 text-center text-[var(--nl-text)] last:border-r-0">
                      <span className="inline-flex items-center justify-center gap-2">
                        {index === 0 && <Check className="size-4 rounded-full bg-[var(--nl-green)] p-0.5 text-white" />}
                        {value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-7 md:px-10">
      <h2 className="text-2xl font-medium text-[var(--nl-text)]">Frequently asked questions</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {faqItems.map((item) => (
          <details key={item.question} className="group rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-card)] px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--nl-text)]">
              {item.question}
              <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function GuaranteeBand() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-4 md:px-10">
      <div className="grid gap-6 rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-callout)] px-6 py-5 md:grid-cols-[1.5fr_1fr_1fr] md:items-center">
        <div className="flex items-center gap-6">
          <div className="grid size-16 shrink-0 place-items-center rounded-full border-[6px] border-[var(--nl-ring-muted)] border-l-[var(--nl-green)] bg-[var(--nl-card-solid)] text-center text-[var(--nl-text)]">
            <span className="text-lg font-semibold leading-none">30</span>
            <span className="-mt-3 text-[10px] font-semibold uppercase">days</span>
          </div>
          <div>
            <div className="text-base font-semibold text-[var(--nl-text)]">30-day satisfaction guarantee</div>
            <p className="mt-2 text-sm leading-6 text-[var(--nl-muted)]">
              Try Northline Signal risk-free for 30 days. If it&apos;s not right for you, get a full refund.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="grid size-11 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]">
            <Lock className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-[var(--nl-text)]">Secure payments</div>
            <div className="mt-1 text-sm text-[var(--nl-muted)]">Powered by Stripe</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="grid size-11 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-[var(--nl-text)]">Your data is safe</div>
            <div className="mt-1 text-sm text-[var(--nl-muted)]">We never share your information</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <div className="nl-page-bg min-h-screen bg-[var(--nl-bg)] text-[var(--nl-text)]">
      <PricingHeader />
      <main>
        <HeroSection />
        <AccessSection />
        <ComparisonSection />
        <FaqSection />
        <GuaranteeBand />
      </main>
    </div>
  )
}
