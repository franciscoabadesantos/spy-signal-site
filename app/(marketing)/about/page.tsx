import type { Metadata } from 'next'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import AboutPage from '@/components/marketing/AboutPage'

export const metadata: Metadata = {
  title: 'About | Northline Signal',
  description: 'Learn about Northline Signal, a systematic market exposure signal built for clarity and discipline.',
}

export default function About() {
  return (
    <>
      <TrackEventOnMount eventName="view_about" />
      <AboutPage />
    </>
  )
}
