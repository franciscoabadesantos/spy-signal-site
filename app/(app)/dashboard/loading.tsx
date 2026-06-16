import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="section-gap">
      <Card className="section-gap" padding="lg">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-5 w-72 max-w-full" />
      </Card>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  )
}
