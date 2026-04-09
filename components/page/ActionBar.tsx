import { cn } from '@/lib/utils'

type ActionBarProps = {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'between' | 'end'
}

function alignClass(align: ActionBarProps['align']): string {
  if (align === 'start') return 'justify-start'
  if (align === 'end') return 'justify-end'
  return 'justify-between'
}

export default function ActionBar({
  children,
  className,
  align = 'between',
}: ActionBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', alignClass(align), className)}>
      {children}
    </div>
  )
}
