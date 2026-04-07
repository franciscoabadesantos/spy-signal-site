'use client'
import Link from 'next/link'

type StockSubnavSection = 'overview' | 'holdings-dividends' | 'signal-history' | 'methodology'

function subnavClass(active: boolean): string {
  if (active) return 'border-b-[3px] border-primary text-gray-900 font-bold px-1 py-3 text-[15px]'
  return 'border-b-[3px] border-transparent text-gray-500 hover:text-gray-900 font-medium px-1 py-3 text-[15px] transition-colors'
}

export default function StockSubnav({
  ticker,
  active,
}: {
  ticker: string
  active?: StockSubnavSection
}) {
  return (
    <div className="border-b border-border mt-4 overflow-x-auto">
      <nav className="flex items-center gap-6 whitespace-nowrap min-w-max px-1">
        <Link href={`/stocks/${ticker}`} className={subnavClass(active === 'overview')}>
          Overview
        </Link>
        <Link
          href={`/stocks/${ticker}/holdings-dividends`}
          className={subnavClass(active === 'holdings-dividends')}
        >
          Holdings & Dividends
        </Link>
        <Link
          href={`/stocks/${ticker}/signal-history`}
          className={subnavClass(active === 'signal-history')}
        >
          Signal History
        </Link>
        <Link
          href={`/stocks/${ticker}/methodology`}
          className={subnavClass(active === 'methodology')}
        >
          Methodology
        </Link>
      </nav>
    </div>
  )
}
