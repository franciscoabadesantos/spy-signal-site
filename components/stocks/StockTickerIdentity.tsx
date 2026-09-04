import LoadingPulse from '@/components/ui/LoadingPulse'
import styles from './StockTickerIdentity.module.css'

type StockTickerIdentityProps = {
  ticker: string
  displayName: string
  metadata: string | null
  identityColor: string
  nameAsHeading?: boolean
  loading?: boolean
}

export default function StockTickerIdentity({
  ticker,
  displayName,
  metadata,
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
      <div className={styles.nameRow} data-ticker-identity="">
        {name}
        {loading ? (
          <LoadingPulse label={`Loading ${ticker}`} size="compact" />
        ) : (
          <>
            <span className={styles.tickerBadge}>{ticker}</span>
            {metadata ? <span className={styles.metadata}>{metadata}</span> : null}
          </>
        )}
      </div>
    </div>
  )
}
