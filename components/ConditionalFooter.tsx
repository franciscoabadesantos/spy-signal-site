'use client'

import { usePathname } from 'next/navigation'

// Hides the marketing footer on full-screen dashboard routes (the market atlas),
// while rendering it everywhere else. The footer itself stays a server component:
// it is passed as children and only conditionally rendered here.
const FULLSCREEN_ROUTES = new Set<string>(['/markets/network'])

export default function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname && FULLSCREEN_ROUTES.has(pathname)) return null
  return <>{children}</>
}
