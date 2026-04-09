import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800',
        className
      )}
    />
  )
}
