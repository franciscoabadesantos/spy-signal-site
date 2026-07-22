# Ticker Research Views

Status: Phase 2 first vertical slice implemented for visual review.

## Information architecture

- Overview remains the quick read. Research views do not repeat its price chart, final grade, technical gauges, metric ribbon, or relationships preview.
- Research navigation keeps the primary destinations visible in one horizontally scrollable secondary bar. Only Financials, Signals, and More use compact anchored disclosures.
- Every Research, Overview, and Relationships link preserves `?lens=trade|short|medium|long`.
- The selected Lens changes initial priority and defaults; it never hides the remaining evidence.

## First vertical slice

### Company Profile / Fund Profile

- Company Profile prioritizes the business description, then profile facts and secondary identifiers.
- Fund Profile replaces company language with holdings, sector exposure, distributions, and risk.
- Missing descriptive or identifier fields use a compact `Data pending` state without fabricated copy.

### Fundamentals

- Equity themes are Valuation, Growth, Profitability, Financial health, and Shareholder return.
- Fund themes are Portfolio, Exposure, Valuation, Distributions, and Risk.
- Current canonical metric rows remain visible in every Lens; Lens only changes their order and visual priority.
- Historical trend slots are reserved as `Data pending` until a canonical series contract exists.

### Financial Statements

- Income Statement, Balance Sheet, and Cash Flow are stable URL states through `?statement=`.
- Annual and Quarterly are stable URL states through `?period=`.
- The current summary snapshot is explicitly separate from a complete statement series.
- Statement trajectories, comparative periods, growth, units, and restatements remain `Pending integration`; no values or dates are simulated.
- Mobile exposes the selected period as the primary column rather than making horizontal scrolling the main interaction.

## Data boundaries

- Runtime product data comes only from finance-backend through `lib/backend.ts`.
- Current views use `/tickers/:ticker/summary` and `/tickers/:ticker/profile` through existing server helpers.
- No API route, backend contract, scoring logic, provider fallback, Yahoo path, or Supabase path is added.
- Missing statement and full-profile fields are documented in `docs/api/requested-endpoints.md` as contract gaps, not available functionality.

## Shared UI

- `ResearchViewShell` owns the factual page heading, ticker context, coverage label, Perspective Dial, and development-only ad placement.
- `StockResearchNav` owns keyboard-operable horizontal navigation, active-destination visibility, Lens-preserving links, compact disclosures, Escape/outside close, and mobile scrolling. It does not display or explain the current Perspective.
- `ResearchViews.module.css` supplies document-flow chapters, metric rows, statement controls, table behavior, zoom-safe layouts, and reduced-motion handling.
