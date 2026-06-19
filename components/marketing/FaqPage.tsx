import { Check } from 'lucide-react'
import AskUsForm from '@/components/marketing/AskUsForm'
import {
  GlassPanel,
  HandScript,
  MarketingPageOutro,
  MarketingPageShell,
} from '@/components/marketing/site-chrome'

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

function FaqRows() {
  const groupsWithNumbers = faqGroups.map((group, groupIndex) => {
    const start = faqGroups.slice(0, groupIndex).reduce((total, current) => total + current.items.length, 0)

    return {
      ...group,
      items: group.items.map((item, itemIndex) => ({
        ...item,
        number: String(start + itemIndex + 1).padStart(2, '0'),
      })),
    }
  })

  return (
    <div className="mt-12 divide-y divide-slate-950/[0.07] dark:divide-white/[0.07]">
      {groupsWithNumbers.map((group) => (
        <div key={group.label} className="pt-12 first:pt-0">
          <div className="mb-2 flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0757ff] dark:text-[#f8f200]">
              {group.label}
            </span>
            <span className="h-px flex-1 bg-slate-950/10 dark:bg-white/10" />
          </div>
          <div className="divide-y divide-slate-950/[0.07] dark:divide-white/[0.07]">
            {group.items.map((item) => (
              <div key={item.question} className="group relative">
                <div className="pointer-events-none absolute inset-x-[-1.25rem] inset-y-[0.4rem] rounded-3xl bg-[#0757ff]/0 transition-colors duration-200 group-hover:bg-[#0757ff]/[0.035] dark:group-hover:bg-white/[0.03]" />
                <div className="relative grid grid-cols-[2.25rem_1fr] gap-x-5 py-7 sm:grid-cols-[4.25rem_1fr] sm:gap-x-8">
                  <span className="select-none pt-1 text-2xl font-black tabular-nums leading-none text-slate-950/[0.18] transition-colors duration-200 group-hover:text-[#0757ff] dark:text-white/20 dark:group-hover:text-[#f8f200] sm:text-[2.6rem]">
                    {item.number}
                  </span>
                  <div className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                    <h3 className="text-xl font-semibold leading-snug tracking-tight sm:text-[1.6rem]">
                      {item.question}
                    </h3>
                    <p className="mt-2.5 max-w-2xl text-[1.02rem] leading-7 text-slate-600 dark:text-white/62">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FaqPage() {
  return (
    <MarketingPageShell
      activeHref="/faq"
      eyebrow="FAQ"
      title={
        <>
          Straight answers,
          <br />
          before you start
          <br />
          <span className="text-[#0757ff]">membership.</span>
        </>
      }
      description="Everything worth knowing about the signal, the workspace, and the access flow before you create an account."
      primaryCta={{ label: 'Start membership', href: '/sign-up' }}
      secondaryCta={{ label: 'See pricing', href: '/pricing' }}
      heroAside={
        <GlassPanel className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0757ff] dark:text-[#f8f200]">
            The short version
          </p>
          <ul className="mt-6 space-y-4">
            {quickFacts.map((fact) => (
              <li key={fact} className="flex items-start gap-3 text-[0.97rem] leading-6">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#0757ff]/12 text-[#0757ff] dark:bg-white/[0.08] dark:text-[#f8f200]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 border-t border-slate-950/8 pt-5 dark:border-white/10">
            <HandScript className="text-[1.7rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
              Just signal. No noise.
            </HandScript>
          </div>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[1080px] px-6 py-20 sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">
            The questions
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Everything you&apos;d ask before you start.
          </h2>
          <HandScript className="mt-4 block text-[2.15rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">
            Straight talk. No script.
          </HandScript>
        </div>
        <FaqRows />
      </section>

      <section className="border-y border-slate-950/10 bg-[radial-gradient(circle_at_85%_0%,rgba(7,87,255,0.1),transparent_45%)] bg-white/24 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0757ff] dark:text-[#f8f200]">
              The lounge
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              It&apos;s a lounge,
              <br />
              not a help desk.
            </h2>
            <HandScript className="mt-4 block text-[2.15rem] leading-none text-[#ff8b2b]">
              Real people. Real replies.
            </HandScript>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-600 dark:text-white/62">
              Longbrunch is a small room of people reading the same tape every week. Bring a question, a doubt, or a
              second opinion and a real person reads every message and writes back.
            </p>
          </div>
          <GlassPanel className="p-7 sm:p-8">
            <h3 className="text-2xl font-black tracking-tight">Ask us anything.</h3>
            <p className="mt-2 text-base leading-7 text-slate-600 dark:text-white/62">
              No ticket numbers, no bots. Just send it over.
            </p>
            <div className="mt-6">
              <AskUsForm />
            </div>
          </GlassPanel>
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
