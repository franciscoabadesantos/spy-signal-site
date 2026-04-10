import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-surface-card text-content-secondary">
      <div className="container-lg py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="mb-3 text-heading-sm text-content-primary">SpySignal</div>
            <p className="max-w-sm text-body-sm text-content-muted">
              Quantitative research platform for signal monitoring, market screening, and model-state
              tracking across actively covered assets.
            </p>
          </div>

          <div>
            <div className="mb-3 text-label-sm uppercase tracking-[0.12em] text-content-muted">Platform</div>
            <div className="space-y-2 text-body-sm">
              <Link href="/screener" className="state-interactive block hover:text-content-primary">
                Screener
              </Link>
              <Link href="/stocks/SPY/performance" className="state-interactive block hover:text-content-primary">
                Performance
              </Link>
              <Link href="/methodology" className="state-interactive block hover:text-content-primary">
                Methodology
              </Link>
              <Link href="/dashboard" className="state-interactive block hover:text-content-primary">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 text-label-sm uppercase tracking-[0.12em] text-content-muted">Research Disclaimer</div>
            <p className="text-caption leading-6 text-content-muted">
              SpySignal is a research platform and is not a registered investment advisor. Algorithmic
              signals and analytics are for informational purposes only. Past performance does not
              guarantee future results.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-caption text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} SpySignal. All rights reserved.</span>
          <span>For research use only.</span>
        </div>
      </div>
    </footer>
  )
}
