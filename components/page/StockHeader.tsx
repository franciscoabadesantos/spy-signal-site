import Badge from '@/components/ui/Badge'

type StockSignalTone = 'bullish' | 'bearish' | 'neutral'

type StockHeaderProps = {
  companyName?: string | null
  ticker: string
  price?: number | null
  dailyMove?: {
    amount?: number | null
    percent?: number | null
  }
  signal?: {
    label: string
    tone: StockSignalTone
  }
  watchlistAction?: React.ReactNode
  primaryCta?: React.ReactNode
  subtitle?: React.ReactNode
}

function signalVariant(tone: StockSignalTone): 'success' | 'danger' | 'neutral' {
  if (tone === 'bullish') return 'success'
  if (tone === 'bearish') return 'danger'
  return 'neutral'
}

function dailyMoveClass(amount?: number | null): string {
  if (amount === null || amount === undefined) return 'text-neutral-500'
  if (amount > 0) return 'text-emerald-600'
  if (amount < 0) return 'text-rose-600'
  return 'text-neutral-600'
}

export default function StockHeader({
  companyName,
  ticker,
  price,
  dailyMove,
  signal,
  watchlistAction,
  primaryCta,
  subtitle,
}: StockHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-page-title tracking-tight text-neutral-900 dark:text-neutral-100">
            {ticker}
          </h1>
          {companyName ? (
            <span className="text-lg font-medium text-neutral-600 dark:text-neutral-300">{companyName}</span>
          ) : null}
          {signal ? (
            <Badge variant={signalVariant(signal.tone)}>{signal.label}</Badge>
          ) : null}
        </div>

        {price !== null && price !== undefined ? (
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="text-[40px] font-semibold leading-none text-neutral-900 dark:text-neutral-100">
              ${price.toFixed(2)}
            </span>
            {(dailyMove?.amount !== null && dailyMove?.amount !== undefined) ||
            (dailyMove?.percent !== null && dailyMove?.percent !== undefined) ? (
              <span className={`mb-1 text-lg font-semibold ${dailyMoveClass(dailyMove?.amount)}`}>
                {dailyMove?.amount !== null && dailyMove?.amount !== undefined
                  ? `${dailyMove.amount >= 0 ? '+' : ''}${dailyMove.amount.toFixed(2)}`
                  : '—'}
                {dailyMove?.percent !== null && dailyMove?.percent !== undefined
                  ? ` (${dailyMove.percent >= 0 ? '+' : ''}${dailyMove.percent.toFixed(2)}%)`
                  : ''}
              </span>
            ) : null}
          </div>
        ) : null}

        {subtitle ? <div className="text-body mt-2">{subtitle}</div> : null}
      </div>

      {(watchlistAction || primaryCta) ? (
        <div className="flex flex-wrap items-center gap-2">
          {watchlistAction}
          {primaryCta}
        </div>
      ) : null}
    </div>
  )
}
