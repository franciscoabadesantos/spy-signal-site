import type { Metadata } from 'next'
import PerformancePage from '@/components/marketing/PerformancePage'

export const metadata: Metadata = {
  title: 'Performance | Northline Signal',
  description: 'Northline Signal live performance, key metrics, and behavior across market cycles.',
}

export default function Performance() {
  return <PerformancePage />
}
