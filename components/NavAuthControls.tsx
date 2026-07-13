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
        className="inline-flex h-9 items-center justify-center rounded-full bg-brand-spark px-4 text-sm font-semibold text-[#04201d] shadow-[0_12px_28px_rgba(13,148,136,0.24)] transition duration-200 hover:brightness-[1.08]"
      >
        Start membership
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
      <div className="rounded-full border border-slate-950/8 bg-white/78 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(20,33,51,0.06)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.05] dark:shadow-none">
        <UserButton />
      </div>
    </div>
  )
}
