'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import BrandHomeMenu from '@/components/BrandHomeMenu'
import { HandScript } from '@/components/marketing/site-chrome'
import HeaderSearch from '@/components/HeaderSearch'
import { buttonClass } from '@/components/ui/Button'

export type NavSection = 'stocks' | 'dashboard' | 'screener' | 'models' | 'performance' | 'methodology'

interface NavProps {
  active?: NavSection
}

const NavAuthControls = dynamic(() => import('./NavAuthControls'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3">
      <HandScript className="hidden text-[1.35rem] leading-none text-[#7d8cff] xl:block">
        Live tape.
      </HandScript>
      <Link href="/sign-up" className={buttonClass({ variant: 'primary', size: 'sm' })}>
        Join the lounge
      </Link>
    </div>
  ),
})

export default function Nav({ active }: NavProps) {
  return (
    <header
      data-section={active ?? undefined}
      className="fixed inset-x-0 top-0 z-[80] border-b border-white/8 bg-[#020611]/58 backdrop-blur-[28px] saturate-[1.8]"
    >
      <div className="container-lg py-3">
        <div className="flex h-[48px] items-center justify-between gap-5">
          <BrandHomeMenu
            textClassName="text-content-primary"
            menuShellClassName="border border-white/8 bg-[#020611]/58 backdrop-blur-[28px] saturate-[1.8]"
          />

          <div className="hidden min-w-0 flex-1 md:block">
            <HeaderSearch className="ml-auto w-full max-w-[520px] lg:max-w-[480px]" />
          </div>

          <div className="flex items-center gap-2">
            <NavAuthControls />
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <HeaderSearch className="mx-auto w-full max-w-[680px]" />
        </div>
      </div>
    </header>
  )
}
