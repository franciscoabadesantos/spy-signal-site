'use client'

import { Suspense, use, useMemo } from 'react'
import StockResearchNav from '@/components/stocks/StockResearchNav'
import StockTickerIdentity from '@/components/stocks/StockTickerIdentity'
import TickerRelationshipField, { TickerRelationshipFieldFallback } from '@/components/stocks/TickerRelationshipField'
import WatchlistButton from '@/components/WatchlistButton'
import type { StockTickerChromeData } from '@/lib/stock-ticker-chrome'
import styles from './StockTickerChrome.module.css'

export function StockTickerChromeFallback({
  ticker,
  isOverview,
}: {
  ticker: string
  isOverview: boolean
}) {
  return (
    <section className={styles.chrome} data-ticker-hero="" data-ticker-chrome="loading" aria-label={`${ticker} research`}>
      <TickerRelationshipFieldFallback tone="brand" />
      <div className={styles.content}>
        <div className={styles.identityRow}>
          <StockTickerIdentity
            ticker={ticker}
            displayName={ticker}
            assetBadgeLabel={null}
            currency="USD"
            price={null}
            dailyMoveAmount={null}
            dailyMovePercent={null}
            tone="brand"
            nameAsHeading={isOverview}
            loading
          />
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
      <Suspense fallback={<TickerRelationshipFieldFallback tone={resolved.tone} />}>
        <TickerRelationshipField ticker={resolved.ticker} tone={resolved.tone} relationships={relationships} />
      </Suspense>
      <div className={styles.content}>
        <div className={styles.identityRow}>
          <StockTickerIdentity
            ticker={resolved.ticker}
            displayName={resolved.displayName}
            assetBadgeLabel={resolved.assetBadgeLabel}
            currency={resolved.currency}
            price={resolved.price}
            dailyMoveAmount={resolved.dailyMoveAmount}
            dailyMovePercent={resolved.dailyMovePercent}
            tone={resolved.tone}
            signal={isOverview ? resolved.signal : null}
            nameAsHeading={isOverview}
          />
          <div className={styles.controlRail}>
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
