import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-surface-elevated text-content-secondary">
      <div className="container-lg py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-3 text-[16px] font-semibold text-content-primary">SpySignal</div>
            <p className="max-w-sm text-[13px] leading-6 text-content-muted">
              Quantitative research platform for signal monitoring, market screening, and model-state
              tracking across actively covered assets.
            </p>
          </div>

          <div>
            <div className="mb-3 text-[13px] uppercase tracking-wide text-content-muted">Platform</div>
            <div className="space-y-2 text-[14px]">
              <Link href="/screener" className="block transition-colors hover:text-content-primary">
                Screener
              </Link>
              <Link href="/performance" className="block transition-colors hover:text-content-primary">
                Performance
              </Link>
              <Link href="/methodology" className="block transition-colors hover:text-content-primary">
                Methodology
              </Link>
              <Link href="/dashboard" className="block transition-colors hover:text-content-primary">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 text-[13px] uppercase tracking-wide text-content-muted">Research Disclaimer</div>
            <p className="text-[12px] leading-6 text-content-muted">
              SpySignal is a research platform and is not a registered investment advisor. Algorithmic
              signals and analytics are for informational purposes only. Past performance does not
              guarantee future results.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-[12px] text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} SpySignal. All rights reserved.</span>
          <span>For research use only.</span>
        </div>
      </div>
    </footer>
  )
}
