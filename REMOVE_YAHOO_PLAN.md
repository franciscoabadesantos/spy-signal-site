# Remove the direct Yahoo Finance dependency (read fundamentals from the backend)

## Context
`lib/finance.ts` fetches a large block of stock/ETF fundamentals **live, directly from Yahoo
Finance** (`query2.finance.yahoo.com` quoteSummary: `summaryDetail, defaultKeyStatistics,
assetProfile, summaryProfile, fundProfile, topHoldings`). Decision (owner, 2026-06-22): the frontend
should NOT make those external calls — move it all to the canonical pipeline. data-ops now captures
it (`finance-data-ops/YAHOO_FUNDAMENTALS_MIGRATION_PLAN.md`) and the backend serves it
(`finance-backend/TICKER_PROFILE_PLAN.md`). This plan makes the site **read from the backend and
remove the Yahoo fetch**.

## Scope
Everything the site reads from Yahoo `quoteSummary`:
- Dividends (rate/yield/ex-date/payout/frequency)
- Company description ("about") + ETF fund profile (category, family, fees, inception, legal type)
- ETF holdings + sector weightings
- beta, 3y/5y avg returns, ytd return, 52w & day high/low, marketCap, trailingPE, totalAssets,
  sharesOutstanding

## Work
1. **Backend client:** extend the fundamentals/profile fetch in `lib/finance.ts` (or a new
   `lib/profile.ts`) to get all the above from the backend via `fetchBackendJson` (the backend adds
   them to `/tickers/{ticker}/summary` or `/tickers/{ticker}/profile` — match the contract the
   backend agent finalizes). Keep the existing `TickerFundamentals` shape; just change the SOURCE.
2. **Remove the Yahoo path:** delete the quoteSummary fetch + crumb/auth/cooldown machinery and all
   the `summaryDetail?.x / defaultKeyStatistics?.x / fundProfile?.x / topHoldings?.x` parsing used
   for fundamentals. Grep `YAHOO_SUMMARY_API_BASE`, `quoteSummary`, `summaryDetail`,
   `defaultKeyStatistics`, `fundProfile`, `topHoldings` and remove the fundamentals usage.
   - SCOPE CHECK: confirm whether the Yahoo machinery is also used for non-fundamentals (e.g. the
     `/api/search` route uses Yahoo search — that's separate, LEAVE it; and price history has a
     Yahoo fallback — decide with the owner whether to keep that fallback or also drop it). Only
     remove the **fundamentals** Yahoo usage in this pass unless told otherwise.
3. **Formatting:** if the backend returns raw numbers (preferred), do the formatting here (reuse the
   existing `formatPercentFromValue` / `getYahooFmt`-equivalent helpers, renamed off "Yahoo").
4. **Graceful nulls:** equities → no ETF holdings/sector weights; non-payers → no dividends;
   missing profile → no "about"/beta. The pages already handle missing rows — keep that.

## Affected surfaces
The stock page fundamentals/holdings/dividends sections (`StockOverviewClient`, the
holdings-dividends page, financials), and anything reading `TickerFundamentals`. The display stays
the same; only the data source changes.

## Sequencing
Depends on the backend serving these fields (which depends on the data-ops capture). Build the
client against the agreed contract; you can keep Yahoo as a temporary fallback while the backend
fields roll out, then delete it once the backend serves everything (confirm before final removal).

## Execution boundaries
- **You (site code agent):** the backend client + wiring + removing the Yahoo fundamentals fetch.
  No DB/server. Validate tsc + build + browser on a stock page (equity AND an ETF, to check
  holdings/sector weights). 
- **Owner:** deploys.
- **Planner (Claude):** verifies the backend profile/holdings/dividends response via
  `backend.longbrunch.com`.

## Out of scope
- Yahoo **search** (`/api/search`) — different feature, leave it.
- Price-history Yahoo fallback — decide separately (default: keep as fallback for now).
