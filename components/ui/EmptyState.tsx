import Card from '@/components/ui/Card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col items-center text-center">
        <h3 className="text-section-title text-neutral-900 dark:text-neutral-100">{title}</h3>
        {description ? <p className="text-body mt-2 max-w-[60ch]">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </Card>
  )
}
