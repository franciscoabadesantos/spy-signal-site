'use client'

import { useScrollSpy } from '@/hooks/useScrollSpy'

export type StickySection = {
  id: string
  label: string
}

function itemClass(active: boolean): string {
  if (active) return 'relative py-2.5 pl-4 text-left text-sm font-semibold text-primary'
  return 'relative py-2.5 pl-4 text-left text-sm font-medium text-slate-500 transition-colors hover:text-slate-800'
}

export default function StickySectionNav({
  sections,
  offset = 112,
}: {
  sections: StickySection[]
  offset?: number
}) {
  const activeId = useScrollSpy(
    sections.map((section) => section.id),
    offset
  )

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (!element) return
    const target = element.getBoundingClientRect().top + window.scrollY - offset + 4
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  if (sections.length === 0) return null

  return (
    <aside className="sticky top-24 hidden w-44 shrink-0 self-start xl:block">
      <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        On this page
      </div>
      <nav className="relative mt-3 ml-2 border-l border-slate-200">
        {sections.map((section) => {
          const active = section.id === activeId
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              className={itemClass(active)}
            >
              {active ? (
                <span className="absolute -left-px top-0 h-full w-[2px] rounded bg-primary" />
              ) : null}
              {section.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
