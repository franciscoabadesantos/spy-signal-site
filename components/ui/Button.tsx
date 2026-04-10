import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-primary text-primary-foreground hover:bg-[var(--accent-600)]',
  secondary:
    'border border-border bg-surface-card text-content-primary hover:border-primary/40 hover:bg-surface-hover',
  ghost:
    'border border-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary',
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
    'state-interactive inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg disabled:pointer-events-none disabled:cursor-not-allowed',
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
