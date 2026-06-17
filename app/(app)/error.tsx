'use client'

import RouteErrorFallback from '@/components/ui/RouteErrorFallback'

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <RouteErrorFallback
      error={error}
      unstable_retry={unstable_retry}
      title="App data is temporarily unavailable"
      description="This screen could not finish loading. Retry will re-fetch the latest data for this app section."
      homeHref="/screener"
      homeLabel="Open Signals"
    />
  )
}
