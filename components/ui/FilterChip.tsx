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
      ? 'border-primary/40 bg-primary/12 text-content-primary'
      : 'border-border bg-surface-card text-content-secondary hover:bg-surface-hover hover:text-content-primary',
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
