import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Info,
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

const proofStats = [
  { label: 'Live since', value: 'Jan 2018', body: '', icon: CalendarDays },
  { label: '7+ years', value: 'of live signals', body: '', icon: RefreshCw },
  { label: 'Multiple cycles', value: 'Bull, bear, chop, recovery, volatility', body: '', icon: TrendingUp },
  { label: 'Rule-based', value: 'No discretion. No overrides.', body: '', icon: ShieldCheck },
]

const phases = [
  { year: '2018', title: 'Growth', state: 'Allocated', tone: 'green' },
  { year: '2020', title: 'Crash', state: 'Moved to Cash', tone: 'red' },
  { year: '2021', title: 'Recovery', state: 'Re-allocated', tone: 'green' },
  { year: '2022', title: 'Inflation Shock', state: 'Reduced', tone: 'red' },
  { year: '2023-2024', title: 'New Regime', state: 'Re-allocated', tone: 'green' },
  { year: '2025-Now', title: 'Current', state: 'Allocated', tone: 'green' },
]

const metrics = [
  { label: 'Annualized Return', system: '17.3%', benchmark: '9.1%', benchmarkLabel: 'Buy & Hold', icon: TrendingUp },
  { label: 'Max Drawdown', system: '-20.2%', benchmark: '-33.9%', benchmarkLabel: 'Buy & Hold', icon: ShieldCheck },
  { label: 'Sharpe Ratio', system: '0.95', benchmark: '0.55', benchmarkLabel: 'Buy & Hold', icon: Target },
  { label: '% Profitable Months', system: '72%', benchmark: '61%', benchmarkLabel: 'Buy & Hold', icon: CalendarDays },
  { label: 'Exposure', system: '45%', benchmark: 'In cash 55%', benchmarkLabel: 'On average', icon: CalendarDays },
  { label: 'Trades / Year', system: '3.2', benchmark: 'Systematic', benchmarkLabel: 'Not frequent', icon: RefreshCw },
]

const cycleRows = [
  {
    label: 'Northline Signal',
    values: ['+26.1%', '-8.4%', '+29.3%', '-5.6%', '+36.7%', '+14.2%'],
  },
  {
    label: 'Buy & Hold (S&P 500)',
    values: ['+28.9%', '-33.9%', '+26.9%', '-18.1%', '+30.2%', '+8.7%'],
  },
  {
    label: 'Outperformance',
    values: ['-2.8%', '+25.5%', '+2.4%', '+12.5%', '+6.5%', '+5.5%'],
  },
]

const cycleHeaders = [
  '2018-2019 Growth',
  '2020 COVID Crash',
  '2021 Recovery',
  '2022 Inflation Shock',
  '2023-2024 New Regime',
  '2025-Apr 24, 2026 Current',
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

function PerformanceHeader() {
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
                item.label === 'Performance' && 'border-[var(--nl-green)] text-white'
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

function HeroCurve() {
  return (
    <svg viewBox="0 0 650 320" role="img" aria-label="Northline Signal performance compared with buy and hold" className="h-auto w-full">
      <defs>
        <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--nl-green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--nl-green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="var(--nl-grid)" strokeWidth="1">
        {[50, 96, 142, 188, 234, 280].map((y) => <line key={y} x1="28" x2="632" y1={y} y2={y} />)}
        {[72, 150, 228, 306, 384, 462, 540, 618].map((x) => <line key={x} x1={x} x2={x} y1="20" y2="292" />)}
      </g>
      <path
        d="M44 266 C80 253 112 238 148 226 C184 213 204 198 230 184 C252 171 260 134 276 178 C294 218 320 145 350 129 C382 107 402 96 430 86 C462 74 488 120 518 98 C552 73 584 38 624 22 L624 292 L44 292 Z"
        fill="url(#heroFill)"
      />
      <path
        d="M44 266 C80 253 112 238 148 226 C184 213 204 198 230 184 C252 171 260 134 276 178 C294 218 320 145 350 129 C382 107 402 96 430 86 C462 74 488 120 518 98 C552 73 584 38 624 22"
        fill="none"
        stroke="var(--nl-green)"
        strokeWidth="3"
      />
      <path
        d="M44 274 C94 263 130 251 170 244 C214 237 246 242 286 221 C322 199 350 179 388 174 C430 170 452 215 488 188 C526 158 570 133 624 92"
        fill="none"
        stroke="var(--nl-chart-muted)"
        strokeWidth="2.3"
      />
      <circle cx="624" cy="22" r="7" fill="var(--nl-card-solid)" stroke="var(--nl-green)" strokeWidth="2.5" />
      <g fill="var(--nl-muted)" fontSize="12">
        {['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'].map((year, index) => (
          <text key={year} x={56 + index * 78} y="314">{year}</text>
        ))}
      </g>
    </svg>
  )
}

function HeroSection() {
  return (
    <section className="border-b border-[var(--nl-border)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 py-12 md:px-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Performance</div>
          <h1 className="mt-5 text-4xl font-medium leading-tight text-[var(--nl-text)] md:text-5xl">
            <span className="block">Proven in real markets.</span>
            <span className="block text-[var(--nl-green)]">Across every cycle.</span>
          </h1>
          <p className="mt-7 max-w-[36rem] text-base leading-7 text-[var(--nl-muted)]">
            Northline Signal has been running live since January 2018. The same rules. The same process. Every day.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {proofStats.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="border-l border-[var(--nl-border)] pl-5 first:border-l-0 first:pl-0">
                  <Icon className="mb-3 size-6 text-[var(--nl-green)]" strokeWidth={1.6} />
                  <div className="text-xs text-[var(--nl-muted)]">{item.label}</div>
                  <div className="mt-1 text-base font-semibold text-[var(--nl-text)]">{item.value}</div>
                  {item.body ? <p className="mt-1 text-xs text-[var(--nl-muted)]">{item.body}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
        <HeroCurve />
      </div>
    </section>
  )
}

function EquityCurve() {
  return (
    <div className="grid gap-7 rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] p-6 md:p-8 lg:grid-cols-[230px_1fr_160px]">
      <div className="lg:border-r lg:border-[var(--nl-border)] lg:pr-8">
        <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Equity curve</div>
        <h2 className="mt-5 text-2xl font-medium leading-tight text-[var(--nl-text)]">Model vs. Buy &amp; Hold (S&amp;P 500)</h2>
        <p className="mt-8 text-sm leading-6 text-[var(--nl-muted)]">Growth of $100,000 from January 2018 to April 24, 2026.</p>
        <div className="mt-8 grid gap-3 text-sm">
          <span className="flex items-center gap-3 text-[var(--nl-text)]">
            <span className="h-0.5 w-7 bg-[var(--nl-green)]" />
            Northline Signal
          </span>
          <span className="flex items-center gap-3 text-[var(--nl-muted)]">
            <span className="h-0.5 w-7 bg-[var(--nl-chart-muted)]" />
            Buy &amp; Hold (S&amp;P 500)
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <svg viewBox="0 0 720 330" role="img" aria-label="Equity curve comparing Northline Signal with buy and hold" className="h-auto w-full">
          <g stroke="var(--nl-grid)" strokeWidth="1">
            {[45, 108, 171, 234, 297].map((y) => <line key={y} x1="58" x2="700" y1={y} y2={y} />)}
          </g>
          <g fill="var(--nl-muted)" fontSize="13">
            <text x="0" y="49">$400K</text>
            <text x="0" y="112">$300K</text>
            <text x="0" y="175">$200K</text>
            <text x="0" y="238">$100K</text>
            <text x="8" y="301">$80K</text>
          </g>
          <path
            d="M64 284 C100 274 134 260 170 250 C206 239 226 226 252 210 C274 196 282 154 298 210 C318 244 342 166 374 146 C408 126 430 112 462 98 C490 88 520 140 548 122 C584 96 626 56 690 26"
            fill="none"
            stroke="var(--nl-green)"
            strokeWidth="3"
          />
          <path
            d="M64 292 C116 282 154 271 194 264 C236 256 270 260 310 238 C344 217 372 196 410 190 C452 186 474 232 510 204 C548 174 596 142 690 90"
            fill="none"
            stroke="var(--nl-chart-muted)"
            strokeWidth="2.3"
          />
          <line x1="58" x2="700" y1="297" y2="297" stroke="var(--nl-axis)" />
          {['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Apr 24, 2026'].map((year, index) => (
            <text key={year} x={64 + index * 74} y="324" fill="var(--nl-muted)" fontSize="12">{year}</text>
          ))}
        </svg>
      </div>
      <div className="grid gap-7 text-left lg:text-left">
        <div>
          <div className="text-4xl font-medium leading-none text-[var(--nl-green)]">$338,200</div>
          <div className="mt-2 text-sm text-[var(--nl-text)]">Northline Signal</div>
          <div className="mt-2 text-xl font-semibold text-[var(--nl-green)]">+238%</div>
        </div>
        <div>
          <div className="text-3xl font-medium leading-none text-[var(--nl-muted)]">$212,100</div>
          <div className="mt-2 text-sm text-[var(--nl-text)]">Buy &amp; Hold</div>
          <div className="mt-2 text-xl font-semibold text-[var(--nl-muted)]">+112%</div>
        </div>
        <div className="text-xs text-[var(--nl-muted)]">As of Apr 24, 2026</div>
      </div>
      <div className="lg:col-span-3">
        <div className="grid rounded-[5px] border border-[var(--nl-border)] md:grid-cols-6">
          {phases.map((phase) => (
            <div key={phase.year} className="border-b border-[var(--nl-border)] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="flex items-center gap-2 text-sm text-[var(--nl-muted)]">
                <span className={cn('size-2 rounded-full', phase.tone === 'green' ? 'bg-[var(--nl-green)]' : 'bg-[var(--nl-red)]')} />
                {phase.year}
              </div>
              <div className="mt-4 text-sm text-[var(--nl-text)]">{phase.title}</div>
              <div className={cn('mt-3 text-sm font-semibold', phase.tone === 'green' ? 'text-[var(--nl-green)]' : 'text-[var(--nl-red)]')}>
                {phase.state}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricsSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-6 md:px-10">
      <EquityCurve />
      <div className="mt-7 rounded-[5px] border border-[var(--nl-border-strong)] bg-[var(--nl-panel)] p-6 md:p-8">
        <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Key metrics</div>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {metrics.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="border-l border-[var(--nl-border)] pl-5 first:border-l-0 first:pl-0">
                <Icon className="mb-4 size-6 text-[var(--nl-green)]" strokeWidth={1.6} />
                <div className="text-sm font-semibold text-[var(--nl-text)]">{item.label}</div>
                <div className="mt-4 text-3xl font-medium text-[var(--nl-green)]">{item.system}</div>
                <div className="mt-1 text-xs font-semibold text-[var(--nl-text)]">Northline Signal</div>
                <div className="mt-5 text-xl font-medium text-[var(--nl-text)]">{item.benchmark}</div>
                <div className="mt-1 text-xs text-[var(--nl-muted)]">{item.benchmarkLabel}</div>
              </div>
            )
          })}
        </div>
        <div className="mt-9 border-t border-[var(--nl-border)] pt-7">
          <div className="text-xs font-semibold uppercase text-[var(--nl-green)]">Performance through market cycles</div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[820px] w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[var(--nl-border)] px-4 py-4 text-left font-medium text-[var(--nl-muted)]">Market Cycle</th>
                  {cycleHeaders.map((header) => (
                    <th key={header} className="border-b border-l border-[var(--nl-border)] px-4 py-4 text-center font-medium text-[var(--nl-muted)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycleRows.map((row) => (
                  <tr key={row.label}>
                    <td className="border-b border-[var(--nl-border)] px-4 py-4 font-medium text-[var(--nl-text)]">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.label}-${index}`}
                        className={cn(
                          'border-b border-l border-[var(--nl-border)] px-4 py-4 text-center font-semibold',
                          value.startsWith('-') ? 'text-[var(--nl-red)]' : 'text-[var(--nl-green)]'
                        )}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-4 rounded-[5px] bg-[var(--nl-callout)] px-5 py-4 text-sm text-[var(--nl-text)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Info className="size-5 text-[var(--nl-green)]" />
            Past performance is not indicative of future results. Northline Signal is a systematic model and does not guarantee profits or protect against losses.
          </div>
          <Link href="/methodology" className="inline-flex items-center gap-3 font-semibold text-[var(--nl-text)]">
            Full performance notes
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-5 md:px-10">
      <div className="grid gap-7 rounded-[5px] border border-white/10 bg-[#01131b] p-8 text-white md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-7">
          <LogoMark className="size-16" />
          <div>
            <h2 className="text-2xl font-medium leading-tight">The results come from the process.</h2>
            <p className="mt-2 text-2xl text-white">See the system in action.</p>
          </div>
        </div>
        <div>
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center justify-center gap-3 rounded-[4px] bg-[var(--nl-green)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--nl-green-strong)]"
          >
            Get access to the current signal
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-center text-sm text-slate-300">Full system view. Updated live.</p>
        </div>
      </div>
    </section>
  )
}

export default function PerformancePage() {
  return (
    <div className="nl-page-bg min-h-screen bg-[var(--nl-bg)] text-[var(--nl-text)]">
      <PerformanceHeader />
      <main>
        <HeroSection />
        <MetricsSection />
        <CtaBand />
      </main>
    </div>
  )
}
