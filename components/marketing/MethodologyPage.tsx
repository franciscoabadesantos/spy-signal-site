import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Droplet,
  Eye,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
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

const frameworkSteps = [
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
    body: 'A transparent logic chain converts inputs into a continuous exposure score.',
    icon: GitBranch,
  },
  {
    title: 'Manage risk',
    body: 'When conditions deteriorate, the system reduces risk to protect capital.',
    icon: ShieldCheck,
  },
  {
    title: 'One answer',
    body: 'The output is simple: the exposure you should hold.',
    icon: Target,
  },
]

const pipelineStages = [
  {
    stage: 'Data ingestion',
    desc: 'Price, volume, and macro data are fetched from external sources. Data is stored with explicit date handling, and macro inputs are aligned using release-aware availability rules rather than revised hindsight values.',
  },
  {
    stage: 'Feature engineering',
    desc: 'Technical, return-based, and macro regime features are computed only from information that should be available at the decision timestamp.',
  },
  {
    stage: 'Model training',
    desc: 'A model is trained on rolling historical windows and retrained on a fixed schedule. The exact live feature set, model specification, and parameterization are not publicly disclosed.',
  },
  {
    stage: 'Signal generation',
    desc: 'The model produces a forward expectation for SPY using end-of-day information under a fixed timing contract.',
  },
  {
    stage: 'Risk and allocation layer',
    desc: 'Model output is translated into an invest-or-flat stance through risk-scaling and allocation logic. In the public live version, this results in either positive SPY exposure or a flat position.',
  },
  {
    stage: 'Backtesting and validation',
    desc: 'Performance is evaluated on held-out periods through walk-forward testing, with no leakage from evaluation windows into training or feature construction.',
  },
]

const dimensions = [
  {
    title: 'Momentum',
    label: 'Trend strength',
    measure: 'Measures the rate and strength of price trends across the market.',
    why: 'Strong momentum regimes tend to persist. Weak momentum often precedes drawdowns.',
    icon: TrendingUp,
  },
  {
    title: 'Macro Regime',
    label: 'Economic backdrop',
    measure: 'Assesses economic growth, inflation, and policy conditions.',
    why: 'The macro environment determines the path of risk assets.',
    icon: BarChart3,
  },
  {
    title: 'Volatility',
    label: 'Market stress',
    measure: 'Tracks realized and implied volatility to gauge market stress.',
    why: 'Rising volatility increases risk of capital impairment.',
    icon: Activity,
  },
  {
    title: 'Market Breadth',
    label: 'Participation',
    measure: 'Measures the percentage of stocks participating in uptrends.',
    why: 'Broad participation supports trends. Narrow markets are more fragile.',
    icon: CircleDot,
  },
  {
    title: 'Liquidity',
    label: 'Market liquidity',
    measure: 'Monitors liquidity conditions across key markets.',
    why: 'Liquidity dries up before stress becomes price damage.',
    icon: Droplet,
  },
]

const realMarkets = [
  {
    title: 'Risk first',
    body: 'Protect capital when conditions deteriorate.',
    icon: ShieldCheck,
  },
  {
    title: 'Adaptive',
    body: 'Rules adjust to changing market environments.',
    icon: RefreshCw,
  },
  {
    title: 'Objective',
    body: 'No opinions. No overrides. Just data and rules.',
    icon: Eye,
  },
  {
    title: 'Consistent',
    body: 'The same process, applied every day.',
    icon: CalendarDays,
  },
  {
    title: 'Repeatable',
    body: 'A framework you can rely on, cycle after cycle.',
    icon: BarChart3,
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
    value: 'Of live signals',
    body: '',
    icon: TrendingUp,
  },
  {
    label: 'Multiple cycles',
    value: 'Bull, bear, chop, recovery, volatility.',
    body: '',
    icon: RefreshCw,
  },
  {
    label: 'Rule-based',
    value: 'No discretion. No overrides.',
    body: '',
    icon: ShieldCheck,
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

function MethodologyHeader() {
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
                item.label === 'Methodology' && 'border-[var(--nl-green)] text-white'
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

function MethodologyField() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block" aria-hidden="true">
      <div className="absolute right-0 top-0 h-[330px] w-[760px]">
        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-[var(--nl-axis)] opacity-35" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--nl-axis)] opacity-4" />
        {[90, 160, 250, 365, 520].map((width, index) => (
          <div
            key={width}
            className="absolute left-1/2 rounded-full border border-[var(--nl-border-strong)] bg-[var(--nl-panel)]"
            style={{
              top: `${60 + index * 38}px`,
              width,
              height: width * 0.16,
              transform: 'translateX(-50%)',
              opacity: 0.4 + index * 0.08,
            }}
          />
        ))}
        {[72, 118, 176, 250, 345, 470].map((width) => (
          <div
            key={`ring-${width}`}
            className="absolute left-1/2 top-[205px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nl-border-strong)]"
            style={{ width, height: width * 0.32 }}
          />
        ))}
        <div className="absolute left-1/2 top-[205px] size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--nl-green)_0_36%,rgba(14,122,53,0.28)_37%_58%,transparent_60%)]" />
        {[14, 24, 34, 44, 54, 64, 74, 84].map((left, index) => (
          <span
            key={left}
            className="absolute size-1 rounded-full bg-[var(--nl-green)] opacity-50"
            style={{ left: `${left}%`, top: `${40 + (index % 4) * 42}px` }}
          />
        ))}
      </div>
    </div>
  )
}

function IconBubble({ icon: Icon, className }: { icon: IconType; className?: string }) {
  return (
    <span className={cn('grid size-12 place-items-center rounded-full bg-[var(--nl-step-bg)] text-[var(--nl-green)]', className)}>
      <Icon className="size-6" strokeWidth={1.6} />
    </span>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--nl-border)]">
      <MethodologyField />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 py-14 md:px-10 md:py-16">
        <div className="max-w-[590px]">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Methodology</div>
          <h1 className="mt-5 text-4xl font-medium leading-tight text-[var(--nl-text)] md:text-5xl">
            <span className="block">A systematic process.</span>
            <span className="block text-[var(--nl-green)]">Built to adapt. Proven to last.</span>
          </h1>
          <p className="mt-7 max-w-[36rem] text-base leading-7 text-[var(--nl-muted)]">
            Northline Signal uses a rules-based framework to measure market conditions, manage risk,
            and provide one clear answer: how much exposure to hold.
          </p>
        </div>
      </div>
    </section>
  )
}

function FrameworkSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-9 px-5 py-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <div className="lg:border-r lg:border-[var(--nl-border)] lg:pr-10">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">1. The framework</div>
          <h2 className="mt-5 text-3xl font-medium leading-tight text-[var(--nl-text)]">From data to decision.</h2>
          <p className="mt-5 text-base leading-7 text-[var(--nl-muted)]">
            A disciplined five-step process that turns market data into a clear exposure signal.
          </p>
          <Link href="/#problem" className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[var(--nl-green)]">
            See how it works
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {frameworkSteps.map((item, index) => (
            <div key={item.title} className="relative">
              {index > 0 && (
                <ChevronRight className="absolute -left-5 top-14 hidden size-5 text-[var(--nl-border-strong)] xl:block" />
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

function PipelineSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-9 px-5 py-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <div className="lg:border-r lg:border-[var(--nl-border)] lg:pr-10">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">2. Pipeline architecture</div>
          <h2 className="mt-5 text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Clear stages. Explicit timing assumptions.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--nl-muted)]">
            The system is structured as a sequential pipeline with clear stage boundaries and explicit timing assumptions.
          </p>
        </div>
        <div className="rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)]">
          <div className="grid md:grid-cols-2">
            {pipelineStages.map((item, index) => (
              <div
                key={item.stage}
                className="border-b border-[var(--nl-border)] p-6 md:border-r md:odd:border-r md:even:border-r-0 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-sm font-semibold text-[var(--nl-green)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--nl-text)]">{item.stage}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--nl-border)] bg-[var(--nl-callout)] px-6 py-5 text-sm leading-6 text-[var(--nl-text)]">
            The same core system contract is used across research and live runtime. Public results are intended
            to reflect the deployed process rather than a separate simplified demonstration path.
          </div>
        </div>
      </div>
    </section>
  )
}

function DimensionsSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-9 px-5 py-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <div className="lg:border-r lg:border-[var(--nl-border)] lg:pr-10">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">3. The dimensions</div>
          <h2 className="mt-5 text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Five dimensions. Every day.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--nl-muted)]">
            We evaluate the market across five key dimensions that capture trend, momentum, volatility,
            breadth, and liquidity conditions.
          </p>
        </div>
        <div className="overflow-hidden rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)]">
          {dimensions.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="grid gap-5 border-b border-[var(--nl-border)] p-5 last:border-b-0 md:grid-cols-[220px_1fr_1fr] md:p-6">
                <div className="flex items-start gap-4">
                  <Icon className="mt-1 size-6 shrink-0 text-[var(--nl-green)]" strokeWidth={1.6} />
                  <div>
                    <h3 className="text-base font-semibold text-[var(--nl-text)]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[var(--nl-muted)]">{item.label}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-[var(--nl-muted)]">{item.measure}</p>
                <div className="text-sm leading-6 text-[var(--nl-muted)]">
                  <div className="font-semibold text-[var(--nl-text)]">Why it matters</div>
                  <p className="mt-1">{item.why}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LogicSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-9 px-5 py-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <div className="lg:border-r lg:border-[var(--nl-border)] lg:pr-10">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">4. Logic &amp; output</div>
          <h2 className="mt-5 text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Transparent logic. Continuous output.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--nl-muted)]">
            All inputs are combined using a proprietary ruleset to produce a continuous exposure score between
            0% and 100%.
          </p>
          <p className="mt-4 text-base leading-7 text-[var(--nl-muted)]">
            The score maps to a clear position in the market.
          </p>
        </div>
        <div className="rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] p-6 md:p-8">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Logic chain</div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
            {[
              { title: '5 Dimensions', body: 'Daily readings' },
              { title: 'Proprietary ruleset', body: 'Weighted, adaptive' },
              { title: 'Exposure score', body: '0% to 100%' },
              { title: 'Position', body: 'Allocated / Not' },
            ].map((item, index) => (
              <div key={item.title} className={cn(index < 3 && 'contents')}>
                <div className="rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-card)] p-5">
                  <div className="text-sm font-semibold text-[var(--nl-text)]">{item.title}</div>
                  <div className="mt-1 text-sm text-[var(--nl-muted)]">{item.body}</div>
                </div>
                {index < 3 && <ChevronRight className="hidden size-5 text-[var(--nl-border-strong)] md:block" />}
              </div>
            ))}
          </div>
          <div className="mt-8 text-xs font-semibold uppercase text-[var(--nl-green)]">Exposure scale</div>
          <div className="mt-5 px-1">
            <div className="relative h-3 rounded-full bg-[linear-gradient(90deg,rgba(14,122,53,0.14),var(--nl-green))]">
              <span className="absolute left-0 top-1/2 size-5 -translate-y-1/2 rounded-full border-4 border-[var(--nl-card-solid)] bg-[var(--nl-ring-muted)] shadow-sm" />
              <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--nl-card-solid)] bg-[var(--nl-trend)] shadow-sm" />
              <span className="absolute right-0 top-1/2 size-5 -translate-y-1/2 rounded-full border-4 border-[var(--nl-card-solid)] bg-[var(--nl-green)] shadow-sm" />
            </div>
            <div className="mt-5 grid gap-5 text-sm md:grid-cols-3">
              <div>
                <div className="font-semibold text-[var(--nl-text)]">0%</div>
                <div className="mt-1 font-semibold text-[var(--nl-text)]">Not Allocated</div>
                <p className="mt-1 text-[var(--nl-muted)]">Risk is too high. Capital preserved.</p>
              </div>
              <div className="md:text-center">
                <div className="font-semibold text-[var(--nl-text)]">50%</div>
                <div className="mt-1 font-semibold text-[var(--nl-text)]">Partial Allocation</div>
                <p className="mt-1 text-[var(--nl-muted)]">Mixed conditions. Reduced exposure.</p>
              </div>
              <div className="md:text-right">
                <div className="font-semibold text-[var(--nl-text)]">100%</div>
                <div className="mt-1 font-semibold text-[var(--nl-text)]">Fully Allocated</div>
                <p className="mt-1 text-[var(--nl-muted)]">Favorable conditions. Full exposure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RealMarketsSection() {
  return (
    <section>
      <div className="mx-auto grid w-full max-w-[1280px] gap-9 px-5 py-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">5. Built for real markets</div>
          <h2 className="mt-5 text-3xl font-medium leading-tight text-[var(--nl-text)]">
            Designed for uncertainty. Built for the long run.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--nl-muted)]">
            Markets are unpredictable. Our process is designed to adapt, control downside, and compound over time.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {realMarkets.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="border-l border-[var(--nl-border)] pl-5">
                <Icon className="mb-5 size-7 text-[var(--nl-green)]" strokeWidth={1.6} />
                <h3 className="text-sm font-semibold text-[var(--nl-text)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function EvidenceBand() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-5 md:px-10">
      <div className="grid gap-7 rounded-[5px] border border-white/10 bg-[#01131b] p-7 text-white lg:grid-cols-[300px_1fr]">
        <div>
          <h2 className="text-2xl font-medium leading-tight">Evidence over opinion.</h2>
          <p className="mt-2 text-xl text-slate-200">The proof is in the results.</p>
          <Link href="/#evidence" className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[var(--nl-green)]">
            View performance
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {proof.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="border-l border-white/15 pl-5">
                <Icon className="mb-4 size-6 text-white" strokeWidth={1.6} />
                <div className="text-sm text-slate-300">{item.label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                {item.body ? <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p> : null}
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
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-5 md:px-10">
      <div className="grid gap-5 rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-callout)] p-7 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-5">
          <LogoMark className="size-12" />
          <div>
            <h2 className="text-xl font-semibold text-[var(--nl-text)]">Ready to put a systematic process to work?</h2>
            <p className="mt-2 text-sm text-[var(--nl-muted)]">Get access to the current signal and full system view.</p>
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

function Disclosure() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-7 md:px-10">
      <div className="rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-panel)] p-5 text-xs leading-6 text-[var(--nl-muted)]">
        <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--nl-text)]">
          <CheckCircle2 className="size-4 text-[var(--nl-green)]" />
          Research disclosure
        </div>
        Nothing on this site constitutes investment advice or a recommendation to buy or sell any security.
        The site does not account for individual objectives, constraints, taxes, transaction costs, slippage,
        or execution quality, and real-world results may differ materially from modeled or displayed outcomes.
      </div>
    </section>
  )
}

export default function MethodologyPage() {
  return (
    <div className="nl-page-bg min-h-screen bg-[var(--nl-bg)] text-[var(--nl-text)]">
      <MethodologyHeader />
      <main>
        <HeroSection />
        <FrameworkSection />
        <PipelineSection />
        <DimensionsSection />
        <LogicSection />
        <RealMarketsSection />
        <EvidenceBand />
        <CtaBand />
        <Disclosure />
      </main>
    </div>
  )
}
