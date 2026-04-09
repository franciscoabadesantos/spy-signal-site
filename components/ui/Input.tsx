import * as React from 'react'
import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-input bg-surface-card px-3 text-sm text-content-primary outline-none transition-colors placeholder:text-content-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
}
