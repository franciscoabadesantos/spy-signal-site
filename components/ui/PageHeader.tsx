import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  meta,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl">
        {meta ? <div className="text-caption uppercase tracking-[0.18em] text-content-muted">{meta}</div> : null}
        <h1 className="text-page-title text-content-primary">{title}</h1>
        {subtitle ? <p className="text-body mt-2">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
