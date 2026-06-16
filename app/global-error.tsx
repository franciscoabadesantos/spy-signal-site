'use client'

import RouteErrorFallback from '@/components/ui/RouteErrorFallback'
import './globals.css'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <RouteErrorFallback
          error={error}
          unstable_retry={unstable_retry}
          title="The site ran into an unexpected error"
          description="Retry will ask the server to render this page again with fresh data."
          homeHref="/"
          homeLabel="Return Home"
        />
      </body>
    </html>
  )
}
