import type { StockQuote } from '@/lib/finance'
import { formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'

function changeTone(changePercent: number): string {
  if (changePercent > 0) return 'text-signal-bullish'
  if (changePercent < 0) return 'text-signal-bearish'
  return 'text-signal-neutral'
}

function formatChange(changePercent: number): string {
  return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
}

function TickerRow({ quotes, ariaHidden }: { quotes: StockQuote[]; ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 pr-2.5" aria-hidden={ariaHidden}>
      {quotes.map((quote) => (
        <span
          key={`${ariaHidden ? 'dup-' : ''}${quote.ticker}`}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface-card px-3.5 py-1.5 text-label-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          <span className="tracking-wide text-content-primary">{quote.ticker}</span>
          <span className="numeric-tabular text-content-secondary">{formatMoney(quote.price, 'USD')}</span>
          <span className={cn('numeric-tabular', changeTone(quote.changePercent))}>
            {formatChange(quote.changePercent)}
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * Glass market ticker bar fed with real quotes (renders nothing without them —
 * no sample prices in production). The row is duplicated for a seamless
 * marquee; motion stops for prefers-reduced-motion users.
 */
export default function MarketTicker({ quotes }: { quotes: StockQuote[] }) {
  if (quotes.length === 0) return null

  return (
    <div className="material-glass overflow-hidden rounded-full py-2 pl-2.5">
      <div className="marketing-ticker-track flex w-max items-center motion-reduce:animate-none">
        <TickerRow quotes={quotes} />
        <TickerRow quotes={quotes} ariaHidden />
      </div>
    </div>
  )
}
