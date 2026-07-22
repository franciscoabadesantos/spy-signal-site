import NavRouteAware from '@/components/NavRouteAware'
import { sharedHeaderOffsetClass } from '@/components/marketing/site-chrome'

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      data-app-theme="light"
      data-theme="light"
      className="app-shell relative min-h-screen text-foreground"
      style={{ overflowX: 'clip' }}
    >
      <div
        aria-hidden="true"
        className="app-shell__atmosphere pointer-events-none absolute inset-0"
      />
      <NavRouteAware />
      <main className={`relative z-10 ${sharedHeaderOffsetClass} pb-8 section-gap`}>{children}</main>
    </div>
  )
}
