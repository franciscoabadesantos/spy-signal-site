import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'

type StatProps = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
}

export default function Stat({ label, value, hint, className }: StatProps) {
  return (
    <Card className={cn('surface-tertiary p-5 md:p-6', className)}>
      <div className="text-label-sm uppercase tracking-[0.08em] text-content-muted">
        {label}
      </div>
      <div className="text-data-lg numeric-tabular mt-2 text-content-primary">
        {value}
      </div>
      {hint ? (
        <div className="text-caption mt-2 text-content-muted">
          {hint}
        </div>
      ) : null}
    </Card>
  )
}
