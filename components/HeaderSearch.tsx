'use client'

import TickerSearchCombobox from '@/components/search/TickerSearchCombobox'

export default function HeaderSearch({
  className,
  placeholder = 'Search tracked tickers or company names...',
}: {
  className?: string
  placeholder?: string
}) {
  return (
    <TickerSearchCombobox
      className={className}
      placeholder={placeholder}
      routeForTicker={(symbol) => `/stocks/${encodeURIComponent(symbol)}`}
      variant="header"
    />
  )
}
