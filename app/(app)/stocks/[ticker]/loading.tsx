import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function StockTickerLoading() {
  return (
    <div className="section-gap">
      <Card className="section-gap" padding="lg">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </Card>
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  )
}
