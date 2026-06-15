import type { Metadata } from 'next'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import PricingPage from '@/components/marketing/PricingPage'

export const metadata: Metadata = {
  title: 'Pricing | Longbrunch',
  description: 'Simple pricing for full access to the Longbrunch weekly workflow.',
}

export default function Pricing() {
  return (
    <>
      <TrackEventOnMount eventName="view_pricing" />
      <PricingPage />
    </>
  )
}
