'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import StockTickerChrome, { StockTickerChromeFallback } from '@/components/stocks/StockTickerChrome'
import type { StockTickerChromeData } from '@/lib/stock-ticker-chrome'

function isOverviewPath(pathname: string): boolean {
  return /^\/stocks\/[^/]+\/?$/.test(pathname)
}

export default function StockTabsAuto({
  chromeData,
}: {
  chromeData: Promise<StockTickerChromeData>
}) {
  const pathname = usePathname()
  const ticker = decodeURIComponent(pathname.split('/').filter(Boolean)[1] ?? '').toUpperCase()
  const isOverview = isOverviewPath(pathname)

  return (
    <Suspense fallback={<StockTickerChromeFallback ticker={ticker} isOverview={isOverview} />}>
      <StockTickerChrome data={chromeData} isOverview={isOverview} />
    </Suspense>
  )
}
