'use client'

import { usePathname } from 'next/navigation'
import Nav, { type NavSection } from '@/components/Nav'

function sectionFromPath(pathname: string): NavSection {
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/screener')) return 'screener'
  if (pathname.startsWith('/models')) return 'models'
  if (pathname.startsWith('/analyst')) return 'analyst'
  if (pathname.startsWith('/methodology')) return 'methodology'
  if (
    pathname === '/performance' ||
    (pathname.startsWith('/stocks/') && pathname.endsWith('/performance'))
  ) {
    return 'performance'
  }
  return 'stocks'
}

export default function NavRouteAware() {
  const pathname = usePathname()
  return <Nav active={sectionFromPath(pathname)} />
}
