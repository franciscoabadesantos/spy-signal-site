import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/watchlist(.*)',
  '/api/export-signals(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!process.env.CLERK_SECRET_KEY) return
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/dashboard(.*)',
    '/api/watchlist(.*)',
    '/api/export-signals(.*)',
  ],
}
