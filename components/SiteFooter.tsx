import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[var(--nl-border)] bg-[var(--nl-bg)] text-[var(--nl-muted)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-8 md:px-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase text-[var(--nl-text)]">
              <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-[var(--nl-green)]">
                <span className="size-2.5 rounded-full bg-[var(--nl-green)]" />
              </span>
              Northline Signal
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6">
              A systematic market exposure signal for the S&P 500.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-9 gap-y-3 text-sm">
            <Link href="/#problem" className="transition hover:text-[var(--nl-text)]">How it works</Link>
            <Link href="/#evidence" className="transition hover:text-[var(--nl-text)]">Performance</Link>
            <Link href="/methodology" className="transition hover:text-[var(--nl-text)]">Methodology</Link>
            <Link href="/#access" className="transition hover:text-[var(--nl-text)]">Pricing</Link>
            <Link href="/#system" className="transition hover:text-[var(--nl-text)]">About</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-4 border-t border-[var(--nl-border)] pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <div className="flex gap-7">
            <Link href="/privacy" className="transition hover:text-[var(--nl-text)]">Privacy</Link>
            <Link href="/terms" className="transition hover:text-[var(--nl-text)]">Terms</Link>
            <Link href="/contact" className="transition hover:text-[var(--nl-text)]">Contact</Link>
          </div>
          <span>© {year} Northline Signal. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
