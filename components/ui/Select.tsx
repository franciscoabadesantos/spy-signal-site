import * as React from 'react'
import { cn } from '@/lib/utils'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border border-input bg-surface-card px-3 text-sm text-content-primary outline-none transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:border-primary/55 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-page-bg',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
