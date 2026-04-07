import Link from 'next/link'

type StockSubnavSection = 'overview' | 'holdings-dividends' | 'signal-history' | 'methodology'

function subnavClass(active: boolean): string {
  if (active) return 'border-b-[3px] border-primary text-gray-900 font-semibold px-4 py-3 text-[15px]'
  return 'border-b-[3px] border-transparent text-gray-600 hover:text-gray-900 font-medium px-4 py-3 text-[15px]'
}

export default function StockSubnav({
  ticker,
  active,
}: {
  ticker: string
  active?: StockSubnavSection
}) {
  return (
    <div className="border-b border-gray-300 mt-6 overflow-x-auto">
      <nav className="flex items-center whitespace-nowrap min-w-max">
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
