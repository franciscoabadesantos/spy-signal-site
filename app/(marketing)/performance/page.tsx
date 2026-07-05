import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PerformancePage from '@/components/marketing/PerformancePage'
import { modelSignalsEnabled } from '@/lib/flags'

export const metadata: Metadata = {
  title: 'Performance | Longbrunch',
  description: 'Model performance, once public models ship.',
}

// Placeholder-signal territory: hidden until real model output exists (Plan 01).
export default function Performance() {
  if (!modelSignalsEnabled()) notFound()
  return <PerformancePage />
}
