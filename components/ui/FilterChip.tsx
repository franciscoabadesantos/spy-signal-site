import Link from 'next/link'
import { cn } from '@/lib/utils'

type FilterChipProps = {
  label: string
  active?: boolean
  onClick?: () => void
  href?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function FilterChip({
  label,
  active = false,
  onClick,
  href,
  className,
  type = 'button',
}: FilterChipProps) {
  const sharedClass = cn(
    'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800',
    className
  )

  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {label}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={sharedClass}
    >
      {label}
    </button>
  )
}
