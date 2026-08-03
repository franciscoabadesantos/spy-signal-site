import type { ReactNode } from 'react'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

export default function ResearchViewShell({
  data,
  coverageLabel,
  title,
  children,
  busy = false,
  showHeader = true,
}: {
  data?: Pick<StockResearchData, 'coverageLabel'>
  coverageLabel?: string
  title: string
  children: ReactNode
  busy?: boolean
  showHeader?: boolean
}) {
  const resolvedCoverageLabel = coverageLabel ?? data?.coverageLabel ?? 'Coverage pending'

  return (
    <div className={styles.page} data-research-view="" aria-busy={busy || undefined}>
      {showHeader ? (
        <header className={styles.header}>
          <h1>{title}</h1>
          {!busy ? (
            <div className={styles.headerMeta}>
              <span className={styles.coverage}>{resolvedCoverageLabel}</span>
            </div>
          ) : null}
        </header>
      ) : null}
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
