'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { buttonClass } from '@/components/ui/Button'

export default function NavAuthControls() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return (
      <>
        <Link
          href="/sign-in"
          className={`${buttonClass({ variant: 'ghost', size: 'sm' })} hidden sm:inline-flex`}
        >
          Log In
        </Link>
        <Link
          href="/sign-up"
          className={buttonClass({ variant: 'primary', size: 'sm' })}
        >
          Sign Up
        </Link>
      </>
    )
  }

  return (
    <>
      <Link
        href="/dashboard"
        className={`${buttonClass({ variant: 'ghost', size: 'sm' })} hidden sm:inline-flex`}
      >
        Dashboard
      </Link>
      <UserButton />
    </>
  )
}
