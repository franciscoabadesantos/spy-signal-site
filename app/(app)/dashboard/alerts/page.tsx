import Card from '@/components/ui/Card'

export default function DashboardAlertsPage() {
  return (
    <Card>
      <h1 className="text-section-title text-content-primary">Alerts</h1>
      <p className="text-body mt-2">Alert management UI is not yet exposed in this section.</p>
      <p className="text-body mt-1">Signal flip alert dispatch is currently handled by cron and watchlist subscriptions.</p>
    </Card>
  )
}
