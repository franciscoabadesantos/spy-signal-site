import { CircleHighlight, GlassPanel, HandScript, MarketingPageOutro, MarketingPageShell, ScribbleNote, SectionHeading } from '@/components/marketing/site-chrome'

const faqItems = [
  {
    question: 'What is included in membership?',
    answer: 'Membership covers the signal workspace, markets and ticker coverage, screener and watchlist access, research context, alerts, and signal history views.',
  },
  {
    question: 'Do I need an account first?',
    answer: 'Yes. If you are not signed in, the current flow starts with account creation before you continue into the workspace.',
  },
  {
    question: 'Is this for intraday trading?',
    answer: 'No. The product is built around signal monitoring, market context, watchlists, and research workflows rather than a chatty intraday feed.',
  },
  {
    question: 'What happens after signup?',
    answer: 'After sign-up you continue into the product workspace. Upgrade or paid access only follows the live billing path when that path is configured for your account.',
  },
  {
    question: 'Can I review history and research inside the product?',
    answer: 'Yes. The product includes signal history views, ticker-level context, and saved research surfaces inside the workspace.',
  },
] as const

export default function FaqPage() {
  return (
    <MarketingPageShell
      activeHref="/faq"
      eyebrow="FAQ"
      title={
        <>
          Straight answers
          <br />
          before you start
          <br />
          <span className="text-[#0757ff]">membership.</span>
        </>
      }
      description="Review the basics on cadence, deliverables, workflow, and product fit before you create an account."
      primaryCta={{ label: 'Start membership', href: '/sign-up' }}
      secondaryCta={{ label: 'See pricing', href: '/pricing' }}
      heroAside={
        <GlassPanel className="p-7">
          <CircleHighlight className="mb-5" tone="blue">
            <HandScript className="text-[2.15rem] leading-none text-[#6f79ff] dark:text-[#8590ff]">Quick answers.</HandScript>
          </CircleHighlight>
          <ScribbleNote tone="blue">
            Fewer questions.
            <br />
            Faster conviction.
          </ScribbleNote>
        </GlassPanel>
      }
    >
      <section className="mx-auto max-w-[980px] px-6 py-20 sm:px-10">
        <SectionHeading
          eyebrow="Answers"
          title="The essentials before someone commits."
          body="The focus is simple: what the product delivers, how often it updates, and who it is built for."
        />
        <div className="mt-10 space-y-4">
          {faqItems.map((item) => (
            <details key={item.question} className="group">
              <GlassPanel className="p-0">
                <summary className="cursor-pointer list-none px-6 py-5 text-lg font-semibold">
                  {item.question}
                </summary>
                <div className="border-t border-slate-950/8 px-6 py-5 text-base leading-7 text-slate-600 dark:border-white/10 dark:text-white/62">
                  {item.answer}
                </div>
              </GlassPanel>
            </details>
          ))}
        </div>
      </section>

      <MarketingPageOutro />
    </MarketingPageShell>
  )
}
