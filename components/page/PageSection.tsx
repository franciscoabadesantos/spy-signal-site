import { cn } from '@/lib/utils'
import SectionHeader from '@/components/ui/SectionHeader'

type PageSectionProps = {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export default function PageSection({
  id,
  title,
  description,
  action,
  className,
  children,
}: PageSectionProps) {
  return (
    <section id={id} className={cn('section-gap', className)}>
      {title ? <SectionHeader title={title} description={description} action={action} /> : null}
      <div>{children}</div>
    </section>
  )
}
