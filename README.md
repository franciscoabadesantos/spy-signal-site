This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js `>=20.19.0` (required by Next.js 16)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment TODO (Vercel)

Use this checklist when you're ready to move from local/dev to production:

1. Add production env vars in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
   - `STRIPE_WEBHOOK_SECRET`
   - `SIGNAL_ALERT_CRON_TOKEN`
   - `RESEND_API_KEY`
   - `SIGNAL_ALERT_FROM_EMAIL`
2. Run SQL migrations in production Supabase:
   - `supabase/sql/market_cache.sql`
   - `supabase/sql/market_signals.sql`
   - `supabase/sql/user_watchlists.sql`
   - `supabase/sql/signal_alert_dispatches.sql`
   - `supabase/sql/analytics_events.sql`
3. Deploy to Vercel (`vercel --prod` or your main-branch auto-deploy flow).
4. Verify cron config from `vercel.json` is active in production.
5. Run a cron smoke test:
   - `GET /api/cron/check-signals?dryRun=1` with `Authorization: Bearer <SIGNAL_ALERT_CRON_TOKEN>`
6. Run one real delivery test on a known flip date:
   - `GET /api/cron/check-signals?date=YYYY-MM-DD`

## Market Data Cache (Supabase)

The app now uses a Supabase-backed cache for quotes, historical prices, and ETF fundamentals:

- Page requests read `market_quotes` and `market_price_daily` first.
- Fundamentals pages read `market_fundamentals` first.
- If cached data is stale/missing, the server fetches live data and writes fresh rows.
- If providers rate-limit, stale cache is served when available.

### Setup

1. Run SQL: `supabase/sql/market_cache.sql` in your Supabase SQL editor.
2. Add env vars:
   - `SUPABASE_SERVICE_ROLE_KEY` (required for cache writes).
   - `MARKET_REFRESH_TOKEN` (optional, protects refresh endpoint).
3. Refresh endpoint:
   - `GET /api/market/refresh?tickers=SPY,AAPL&periodDays=120`
   - Header (if token configured): `Authorization: Bearer <MARKET_REFRESH_TOKEN>`

If you already created the old schema, re-run `supabase/sql/market_cache.sql` so `market_fundamentals` is created.

## Watchlist Tables (Dashboard)

To enable the Pro dashboard watchlist feature, also run:

1. `supabase/sql/user_watchlists.sql`

This table is keyed by Clerk `user_id` and is intended for server-side access via `SUPABASE_SERVICE_ROLE_KEY`.

## Signal Flip Alerts (Cron + Email)

The alert pipeline sends emails when watched tickers flip signal direction on a given date.

### Setup

1. Run SQL: `supabase/sql/signal_alert_dispatches.sql`
2. Add env vars:
   - `SIGNAL_ALERT_CRON_TOKEN` (recommended, secures cron endpoint)
   - `RESEND_API_KEY`
   - `SIGNAL_ALERT_FROM_EMAIL` (must be a verified sender in Resend)
   - `NEXT_PUBLIC_APP_URL` (used in email links)

### Cron endpoint

- Route: `GET /api/cron/check-signals`
- Optional query params:
  - `date=YYYY-MM-DD` (defaults to current US/Eastern date)
  - `dryRun=1` (no email sends, useful for testing)
- Auth header (if token configured):
  - `Authorization: Bearer <SIGNAL_ALERT_CRON_TOKEN>`

The endpoint is idempotent per user/ticker/date/direction when `signal_alert_dispatches` table exists.

### Vercel Cron

`vercel.json` includes:

- `GET /api/cron/check-signals` on weekdays (`10 21 * * 1-5`, UTC)

### Cron Strategy

Call `/api/market/refresh` every 1-5 minutes for quotes and periodically (for example hourly) for historicals. This decouples user requests from provider throttling.

### Optional: Seed From Local Finance Cache

If Yahoo is rate-limited from this runtime, you can bootstrap Supabase from your existing local Finance repo parquet cache:

```bash
/home/franciscosantos/Finance/.venv/bin/python scripts/seed_market_cache_from_finance.py --tickers SPY
```

This writes to `market_quotes` and `market_price_daily` using `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.

## Multi-Ticker Signal Source (Screener/Dashboard)

Use this to power `/screener`, `/dashboard`, and signal-history/export with cross-ticker rows.

### Setup

1. Run SQL: `supabase/sql/market_signals.sql`
2. Batch upsert model outputs into `market_signals` (one row per ticker/day).
3. `latest_signals_view` will automatically expose the newest row per ticker.

### Batch Upsert Utility

Use `scripts/upsert_market_signals.py` with CSV input:

```bash
python scripts/upsert_market_signals.py --csv data/signals.csv
```

Expected CSV columns:

- `ticker`
- `signal_date` (`YYYY-MM-DD`)
- `direction` (`bullish|neutral|bearish`)
- `prob_side` (0-1 or 0-100)
- `prediction_horizon`

Optional columns:

- `source`
- `model_version_id`
- `retrain_id`
- `metadata` (JSON string)

Dry-run parser check:

```bash
python scripts/upsert_market_signals.py --csv data/signals.csv --dry-run
```

## AI Analyst Panel (Perplexity)

Ticker pages now include a streaming AI analyst panel that summarizes likely catalysts behind the latest model signal.

### Setup

1. Add env vars:
   - `PERPLEXITY_API_KEY` (required)
   - `PERPLEXITY_MODEL` (optional, defaults to `sonar-pro`)
2. Open any ticker page and click **Generate Analysis**.

The app sends ticker + latest signal + recent headlines to `POST /api/ai-analyst`, which proxies Perplexity streaming output back to the client.

If `PERPLEXITY_API_KEY` is not set, the AI Analyst UI is hidden automatically.

## Analytics Events (User Testing)

To persist product-loop analytics used by `/api/analytics/event`, run:

1. `supabase/sql/analytics_events.sql`

The API writes via `SUPABASE_SERVICE_ROLE_KEY` and stores:

- `event_name`
- `payload`
- `session_id`
- `anonymous_id`
- `pathname`
- `referrer`
- `occurred_at`

Quick smoke test (requires running app):

```bash
set -a; source .env.local; set +a
node scripts/analytics_e2e_smoke.mjs
```

## Stripe Pro Plan Activation

The app now supports Stripe-driven Pro gating for screener full results and CSV export.

### Setup

1. Add env vars:
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (Stripe Payment Link URL for your Pro plan)
   - `STRIPE_WEBHOOK_SECRET` (endpoint secret from Stripe webhook config)
   - `STRIPE_WEBHOOK_TOLERANCE_SECONDS` (optional, defaults to `300`)
2. In Stripe, configure a webhook endpoint:
   - `POST /api/webhooks/stripe`
   - Event: `checkout.session.completed`
3. Ensure checkout includes Clerk user ID:
   - Preferred: append `?client_reference_id=<clerk_user_id>` to the payment link.
   - Fallback: include `clerk_user_id` in checkout metadata.

On successful `checkout.session.completed`, the webhook sets Clerk metadata:

- `publicMetadata.plan = 'pro'`
- `privateMetadata.stripeCustomerId`
- `privateMetadata.stripeSubscriptionId`
- `privateMetadata.stripeLastCheckoutSessionId`
- `privateMetadata.stripeLastCheckoutAt`

### Local test workflow (without deploying)

Use this when you want to test Stripe end-to-end on `localhost` before pushing to Vercel.

1. Install and authenticate Stripe CLI (one-time setup):
   ```bash
   curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   sudo apt update
   sudo apt install stripe
   stripe login
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. In a second terminal, start webhook forwarding:
   ```bash
   stripe listen --events checkout.session.completed --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the `whsec_...` shown by `stripe listen` and set it in local env:
   - `STRIPE_WEBHOOK_SECRET=<whsec_from_stripe_listen>`
5. Ensure your local payment link env exists:
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...` (test-mode link)
6. Restart `npm run dev` after env changes.
7. While signed in, click Upgrade from the app and complete checkout using a Stripe test card:
   - `4242 4242 4242 4242` + any future date/CVC.
8. Verify webhook success in the `stripe listen` terminal:
   - `checkout.session.completed` forwarded with HTTP `200`.
9. Refresh the app (or sign out/sign in once) and confirm:
   - Screener lock removed for Pro user.
   - CSV export unlocked.

Important notes:

- The webhook secret from `stripe listen` is local-only and different from your Dashboard endpoint secret.
- Keep modes aligned: test payment link + test events + test account data.
- If checkout doesn’t return to your app automatically, configure Payment Link "After payment -> Redirect to URL" to your local route (for example `http://localhost:3000/screener`).

## Product Backlog

- Wire daily model batch jobs to continuously populate `market_signals` for your target universe (for example S&P 100).
- Extend the AI analyst panel with follow-up Q&A and memory per ticker.
- Add social/news momentum inputs (for example X/Reddit trend context) into AI analysis.
- Add ads/sponsored placements in the ticker News section (clear labeling, frequency caps, non-intrusive placement).
