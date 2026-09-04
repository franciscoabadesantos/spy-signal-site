import { formatMoney, formatSignedMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import LoadingPulse from '@/components/ui/LoadingPulse'
import styles from './StockTickerIdentity.module.css'

type StockTickerIdentityProps = {
  ticker: string
  displayName: string
  assetBadgeLabel: string | null
  currency: string
  exchange: string | null
  price: number | null
  dailyMoveAmount: number | null
  dailyMovePercent: number | null
  identityColor: string
  nameAsHeading?: boolean
  loading?: boolean
}

function formatCompactPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

function deltaClass(value: number): string {
  if (value > 0) return styles.deltaPositive
  if (value < 0) return styles.deltaNegative
  return styles.deltaNeutral
}

export default function StockTickerIdentity({
  ticker,
  displayName,
  assetBadgeLabel,
  currency,
  exchange,
  price,
  dailyMoveAmount,
  dailyMovePercent,
  identityColor,
  nameAsHeading = false,
  loading = false,
}: StockTickerIdentityProps) {
  const hasDailyMove = isFiniteNumber(dailyMoveAmount) && isFiniteNumber(dailyMovePercent)
  const listing = exchange === null ? currency : `${exchange} · ${currency}`
  const name = nameAsHeading
    ? <h1 className={styles.name}>{displayName}</h1>
    : <p className={styles.name}>{displayName}</p>

  return (
    <div className={styles.identity}>
      <span
        className={styles.nodeRail}
        data-selected-ticker-node=""
        style={{ ['--selected-node-tone' as never]: identityColor }}
        aria-hidden="true"
      >
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
              {isFiniteNumber(price) ? <strong className={styles.price}>{formatMoney(price, currency)}</strong> : null}
              {hasDailyMove ? (
                <span className={cn(styles.delta, deltaClass(dailyMoveAmount))}>
                  {formatSignedMoney(dailyMoveAmount, currency)} ({formatCompactPercent(dailyMovePercent)})
                </span>
              ) : null}
              {/* Local currency intentionally has no USD equivalent; see docs/api/requested-endpoints.md#req-002. */}
              <span className={styles.listing}>{listing}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
