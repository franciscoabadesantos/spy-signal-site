import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'danger' | 'warning'

const variantClass: Record<BadgeVariant, string> = {
  neutral:
    'border-border bg-surface-elevated text-content-secondary',
  primary:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/80 dark:bg-blue-950/50 dark:text-blue-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-200',
  danger:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/50 dark:text-rose-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-200',
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

export default function Badge({
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        variantClass[variant],
        className
      )}
      {...props}
    />
  )
}
