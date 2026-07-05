import Link from 'next/link'
import { Lock } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type LockPanelProps = {
  title: string
  /** One line selling inspection depth — never secrets or predictions. */
  line: string
  ctaLabel: string
  ctaHref: string
  className?: string
}

/**
 * Premium lock: a glass panel floating over genuinely blurred real content.
 * Never place it over placeholder data — trust is the product.
 */
export default function LockPanel({ title, line, ctaLabel, ctaHref, className }: LockPanelProps) {
  return (
    <div
      className={cn(
        'material-glass mx-auto flex max-w-md flex-col items-center gap-3 rounded-[var(--radius-xl)] px-6 py-7 text-center',
        className
      )}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-accent-tint text-accent-text">
        <Lock className="size-4" aria-hidden="true" />
      </span>
      <div className="text-heading-sm text-content-primary">{title}</div>
      <p className="text-body-sm text-content-secondary">{line}</p>
      <Link href={ctaHref} className={buttonClass({ variant: 'primary', size: 'md' })}>
        {ctaLabel}
      </Link>
    </div>
  )
}
