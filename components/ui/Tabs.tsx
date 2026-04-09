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
    return 'cursor-not-allowed text-content-muted opacity-70'
  }

  if (active) {
    return 'border-content-primary text-content-primary'
  }

  return 'border-transparent text-content-muted hover:text-content-primary'
}

export default function Tabs({
  items,
  activeKey,
  className,
  onChange,
}: TabsProps) {
  return (
    <div className={cn('border-b border-border', className)}>
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
