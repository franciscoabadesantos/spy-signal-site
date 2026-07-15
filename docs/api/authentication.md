# Authentication Boundaries

Authentication is integration-specific; there is no single global API policy.

| Boundary | Mechanism | Notes |
| --- | --- | --- |
| User sessions | Clerk via `@clerk/nextjs`, `proxy.ts`, `lib/auth.ts`, and handler checks | Watchlist, AI feedback, export, and plan access perform handler-level checks as applicable. Do not rely only on route matching |
| Plan authorization | Clerk public metadata read by `lib/billing.ts` | CSV export requires Pro. Stripe checkout updates Clerk metadata through the signed webhook |
| Site to `finance-backend` | `x-backend-shared-secret` from `BACKEND_SHARED_SECRET` | Server-side only; never expose in browser code |
| Cloudflare Access | `CF-Access-Client-Id` and `CF-Access-Client-Secret` | Both must be set together; server-side only |
| Cron/refresh | Bearer `SIGNAL_ALERT_CRON_TOKEN` or `MARKET_REFRESH_TOKEN` when configured | Current handlers allow unauthenticated access if their token is absent. Preserve or change only through an explicit security task |
| Stripe webhook | `stripe-signature` HMAC with secret and tolerance | Verify raw body before JSON processing |
| Perplexity / Resend | Server API keys | Used only in route/server code; never return keys to clients |
| Public local routes | Ticker index/onboarding, model validation, analytics, AI analyst as currently implemented | Public does not mean unbounded or safe to enrich; preserve validation, data-source, and fail-open policies |

`.env.example` lists names only. Store real values in local or deployment secret stores. Never log secrets, auth headers, cookies, raw webhook signatures, Clerk tokens, or third-party payloads containing sensitive user data.
