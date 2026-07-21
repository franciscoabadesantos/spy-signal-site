'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { stockResearchItems } from '@/components/stocks/stock-nav-config'

export default function StockResearchNav({ ticker, active }: { ticker: string; active?: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative mb-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-10 items-center border-b-2 px-0.5 text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 motion-reduce:transition-none ${active ? 'border-[var(--color-accent)] font-semibold text-[var(--color-accent)]' : 'border-transparent text-content-secondary hover:text-content-primary'}`}
      >
        Research
        <span aria-hidden="true" className={`ml-1.5 text-xs transition-transform duration-[180ms] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open ? (
        <nav
          id={menuId}
          aria-label="Research destinations"
          className="absolute right-0 z-30 mt-2 grid min-w-72 gap-0.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--bg-surface)] p-2 shadow-xl"
        >
          <p className="px-3 pb-2 pt-1 text-caption uppercase tracking-[0.14em] text-content-muted">Research this asset</p>
          {stockResearchItems.map(([slug, label]) => (
            <Link
              key={slug}
              href={`/stocks/${ticker}/${slug}`}
              onClick={() => setOpen(false)}
              className="group flex min-h-10 items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-[var(--bg-surface-raised)] hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 motion-reduce:transition-none"
            >
              {label}
              <span aria-hidden="true" className="text-content-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">→</span>
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
