import Link from 'next/link'
import { Caveat } from 'next/font/google'
import { ArrowUpRight } from 'lucide-react'
import { BRAND_NAME, CONTACT_EMAIL, FOOTER_SECONDARY_LINKS, MARKETING_NAV_ITEMS } from '@/components/marketing/site-config'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
})

export default function SiteFooter() {
  const year = new Date().getFullYear()
  const askHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('A question for the lounge')}`

  return (
    <footer className="mt-auto border-t border-slate-950/8 bg-white text-slate-600 dark:border-white/10 dark:bg-[#02050d] dark:text-white/72">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-5 py-12 md:px-10">
        <div className="flex flex-col gap-6 border-b border-slate-950/8 pb-10 dark:border-white/10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className={`${caveat.className} text-[1.7rem] leading-none text-[#7d8cff]`}>
              A small room. The same tape.
            </p>
            <h2 className="mt-3 max-w-md text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Pull up a chair in the lounge.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-[#03050b]"
            >
              Join the lounge
            </Link>
            <a
              href={askHref}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-950/12 bg-white/40 px-6 text-sm font-semibold text-slate-950 transition hover:border-[#0757ff]/30 hover:text-[#0757ff] dark:border-white/14 dark:bg-white/[0.04] dark:text-white dark:hover:text-[#f8f200]"
            >
              Ask us anything
              <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/" className="marketing-logo-type flex items-center gap-3 text-lg font-semibold text-slate-950 dark:text-white">
              <span>lb</span>
              <span className="text-[#ff8b2b]">/</span>
              <span>longbrunch</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-white/58">
              AI-driven weekly SPY signals built for one clear decision before the open.
            </p>
            <p className={`${caveat.className} mt-4 text-3xl leading-none text-[#7d8cff]`}>
              Signal before the open.
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
