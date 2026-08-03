import { formatMoney, formatSignedMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import LoadingPulse from '@/components/ui/LoadingPulse'
import styles from './StockTickerIdentity.module.css'

export type StockIdentityTone = 'bullish' | 'neutral' | 'bearish' | 'brand'

type StockIdentitySignal = {
  direction: 'bullish' | 'neutral' | 'bearish'
  signalDate: string | null
}

type StockTickerIdentityProps = {
  ticker: string
  displayName: string
  assetBadgeLabel: string | null
  currency: string
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  tone: StockIdentityTone
  signal?: StockIdentitySignal | null
  nameAsHeading?: boolean
  loading?: boolean
}

function formatCompactPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatSignalDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function signalLabel(direction: StockIdentitySignal['direction']): string {
  if (direction === 'bullish') return 'Bullish regime'
  if (direction === 'bearish') return 'Bearish regime'
  return 'Neutral regime'
}

function deltaClass(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return styles.deltaNeutral
  if (value > 0) return styles.deltaPositive
  if (value < 0) return styles.deltaNegative
  return styles.deltaNeutral
}

export default function StockTickerIdentity({
  ticker,
  displayName,
  assetBadgeLabel,
  currency,
  price,
  dailyMoveAmount,
  dailyMovePercent,
  tone,
  signal,
  nameAsHeading = false,
  loading = false,
}: StockTickerIdentityProps) {
  const name = nameAsHeading
    ? <h1 className={styles.name}>{displayName}</h1>
    : <p className={styles.name}>{displayName}</p>

  return (
    <div className={styles.identity}>
      <span className={styles.nodeRail} data-selected-ticker-node="" data-tone={tone} aria-hidden="true">
        <span className={styles.node} data-selected-ticker-anchor="" />
      </span>
      <div className={styles.content}>
        <div className={styles.nameRow} data-ticker-identity="">
          {name}
          {!loading ? <span className={styles.tickerBadge}>{ticker}</span> : null}
          {!loading && assetBadgeLabel ? <span className={styles.assetBadge}>{assetBadgeLabel}</span> : null}
        </div>

        <div className={styles.quoteRow} data-ticker-price="">
          {loading ? (
            <LoadingPulse label={`Loading ${ticker} quote`} size="compact" />
          ) : (
            <>
              <strong className={styles.price}>{formatMoney(price, currency)}</strong>
              <span className={cn(styles.delta, deltaClass(dailyMoveAmount))}>
                {formatSignedMoney(dailyMoveAmount, currency)} ({formatCompactPercent(dailyMovePercent)})
              </span>
            </>
          )}
        </div>

        {signal ? (
          <div className={styles.signalRow}>
            <span className={styles.regimeBadge} data-tone={signal.direction}>{signalLabel(signal.direction)}</span>
            {signal.signalDate ? <span className={styles.signalDateBadge}>Signal: {formatSignalDate(signal.signalDate)}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
