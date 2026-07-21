'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight } from 'lucide-react'

export type FaqInlineLink = {
  href: string
  label: string
  suffix?: string
}

export type FaqItem = {
  question: string
  answer: string
  link?: FaqInlineLink
}

export type FaqGroup = {
  label: string
  description: string
  items: readonly FaqItem[]
}

export default function FaqAccordion({ groups }: { groups: readonly FaqGroup[] }) {
  const [openItem, setOpenItem] = useState('faq-0-0')

  return (
    <div className="faq-accordion mt-12 sm:mt-16">
      {groups.map((group, groupIndex) => {
        const groupId = `faq-group-${groupIndex}`
        const itemStartNumber = groups
          .slice(0, groupIndex)
          .reduce((total, currentGroup) => total + currentGroup.items.length, 0)

        return (
          <section key={group.label} className="mb-16 last:mb-0 sm:mb-20" aria-labelledby={groupId}>
            <div className="mb-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-border pt-4">
              <h3
                id={groupId}
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-2xl font-bold tracking-[-0.04em] text-content-primary sm:text-3xl"
              >
                {group.label}
              </h3>
              <p className="basis-full max-w-[36ch] text-sm leading-6 text-content-secondary sm:ml-auto sm:basis-auto sm:text-right">
                {group.description}
              </p>
            </div>

            <div className="border-y border-border">
              {group.items.map((item, itemIndex) => {
                const itemKey = `faq-${groupIndex}-${itemIndex}`
                const panelId = `${itemKey}-answer`
                const questionId = `${itemKey}-question`
                const isOpen = openItem === itemKey

                return (
                  <article
                    key={item.question}
                    className={`group border-b border-border last:border-b-0 transition-colors duration-200 ease-out ${
                      isOpen ? 'bg-surface-hover/45' : ''
                    }`}
                  >
                    <button
                      type="button"
                      aria-controls={panelId}
                      aria-expanded={isOpen}
                      className="grid min-h-[76px] w-full grid-cols-[2.5rem_minmax(0,1fr)_2.25rem] items-center gap-3 px-3 py-4 text-left transition-[color,background-color] duration-200 ease-out hover:bg-surface-hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-spark sm:min-h-[84px] sm:grid-cols-[4rem_minmax(0,1fr)_2.5rem] sm:gap-5 sm:px-5 sm:py-5"
                      onClick={() => setOpenItem(isOpen ? '' : itemKey)}
                    >
                      <span
                        style={{ fontFamily: 'var(--font-mono)' }}
                        className="text-xs font-semibold tabular-nums tracking-[0.12em] text-brand-spark/75 sm:text-sm"
                        aria-hidden="true"
                      >
                        {String(itemStartNumber + itemIndex + 1).padStart(2, '0')}
                      </span>
                      <span
                        id={questionId}
                        style={{ fontFamily: 'var(--font-display)' }}
                        className="min-w-0 text-[1.05rem] font-semibold leading-6 tracking-[-0.025em] text-content-primary sm:text-xl sm:leading-7"
                      >
                        {item.question}
                      </span>
                      <span
                        className={`grid size-9 place-items-center justify-self-end rounded-full border border-border text-brand-spark transition-[transform,border-color,color,background-color] duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:border-brand-spark/45 ${
                          isOpen ? 'rotate-0 bg-brand-spark/8' : '-rotate-90'
                        }`}
                        aria-hidden="true"
                      >
                        <ArrowDown className="size-4" strokeWidth={1.7} />
                      </span>
                    </button>

                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={questionId}
                      aria-hidden={!isOpen}
                      inert={!isOpen}
                      className={`grid transition-[grid-template-rows,opacity] duration-[280ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p
                          className={`grid grid-cols-[2.5rem_minmax(0,1fr)_2.25rem] gap-3 px-3 pb-6 text-[0.98rem] leading-7 text-content-secondary transition-[transform,opacity] duration-[280ms] ease-[cubic-bezier(.22,1,.36,1)] sm:grid-cols-[4rem_minmax(0,1fr)_2.5rem] sm:gap-5 sm:px-5 sm:pb-7 sm:text-base sm:leading-8 ${
                            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                          }`}
                        >
                          <span aria-hidden="true" />
                          <span className="min-w-0 max-w-[68ch]">
                            {item.answer}{' '}
                            {item.link ? (
                              <>
                                <Link
                                  href={item.link.href}
                                  className="group/inline-link inline-flex items-baseline gap-1 font-semibold text-content-primary underline decoration-brand-spark/45 underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-brand-spark hover:decoration-brand-spark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-spark"
                                >
                                  {item.link.label}
                                  <ArrowUpRight className="size-3.5 shrink-0 self-center transition-transform duration-200 ease-out group-hover/inline-link:-translate-y-0.5 group-hover/inline-link:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                                </Link>
                                {item.link.suffix ? ` ${item.link.suffix}` : null}
                              </>
                            ) : null}
                          </span>
                          <span aria-hidden="true" />
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
