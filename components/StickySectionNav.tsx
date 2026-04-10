'use client'

import { useScrollSpy } from '@/hooks/useScrollSpy'

export type StickySection = {
  id: string
  label: string
}

function itemClass(active: boolean): string {
  if (active) {
    return 'relative rounded-r-md py-2.5 pl-4 text-left text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
  }
  return 'relative rounded-r-md py-2.5 pl-4 text-left text-sm font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary active:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
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
      <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-content-muted">
        On this page
      </div>
      <nav className="relative mt-3 ml-2 border-l border-border">
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
