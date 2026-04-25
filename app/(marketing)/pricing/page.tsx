import type { Metadata } from 'next'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import PricingPage from '@/components/marketing/PricingPage'

export const metadata: Metadata = {
  title: 'Pricing | Northline Signal',
  description: 'Simple monthly pricing for full access to Northline Signal.',
}

export default function Pricing() {
  return (
    <>
      <TrackEventOnMount eventName="view_pricing" />
      <PricingPage />
    </>
  )
}
