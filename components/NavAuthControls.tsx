'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { HandScript } from '@/components/marketing/site-chrome'
import { buttonClass } from '@/components/ui/Button'

export default function NavAuthControls() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-up"
        className="group relative inline-flex items-center rounded-full px-2 py-1 text-[1.22rem] leading-none text-[#ffb46a] transition duration-200 hover:text-[#ffd3a3] dark:text-[#ffc27f] dark:hover:text-[#ffe1ba]"
      >
        <HandScript className="relative z-10 transition duration-200 group-hover:-rotate-[2deg] group-hover:scale-[1.04]">
          Join the lounge
        </HandScript>
        <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px origin-left scale-x-0 bg-current/70 transition duration-300 group-hover:scale-x-100" />
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <HandScript className="hidden text-[1.35rem] leading-none text-[#7d8cff] xl:block">
        Live tape.
      </HandScript>
      <Link href="/dashboard" className={`${buttonClass({ variant: 'ghost', size: 'sm' })} hidden lg:inline-flex`}>
        Lounge
      </Link>
      <div className="rounded-full border border-slate-950/8 bg-white/78 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(20,33,51,0.06)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.05] dark:shadow-none">
        <UserButton />
      </div>
    </div>
  )
}
