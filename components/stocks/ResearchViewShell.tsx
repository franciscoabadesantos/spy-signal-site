import Link from 'next/link'
import type { ReactNode } from 'react'
import ResearchPerspectiveControl from '@/components/stocks/ResearchPerspectiveControl'
import type { InvestmentLensKey } from '@/lib/investment-lens'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

export default function ResearchViewShell({
  data,
  lens,
  title,
  children,
}: {
  data: StockResearchData
  lens: InvestmentLensKey
  title: string
  children: ReactNode
}) {
  return (
    <div className={styles.page} data-research-view="" data-lens={lens}>
      <header className={styles.header}>
        <div>
          <nav className={styles.breadcrumb} aria-label="Research breadcrumb">
            <Link href={`/stocks/${data.ticker}?lens=${lens}`}>{data.ticker}</Link>
            <span aria-hidden="true">/</span>
            <span>Research</span>
          </nav>
          <div className={styles.headingRow}>
            <h1>{title}</h1>
            <span className={styles.assetContext}>{data.name} · {data.kind === 'fund' ? 'Fund' : 'Equity'}</span>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.coverage}>{data.coverageLabel}</span>
          <ResearchPerspectiveControl lens={lens} />
        </div>
      </header>
      {children}
    </div>
  )
}

export function ResearchAdPlacement() {
  if (process.env.NODE_ENV === 'production') return null
  return (
    <aside className={styles.adPlacement} aria-label="Advertisement placement preview">
      Advertisement placement
      <span>Preview · zero runtime space without a campaign</span>
    </aside>
  )
}
