'use client'

import { useEffect } from 'react'
import { useScrollRuntime } from '@/components/motion/ScrollRuntime'

/**
 * Headless controller for the marketing site chrome.
 *
 * Mirrors the technique used on wolverineworldwide.com: JS only maintains a
 * handful of *state classes* on <html> and lets CSS own every transition. It
 * It consumes the shared site scroll runtime, which owns the single
 * Lenis instance and keeps this CSS state machine synchronized with both
 * smooth and reduced-motion native scrolling.
 *
 * Classes toggled on documentElement:
 *   chrome-scrolled     scrollY past the "condense" threshold — the header goes
 *                       from a boxless floating row to the liquid-glass pill
 *   chrome-past-fold    scrollY past the hide/reveal threshold
 *   chrome-scroll-down  last meaningful scroll delta was downward
 *   chrome-scroll-up    last meaningful scroll delta was upward
 *
 * The bar→pill morph is pure CSS (max-width / padding / a fading ::before glass
 * layer), so there's no geometry library and no text-scaling artifacts.
 */

const SCROLLED = 40
// How far you must scroll before the header is allowed to hide on scroll-down.
// Kept high so the search stays reachable well into the page (incl. the pinned
// hero) and only tucks away once you're deep past it.
const FOLD = 1200
const DELTA = 5

export default function SiteChromeMotion() {
  const { runtime } = useScrollRuntime()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement

    root.classList.toggle('chrome-scrolled', window.scrollY > SCROLLED)

    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        root.classList.toggle('chrome-scrolled', y > SCROLLED)
        root.classList.toggle('chrome-past-fold', y > FOLD)
        if (Math.abs(y - lastY) > DELTA) {
          const down = y > lastY && y > SCROLLED
          root.classList.toggle('chrome-scroll-down', down)
          root.classList.toggle('chrome-scroll-up', !down)
          lastY = y
        }
        ticking = false
      })
    }

    const unsubscribe = runtime.subscribeScroll(onScroll)

    return () => {
      unsubscribe()
      root.classList.remove(
        'chrome-scrolled',
        'chrome-past-fold',
        'chrome-scroll-down',
        'chrome-scroll-up'
      )
    }
  }, [runtime])

  return null
}
