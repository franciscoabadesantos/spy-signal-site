import Link from 'next/link'
import { buttonClass } from '@/components/ui/Button'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="container-md section-gap">
      <div className="sticky top-[5.8rem] z-20 rounded-[26px] border border-slate-950/8 bg-white/82 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_16px_40px_rgba(20,33,51,0.06)] backdrop-blur-[26px] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="flex flex-wrap items-center gap-2">
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
      </div>
      {children}
    </div>
  )
}
