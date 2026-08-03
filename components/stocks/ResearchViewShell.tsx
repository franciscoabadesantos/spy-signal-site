import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

export default function ResearchViewShell({
  data,
  title,
  children,
}: {
  data: StockResearchData
  title: string
  children: ReactNode
}) {
  return (
    <div className={styles.page} data-research-view="">
      <header className={styles.header}>
        <div>
          <nav className={styles.breadcrumb} aria-label="Research breadcrumb">
            <Link href={`/stocks/${data.ticker}`}>{data.ticker}</Link>
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
