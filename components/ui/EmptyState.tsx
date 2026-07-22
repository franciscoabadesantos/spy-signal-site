import Card from '@/components/ui/Card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  headingLevel?: 'h1' | 'h2' | 'h3'
}

export default function EmptyState({
  title,
  description,
  action,
  className,
  headingLevel = 'h3',
}: EmptyStateProps) {
  const Heading = headingLevel

  return (
    <Card className={className}>
      <div className="flex flex-col items-center text-center">
        <Heading className="text-section-title text-content-primary">{title}</Heading>
        {description ? <p className="text-body mt-2 max-w-[60ch]">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </Card>
  )
}
