import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'
import MarketingHomePage from '@/components/marketing/HomePage'

export default function Home() {
  return (
    <>
      <TrackEventOnMount eventName="view_homepage" />
      <MarketingHomePage />
    </>
  )
}
