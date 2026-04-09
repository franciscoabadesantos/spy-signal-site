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
      <div className="text-[10px] uppercase tracking-[0.08em] text-content-muted">
        {label}
      </div>
      <div className="mt-2 text-[1.9rem] font-semibold leading-none text-content-primary">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-[12px] text-content-muted">
          {hint}
        </div>
      ) : null}
    </Card>
  )
}
