import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'

type StatProps = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
}

export default function Stat({ label, value, hint, className }: StatProps) {
  return (
    <Card className={cn('p-5 md:p-6', className)}>
      <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-[1.9rem] font-semibold leading-none text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
          {hint}
        </div>
      ) : null}
    </Card>
  )
}
