import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type InsightCardProps = {
  title?: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export default function InsightCard({
  title,
  description,
  className,
  children,
}: InsightCardProps) {
  return (
    <Card className={cn('section-gap', className)}>
      {title ? <h3 className="text-card-title text-content-primary">{title}</h3> : null}
      {description ? <p className="text-body">{description}</p> : null}
      {children}
    </Card>
  )
}
