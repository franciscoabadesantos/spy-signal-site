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
    'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg',
    active
      ? 'border-primary/40 bg-primary/12 text-content-primary hover:bg-primary/16 active:bg-primary/20'
      : 'border-border bg-surface-card text-content-secondary hover:border-divider-strong hover:bg-surface-hover hover:text-content-primary active:bg-surface-elevated',
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
