import { cn } from '@/lib/utils'

type StatRowCardProps = {
  label: string
  value: React.ReactNode
  className?: string
  valueClassName?: string
}

export default function StatRowCard({
  label,
  value,
  className,
  valueClassName,
}: StatRowCardProps) {
  return (
    <div className={cn('emphasis-tertiary', className)}>
      <div className="text-filter-label">{label}</div>
      <div className={cn('text-data-sm numeric-tabular mt-1 text-content-primary', valueClassName)}>
        {value}
      </div>
    </div>
  )
}

