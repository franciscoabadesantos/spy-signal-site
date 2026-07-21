import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Inter, JetBrains_Mono, Sora } from 'next/font/google'
import AskUsForm from '@/components/marketing/AskUsForm'
import { MarketingHeader, sharedHeaderSpacerClass } from '@/components/marketing/site-chrome'

const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap' })
const inter = Inter({ subsets: ['latin'], display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' })

type FaqItem = {
  question: string
  answer: string
}

type FaqGroup = {
  label: string
  items: readonly FaqItem[]
}

const faqGroups: readonly FaqGroup[] = [
  {
    label: 'The signal',
    items: [
      {
        question: 'When does the signal arrive?',
        answer:
          'Every Sunday, before the market opens. The decision is made ahead of the week, not in reaction to Monday tape.',
      },
      {
        question: 'What does the signal actually tell me?',
        answer:
          'Direction, confidence, and the supporting tape behind the call. You get the full read, not a single one-word label.',
      },
      {
        question: 'Is this built for intraday trading?',
        answer:
          'No. It is deliberately slower. One weekly posture, held with discipline, instead of a stream of intraday alerts.',
      },
      {
        question: 'Do I have to watch the market all week?',
        answer:
          'No. That is the point. Read the signal before Monday, set your stance, and step back from the noise.',
      },
    ],
  },
  {
    label: 'Membership',
    items: [
      {
        question: 'What is included in membership?',
        answer:
          'Membership covers the weekly signal, the full system view, markets and ticker coverage, screener and watchlist access, research context, alerts, and signal history views.',
      },
      {
        question: 'How much does it cost?',
        answer: 'Forty-nine euros a month. One flat rate. No tiers, no add-ons, and no upsells.',
      },
      {
        question: 'Is this for intraday trading?',
        answer:
          'No. The product is built around a slower weekly posture, signal monitoring, and research workflows rather than a chatty intraday feed.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes. No lock-in and no penalty. Access runs to the end of the billing period, then simply stops.',
      },
    ],
  },
  {
    label: 'Access and workspace',
    items: [
      {
        question: 'Do I need an account first?',
        answer:
          'Yes. If you are not signed in, the current flow starts with account creation before you continue into the workspace.',
      },
      {
        question: 'What happens after signup?',
        answer:
          'After sign-up you continue into the product workspace. Upgrade or paid access only follows the live billing path when that path is configured for your account.',
      },
      {
        question: 'Can I review history and research inside the product?',
        answer:
          'Yes. The product includes signal history views, ticker-level context, and saved research surfaces inside the workspace.',
      },
      {
        question: 'Is there a free trial?',
        answer:
          'Not yet. The public screener lets you preview the signal format before you commit to membership.',
      },
    ],
  },
]

const quickFacts = [
  'Weekly signal before the open',
  'Markets, watchlists, and research context',
  'Weekly cadence, never intraday',
  '€49 / month, cancel anytime',
] as const

const numberedFaqGroups = faqGroups.map((group, groupIndex) => {
  const start = faqGroups.slice(0, groupIndex).reduce((total, current) => total + current.items.length, 0)

  return {
    ...group,
    items: group.items.map((item, itemIndex) => ({
      ...item,
      number: String(start + itemIndex + 1).padStart(2, '0'),
    })),
  }
})

const faqThemeStyle = {
  ['--page-bg' as never]: '#f3efe6',
  ['--content-primary' as never]: '#142943',
  ['--content-secondary' as never]: '#5b6978',
  ['--content-muted' as never]: '#87929b',
  ['--brand-spark' as never]: '#0b8178',
  ['--brand-spark-soft' as never]: '#1ba69a',
  ['--brand-spark-on' as never]: '#04201d',
  ['--border' as never]: 'rgba(20, 41, 67, 0.14)',
  ['--surface-card' as never]: 'rgba(255, 255, 255, 0.66)',
  ['--surface-card-top-light' as never]: 'rgba(255, 255, 255, 0.58)',
  ['--surface-hover' as never]: 'rgba(255, 255, 255, 0.42)',
  ['--font-display' as never]: sora.style.fontFamily,
  ['--font-body' as never]: inter.style.fontFamily,
  ['--font-mono' as never]: mono.style.fontFamily,
  fontFamily: 'var(--font-body)',
  colorScheme: 'light',
} as CSSProperties

const displayStyle = { fontFamily: 'var(--font-display)' }
const monoStyle = { fontFamily: 'var(--font-mono)' }

function FaqRows() {
  return (
    <div className="mt-7 divide-y divide-border">
      {numberedFaqGroups.map((group) => {
        const groupId = `faq-group-${group.label.toLowerCase().replaceAll(' ', '-')}`

        return (
          <section key={group.label} className="pt-8 first:pt-0" aria-labelledby={groupId}>
            <div className="mb-2 flex items-center gap-4">
              <h3
                id={groupId}
                style={monoStyle}
                className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-spark"
              >
                {group.label}
              </h3>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
            <div className="divide-y divide-border">
              {group.items.map((item) => (
                <article key={item.question} className="group relative">
                  <div className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 py-5 transition-colors duration-200 group-hover:bg-surface-hover sm:grid-cols-[3.5rem_1fr] sm:gap-x-6">
                    <span
                      style={monoStyle}
                      className="select-none pt-1 text-xs font-semibold tabular-nums tracking-[0.14em] text-brand-spark/70 sm:text-sm"
                      aria-hidden="true"
                    >
                      {item.number}
                    </span>
                    <div>
                      <h4 style={displayStyle} className="text-lg font-semibold leading-7 tracking-tight sm:text-xl">
                        {item.question}
                      </h4>
                      <p className="mt-2 max-w-2xl text-base leading-7 text-content-secondary">{item.answer}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
function QuickFacts() {
  return (
    <div className="surface-card rounded-[24px] p-6 sm:p-7" aria-labelledby="faq-short-version">
      <p
        id="faq-short-version"
        style={monoStyle}
        className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-spark"
      >
        The short version
      </p>
      <ul className="mt-6 space-y-4">
        {quickFacts.map((fact) => (
          <li key={fact} className="flex items-start gap-3 text-[0.97rem] leading-6">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-spark/12 text-brand-spark">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>
      <p style={monoStyle} className="mt-7 border-t border-border pt-5 text-xs uppercase tracking-[0.18em] text-content-muted">
        Just signal. No noise.
      </p>
    </div>
  )
}

export default function FaqPage() {
  return (
    <main
      data-theme="light"
      style={faqThemeStyle}
      className="relative min-h-screen overflow-x-clip bg-[var(--page-bg)] text-content-primary"
    >
      <MarketingHeader activeHref="/faq" />
      <div className={sharedHeaderSpacerClass} aria-hidden="true" />

      <section className="mx-auto max-w-[1120px] px-6 pb-9 pt-7 sm:px-10 sm:pb-11 sm:pt-9 lg:px-14">
        <p style={monoStyle} className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-spark">
          FAQ
        </p>
        <h1
          style={displayStyle}
          className="mt-3 max-w-[760px] text-[clamp(2.35rem,5.2vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.045em]"
        >
          Straight answers,
          <br />
          before you start
          <br />
          <span className="text-brand-spark">membership.</span>
        </h1>
        <p className="mt-4 max-w-[640px] text-base leading-7 text-content-secondary sm:text-lg sm:leading-8">
          Everything worth knowing about the signal, the workspace, and the access flow before you create an account.
        </p>
      </section>

      <section id="questions" className="border-t border-border" aria-labelledby="faq-questions-heading">
        <div className="mx-auto max-w-[1120px] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          <p style={monoStyle} className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-spark">
            The questions
          </p>
          <h2
            id="faq-questions-heading"
            style={displayStyle}
            className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl"
          >
            Everything you&apos;d ask before you start.
          </h2>
          <FaqRows />
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 text-sm font-semibold">
            <Link
              href="/pricing"
              className="text-content-secondary transition hover:text-brand-spark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-spark"
            >
              See pricing
            </Link>
            <Link
              href="/sign-up"
              className="text-content-secondary transition hover:text-brand-spark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-spark"
            >
              Start membership
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border" aria-label="FAQ summary and contact">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-14">
          <QuickFacts />
          <div className="lg:pt-1">
            <p style={monoStyle} className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-spark">
              The lounge
            </p>
            <h2
              style={displayStyle}
              className="mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] md:text-5xl"
            >
              It&apos;s a lounge,
              <br />
              not a help desk.
            </h2>
            <p className="mt-4 text-sm font-semibold text-brand-spark">Real people. Real replies.</p>
            <p className="mt-5 max-w-md text-lg leading-8 text-content-secondary">
              Longbrunch is a small room of people reading the same tape every week. Bring a question, a doubt, or a
              second opinion and a real person reads every message and writes back.
            </p>
          </div>
          <div className="surface-card rounded-[24px] p-6 sm:p-8 lg:col-start-2">
            <h3 style={displayStyle} className="text-2xl font-extrabold tracking-tight">
              Ask us anything.
            </h3>
            <p className="mt-2 text-base leading-7 text-content-secondary">No ticket numbers, no bots. Just send it over.</p>
            <div className="mt-6">
              <AskUsForm />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-10 sm:px-10 lg:px-14" aria-label="More Longbrunch links">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p style={monoStyle} className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-spark">
              Membership
            </p>
            <p style={displayStyle} className="mt-2 text-xl font-extrabold tracking-tight">
              Signals, research, and alerts in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link
              href="/screener"
              className="text-content-secondary transition hover:text-brand-spark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-spark"
            >
              View current signal
            </Link>
            <Link
              href="/sign-up"
              className="text-content-secondary transition hover:text-brand-spark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-spark"
            >
              Start membership
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
