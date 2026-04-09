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
        'bg-surface-elevated text-content-muted',
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
        {indicator ? <span className="text-[10px] text-content-muted">{indicator}</span> : null}
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
        'border-t border-border',
        striped && index % 2 === 1 ? 'bg-surface-elevated' : undefined,
        hover ? 'hover:bg-surface-hover' : undefined,
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
    <td className={cn('px-4 py-3', muted ? 'text-content-muted' : undefined, className)}>
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
    <tr className="border-t border-border">
      <td className="px-4 py-10 text-center" colSpan={colSpan}>
        <div className="text-card-title text-content-primary">{title}</div>
        {description ? <div className="text-body mt-1">{description}</div> : null}
      </td>
    </tr>
  )
}
