import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'

export function TableShell({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className={cn('overflow-auto', contentClassName)}>{children}</div>
    </Card>
  )
}

export function TableBase({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <table className={cn('w-full text-left text-sm', className)}>{children}</table>
}

export function TableHead({
  children,
  sticky = false,
}: {
  children: React.ReactNode
  sticky?: boolean
}) {
  return (
    <thead
      className={cn(
        'bg-neutral-50 text-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-400',
        sticky ? 'sticky top-0 z-10' : undefined
      )}
    >
      {children}
    </thead>
  )
}

export function TableHeaderCell({
  children,
  className,
  sortable = false,
  sortDirection,
}: {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sortDirection?: 'asc' | 'desc'
}) {
  const indicator = sortable ? (sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕') : null
  return (
    <th className={cn('px-4 py-3 text-[12px] font-medium uppercase tracking-wide', className)}>
      <span className="inline-flex items-center gap-1.5">
        <span>{children}</span>
        {indicator ? <span className="text-[10px] text-neutral-400">{indicator}</span> : null}
      </span>
    </th>
  )
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({
  children,
  striped = true,
  hover = true,
  index = 0,
  className,
}: {
  children: React.ReactNode
  striped?: boolean
  hover?: boolean
  index?: number
  className?: string
}) {
  return (
    <tr
      className={cn(
        'border-t border-neutral-200 dark:border-neutral-800',
        striped && index % 2 === 1 ? 'bg-neutral-50/70 dark:bg-neutral-900/40' : undefined,
        hover ? 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50' : undefined,
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableCell({
  children,
  className,
  muted = false,
}: {
  children: React.ReactNode
  className?: string
  muted?: boolean
}) {
  return (
    <td className={cn('px-4 py-3', muted ? 'text-neutral-500 dark:text-neutral-400' : undefined, className)}>
      {children}
    </td>
  )
}

export function TableEmptyRow({
  colSpan,
  title,
  description,
}: {
  colSpan: number
  title: string
  description?: string
}) {
  return (
    <tr className="border-t border-neutral-200 dark:border-neutral-800">
      <td className="px-4 py-10 text-center" colSpan={colSpan}>
        <div className="text-card-title text-neutral-900 dark:text-neutral-100">{title}</div>
        {description ? <div className="text-body mt-1">{description}</div> : null}
      </td>
    </tr>
  )
}
