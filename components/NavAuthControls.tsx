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
        className="group relative inline-flex items-center rounded-full px-2 py-1 text-sm font-semibold leading-none text-accent-text transition duration-200 hover:opacity-85"
      >
        <HandScript className="relative z-10 transition duration-200 group-hover:-rotate-[2deg] group-hover:scale-[1.04]">
          Become a member
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
        Today
      </Link>
      <div className="material-glass rounded-full p-1">
        <UserButton />
      </div>
    </div>
  )
}
