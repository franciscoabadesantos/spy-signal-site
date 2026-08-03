'use client'

import { usePathname } from 'next/navigation'
import ResearchViewShell from '@/components/stocks/ResearchViewShell'
import {
  stockResearchKeyFromPath,
  stockResearchPrimaryItems,
} from '@/components/stocks/stock-nav-config'
import LoadingPulse from '@/components/ui/LoadingPulse'
import styles from './TickerResearchLoading.module.css'

function destination(pathname: string) {
  const activeKey = stockResearchKeyFromPath(pathname)
  const item = stockResearchPrimaryItems.find((candidate) => candidate.key === activeKey)
  return {
    key: activeKey,
    label: item?.loadingTitle ?? item?.label ?? 'Research',
  }
}

export default function TickerResearchLoading() {
  const pathname = usePathname()
  const { key, label } = destination(pathname)

  const indicator = (
    <section className={styles.root} data-ticker-research-loading="">
      <LoadingPulse label={`Loading ${label || 'Overview'}`} />
    </section>
  )

  if (key === 'overview') return indicator

  return (
    <ResearchViewShell title={label} busy>
      {indicator}
    </ResearchViewShell>
  )
}
