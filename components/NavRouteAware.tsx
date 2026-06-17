'use client'

import { usePathname } from 'next/navigation'
import { appNavSectionFromPath } from '@/components/app-nav'
import Nav from '@/components/Nav'

export default function NavRouteAware() {
  const pathname = usePathname()
  return <Nav active={appNavSectionFromPath(pathname)} />
}
