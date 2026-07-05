import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-primary/25 bg-primary text-primary-foreground shadow-[0_14px_36px_var(--accent-glow)] hover:bg-[var(--accent-600)] hover:border-primary/40',
  secondary:
    'border border-border bg-surface-solid-raised text-content-primary shadow-[var(--shadow-xs)] hover:border-divider-strong hover:bg-surface-hover',
  ghost:
    'border border-transparent text-content-secondary hover:bg-slate-950/[0.04] hover:text-content-primary dark:hover:bg-white/[0.06]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 py-2.5 text-label-sm',
  md: 'h-11 px-[18px] py-[12px] text-label-lg',
}

type ButtonClassOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
}: ButtonClassOptions = {}): string {
  return cn(
    'state-interactive inline-flex items-center justify-center rounded-full font-medium duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg disabled:pointer-events-none disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size]
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonClassOptions

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size }), className)}
      {...props}
    />
  )
}
