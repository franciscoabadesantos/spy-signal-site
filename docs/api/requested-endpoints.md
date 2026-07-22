# Requested Backend Support

There are no active endpoint requests recorded at the creation of this document. Add an entry only after confirming that existing local routes, backend helpers, payload fields, and graceful empty states cannot support the frontend need.

Use `api-request-template.md`, assign an owner, and keep status one of `draft`, `frontend-reviewed`, `backend-reviewed`, `approved`, `implemented`, `verified`, or `declined`. A proposed route is not available to frontend code until implementation and contract verification are complete.

## Requests

| ID | Need | Consumer | Proposed endpoint | Priority | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| _None_ |  |  |  |  |  |  |

## Confirmed Phase 2 contract gaps

These are frontend-observed data requirements, not active or available endpoints. The first Research Views slice must continue to render intentional placeholders until finance-backend owners define and verify the contracts.

### Complete company and fund profile

- Stable asset kind and field applicability for equity, ETF, fund, and other supported instruments.
- Business/fund description, activity or objective, sector/category, industry, country/domicile, exchange, website, head office, employees, foundation/inception, issuer, structure, and identifiers.
- Explicit source, as-of/freshness, null semantics, and coverage/readiness.
- Confirmed error semantics for unavailable, unsupported, partial, malformed, and unauthorized responses.

The existing `/tickers/:ticker/profile` normalizer remains the only current source. No additional route is assumed.

### Financial statement series

- Statement type: Income Statement, Balance Sheet, or Cash Flow.
- Frequency: Annual or Quarterly.
- Ordered line items with stable keys, labels, values, period end, filing date, currency, unit, and scaling.
- Comparative periods and period-over-period growth where canonically supplied.
- Restatement/version metadata and source context.
- Explicit partial/empty/unsupported semantics and available history window.

No statement-series contract is currently available to the frontend. The Financial Statements view must not treat summary fundamentals as a substitute for complete statements.

### Valuation history

The Valuation History view currently uses only the canonical current trailing P/E, market cap, currency, reporting period, and available earnings context from the existing summary payload. The following future contract is required before historical modules can display live values:

- Metric series for P/E, P/S, P/B, P/FCF, EV/EBITDA, and future supported multiples.
- Explicit frequency and period semantics for annual and quarterly observations.
- Ordered observations with metric key, period end, value, unit, currency, source, as-of timestamp, and restatement/version metadata.
- Canonical historical range statistics such as minimum, maximum, mean/median, and current position or percentile, with methodology defined by the backend.
- Peer and sector benchmark observations with stable identities, comparison period, membership/as-of rules, and aggregation method.
- Event or market-period markers that can be associated with valuation observations.

The frontend must not derive unsupported multiples, historical ranges, percentiles, peer medians, or sector comparisons from current summary fields or price history.

### Ownership and capital structure

The Ownership & Capital view currently uses only market cap, shares outstanding, currency, and reporting period when those fields are present. The following asset-aware contract is required for live ownership and capital modules:

- Ownership categories with percentages, share counts, as-of dates, source, and explicit null/coverage semantics.
- Top holders with stable identifiers, holder type, position, percentage, date, and ranking methodology.
- Free float, closely held shares, share classes, and voting/non-voting semantics.
- Debt, cash and equivalents, minority interest, and enterprise value with consistent currency, unit, period, and source metadata.
- Shares-outstanding history with ordered observations and period semantics.
- Issuance, buyback, split, and other capital-action history with dated events and share-count impact.
- Fund-specific fields for issuer, AUM, shares outstanding, creation/redemption structure, holder concentration, and fund-level applicability.

The frontend must not infer institutional, insider, retail, or free-float percentages, calculate enterprise value, or classify corporate dilution from the current summary/profile payload.

### Signals and technical evidence

The Signals & Indicators view uses existing `/signals/history/:ticker`, `/screener/signals`, and `/tickers/:ticker/ohlc` helpers. The following future contract gaps remain before deeper history can be shown as canonical evidence:

- Signal history rows with stable identity, direction, date, reported horizon, source, as-of timestamp, and explicit duplicate/error semantics.
- Canonical regime history with state vocabulary, start/end timestamps, duration semantics, coverage, and methodology.
- Indicator series by canonical indicator key, family, period, frequency, value, unit, source, as-of timestamp, and missing-data semantics.
- Explicit chart-range versus signal-horizon semantics; UI ranges must not be treated as model horizons.
- Technical aggregation methodology and versioned source timestamps for Summary, Oscillators, and Moving Averages.
- Volume, turnover, spread, and liquidity fields with frequency, currency/unit, and coverage semantics.

The frontend currently uses the existing OHLC-derived technical implementation for the same Summary, Oscillators, and Moving Averages already used by Overview. It does not create a historical indicator series or recalculate signal scores.

### Earnings and events

The current summary exposes a partial next-earnings object and an earnings-history array. A canonical events contract is required for the final event timeline:

- Stable event identity, type, date, time, timezone, fiscal/reporting period, source, certainty, as-of timestamp, and coverage state.
- Earnings actuals, estimates, surprise fields, guidance, revisions, restatements, and duplicate/version rules.
- Dividend and distribution events with declaration, record, ex-date, payment/distribution date, amount, currency, and source.
- Corporate actions including splits, issuance, buybacks, shareholder meetings, and filings with effective dates and asset applicability.
- Fund-specific distributions, rebalances, index changes, issuer events, splits, and structural changes.
- Optional event-to-price relationships with an approved methodology; the frontend must not infer event impact.

Until these contracts exist, the page renders only individually safe existing fields and keeps the remaining geometry in `Pending integration`, `Partial coverage`, or `Unavailable` states.
