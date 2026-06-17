import Link from 'next/link'
import { Caveat } from 'next/font/google'
import { BRAND_NAME, FOOTER_SECONDARY_LINKS, MARKETING_NAV_ITEMS } from '@/components/marketing/site-config'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
})

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-950/8 bg-white text-slate-600 dark:border-white/10 dark:bg-[#02050d] dark:text-white/72">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-10 md:px-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/" className="marketing-logo-type flex items-center gap-3 text-lg font-semibold text-slate-950 dark:text-white">
              <span>lb</span>
              <span className="text-[#ff8b2b]">/</span>
              <span>longbrunch</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-white/58">
              Market signals, research, watchlists, and alerts in one workspace.
            </p>
            <p className={`${caveat.className} mt-4 text-3xl leading-none text-[#7d8cff]`}>
              Open the workspace.
            </p>
          </div>
          <nav className="flex max-w-[34rem] flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-white/72">
            {MARKETING_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-950 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-950/8 pt-6 text-xs md:flex-row md:items-center md:justify-between dark:border-white/10">
          <div className="flex flex-wrap gap-7">
            {FOOTER_SECONDARY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-950 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <span>© {year} {BRAND_NAME}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
