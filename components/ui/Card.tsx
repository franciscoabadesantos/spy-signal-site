import * as React from 'react'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'md' | 'lg' | 'none'
}

function paddingClass(padding: CardProps['padding']): string {
  if (padding === 'none') return ''
  if (padding === 'lg') return 'p-6'
  return 'p-5'
}

export default function Card({
  className,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'card-depth rounded-2xl border border-border bg-surface-card text-content-primary',
        paddingClass(padding),
        className
      )}
      {...props}
    />
  )
}
