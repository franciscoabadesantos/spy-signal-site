'use client'

import { useEffect } from 'react'
import { useScrollRuntime } from '@/components/motion/ScrollRuntime'

// Turns the current route into a full-screen dashboard. While mounted it:
//   1. flags <html> with `atlas-immersive` so CSS can lock page overflow and
//      neutralize the app <main> padding that would otherwise overflow the
//      viewport by a few pixels (72px top pad + 100svh-based stage + 32px pad).
//   2. stops the shared Lenis instance, so smooth-scroll can't glide the page
//      even when there is residual scrollable height (overflow:hidden alone does
//      not pause Lenis).
// Everything reverts cleanly on unmount.
export default function AtlasImmersiveMode() {
  const { runtime } = useScrollRuntime()

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('atlas-immersive')
    // Force the marketing header into its condensed floating-pill state (there is
    // no scroll here to trigger it). Only clear it on unmount if we added it.
    const hadScrolled = root.classList.contains('chrome-scrolled')
    root.classList.add('chrome-scrolled')
    const releaseScroll = runtime.acquireLock()
    return () => {
      root.classList.remove('atlas-immersive')
      if (!hadScrolled) root.classList.remove('chrome-scrolled')
      releaseScroll()
    }
  }, [runtime])

  return null
}
