import Nav, { type NavSection } from '@/components/Nav'
import { cn } from '@/lib/utils'

type AppShellProps = {
  active?: NavSection
  controls?: React.ReactNode
  children: React.ReactNode
  className?: string
  container?: 'md' | 'lg'
}

function containerClass(container: AppShellProps['container']): string {
  return container === 'md' ? 'container-md' : 'container-lg'
}

export default function AppShell({
  active,
  controls,
  children,
  className,
  container = 'lg',
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active={active} />
      <main className={cn(containerClass(container), 'py-8 section-gap', className)}>
        {controls ? <div>{controls}</div> : null}
        <div>{children}</div>
      </main>
    </div>
  )
}
