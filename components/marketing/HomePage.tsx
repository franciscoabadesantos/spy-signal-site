import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  Clock3,
  MonitorCheck,
  Power,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { homepageContent } from './home-content'

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

const proofIcons: IconType[] = [ShieldCheck, RefreshCw, MonitorCheck, Power]
const problemIcons: IconType[] = [Brain, Clock3, TrendingUp, SlidersHorizontal]

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-5 items-center justify-center rounded-full border-2 border-[var(--nl-green)]',
        className
      )}
      aria-hidden="true"
    >
      <span className="size-2 rounded-full bg-[var(--nl-green)]" />
    </span>
  )
}

function HomepageHeader() {
  const { brand, nav } = homepageContent

  return (
    <header className="border-b border-[var(--nl-border)] bg-[var(--nl-bg)]/88 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-5 md:px-10">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase text-[var(--nl-text)]">
          <LogoMark />
          <span>{brand}</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-[var(--nl-muted)] lg:flex">
          {nav.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[var(--nl-text)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center rounded-[4px] border border-[var(--nl-button-border)] bg-[var(--nl-button-bg)] px-5 text-sm font-semibold text-[var(--nl-button-text)] transition hover:opacity-85"
        >
          Log in
        </Link>
      </div>
    </header>
  )
}

function PrimaryButton({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-[52px] items-center justify-center gap-3 rounded-[4px] bg-[var(--nl-green)] px-7 text-sm font-semibold text-white shadow-none transition hover:bg-[var(--nl-green-strong)]',
        className
      )}
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  )
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[52px] items-center justify-center rounded-[4px] border border-[var(--nl-border)] bg-transparent px-7 text-sm font-semibold text-[var(--nl-text)] transition hover:border-[var(--nl-green)]"
    >
      {children}
    </Link>
  )
}

function AllocationRing({ value, size = 'large' }: { value: number; size?: 'large' | 'small' }) {
  const dimensions = size === 'large' ? 'size-52 md:size-56' : 'size-20'
  const inner = size === 'large' ? 'size-32 text-4xl' : 'size-14 text-lg'

  return (
    <div
      className={cn('grid place-items-center rounded-full', dimensions)}
      style={{
        background: `conic-gradient(var(--nl-green) 0 ${value}%, var(--nl-ring-muted) ${value}% 100%)`,
      }}
    >
      <div className={cn('grid place-items-center rounded-full bg-[var(--nl-card-solid)] font-medium text-[var(--nl-text)]', inner)}>
        {value}%
      </div>
    </div>
  )
}

function ConfidenceDots() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--nl-green)]">{homepageContent.hero.snapshot.confidence}</span>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={cn(
              'size-2.5 rounded-full',
              index < 4 ? 'bg-[var(--nl-green)]' : 'bg-[var(--nl-dot-muted)]'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function LiveSignalCard({
  compact = false,
  integrated = false,
}: {
  compact?: boolean
  integrated?: boolean
}) {
  const { snapshot } = homepageContent.hero

  return (
    <div
      className={cn(
        'rounded-[5px] shadow-none',
        integrated
          ? 'bg-transparent p-0'
          : 'border border-[var(--nl-border)] bg-[var(--nl-card)]',
        compact && !integrated ? 'p-5' : 'p-7 md:p-8',
        integrated && 'p-0'
      )}
    >
      <div className="text-xs font-semibold uppercase text-[var(--nl-muted)]">{snapshot.label}</div>
      <div className={cn('mt-6 flex items-center justify-between gap-7', compact ? '' : 'min-h-[230px]')}>
        <div>
          <div className="text-2xl font-medium uppercase text-[var(--nl-green)]">{snapshot.status}</div>
          <div className={cn('mt-5 font-medium leading-none text-[var(--nl-text)]', compact ? 'text-5xl' : 'text-7xl md:text-8xl')}>
            {snapshot.allocation}
            <span className="text-[0.46em]">%</span>
          </div>
          <div className="mt-4 text-sm text-[var(--nl-muted)]">{snapshot.caption}</div>
        </div>
        <AllocationRing value={snapshot.allocation} size={compact ? 'small' : 'large'} />
      </div>
      <div className={cn('mt-7 pt-5', !integrated && 'border-t border-[var(--nl-border)]')}>
        <ConfidenceDots />
      </div>
      <div className={cn('mt-5 flex flex-col gap-2 pt-4 text-xs text-[var(--nl-muted)] sm:flex-row sm:justify-between', !integrated && 'border-t border-[var(--nl-border)]')}>
        <span>{snapshot.updatedAt}</span>
        <span>{snapshot.age}</span>
      </div>
      <div className="mt-3 text-xs text-[var(--nl-soft)]">{snapshot.nextUpdate}</div>
    </div>
  )
}

function HeroSection() {
  const { hero } = homepageContent

  return (
    <section className="relative overflow-hidden border-b border-[var(--nl-border)]">
      <div className="nl-wave-bg absolute inset-x-0 bottom-0 h-44 opacity-70" />
      <div className="relative mx-auto grid w-full max-w-[1280px] gap-10 px-5 py-10 md:px-10 lg:grid-cols-[minmax(0,55fr)_minmax(360px,45fr)] lg:items-center xl:gap-14">
        <div className="min-w-0">
          <h1 className="max-w-[14ch] text-5xl font-medium leading-[1.05] text-[var(--nl-text)] md:text-6xl xl:text-7xl">
            <span className="block">{hero.headline[0]}</span>
            <span className="block">{hero.headline[1]}</span>
            <span className="block text-[var(--nl-green)]">{hero.headline[2]}</span>
          </h1>
          <p className="mt-7 max-w-[38rem] text-lg leading-8 text-[var(--nl-muted)]">
            {hero.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href={hero.primaryCta.href}>{hero.primaryCta.label}</PrimaryButton>
            <SecondaryButton href={hero.secondaryCta.href}>{hero.secondaryCta.label}</SecondaryButton>
          </div>
          <div className="mt-11 grid grid-cols-2 gap-x-5 gap-y-5 opacity-75 sm:grid-cols-4">
            {hero.proofs.map((item, index) => {
              const Icon = proofIcons[index] ?? ShieldCheck
              return (
              <div key={item.title} className="border-[var(--nl-border)] pr-4 sm:border-r sm:last:border-r-0">
                <Icon className="mb-2 size-4 text-[var(--nl-green)] opacity-70" strokeWidth={1.7} />
                <div className="text-xs font-semibold text-[var(--nl-text)]">{item.title}</div>
                <div className="mt-1 text-[0.68rem] text-[var(--nl-muted)]">{item.body}</div>
              </div>
              )
            })}
          </div>
        </div>
        <div className="lg:-mt-8">
          <LiveSignalCard />
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const { problem } = homepageContent

  return (
    <section id="problem" className="border-b border-[var(--nl-border)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-12 md:px-10">
        <div>
          <div className="max-w-[42rem]">
            <h2 className="max-w-[34rem] text-3xl font-medium leading-snug text-[var(--nl-text)] md:text-4xl">
              {problem.headline}
            </h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {problem.reasons.map((item, index) => {
              const Icon = problemIcons[index] ?? Activity
              return (
                <div key={item.title} className="border-l border-[var(--nl-border)] pl-5">
                  <Icon className="mb-5 size-5 text-[var(--nl-green)] opacity-55" strokeWidth={1.5} />
                  <div className="text-base font-medium text-[var(--nl-text)]">{item.title}</div>
                  <div className="mt-3 text-sm leading-6 text-[var(--nl-muted)]">{item.body}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--nl-border)] pt-5 text-sm text-[var(--nl-muted)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <LogoMark className="size-5 shrink-0 opacity-80" />
            <span>{problem.callout}</span>
          </div>
          <span className="font-medium text-[var(--nl-green)]">{problem.calloutAside}</span>
        </div>
      </div>
    </section>
  )
}

function EvidenceMetric({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[var(--nl-text)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--nl-muted)]">{value}</div>
    </div>
  )
}

function EquityCurveChart() {
  const { chart } = homepageContent.evidence

  return (
    <div className="relative pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-medium text-[var(--nl-text)]">{chart.title}</div>
          <div className="mt-2 text-xs text-[var(--nl-muted)]">{chart.subtitle}</div>
          <div className="mt-5 flex gap-9 text-xs">
            <span className="flex items-center gap-2 text-[var(--nl-text)]">
              <span className="size-2 rounded-full bg-[var(--nl-green)]" />
              Northline Signal
            </span>
            <span className="flex items-center gap-2 text-[var(--nl-muted)]">
              <span className="size-2 rounded-full bg-[var(--nl-chart-muted)]" />
              Buy & Hold
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-7 text-right">
          <div>
            <div className="text-5xl font-medium leading-none text-[var(--nl-green)]">{chart.modelReturn}</div>
            <div className="mt-2 text-sm text-[var(--nl-text)]">System</div>
          </div>
          <div>
            <div className="text-4xl font-medium leading-none text-[var(--nl-muted)]">{chart.buyHoldReturn}</div>
            <div className="mt-2 text-sm text-[var(--nl-muted)]">Buy & Hold</div>
          </div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden">
        <svg viewBox="0 0 620 310" role="img" aria-label="Northline Signal performance compared with buy and hold" className="h-auto w-full">
          <g stroke="var(--nl-grid)" strokeWidth="1">
            <line x1="34" x2="594" y1="42" y2="42" />
            <line x1="34" x2="594" y1="106" y2="106" />
            <line x1="34" x2="594" y1="170" y2="170" />
            <line x1="34" x2="594" y1="234" y2="234" />
          </g>
          <g fill="var(--nl-muted)" fontSize="12">
            <text x="0" y="46">400%</text>
            <text x="0" y="110">200%</text>
            <text x="8" y="174">0%</text>
            <text x="2" y="238">-20%</text>
          </g>
          <path
            d="M40 230 C80 222 102 212 130 205 C154 196 170 185 194 176 C222 164 224 138 236 174 C250 204 270 148 300 133 C328 117 344 102 372 88 C394 76 418 130 444 116 C480 96 510 65 536 56 C560 48 575 40 592 24"
            fill="none"
            stroke="var(--nl-green)"
            strokeWidth="3"
          />
          <path
            d="M40 236 C82 230 112 222 142 212 C180 203 208 207 238 192 C260 176 274 160 306 154 C334 147 356 174 382 176 C414 180 434 222 464 191 C490 162 518 142 548 110 C566 94 580 80 592 68"
            fill="none"
            stroke="var(--nl-chart-muted)"
            strokeWidth="2.2"
          />
          <line x1="34" x2="594" y1="234" y2="234" stroke="var(--nl-axis)" />
          {['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025 YTD'].map((year, index) => (
            <text key={year} x={42 + index * 74} y="282" fill="var(--nl-muted)" fontSize="12">
              {year}
            </text>
          ))}
        </svg>
      </div>
      <div className="mt-4 text-right text-xs text-[var(--nl-muted)]">{chart.asOf}</div>
      <div className="mt-8 grid border-t border-[var(--nl-border)] md:grid-cols-6">
        {chart.phases.map((phase) => (
          <div key={phase.year} className="border-b border-[var(--nl-border)] py-6 pr-5 last:border-b-0 md:border-b-0">
            <div className="flex items-center gap-2 text-sm text-[var(--nl-muted)]">
              <span className={cn('size-2 rounded-full', phase.tone === 'green' ? 'bg-[var(--nl-green)]' : 'bg-[var(--nl-red)]')} />
              {phase.year}
            </div>
            <div className="mt-3 text-base text-[var(--nl-text)] md:text-sm xl:text-base">{phase.title}</div>
            <div className={cn('mt-3 text-base font-medium', phase.tone === 'green' ? 'text-[var(--nl-green)]' : 'text-[var(--nl-red)]')}>
              {phase.state}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvidenceSection() {
  const { evidence } = homepageContent

  return (
    <section id="evidence" className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 py-12 md:px-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
        <div>
          <h2 className="max-w-[23rem] text-3xl font-medium leading-snug text-[var(--nl-text)] md:text-4xl">{evidence.headline}</h2>
          <p className="mt-5 text-base font-medium text-[var(--nl-text)]">{evidence.processLine}</p>
          <div className="mt-7 space-y-2 text-sm leading-7 text-[var(--nl-muted)]">
            {evidence.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-9 grid grid-cols-4 gap-x-5 border-t border-[var(--nl-border)] pt-5">
            {evidence.stats.map((item) => (
              <EvidenceMetric key={item.title} title={item.title} value={item.value} />
            ))}
          </div>
        </div>
        <EquityCurveChart />
      </div>
    </section>
  )
}

const trendPaths: Record<string, string> = {
  Momentum: 'M3 31 L14 29 L25 23 L36 26 L48 18 L59 20 L71 15 L83 17 L96 10 L110 12 L124 7 L145 4',
  'Macro Regime': 'M3 29 L17 25 L29 28 L43 22 L56 23 L70 18 L82 14 L96 16 L110 10 L124 8 L145 3',
  Volatility: 'M3 18 L17 22 L30 17 L43 25 L57 20 L70 24 L83 21 L96 26 L110 22 L124 25 L145 20',
  'Market Breadth': 'M3 30 L16 27 L30 29 L44 23 L58 25 L72 19 L86 20 L100 16 L114 18 L129 12 L145 9',
  Liquidity: 'M3 27 L16 30 L29 24 L42 28 L56 21 L70 25 L84 19 L98 22 L112 15 L126 17 L145 11',
}

function MiniTrend({ condition }: { condition: (typeof homepageContent.system.conditions)[number] }) {
  const path = trendPaths[condition.title] ?? trendPaths.Momentum
  const scaled = condition.outcome.toLowerCase() === 'scaled'

  return (
    <div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[0.7rem] uppercase text-[var(--nl-muted)]">
        <span>{condition.window}</span>
        <span className={cn('font-semibold', scaled ? 'text-[var(--nl-warn)]' : 'text-[var(--nl-green)]')}>
          {condition.outcome}
        </span>
      </div>
      <svg viewBox="0 0 150 42" className="mt-3 h-10 w-full" aria-hidden="true">
        <path
          d="M0 32 H150"
          fill="none"
          stroke="var(--nl-grid)"
          strokeWidth="1"
        />
        <path
          d={path}
          fill="none"
          stroke={scaled ? 'var(--nl-warn)' : 'var(--nl-trend)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--nl-meter-bg)]">
        <div
          className={cn('h-full rounded-full', scaled ? 'bg-[var(--nl-warn)]' : 'bg-[var(--nl-green)]')}
          style={{ width: `${condition.score}%` }}
        />
      </div>
    </div>
  )
}

function ConditionCard({ condition }: { condition: (typeof homepageContent.system.conditions)[number] }) {
  return (
    <div className="min-h-[218px] border-t border-[var(--nl-border)] bg-transparent px-4 py-4 first:border-t-0 sm:border-l sm:first:border-l-0 lg:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--nl-muted)]">{condition.title}</div>
          <div className="mt-2 text-3xl font-medium text-[var(--nl-text)]">{condition.value}</div>
        </div>
        <div className="pt-1 text-right text-[0.7rem] uppercase text-[var(--nl-muted)]">{condition.label}</div>
      </div>
      <div className="mt-3 min-h-5 text-sm text-[var(--nl-text)]">{condition.interpretation}</div>
      <MiniTrend condition={condition} />
    </div>
  )
}

function LogicRow({
  label,
  status,
}: {
  label: string
  status: string
}) {
  const scaled = status.toLowerCase() === 'scaled'
  return (
    <div className="flex items-center gap-4 border-b border-[var(--nl-border)] py-3 last:border-b-0">
      <span className="size-1.5 shrink-0 rounded-full bg-[var(--nl-green)]" />
      <span className="min-w-0 flex-1 text-base text-[var(--nl-text)]">{label}</span>
      <span className={cn('min-w-16 text-right text-sm font-semibold uppercase', scaled ? 'text-[var(--nl-warn)]' : 'text-[var(--nl-green)]')}>
        {status}
      </span>
    </div>
  )
}

function RegimeMap() {
  return (
    <div className="h-full bg-transparent">
      <div className="text-xs font-semibold uppercase text-[var(--nl-muted)]">Regime position</div>
      <div className="mx-auto mt-5 grid max-w-[720px] grid-cols-[76px_1fr_76px] grid-rows-[32px_1fr_32px] items-center text-center text-[11px] font-semibold uppercase text-[var(--nl-text)]">
        <div />
        <div>Macro improving</div>
        <div />
        <div className="leading-4">Momentum weak</div>
        <div className="relative grid aspect-[1.75/1] grid-cols-2 overflow-hidden rounded-[4px] border border-[var(--nl-border)] text-base font-medium normal-case text-white">
          <div className="grid place-items-center bg-[linear-gradient(135deg,#8bb9a4,#b8d69a)] text-[var(--nl-map-text)]">Recovering</div>
          <div className="grid place-items-center bg-[linear-gradient(135deg,#6aa45f,#b2cf70)] text-white">Aligned</div>
          <div className="grid place-items-center bg-[linear-gradient(135deg,#d65f51,#f29179)]">Dislocated</div>
          <div className="grid place-items-center bg-[linear-gradient(135deg,#e8894d,#f1c875)] text-[var(--nl-map-text)]">Divergent</div>
          <div className="absolute right-9 top-9 grid size-10 place-items-center rounded-full border-4 border-white bg-white/25 shadow-[0_0_0_8px_rgba(255,255,255,0.16)]">
            <span className="size-3 rounded-full bg-white" />
          </div>
        </div>
        <div className="leading-4">Momentum strong</div>
        <div />
        <div>Macro deteriorating</div>
        <div />
      </div>
    </div>
  )
}

function ProductPreviewSection() {
  const { system } = homepageContent

  return (
    <section id="system" className="nl-system-field relative overflow-hidden border-b border-[var(--nl-border)]">
      <div className="relative mx-auto w-full max-w-[1280px] px-5 pb-5 pt-11 md:px-10">
        <h2 className="text-3xl font-medium leading-snug text-[var(--nl-text)] md:text-4xl">
          {system.headline}
        </h2>
        <div className="mt-7 overflow-hidden rounded-[5px] bg-[var(--nl-system-surface)]">
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-xs font-semibold uppercase text-[var(--nl-muted)]">Current conditions</div>
            <div className="text-xs text-[var(--nl-muted)]">Inputs read daily after market close</div>
          </div>
          <div className="grid border-t border-[var(--nl-border)] sm:grid-cols-2 lg:grid-cols-5">
            {system.conditions.map((condition) => (
              <ConditionCard key={condition.title} condition={condition} />
            ))}
          </div>
          <div className="grid border-t border-[var(--nl-border)] lg:grid-cols-[minmax(0,0.7fr)_minmax(280px,0.3fr)]">
            <div className="p-5 lg:p-6">
              <div className="text-xs font-semibold uppercase text-[var(--nl-muted)]">Logic chain</div>
              <div className="mt-4">
                {system.logic.map((item) => (
                  <LogicRow key={item.label} label={item.label} status={item.status} />
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--nl-border)] p-5 lg:flex lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:px-5 lg:py-6">
              <div className="text-xs font-semibold uppercase text-[var(--nl-muted)]">System output</div>
              <div className="mt-7 text-[3.35rem] font-medium uppercase leading-none text-[var(--nl-green)]">{system.result}</div>
              <p className="mt-5 text-sm leading-6 text-[var(--nl-soft)]">{system.resultCopy}</p>
            </div>
          </div>
          <div className="border-t border-[var(--nl-border)] p-5 lg:px-7 lg:py-5">
            <div className="mx-auto max-w-[860px]">
              <div className="text-sm font-medium text-[var(--nl-text)]">These conditions place the market here:</div>
              <div className="mt-3">
                <RegimeMap />
              </div>
            </div>
          </div>
          <Link
            href={system.cta.href}
            className="flex flex-col gap-4 border-t border-[var(--nl-border)] bg-[var(--nl-callout)] px-8 py-5 text-[var(--nl-text)] transition hover:bg-[var(--nl-card)] sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block text-xl font-medium">{system.cta.title}</span>
              <span className="mt-2 block text-sm text-[var(--nl-muted)]">{system.cta.body}</span>
            </span>
            <span className="flex items-center gap-4 text-base font-medium">
              {system.cta.label}
              <ArrowRight className="size-5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function PricingCard() {
  const { access } = homepageContent

  return (
    <div className="flex h-full flex-col rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-card)] p-6 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm text-[var(--nl-muted)]">Monthly</div>
        <div className="text-xs text-[var(--nl-muted)]">Cancel anytime</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2 text-[var(--nl-text)]">
        <span className="text-6xl font-medium leading-none">{access.price}</span>
        <span className="text-lg text-[var(--nl-muted)]">{access.period}</span>
      </div>
      <ul className="mt-7 grid gap-3">
        {access.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm text-[var(--nl-text)]">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--nl-green)]" />
            {benefit}
          </li>
        ))}
      </ul>
      <PrimaryButton href={access.cta.href} className="mt-auto h-[52px] w-full translate-y-1">{access.cta.label}</PrimaryButton>
    </div>
  )
}

function IncludedCard() {
  const { access } = homepageContent

  return (
    <div className="h-full rounded-[5px] border border-[var(--nl-border)] bg-[var(--nl-panel)] p-6 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-[var(--nl-text)]">What you get</h3>
        <span className="text-xs text-[var(--nl-muted)]">Included</span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {access.included.map((item, index) => (
          <div key={item.title} className="grid min-h-24 grid-cols-[24px_1fr] gap-3 border-t border-[var(--nl-border)] pt-3">
            <div className="text-sm font-semibold text-[var(--nl-green)]">{String(index + 1).padStart(2, '0')}</div>
            <div>
              <div className="text-sm font-semibold text-[var(--nl-text)]">{item.title}</div>
              <div className="mt-1 text-xs leading-5 text-[var(--nl-muted)]">{item.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccessSection() {
  const { access } = homepageContent

  return (
    <section id="access">
      <div className="mx-auto grid w-full max-w-[1280px] items-stretch gap-5 px-5 py-10 md:px-10 lg:grid-cols-[minmax(240px,0.8fr)_minmax(300px,0.86fr)_minmax(480px,1.34fr)]">
        <div className="flex h-full flex-col justify-between border-y border-[var(--nl-border)] py-6">
          <div>
            <h2 className="max-w-[24rem] text-3xl font-medium leading-tight text-[var(--nl-text)] md:text-[2.35rem]">{access.headline}</h2>
            <p className="mt-4 max-w-[22rem] text-xl leading-8 text-[var(--nl-soft)]">{access.subhead}</p>
          </div>
          <div className="mt-8 text-sm text-[var(--nl-muted)]">
            Current signal, full system view, historical record.
          </div>
        </div>
        <PricingCard />
        <IncludedCard />
      </div>
    </section>
  )
}

export default function MarketingHomePage() {
  return (
    <div className="nl-page-bg min-h-screen bg-[var(--nl-bg)] text-[var(--nl-text)]">
      <HomepageHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <EvidenceSection />
        <ProductPreviewSection />
        <AccessSection />
      </main>
    </div>
  )
}
