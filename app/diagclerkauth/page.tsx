import { getViewerUserId } from '@/lib/auth'

/**
 * THROWAWAY DIAGNOSTIC — not product surface.
 *
 * The smallest possible matched, rendered route: one server-side auth read and
 * nothing else. No backend call, no Suspense, no application data, no watchlist
 * code. It exists only to tell a Clerk/Next dev-server problem apart from a
 * ticker-page problem. Delete with this branch.
 */
export const dynamic = 'force-dynamic'

export default async function ClerkAuthContextDiagnostic() {
  const userId = await getViewerUserId()
  return (
    <pre data-diag="clerk-auth-context">
      {JSON.stringify({ authResolved: true, viewer: userId ? 'signed-in' : 'anonymous' })}
    </pre>
  )
}
