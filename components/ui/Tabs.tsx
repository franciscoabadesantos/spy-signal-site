import Link from 'next/link'
import { cn } from '@/lib/utils'

export type TabItem = {
  key: string
  label: string
  href?: string
  disabled?: boolean
}

type TabsProps = {
  items: TabItem[]
  activeKey: string
  className?: string
  onChange?: (key: string) => void
}

function tabClass(active: boolean, disabled: boolean): string {
  if (disabled) {
    return 'cursor-not-allowed text-neutral-400 dark:text-neutral-600'
  }

  if (active) {
    return 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
  }

  return 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
}

export default function Tabs({
  items,
  activeKey,
  className,
  onChange,
}: TabsProps) {
  return (
    <div className={cn('border-b border-neutral-200 dark:border-neutral-800', className)}>
      <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap">
        {items.map((item) => {
          const active = item.key === activeKey
          const sharedClass = cn(
            'inline-flex border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            tabClass(active, Boolean(item.disabled))
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
