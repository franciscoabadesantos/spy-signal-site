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

### Cron Strategy

Call `/api/market/refresh` every 1-5 minutes for quotes and periodically (for example hourly) for historicals. This decouples user requests from provider throttling.

### Optional: Seed From Local Finance Cache

If Yahoo is rate-limited from this runtime, you can bootstrap Supabase from your existing local Finance repo parquet cache:

```bash
/home/franciscosantos/Finance/.venv/bin/python scripts/seed_market_cache_from_finance.py --tickers SPY
```

This writes to `market_quotes` and `market_price_daily` using `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.

## Product Backlog

- Add a `News` area on stock pages with tabs:
  - `All`
  - `Videos`
- Future integration idea: Perplexity-powered news feed for ticker-specific updates.
