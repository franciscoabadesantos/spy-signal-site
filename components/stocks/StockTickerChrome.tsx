'use client'

import { Suspense, use, useMemo } from 'react'
import StockResearchNav from '@/components/stocks/StockResearchNav'
import StockTickerIdentity from '@/components/stocks/StockTickerIdentity'
import TickerRelationshipField, { TickerRelationshipFieldFallback } from '@/components/stocks/TickerRelationshipField'
import WatchlistButton from '@/components/WatchlistButton'
import LoadingPulse from '@/components/ui/LoadingPulse'
import { assetMetadata } from '@/lib/asset-metadata'
import { formatMoney, formatSignedMoney } from '@/lib/currency'
import type { StockTickerChromeData } from '@/lib/stock-ticker-chrome'
import { tickerIdentityColor } from '@/lib/ticker-identity-color'
import { cn } from '@/lib/utils'
import styles from './StockTickerChrome.module.css'

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

function formatCompactPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function deltaClass(value: number): string {
  if (value > 0) return styles.deltaPositive
  if (value < 0) return styles.deltaNegative
  return styles.deltaNeutral
}

export function StockTickerChromeFallback({
  ticker,
  isOverview,
}: {
  ticker: string
  isOverview: boolean
}) {
  const identityColor = tickerIdentityColor(ticker)

  return (
    <section className={styles.chrome} data-ticker-hero="" data-ticker-chrome="loading" aria-label={`${ticker} research`}>
      <TickerRelationshipFieldFallback accentColor={identityColor} />
      <div className={styles.content}>
        <div className={styles.identityRow}>
          <StockTickerIdentity
            ticker={ticker}
            displayName={ticker}
            metadata={null}
            identityColor={identityColor}
            nameAsHeading={isOverview}
            loading
          />
          <div className={styles.controlRail}>
            <LoadingPulse label={`Loading ${ticker} quote`} size="compact" />
          </div>
        </div>
        <div className={styles.navigation} data-ticker-navigation=""><StockResearchNav ticker={ticker} /></div>
      </div>
    </section>
  )
}

export default function StockTickerChrome({
  data,
  isOverview,
}: {
  data: Promise<StockTickerChromeData>
  isOverview: boolean
}) {
  const resolved = use(data)
  const relationships = useMemo(() => Promise.resolve(resolved.relationships), [resolved.relationships])

  return (
    <section className={styles.chrome} data-ticker-hero="" data-ticker-chrome="ready" aria-label={`${resolved.ticker} research`}>
      <Suspense fallback={<TickerRelationshipFieldFallback accentColor={resolved.identityColor} />}>
        <TickerRelationshipField ticker={resolved.ticker} accentColor={resolved.identityColor} relationships={relationships} />
      </Suspense>
      <div className={styles.content}>
        <div className={styles.identityRow}>
          <StockTickerIdentity
            ticker={resolved.ticker}
            displayName={resolved.displayName}
            metadata={assetMetadata(resolved.assetBadgeLabel, resolved.exchange, resolved.currency)}
            identityColor={resolved.identityColor}
            nameAsHeading={isOverview}
          />
          <div className={styles.controlRail}>
            {isFiniteNumber(resolved.price) ? (
              <div className={styles.quote}>
                <strong className={styles.price}>{formatMoney(resolved.price, resolved.currency)}</strong>
                {isFiniteNumber(resolved.dailyMoveAmount) && isFiniteNumber(resolved.dailyMovePercent) ? (
                  <span className={cn(styles.delta, deltaClass(resolved.dailyMoveAmount))}>
                    {formatSignedMoney(resolved.dailyMoveAmount, resolved.currency)} ({formatCompactPercent(resolved.dailyMovePercent)})
                  </span>
                ) : null}
              </div>
            ) : null}
            <WatchlistButton
              ticker={resolved.ticker}
              initialInWatchlist={resolved.watchlist.initialInWatchlist}
              signedIn={resolved.watchlist.signedIn}
            />
          </div>
        </div>
        <div className={styles.navigation} data-ticker-navigation=""><StockResearchNav ticker={resolved.ticker} /></div>
      </div>
    </section>
  )
}
