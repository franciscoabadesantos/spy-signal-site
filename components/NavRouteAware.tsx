'use client'

import { usePathname } from 'next/navigation'
import { appNavSectionFromPath } from '@/components/app-nav'
import Nav from '@/components/Nav'

// Full-screen routes render their own chrome instead of the standard app top
// bar (the market atlas floats the compact marketing pill over the map).
const FULLSCREEN_ROUTES = new Set<string>(['/markets/network'])

export default function NavRouteAware() {
  const pathname = usePathname()
  if (pathname && FULLSCREEN_ROUTES.has(pathname)) return null
  return <Nav active={appNavSectionFromPath(pathname)} />
}
