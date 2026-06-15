import type { Metadata } from 'next'
import PerformancePage from '@/components/marketing/PerformancePage'

export const metadata: Metadata = {
  title: 'Performance | Longbrunch',
  description: 'Longbrunch performance, cycle behavior, and weekly execution framing.',
}

export default function Performance() {
  return <PerformancePage />
}
