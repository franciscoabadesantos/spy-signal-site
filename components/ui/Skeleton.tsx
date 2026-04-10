import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-lg)] border border-border/60 bg-surface-elevated',
        className
      )}
    />
  )
}
