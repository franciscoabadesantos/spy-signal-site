'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import BrandHomeMenu from '@/components/BrandHomeMenu'
import type { AppNavSection } from '@/components/app-nav'
import {
  HandScript,
  sharedHeaderDesktopSearchClass,
  sharedHeaderInnerClass,
  sharedHeaderMenuShellClass,
  sharedHeaderMobileSearchClass,
  sharedHeaderShellClass,
} from '@/components/marketing/site-chrome'
import HeaderSearch from '@/components/HeaderSearch'

export type NavSection = AppNavSection

interface NavProps {
  active?: NavSection
}

const NavAuthControls = dynamic(() => import('./NavAuthControls'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3">
      <HandScript className="hidden text-[1.35rem] leading-none text-[#7d8cff] xl:block">Live tape.</HandScript>
      <Link
        href="/sign-up"
        className="group relative inline-flex items-center rounded-full px-2 py-1 text-[1.22rem] leading-none text-[#ffb46a] transition duration-200 hover:text-[#ffd3a3] dark:text-[#ffc27f] dark:hover:text-[#ffe1ba]"
      >
        <HandScript className="relative z-10 transition duration-200 group-hover:-rotate-[2deg] group-hover:scale-[1.04]">
          Join the lounge
        </HandScript>
        <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px origin-left scale-x-0 bg-current/70 transition duration-300 group-hover:scale-x-100" />
      </Link>
    </div>
  ),
})

export default function Nav({ active }: NavProps) {
  return (
    <header
      data-section={active ?? undefined}
      className={sharedHeaderShellClass}
    >
      <div className={sharedHeaderInnerClass}>
        <div className="flex items-center justify-between gap-4">
          <BrandHomeMenu
            textClassName="text-slate-950 dark:text-white"
            menuShellClassName={sharedHeaderMenuShellClass}
          />

          <div className="hidden min-w-0 flex-1 md:block">
            <HeaderSearch className={sharedHeaderDesktopSearchClass} />
          </div>

          <div className="flex items-center gap-3">
            <NavAuthControls />
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <HeaderSearch className={sharedHeaderMobileSearchClass} />
        </div>
      </div>
    </header>
  )
}
