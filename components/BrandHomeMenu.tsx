'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart3,
  Bookmark,
  FlaskConical,
  Gauge,
  House,
  Layers3,
  MessageSquareShare,
  type LucideIcon,
  PanelsTopLeft,
  CircleHelp,
  NotebookText,
  ReceiptText,
  Waypoints,
} from 'lucide-react'
import { appNavSectionFromPath, type AppNavSection } from '@/components/app-nav'
import { cn } from '@/lib/utils'

type MenuItem = {
  key: AppNavSection
  label: string
  href: string
  icon: LucideIcon
}

const PRIMARY_APP_ITEMS: readonly MenuItem[] = [
  { key: 'today', label: 'Today', href: '/dashboard', icon: PanelsTopLeft },
  { key: 'signals', label: 'Signals', href: '/screener', icon: Gauge },
  { key: 'markets', label: 'Markets', href: '/markets', icon: BarChart3 },
  { key: 'watchlist', label: 'Watchlist', href: '/dashboard/watchlist', icon: Bookmark },
  { key: 'community', label: 'Community', href: '/community', icon: MessageSquareShare },
  { key: 'model-lab', label: 'Model Lab', href: '/models', icon: FlaskConical },
] as const

const SECONDARY_LINKS = [
  { label: 'Home', href: '/', icon: House },
  { label: 'How it works', href: '/how-it-works', icon: Waypoints },
  { label: 'Performance', href: '/performance', icon: BarChart3 },
  { label: 'Method', href: '/method', icon: NotebookText },
  { label: 'Pricing', href: '/pricing', icon: ReceiptText },
  { label: 'FAQ', href: '/faq', icon: CircleHelp },
] as const

function subscribe() {
  return () => {}
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function BrandHomeMenu({
  className,
  textClassName,
  menuShellClassName,
}: {
  className?: string
  textClassName?: string
  menuShellClassName?: string
}) {
  const pathname = usePathname()
  const currentSection = appNavSectionFromPath(pathname)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  function positionPanel() {
    if (!rootRef.current || !panelRef.current) return

    const rect = rootRef.current.getBoundingClientRect()
    panelRef.current.style.left = `${rect.left - 78}px`
    panelRef.current.style.top = `${rect.bottom + 16}px`
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    positionPanel()

    function onReposition() {
      positionPanel()
    }

    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)

    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative inline-flex items-center gap-2', className)} data-open={open}>
      <Link
        href="/"
        className={cn(
          'marketing-logo-type inline-flex items-center text-xl font-bold tracking-normal transition-opacity hover:opacity-85 md:text-2xl',
          textClassName
        )}
      >
        lb
      </Link>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open site menu"
        onClick={() => {
          if (!open) {
            requestAnimationFrame(() => {
              positionPanel()
            })
          }
          setOpen((value) => !value)
        }}
        className="group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b2b]/50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 44 44"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d="M7 17 C9 8 32 6 37 15 C41 25 38 38 27 39 C15 41 7 34 6 25 C5 22 5 19 7 17 Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            pathLength="100"
            className={cn(
              'origin-center text-[#0757ff]/70 opacity-0 [stroke-dasharray:100] [stroke-dashoffset:100] group-hover:animate-[brand-menu-scribble-draw_520ms_ease-out_forwards] dark:text-[#f8f200]/75',
              open
                ? 'opacity-100 [stroke-dashoffset:0]'
                : ''
            )}
          />
        </svg>
        <span
          className={cn(
            'marketing-logo-type relative z-10 text-[1.7rem] font-bold leading-none text-[#ffb56d] transition duration-300',
            open
              ? 'translate-x-0 rotate-[22deg] scale-[1.06]'
              : 'group-hover:translate-x-[2px] group-hover:rotate-[16deg] group-hover:scale-[1.04]'
          )}
        >
          /
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-[8px] right-[6px] h-1.5 w-1.5 rounded-full bg-[#0757ff] transition duration-300 dark:bg-[#f8f200]',
            open ? 'opacity-0 scale-75' : 'opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75'
          )}
        />
      </button>

      {mounted
        ? createPortal(
            <div
              ref={panelRef}
              aria-hidden={!open}
              className={cn(
                'fixed z-[120] w-[22rem] origin-top-left overflow-hidden rounded-none transition-all duration-200 ease-out',
                menuShellClassName ?? 'border border-slate-950/8 bg-white/88 backdrop-blur-[28px] saturate-[1.8] dark:border-white/8 dark:bg-[#020611]/58',
                open
                  ? 'translate-y-0 scale-100 opacity-100 blur-0'
                  : 'pointer-events-none -translate-y-3 scale-[0.97] opacity-0 blur-[2px]'
              )}
            >
              <div className="relative z-10 grid gap-1.5 px-2.5 py-2.5">
                <div className="ml-5 w-[calc(100%-1.4rem)] rounded-[18px] border border-slate-950/8 bg-white/88 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_30px_rgba(20,33,51,0.08)] dark:border-white/10 dark:bg-[#04070d]/94 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_30px_rgba(0,0,0,0.2)]">
                  <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] px-3 py-2.5">
                    <Layers3 className="h-5 w-5 text-content-secondary" strokeWidth={2} />
                    <div>
                      <div className="text-sm font-medium text-content-primary/88">App</div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-content-muted">
                        Daily signal terminal
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 space-y-1 border-t border-slate-950/8 pt-1.5 dark:border-white/10">
                    {PRIMARY_APP_ITEMS.map((item) => {
                      const active = currentSection === item.key
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] px-3 py-2.5 transition',
                            active
                              ? 'bg-slate-950/[0.05] text-content-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                              : 'text-content-secondary hover:bg-slate-950/[0.04] hover:text-content-primary dark:hover:bg-white/[0.05]'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 stroke-[2]',
                              active ? 'text-content-primary' : 'text-content-muted'
                            )}
                            strokeWidth={2}
                          />
                          <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className="ml-5 w-[calc(100%-1.4rem)] rounded-[18px] border border-slate-950/8 bg-white/84 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_30px_rgba(20,33,51,0.05)] dark:border-white/10 dark:bg-[#04070d]/88 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_30px_rgba(0,0,0,0.18)]">
                  <div className="px-1 text-[11px] uppercase tracking-[0.18em] text-content-muted">
                    Learn
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SECONDARY_LINKS.map((item) => {
                      const active = isActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition',
                            active
                              ? 'border-slate-950/12 bg-slate-950/[0.05] text-content-primary dark:border-white/10 dark:bg-white/[0.08]'
                              : 'border-slate-950/8 bg-white/70 text-content-secondary hover:text-content-primary dark:border-white/10 dark:bg-white/[0.04]'
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
