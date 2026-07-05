'use client'

import { usePathname } from 'next/navigation'
import StockTabs from '@/components/page/StockTabs'
import type { StockTabKey } from '@/components/stocks/stock-nav-config'

function activeTabFromPath(pathname: string): StockTabKey {
  if (pathname.endsWith('/signal-history')) return 'signal-history'
  if (pathname.endsWith('/holdings-dividends')) return 'holdings-dividends'
  if (pathname.includes('/financials/')) return 'financials'
  if (pathname.endsWith('/performance')) return 'performance'
  return 'overview'
}

export default function StockTabsAuto({
  ticker,
  includeHoldings,
}: {
  ticker: string
  includeHoldings?: boolean
}) {
  const pathname = usePathname()
  return <StockTabs ticker={ticker} active={activeTabFromPath(pathname)} includeHoldings={includeHoldings} />
}
