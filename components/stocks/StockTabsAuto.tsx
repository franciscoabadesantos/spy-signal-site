'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import StockTabs from '@/components/page/StockTabs'
import type { StockTabKey } from '@/components/stocks/stock-nav-config'
import { parseInvestmentLens } from '@/lib/investment-lens'

function activeTabFromPath(pathname: string): StockTabKey {
  if (pathname.includes('/relationships')) return 'relationships'
  if (/^\/stocks\/[^/]+\/.+/.test(pathname)) return 'research'
  return 'overview'
}

export default function StockTabsAuto({ ticker }: { ticker: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = activeTabFromPath(pathname)
  if (active === 'overview') return null
  return <StockTabs ticker={ticker} active={active} lens={parseInvestmentLens(searchParams.get('lens'))} />
}
