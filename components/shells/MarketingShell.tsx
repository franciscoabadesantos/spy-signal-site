import Nav, { type NavSection } from '@/components/Nav'
import { cn } from '@/lib/utils'

type MarketingShellProps = {
  active?: NavSection
  children: React.ReactNode
  rightRail?: React.ReactNode
  className?: string
}

export default function MarketingShell({
  active,
  children,
  rightRail,
  className,
}: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active={active} />
      <main className={cn('container-md py-8', className)}>
        {rightRail ? (
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_280px]">
            <div>{children}</div>
            <aside className="hidden xl:block">{rightRail}</aside>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </main>
    </div>
  )
}
