'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import {
  stockResearchHref,
  stockResearchMoreItems,
  stockResearchPrimaryItems,
  type StockResearchLink,
  type StockResearchNavKey,
} from '@/components/stocks/stock-nav-config'
import { parseInvestmentLens, type InvestmentLensKey } from '@/lib/investment-lens'
import styles from './StockResearchNav.module.css'

type OpenMenuKey = 'financials' | 'signals' | 'more'

function activeKeyFromPath(pathname: string): StockResearchNavKey {
  const segment = pathname.split('/').filter(Boolean)[2]
  if (!segment) return 'overview'
  if (segment === 'relationships') return 'relationships'
  if (segment === 'fundamentals') return 'fundamentals'
  if (segment === 'financials') return 'financials'
  if (segment === 'valuation') return 'valuation'
  if (['signals', 'signal-history', 'indicators', 'performance'].includes(segment)) return 'signals'
  if (segment === 'events') return 'events'
  if (segment === 'profile') return 'profile'
  return 'more'
}

export default function StockResearchNav({
  ticker,
  initialLens,
}: {
  ticker: string
  initialLens?: InvestmentLensKey
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openMenu, setOpenMenu] = useState<OpenMenuKey | null>(null)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 184 })
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Partial<Record<OpenMenuKey, HTMLButtonElement | null>>>({})
  const focusOnOpenRef = useRef(false)
  const menuId = useId()
  const lens = parseInvestmentLens(searchParams.get('lens') ?? initialLens)
  const activeKey = activeKeyFromPath(pathname)

  useEffect(() => {
    const revealActiveItem = () => {
      const scroller = scrollerRef.current
      const activeItem = scroller?.querySelector<HTMLElement>('[data-active="true"]')
      if (!scroller || !activeItem) return
      const centeredLeft = activeItem.offsetLeft - (scroller.clientWidth - activeItem.offsetWidth) / 2
      scroller.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'auto' })
    }
    revealActiveItem()
    window.addEventListener('resize', revealActiveItem)
    return () => window.removeEventListener('resize', revealActiveItem)
  }, [activeKey])

  useEffect(() => {
    if (!openMenu) return

    const updatePosition = () => {
      const trigger = triggerRefs.current[openMenu]?.getBoundingClientRect()
      if (!trigger) return
      const width = openMenu === 'financials' ? 190 : openMenu === 'signals' ? 176 : 184
      const gutter = 12
      const left = Math.min(Math.max(gutter, trigger.left), window.innerWidth - width - gutter)
      setMenuPosition({ left, top: trigger.bottom + 5, width })
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const currentMenu = openMenu
      setOpenMenu(null)
      triggerRefs.current[currentMenu]?.focus()
    }

    updatePosition()
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [openMenu])

  useEffect(() => {
    if (!openMenu || !focusOnOpenRef.current) return
    focusOnOpenRef.current = false
    menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
  }, [openMenu])

  const toggleMenu = (menu: OpenMenuKey, focusFirst = false) => {
    focusOnOpenRef.current = focusFirst
    setOpenMenu((current) => (current === menu ? null : menu))
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])
    if (!links.length) return
    event.preventDefault()
    const current = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (event.key === 'Home') links[0]?.focus()
    else if (event.key === 'End') links.at(-1)?.focus()
    else if (event.key === 'ArrowDown') links[(current + 1 + links.length) % links.length]?.focus()
    else links[(current - 1 + links.length) % links.length]?.focus()
  }

  const menuItems: readonly StockResearchLink[] = openMenu === 'more'
    ? stockResearchMoreItems
    : stockResearchPrimaryItems.find((item) => item.key === openMenu)?.subitems ?? []
  const menuLabel = openMenu === 'financials'
    ? 'Financials'
    : openMenu === 'signals'
      ? 'Signals'
      : 'More research destinations'
  const menuStyle = {
    '--research-menu-left': `${menuPosition.left}px`,
    '--research-menu-top': `${menuPosition.top}px`,
    '--research-menu-width': `${menuPosition.width}px`,
  } as CSSProperties

  return (
    <div ref={rootRef} className={styles.root} data-stock-research-nav="">
      <nav aria-label="Ticker research" className={styles.nav}>
        <div ref={scrollerRef} className={styles.scroller} onScroll={() => setOpenMenu(null)}>
          {stockResearchPrimaryItems.map((item) => {
            const selected = activeKey === item.key
            const menuKey = item.subitems ? item.key as OpenMenuKey : null
            return (
              <div
                key={item.key}
                className={styles.item}
                data-active={selected}
                data-open={openMenu === menuKey}
              >
                {menuKey ? (
                  <button
                    ref={(node) => { triggerRefs.current[menuKey] = node }}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openMenu === menuKey}
                    aria-controls={openMenu === menuKey ? menuId : undefined}
                    className={styles.menuTrigger}
                    onClick={() => toggleMenu(menuKey)}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown') return
                      event.preventDefault()
                      toggleMenu(menuKey, true)
                    }}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true" className={styles.chevron}>⌄</span>
                  </button>
                ) : (
                  <Link
                    href={stockResearchHref(ticker, item, lens)}
                    aria-current={selected ? 'page' : undefined}
                    className={styles.link}
                    onClick={() => setOpenMenu(null)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            )
          })}
          <div className={styles.item} data-active={activeKey === 'more'} data-open={openMenu === 'more'}>
            <button
              ref={(node) => { triggerRefs.current.more = node }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'more'}
              aria-controls={openMenu === 'more' ? menuId : undefined}
              className={styles.menuTrigger}
              onClick={() => toggleMenu('more')}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown') return
                event.preventDefault()
                toggleMenu('more', true)
              }}
            >
              <span>More</span>
              <span aria-hidden="true" className={styles.chevron}>⌄</span>
            </button>
          </div>
        </div>
      </nav>

      {openMenu ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          className={styles.menu}
          style={menuStyle}
          onKeyDown={onMenuKeyDown}
        >
          {menuItems.map((item) => {
            const href = stockResearchHref(ticker, item, lens)
            const itemParams = new URLSearchParams(item.query)
            const statement = itemParams.get('statement')
            const selected = pathname === href.split('?')[0]
              && (!statement || searchParams.get('statement') === statement)
            return (
              <Link
                key={item.key}
                href={href}
                role="menuitem"
                aria-current={selected ? 'page' : undefined}
                className={styles.menuLink}
                onClick={() => setOpenMenu(null)}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
