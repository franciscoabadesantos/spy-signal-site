import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
  secondary:
    'border border-border bg-surface-card text-content-primary hover:bg-surface-hover active:bg-surface-elevated',
  ghost:
    'text-content-secondary hover:bg-surface-hover hover:text-content-primary active:bg-surface-elevated',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

type ButtonClassOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
}: ButtonClassOptions = {}): string {
  const smallPrimaryClass =
    variant === 'primary' && size === 'sm'
      ? 'dark:border dark:border-primary/35 dark:bg-primary/18 dark:text-accent-text dark:hover:bg-primary/24 dark:active:bg-primary/30'
      : ''
  return cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    smallPrimaryClass
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
