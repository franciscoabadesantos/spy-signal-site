import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 inline-flex rounded-full border border-slate-950/8 bg-white/78 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_28px_rgba(20,33,51,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-content-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-content-primary">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-content-primary' : ''}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 text-content-muted" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
