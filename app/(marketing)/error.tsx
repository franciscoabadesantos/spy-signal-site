'use client'

import RouteErrorFallback from '@/components/ui/RouteErrorFallback'

export default function MarketingError({
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
      title="This page is temporarily unavailable"
      description="The site could not finish rendering this page. Retry will request the latest version again."
      homeHref="/"
      homeLabel="Return Home"
    />
  )
}
