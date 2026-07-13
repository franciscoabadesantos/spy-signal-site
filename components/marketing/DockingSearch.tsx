'use client'

import type { FocusEvent } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import HeaderSearch from '@/components/HeaderSearch'

/**
 * Homepage hero search.
 *
 * At the top it's the centrepiece of the first screen — a large centred search
 * with an eyebrow above and a "See correlations" CTA below. On scroll it lifts
 * and fades as the small in-flow header pill search takes over (see .dock-search
 * in globals.css).
 *
 * While it's focused it tells the constellation (via a `meridian:search-focus`
 * window event) to zoom out and blur — "scanning the universe" for the ticker.
 */
function emit(focused: boolean) {
  window.dispatchEvent(new CustomEvent('meridian:search-focus', { detail: { focused } }))
}

export default function DockingSearch() {
  const onFocus = () => emit(true)
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    // Only when focus truly leaves the search, not when moving within it.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) emit(false)
  }

  return (
    <div data-dock-search className="dock-search" onFocus={onFocus} onBlur={onBlur}>
      <span className="dock-search__eyebrow">The market is a network</span>
      <div className="dock-search__field">
        <HeaderSearch className="w-full" placeholder="Search a ticker or company…" />
      </div>
      <Link href="/markets/network" className="dock-search__cta">
        See correlations
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
