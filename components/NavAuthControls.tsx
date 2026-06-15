'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { HandScript } from '@/components/marketing/site-chrome'
import { buttonClass } from '@/components/ui/Button'

export default function NavAuthControls() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return (
      <Link href="/sign-up" className={buttonClass({ variant: 'primary', size: 'sm' })}>
        Join the lounge
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
      <div className="rounded-full border border-white/12 bg-white/[0.05] p-1 backdrop-blur-xl">
        <UserButton />
      </div>
    </div>
  )
}
