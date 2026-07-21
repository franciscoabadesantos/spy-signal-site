'use client'

import Link from 'next/link'
import HeaderSearch from '@/components/HeaderSearch'
import { cn } from '@/lib/utils'
import { BRAND_NAME } from '@/components/marketing/site-config'

const MARKETING_LINKS = [
  { label: 'Product', href: '/product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
]

export default function HeaderBar({ isHome }: { isHome: boolean }) {
  return (
    <div
      data-site-header-row
      data-home={isHome ? '' : undefined}
      data-internal={!isHome ? '' : undefined}
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
            className="site-header__search hidden w-full min-w-0 max-w-[520px] md:block md:justify-self-center"
          >
            <HeaderSearch className="w-full" />
          </div>
        )}

        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5',
            'site-header__cluster md:justify-self-end'
          )}
        >
          <nav className="hidden items-center md:flex">
            {MARKETING_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="site-header__navlink">
                {item.label}
              </Link>
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
    </div>
  )
}
