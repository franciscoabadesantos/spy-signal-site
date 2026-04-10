import NavRouteAware from '@/components/NavRouteAware'

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavRouteAware />
      <main className="py-8 section-gap">{children}</main>
    </div>
  )
}
