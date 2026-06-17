export type AppNavSection =
  | 'today'
  | 'signals'
  | 'markets'
  | 'watchlist'
  | 'community'
  | 'model-lab'
  | 'marketing'

export function appNavSectionFromPath(pathname: string): AppNavSection {
  if (pathname.startsWith('/dashboard/watchlist')) return 'watchlist'
  if (pathname.startsWith('/dashboard')) return 'today'
  if (pathname.startsWith('/screener')) return 'signals'
  if (pathname.startsWith('/markets') || pathname.startsWith('/stocks')) return 'markets'
  if (pathname.startsWith('/community')) return 'community'
  if (pathname.startsWith('/models')) return 'model-lab'
  return 'marketing'
}
