import NavRouteAware from '@/components/NavRouteAware'

type MarketingLayoutProps = {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavRouteAware />
      <main className="container-md py-8">{children}</main>
    </div>
  )
}
