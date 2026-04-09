import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-section-title text-neutral-900 dark:text-neutral-100">{title}</h2>
        {description ? <p className="text-body mt-1">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
