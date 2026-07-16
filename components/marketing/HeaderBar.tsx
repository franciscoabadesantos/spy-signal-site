'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import HeaderSearch from '@/components/HeaderSearch'
import { cn } from '@/lib/utils'
import { BRAND_NAME } from '@/components/marketing/site-config'

type Tile = { label: string; href: string; grad: string; lightGrad: string }
type Menu = { key: string; label: string; href: string; blurb: string; tiles: Tile[] }

// Placeholder content — the media tiles use gradient placeholders instead of
// photography for now. Swap copy/links/images when ready.
const MENUS: Menu[] = [
  {
    key: 'today',
    label: 'Today',
    href: '/dashboard',
    blurb: 'Placeholder — your daily read: the signal, market context, and what moved overnight.',
    tiles: [
      { label: 'Signal', href: '/screener', grad: 'linear-gradient(150deg,#0f9e8e,#0a3a44)', lightGrad: 'linear-gradient(145deg,#d9eee9,#f4efe5 72%)' },
      { label: 'Markets', href: '/markets', grad: 'linear-gradient(150deg,#3a4d8f,#0b1730)', lightGrad: 'linear-gradient(145deg,#dfe8ee,#f4efe5 72%)' },
      { label: 'Watchlist', href: '/dashboard/watchlist', grad: 'linear-gradient(150deg,#5b3d8c,#160c30)', lightGrad: 'linear-gradient(145deg,#e8e2ee,#f4efe5 72%)' },
    ],
  },
  {
    key: 'correlation',
    label: 'Correlation',
    href: '/markets/network',
    blurb: 'Placeholder — how names move together: the network, correlated pairs, and sector clusters.',
    tiles: [
      { label: 'Network', href: '/markets/network', grad: 'linear-gradient(150deg,#0f9e8e,#0a3a44)', lightGrad: 'linear-gradient(145deg,#d9eee9,#f4efe5 72%)' },
      { label: 'Pairs', href: '/markets', grad: 'linear-gradient(145deg,#8a5a37,#301a0b)', lightGrad: 'linear-gradient(145deg,#eee4d9,#f4efe5 72%)' },
      { label: 'Sectors', href: '/markets', grad: 'linear-gradient(150deg,#3a4d8f,#0b1730)', lightGrad: 'linear-gradient(145deg,#dfe8ee,#f4efe5 72%)' },
    ],
  },
]

export default function HeaderBar({ isHome }: { isHome: boolean }) {
  const [open, setOpen] = useState<string | null>(null)
  const [displayed, setDisplayed] = useState<Menu | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the last menu mounted through the close transition.
  useEffect(() => {
    if (!open && displayed) {
      clearTimer.current = setTimeout(() => setDisplayed(null), 440)
    }
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [open, displayed])

  function toggleMenu(key: string) {
    if (open === key) {
      setOpen(null)
      return
    }
    if (clearTimer.current) clearTimeout(clearTimer.current)
    setDisplayed(MENUS.find((m) => m.key === key) ?? null)
    setOpen(key)
  }

  // Backdrop dim over the page.
  useEffect(() => {
    document.documentElement.classList.toggle('has-header-menu', !!open)
    return () => document.documentElement.classList.remove('has-header-menu')
  }, [open])

  // Close on outside-click / Escape / scroll.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    const onScroll = () => setOpen(null)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  return (
    <div
      ref={rowRef}
      data-site-header-row
      data-home={isHome ? '' : undefined}
      data-menu-open={open ? '' : undefined}
      className="site-header__row"
    >
      <div
        className={cn(
          'site-header__bar flex items-center gap-4',
          !isHome && 'justify-between md:grid md:grid-cols-[1fr_auto_1fr]'
        )}
      >
        <Link
          href="/"
          aria-label={BRAND_NAME}
          className="site-header__brand marketing-logo-type shrink-0 pl-1 font-bold tracking-[-0.01em] text-content-primary transition-opacity hover:opacity-80 md:justify-self-start"
        >
          <span className="site-header__brand-full">{BRAND_NAME}</span>
          <span className="site-header__brand-short" aria-hidden="true">
            lb
          </span>
        </Link>

        {isHome ? (
          <div data-pill-search className="site-header__pill-search hidden md:block">
            <HeaderSearch className="w-full" placeholder="Search…" />
          </div>
        ) : (
          <div
            data-header-search
            className="site-header__search hidden w-full min-w-0 max-w-[460px] md:block md:justify-self-center"
          >
            <HeaderSearch className="w-full" />
          </div>
        )}

        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5',
            isHome ? 'site-header__cluster' : 'md:justify-self-end'
          )}
        >
          <nav className="hidden items-center md:flex">
            {MENUS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-expanded={open === m.key}
                aria-haspopup="menu"
                onClick={() => toggleMenu(m.key)}
                className="site-header__navlink site-nav__trigger"
              >
                {m.label}
                <ChevronDown className="site-nav__chev size-3.5" aria-hidden="true" />
              </button>
            ))}
          </nav>
          <Link
            href="/sign-up"
            className="site-header__join inline-flex items-center justify-center rounded-full bg-brand-spark px-4 font-semibold text-[color:var(--brand-spark-on)] shadow-[0_10px_24px_-8px_var(--brand-spark)] transition duration-200 hover:brightness-[1.08]"
          >
            Join
          </Link>
        </div>
      </div>

      <div className="site-header__dropdowns" aria-hidden={!open} inert={!open ? true : undefined}>
        {displayed ? (
          <div className="site-header__dropgrid">
            <div className="site-header__tile site-header__tile--text">
              <div>
                <p className="site-header__tile-eyebrow">{displayed.label}</p>
                <p className="site-header__tile-blurb">{displayed.blurb}</p>
              </div>
              <Link href={displayed.href} className="site-header__tile-view" onClick={() => setOpen(null)}>
                View
                <ArrowRight className="size-4" />
              </Link>
            </div>
            {displayed.tiles.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                onClick={() => setOpen(null)}
                className="site-header__tile"
                style={{ ['--tile-grad' as string]: t.grad, ['--tile-grad-light' as string]: t.lightGrad }}
              >
                <span className="site-header__tile-media" aria-hidden="true" />
                <span className="site-header__tile-label">{t.label}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
