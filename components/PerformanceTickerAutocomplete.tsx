'use client'

import TickerSearchCombobox from '@/components/search/TickerSearchCombobox'

type PerformanceTickerAutocompleteProps = {
  initialTicker: string
}

export default function PerformanceTickerAutocomplete({
  initialTicker,
}: PerformanceTickerAutocompleteProps) {
  return (
    <TickerSearchCombobox
      initialValue={initialTicker}
      label="Ticker"
      placeholder="Search tracked tickers (AAPL, MSFT, SPY...)"
      routeForTicker={(symbol) => `/stocks/${encodeURIComponent(symbol)}/performance`}
      submitLabel="Load"
      variant="panel"
    />
  )
}
