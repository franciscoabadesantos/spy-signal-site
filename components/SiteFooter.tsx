import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-slate-950 text-slate-200 border-t border-slate-800">
      <div className="container-lg py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-[16px] font-semibold text-white mb-3">SpySignal</div>
            <p className="text-[13px] leading-6 text-slate-400 max-w-sm">
              Quantitative research platform for signal monitoring, market screening, and model-state
              tracking across actively covered assets.
            </p>
          </div>

          <div>
            <div className="text-[13px] uppercase tracking-wide text-slate-500 mb-3">Platform</div>
            <div className="space-y-2 text-[14px]">
              <Link href="/screener" className="block hover:text-white transition-colors">
                Screener
              </Link>
              <Link href="/performance" className="block hover:text-white transition-colors">
                Performance
              </Link>
              <Link href="/methodology" className="block hover:text-white transition-colors">
                Methodology
              </Link>
              <Link href="/dashboard" className="block hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[13px] uppercase tracking-wide text-slate-500 mb-3">Research Disclaimer</div>
            <p className="text-[12px] leading-6 text-slate-400">
              SpySignal is a research platform and is not a registered investment advisor. Algorithmic
              signals and analytics are for informational purposes only. Past performance does not
              guarantee future results.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-800 text-[12px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>© {year} SpySignal. All rights reserved.</span>
          <span>For research use only.</span>
        </div>
      </div>
    </footer>
  )
}
