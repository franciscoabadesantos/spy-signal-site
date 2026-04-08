'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'

export default function NavAuthControls() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return (
      <>
        <Link
          href="/sign-in"
          className="text-[14px] font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 hidden sm:block"
        >
          Log In
        </Link>
        <Link
          href="/sign-up"
          className="text-[14px] font-medium bg-[#1e293b] hover:bg-black text-white px-4 py-1.5 rounded transition-colors shadow-sm"
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
        className="text-[14px] font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 hidden sm:block"
      >
        Dashboard
      </Link>
      <UserButton />
    </>
  )
}
