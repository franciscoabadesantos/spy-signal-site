import LoadingPulse from '@/components/ui/LoadingPulse'
import styles from './StockTickerIdentity.module.css'

type StockTickerIdentityProps = {
  ticker: string
  displayName: string
  orientation: string | null
  identityColor: string
  nameAsHeading?: boolean
  loading?: boolean
}

export default function StockTickerIdentity({
  ticker,
  displayName,
  orientation,
  identityColor,
  nameAsHeading = false,
  loading = false,
}: StockTickerIdentityProps) {
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
        </div>

        <div className={styles.orientation}>
          {loading ? (
            <LoadingPulse label={`Loading ${ticker}`} size="compact" />
          ) : orientation}
        </div>
      </div>
    </div>
  )
}
