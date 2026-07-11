import Link from 'next/link'
import { cn } from '@/lib/utils'

export type TabItem = {
  key: string
  label: string
  href?: string
  disabled?: boolean
}

type TabsVariant = 'pill' | 'underline'

type TabsProps = {
  items: TabItem[]
  activeKey: string
  className?: string
  variant?: TabsVariant
  onChange?: (key: string) => void
}

function pillClass(active: boolean, disabled: boolean): string {
  if (disabled) {
    return 'cursor-not-allowed text-content-muted opacity-70'
  }

  if (active) {
    return 'border-[var(--accent-200)] bg-[var(--accent-50)] text-[var(--accent-700)]'
  }

  return 'border-transparent bg-surface-elevated text-content-secondary hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]'
}

function underlineClass(active: boolean, disabled: boolean): string {
  if (disabled) {
    return 'border-transparent cursor-not-allowed text-content-muted opacity-70'
  }

  if (active) {
    return 'border-[var(--color-accent)] font-semibold text-[var(--color-accent)]'
  }

  return 'border-transparent text-content-secondary hover:text-content-primary'
}

export default function Tabs({
  items,
  activeKey,
  className,
  variant = 'pill',
  onChange,
}: TabsProps) {
  const isUnderline = variant === 'underline'

  return (
    <div className={cn(className)}>
      <nav
        className={cn(
          'flex items-center overflow-x-auto whitespace-nowrap',
          isUnderline ? 'gap-6 border-b border-[var(--color-border-light)]' : 'gap-2'
        )}
      >
        {items.map((item) => {
          const active = item.key === activeKey
          const sharedClass = cn(
            'state-interactive inline-flex items-center text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg',
            isUnderline
              ? cn('h-10 border-b-2 px-0.5 -mb-px', underlineClass(active, Boolean(item.disabled)))
              : cn('h-9 rounded-[var(--radius-pill)] border px-3', pillClass(active, Boolean(item.disabled)))
          )

          if (item.href && !item.disabled) {
            return (
              <Link key={item.key} href={item.href} className={sharedClass}>
                {item.label}
              </Link>
            )
          }

          return (
            <button
              key={item.key}
              type="button"
              className={sharedClass}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled || !onChange) return
                onChange(item.key)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
