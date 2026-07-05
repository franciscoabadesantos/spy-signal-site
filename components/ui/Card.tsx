import * as React from 'react'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

function paddingClass(padding: CardProps['padding']): string {
  if (padding === 'none') return ''
  if (padding === 'sm') return 'p-4 md:p-5'
  if (padding === 'lg') return 'p-6 md:p-7'
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
        'material-surface relative overflow-hidden rounded-[var(--radius-xl)]',
        paddingClass(padding),
        className
      )}
      {...props}
    />
  )
}
