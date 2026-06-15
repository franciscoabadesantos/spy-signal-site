import { CircleHighlight, GlassPanel, HandScript, MarketingPageOutro, MarketingPageShell, ScribbleNote, SectionHeading } from '@/components/marketing/site-chrome'

const faqItems = [
  {
    question: 'When does the signal update?',
    answer: 'The core promise is a weekly signal delivered before the market opens so the decision happens ahead of the week, not in reaction to it.',
  },
  {
    question: 'What does the signal actually tell me?',
    answer: 'It gives you the weekly stance, confidence, and the supporting tape so you can understand the context around the call.',
  },
  {
    question: 'Is this for intraday trading?',
    answer: 'No. The product identity is deliberately slower and more disciplined than an intraday alert service.',
  },
  {
    question: 'Does the site still link back to the app?',
    answer: 'Yes. The refreshed marketing pages keep the routes wired into the existing screener, sign-in, and sign-up flows.',
  },
  {
    question: 'Why move the homepage links off anchors?',
    answer: 'Because the frontpage is now the teaser. Each primary topic has its own route so the site reads like a full product, not a single scrolling page.',
  },
] as const

export default function FaqPage() {
  return (
    <MarketingPageShell
      activeHref="/faq"
      eyebrow="FAQ"
      title={
        <>
          The quick answers
          <br />
          should live on their
          <br />
          <span className="text-[#0757ff]">own page too.</span>
        </>
      }
      description="This page replaces the old anchor-only FAQ behavior and carries the same voice, links, and visual identity as the rest of the refreshed marketing site."
      primaryCta={{ label: 'Join the lounge', href: '/sign-up' }}
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
          body="The content is straightforward, but the page now belongs to the same brand system as the new frontpage."
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
