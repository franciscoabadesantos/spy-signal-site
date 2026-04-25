import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleOff,
  Database,
  Eye,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Target,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

const navItems = [
  { label: 'How it works', href: '/#problem' },
  { label: 'Performance', href: '/performance' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

const principles = [
  {
    title: 'Objective',
    body: 'Rule-based. No opinions. No overrides.',
    icon: Target,
  },
  {
    title: 'Systematic',
    body: 'A consistent process applied every day.',
    icon: BarChart3,
  },
  {
    title: 'Risk-aware',
    body: 'Designed to protect when conditions deteriorate.',
    icon: ShieldCheck,
  },
  {
    title: 'Transparent',
    body: 'You see the inputs, the logic, and the reasoning.',
    icon: Eye,
  },
]

const approach = [
  {
    title: 'Select proven inputs',
    body: 'We track a focused set of market dimensions with strong empirical evidence.',
    icon: Database,
  },
  {
    title: 'Measure what matters',
    body: 'Each input is measured objectively and updated daily after market close.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Apply the rules',
    body: 'A transparent logic chain converts inputs into a clear exposure signal.',
    icon: GitBranch,
  },
  {
    title: 'Manage risk',
    body: 'When conditions deteriorate, the system protects capital.',
    icon: ShieldCheck,
  },
  {
    title: 'One answer',
    body: 'The output is simple: the exposure you should hold.',
    icon: Target,
  },
]

const proof = [
  {
    label: 'Live since',
    value: 'Jan 2018',
    body: 'Through every market cycle.',
    icon: CalendarDays,
  },
  {
    label: '7+ years',
    value: 'Of live signals.',
    body: '',
    icon: BarChart3,
  },
  {
    label: 'Multiple cycles',
    value: 'Bull, bear, chop, recovery, volatility.',
    body: '',
    icon: RefreshCw,
  },
  {
    label: 'Multiple',
    value: 'Bull, bear, chop. No exceptions.',
    body: '',
    icon: ShieldCheck,
  },
  {
    label: 'Rule-based',
    value: 'No discretion.',
    body: '',
    icon: Eye,
  },
]

const teamValues = [
  {
    title: 'Independence',
    body: 'Northline Signal is independent and 100% founder-owned. No conflicts. No incentives to take risk.',
    icon: UserRound,
  },
  {
    title: 'Integrity',
    body: 'We built this for investors like us. We use the same process. We follow the same rules.',
    icon: Star,
  },
  {
    title: 'Continuous improvement',
    body: 'Markets evolve. So does our research. We test, learn, and refine, always.',
    icon: Eye,
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

function AboutHeader() {
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
                item.label === 'About' && 'border-[var(--nl-green)] text-white'
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

function RadarField() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block" aria-hidden="true">
      <div className="absolute right-8 top-9 h-[310px] w-[710px]">
        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-[var(--nl-axis)] opacity-45" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--nl-axis)] opacity-45" />
        <div className="absolute left-1/2 top-1/2 h-px w-[760px] -translate-x-1/2 rotate-[18deg] bg-[var(--nl-border)]" />
        <div className="absolute left-1/2 top-1/2 h-px w-[760px] -translate-x-1/2 -rotate-[23deg] bg-[var(--nl-border)]" />
        {[64, 104, 150, 206, 276, 368, 484].map((width) => (
          <div
            key={width}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nl-border-strong)]"
            style={{ width, height: width * 0.32 }}
          />
        ))}
        <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--nl-green)_0_36%,rgba(14,122,53,0.28)_37%_58%,transparent_60%)]" />
        {[12, 24, 36, 48, 60, 72].map((offset, index) => (
          <span
            key={offset}
            className="absolute size-1 rounded-full bg-[var(--nl-green)] opacity-55"
            style={{
              left: `${19 + offset}%`,
              top: `${18 + (index % 3) * 21}%`,
            }}
          />
        ))}
        {[8, 78, 91].map((left) => (
          <span key={left} className="absolute top-1/2 size-1 rounded-full bg-[var(--nl-green)] opacity-55" style={{ left: `${left}%` }} />
        ))}
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--nl-border)]">
      <RadarField />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 py-12 md:px-10 md:py-14">
        <div className="max-w-[520px]">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">About Northline Signal</div>
          <h1 className="mt-5 text-4xl font-medium leading-tight text-[var(--nl-text)] md:text-5xl">
            <span className="block">Built for clarity.</span>
            <span className="block text-[var(--nl-green)]">Driven by discipline.</span>
          </h1>
          <p className="mt-7 max-w-[33rem] text-base leading-7 text-[var(--nl-muted)]">
            Northline Signal is a systematic market exposure signal for the S&amp;P 500. We remove emotion
            and guesswork, so you can focus on what matters.
          </p>
        </div>
      </div>
    </section>
  )
}

function IconBubble({ icon: Icon, className }: { icon: IconType; className?: string }) {
  return (
    <span className={cn('grid size-12 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]', className)}>
      <Icon className="size-6" strokeWidth={1.6} />
    </span>
  )
}

function MissionSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-11 md:px-10 lg:grid-cols-[360px_1fr] lg:items-start">
        <div>
          <div className="text-sm font-semibold text-[var(--nl-green)]">Our mission</div>
          <h2 className="mt-5 max-w-[21rem] text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Better decisions through a better process.
          </h2>
          <p className="mt-5 max-w-[23rem] text-base leading-7 text-[var(--nl-muted)]">
            Investors don&apos;t need more opinions. They need a process they can trust.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((item) => (
            <div key={item.title} className="border-l border-[var(--nl-border)] pl-6">
              <IconBubble icon={item.icon} />
              <h3 className="mt-5 text-sm font-semibold text-[var(--nl-text)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AudienceSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-10">
      <div className="grid overflow-hidden rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] md:grid-cols-2">
        <div className="grid gap-6 p-7 sm:grid-cols-[76px_1fr] md:p-8">
          <div className="sm:col-span-2 text-sm font-semibold text-[var(--nl-green)]">Who it&apos;s for</div>
          <IconBubble icon={UserRound} className="size-16" />
          <p className="max-w-[24rem] text-lg leading-8 text-[var(--nl-text)]">
            Investors who want a clear, systematic read on market exposure. Actionable. Repeatable. Built to last.
          </p>
        </div>
        <div className="grid gap-6 border-t border-[var(--nl-border)] p-7 sm:grid-cols-[76px_1fr] md:border-l md:border-t-0 md:p-8">
          <div className="sm:col-span-2 text-sm font-semibold text-[var(--nl-green)]">Who it&apos;s not for</div>
          <IconBubble icon={CircleOff} className="size-16" />
          <div className="grid gap-3 text-sm leading-6 text-[var(--nl-text)]">
            <p>Those looking for predictions or certainty.</p>
            <p>Those who want someone else to make decisions for them.</p>
            <p>Those seeking short-term calls or constant activity.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ApproachSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="text-sm font-semibold text-[var(--nl-green)]">Our approach</div>
          <h2 className="mt-5 max-w-[24rem] text-3xl font-medium leading-tight text-[var(--nl-text)]">
            A disciplined framework stands the test of time.
          </h2>
          <p className="mt-5 max-w-[22rem] text-base leading-7 text-[var(--nl-muted)]">
            Markets change. Emotions don&apos;t. We focus on the factors that matter most and let the data do
            the talking.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {approach.map((item, index) => (
            <div key={item.title} className="relative">
              {index > 0 && (
                <span className="absolute -left-4 top-14 hidden h-px w-8 bg-[var(--nl-border-strong)] xl:block" />
              )}
              <div className="text-sm text-[var(--nl-muted)]">{String(index + 1).padStart(2, '0')}</div>
              <IconBubble icon={item.icon} className="mt-5" />
              <h3 className="mt-5 text-sm font-semibold text-[var(--nl-text)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProofBand() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-10">
      <div className="grid gap-6 rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] p-7 lg:grid-cols-[300px_1fr] lg:p-8">
        <h2 className="max-w-[19rem] text-2xl font-medium leading-tight text-[var(--nl-text)]">
          Built on evidence. Proven in real markets.
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {proof.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="border-l border-[var(--nl-border)] pl-5">
                <Icon className="mb-4 size-6 text-[var(--nl-text)]" strokeWidth={1.6} />
                <div className="text-sm font-semibold text-[var(--nl-text)]">{item.label}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--nl-muted)]">
                  {item.value}
                  {item.body ? <><br />{item.body}</> : null}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TeamSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-10">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="text-sm font-semibold text-[var(--nl-green)]">The team</div>
          <h2 className="mt-5 max-w-[20rem] text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Focused on the process. Not the noise.
          </h2>
          <p className="mt-5 max-w-[22rem] text-sm leading-6 text-[var(--nl-muted)]">
            We are a small team of market and systematic investors with decades of combined experience. Our
            focus is singular: build the best process, keep improving it, and deliver it with integrity.
          </p>
        </div>
        <div className="grid gap-6 rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] p-7 md:grid-cols-3 md:p-8">
          {teamValues.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="border-l border-[var(--nl-border)] pl-5 first:border-l-0 first:pl-0">
                <Icon className="mb-5 size-7 text-[var(--nl-green)]" strokeWidth={1.6} />
                <h3 className="text-base font-semibold text-[var(--nl-text)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-5 pt-3 md:px-10">
      <div className="grid gap-5 rounded-[5px] border border-white/10 bg-[#01131b] p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div className="flex items-center gap-5">
          <LogoMark className="size-12 border-[var(--nl-green)]" />
          <div>
            <h2 className="text-xl font-semibold">Ready to see the system in action?</h2>
            <p className="mt-2 text-sm text-slate-300">Get access to the current signal and full system view.</p>
          </div>
        </div>
        <Link
          href="/sign-up"
          className="inline-flex h-12 items-center justify-center gap-3 rounded-[4px] bg-[var(--nl-green)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--nl-green-strong)]"
        >
          Get access now
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <div className="nl-page-bg min-h-screen bg-[var(--nl-bg)] text-[var(--nl-text)]">
      <AboutHeader />
      <main>
        <HeroSection />
        <MissionSection />
        <AudienceSection />
        <ApproachSection />
        <ProofBand />
        <TeamSection />
        <CtaBand />
      </main>
    </div>
  )
}
