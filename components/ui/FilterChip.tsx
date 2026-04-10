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
    'state-interactive inline-flex h-9 items-center rounded-[var(--radius-pill)] border px-3 text-label-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg',
    active
      ? 'border-[var(--accent-200)] bg-[var(--accent-50)] text-[var(--accent-700)]'
      : 'border-border bg-surface-elevated text-content-secondary hover:border-divider-strong hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]',
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
