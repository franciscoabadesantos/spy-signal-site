'use client'

import TickerSearchCombobox from '@/components/search/TickerSearchCombobox'

export default function HeaderSearch({
  className,
  maxSuggestions,
  placeholder = 'Search tracked tickers or company names...',
}: {
  className?: string
  maxSuggestions?: number
  placeholder?: string
}) {
  return (
    <TickerSearchCombobox
      className={className}
      maxSuggestions={maxSuggestions}
      placeholder={placeholder}
      routeForTicker={(symbol) => `/stocks/${encodeURIComponent(symbol)}`}
      variant="header"
    />
  )
}
