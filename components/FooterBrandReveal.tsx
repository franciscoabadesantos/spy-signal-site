'use client'

import { useEffect, useRef } from 'react'
import { Sora } from 'next/font/google'
import { BRAND_NAME } from '@/components/marketing/site-config'

const sora = Sora({ subsets: ['latin'], weight: ['700', '800'], display: 'swap' })

/**
 * The closing brand moment — a large wordmark that sits on its own at the very
 * bottom of the page and emerges from below once it scrolls into view.
 *
 * Self-contained: it runs its own IntersectionObserver so it reveals on every
 * route (the header scroll controller only mounts on marketing pages). Falls
 * back to visible immediately if IntersectionObserver is unavailable.
 */
export default function FooterBrandReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-inview')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal
      aria-hidden="true"
      className={`${sora.className} relative flex select-none items-end justify-center pt-4`}
    >
      {/* spark aura — the one branded accent moment */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] bottom-3 -z-10 h-28 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--brand-spark)_26%,transparent),transparent)] blur-2xl"
      />
      <span className="text-[clamp(3rem,13vw,11rem)] font-extrabold leading-[0.82] tracking-[-0.045em] text-current">
        {BRAND_NAME.toLowerCase()}
      </span>
      <span className="ml-[0.05em] text-[clamp(3rem,13vw,11rem)] font-extrabold leading-[0.82] tracking-[-0.045em] text-brand-spark [text-shadow:0_0_38px_color-mix(in_srgb,var(--brand-spark)_55%,transparent)]">
        /
      </span>
    </div>
  )
}
