import * as React from 'react'
import { cn } from '@/lib/utils'

type IconButtonVariant = 'outline' | 'ghost'
type IconButtonSize = 'sm' | 'md'

const variantClasses: Record<IconButtonVariant, string> = {
  outline:
    'border border-border bg-surface-solid-raised text-content-secondary shadow-[var(--shadow-xs)] hover:border-divider-strong hover:text-content-primary',
  ghost:
    'border border-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary',
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
}

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Required: icon-only buttons must always announce themselves. */
  'aria-label': string
  variant?: IconButtonVariant
  size?: IconButtonSize
  active?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant = 'outline', size = 'md', active = false, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'state-interactive inline-flex shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg disabled:pointer-events-none disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        active && 'border-primary/40 text-accent-text',
        className
      )}
      {...props}
    />
  )
})

export default IconButton
