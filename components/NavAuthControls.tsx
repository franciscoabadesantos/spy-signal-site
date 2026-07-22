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
        className="inline-flex h-9 items-center justify-center rounded-full bg-brand-spark px-4 text-sm font-semibold text-brand-spark-on shadow-[0_12px_28px_var(--brand-cyan-glow)] transition duration-200 hover:brightness-[1.08]"
      >
        Start membership
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <HandScript className="hidden text-[1.35rem] leading-none text-brand-spark-soft xl:block">
        Live tape.
      </HandScript>
      <Link href="/dashboard" className={`${buttonClass({ variant: 'ghost', size: 'sm' })} hidden lg:inline-flex`}>
        Today
      </Link>
      <div className="rounded-full border border-border bg-surface-elevated p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl">
        <UserButton />
      </div>
    </div>
  )
}
