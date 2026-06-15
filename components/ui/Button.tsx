import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-[#0757ff]/20 bg-[#0757ff] text-white shadow-[0_18px_42px_rgba(7,87,255,0.18)] hover:border-[#1a66ff]/28 hover:bg-[#1a66ff] dark:border-[#f5df57]/45 dark:bg-[linear-gradient(180deg,rgba(245,223,87,0.22),rgba(245,223,87,0.12))] dark:text-[#fff8cc] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_42px_rgba(245,223,87,0.08)] dark:hover:border-[#ffe97d]/58 dark:hover:bg-[linear-gradient(180deg,rgba(245,223,87,0.28),rgba(245,223,87,0.16))] dark:hover:text-white',
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
