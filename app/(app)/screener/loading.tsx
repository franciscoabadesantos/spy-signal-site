import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function ScreenerLoading() {
  return (
    <div className="container-lg section-gap">
      <Card className="section-gap" padding="lg">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </Card>
      <Card className="section-gap" padding="lg">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="mt-4 h-[480px] w-full" />
      </Card>
    </div>
  )
}
