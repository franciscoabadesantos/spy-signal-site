'use client'

import { useEffect, useMemo, useState } from 'react'

type VisibleEntry = {
  id: string
  ratio: number
  top: number
}

function pickActiveId({
  sectionIds,
  visible,
  offset,
}: {
  sectionIds: string[]
  visible: Map<string, VisibleEntry>
  offset: number
}): string | null {
  if (sectionIds.length === 0) return null

  const ranked = [...visible.values()].sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio
    return Math.abs(a.top - offset) - Math.abs(b.top - offset)
  })
  if (ranked[0]?.id) return ranked[0].id

  for (const id of sectionIds) {
    const element = document.getElementById(id)
    if (!element) continue
    const rect = element.getBoundingClientRect()
    if (rect.top <= offset && rect.bottom > offset) return id
  }

  return sectionIds[0] ?? null
}

export function useScrollSpy(sectionIds: string[], offset = 120): string {
  const ids = useMemo(
    () => [...new Set(sectionIds.map((id) => id.trim()).filter(Boolean))],
    [sectionIds]
  )
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    if (ids.length === 0) return

    const visible = new Map<string, VisibleEntry>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id
          if (!id) continue

          if (!entry.isIntersecting) {
            visible.delete(id)
            continue
          }

          visible.set(id, {
            id,
            ratio: entry.intersectionRatio,
            top: entry.boundingClientRect.top,
          })
        }

        const next = pickActiveId({ sectionIds: ids, visible, offset })
        if (next) setActiveId(next)
      },
      {
        root: null,
        rootMargin: `-${offset}px 0px -55% 0px`,
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    )

    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [ids, offset])

  if (!ids.includes(activeId)) return ids[0] || ''
  return activeId || ids[0] || ''
}
