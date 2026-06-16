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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(111,121,255,0.16),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(255,139,43,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-8%] top-[12rem] h-72 w-72 rounded-full border border-white/8 bg-white/[0.03] blur-[2px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6%] top-[20rem] h-80 w-80 rounded-full border border-[#ff8b2b]/20 bg-[#ff8b2b]/[0.04] blur-[2px]"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 420 220"
        className="pointer-events-none absolute right-[4%] top-[6.5rem] hidden h-[11rem] w-[21rem] opacity-55 lg:block"
      >
        <path
          d="M18 32 C82 36 132 18 202 42 C266 64 310 58 392 20"
          fill="none"
          stroke="rgba(111,121,255,0.72)"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M248 126 C286 112 332 110 396 148"
          fill="none"
          stroke="rgba(255,139,43,0.68)"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </svg>
      <NavRouteAware />
      <main className={`relative z-10 ${sharedHeaderOffsetClass} pb-8 section-gap`}>{children}</main>
    </div>
  )
}
