import Link from 'next/link'
import { buttonClass } from '@/components/ui/Button'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="container-md section-gap">
      <div className="surface-tertiary flex flex-wrap items-center gap-2 p-2.5">
        <Link href="/dashboard" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
          Overview
        </Link>
        <Link href="/dashboard/watchlist" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
          Watchlist
        </Link>
        <Link href="/dashboard/research" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
          Research
        </Link>
        <Link href="/dashboard/alerts" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
          Alerts
        </Link>
      </div>
      {children}
    </div>
  )
}
