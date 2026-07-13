import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-black/5 bg-brand-spark text-[#04201d] shadow-[0_16px_38px_rgba(13,148,136,0.24)] hover:brightness-[1.08] dark:border-white/10 dark:text-[#04201d] dark:shadow-[0_16px_38px_rgba(25,201,182,0.22)]',
  secondary:
    'border border-slate-950/10 bg-white/78 text-content-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_32px_rgba(20,33,51,0.06)] backdrop-blur-xl hover:border-slate-950/16 hover:bg-white dark:border-white/12 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] dark:hover:border-white/18 dark:hover:bg-white/[0.1]',
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
