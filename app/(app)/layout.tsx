import NavRouteAware from '@/components/NavRouteAware'
import { sharedHeaderOffsetClass } from '@/components/marketing/site-chrome'

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      className="relative min-h-screen bg-background text-foreground"
      style={{ overflowX: 'clip' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_40%_at_50%_-10%,rgba(96,165,250,0.06),transparent),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]"
      />
      <NavRouteAware />
      <main className={`relative z-10 ${sharedHeaderOffsetClass} pb-8 section-gap`}>{children}</main>
    </div>
  )
}
