import * as React from 'react'
import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'state-interactive h-11 w-full rounded-[var(--radius-md)] border border-input bg-surface-card px-4 text-body-sm text-content-primary outline-none placeholder:text-content-muted focus-visible:border-primary/55 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-page-bg',
        className
      )}
      {...props}
    />
  )
}
