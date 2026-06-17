import type { Metadata } from 'next'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import PricingPage from '@/components/marketing/PricingPage'

export const metadata: Metadata = {
  title: 'Pricing | Longbrunch',
  description: 'Pricing for access to the Longbrunch signal workspace, markets coverage, research, watchlists, and alerts.',
}

export default function Pricing() {
  return (
    <>
      <TrackEventOnMount eventName="view_pricing" />
      <PricingPage />
    </>
  )
}
