'use client'

import RouteErrorFallback from '@/components/ui/RouteErrorFallback'

export default function AuthError({
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
      title="Authentication is temporarily unavailable"
      description="This sign-in flow did not finish loading. Retry will request the auth screen again."
      homeHref="/"
      homeLabel="Return Home"
    />
  )
}
