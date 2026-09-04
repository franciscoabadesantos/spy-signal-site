# Requested Backend Support

There are no active endpoint requests recorded at the creation of this document. Before adding one, inspect the machine-readable backend contract (`finance-backend/docs/api-contract.json`, then `docs/openapi.json`) and record the lookup result. Classify whether the gap belongs to source, canonical/derived semantics, ML evidence, signal intent, realized simulation, experiment lineage, eligibility/activation, HTTP exposure, deployment/runtime, or frontend consumption/state. Propose a backend endpoint only when verified upstream semantics exist and HTTP exposure is the missing ownership layer.

Use `api-request-template.md`, assign both the semantic owner and gap layer, and keep status one of `draft`, `frontend-reviewed`, `backend-reviewed`, `approved`, `implemented`, `verified`, or `declined`. A proposed route is not available to frontend code until implementation and contract verification are complete. Do not compensate with frontend derivation, third-party lookup, endpoint fan-out, or approximate substitution without explicit approval.

## Requests

| ID | Need | Consumer | Proposed endpoint | Priority | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | Batch quote and short price history for a set of symbols, so a ranking page can show price, day change and a sparkline per row | `app/(app)/picks/[reading]/page.tsx` via `lib/picks.ts` | `GET /quotes?symbols=A,B,C` returning last price, previous close and a short close series per symbol | Medium | `draft` | unassigned |
| REQ-002 | As-of-dated FX reference so non-USD listing prices can include a USD equivalent | `components/stocks/StockTickerIdentity.tsx` via `lib/stock-ticker-chrome.ts` | Deferred until source and canonical semantics exist | Normal | `draft` | `finance-data-ops` → `finance-feature-store` → `finance-backend` |

**REQ-001 detail.** `GET /screener/rankings` returns `symbol`, `name`, `sector`, `score`,
`coverage` and `components` — no price and no series. The existing per-symbol helpers
(`getStockQuote`, `getHistoricalData` in `lib/finance.ts`) are cached individually, so
covering 25 rows means roughly 50 backend calls per render, which is why the picks pages
ship score-led without price visuals rather than fanning out. Not blocking: the pages are
useful without it. Revisit before adding sparklines or a day-change column.

### REQ-002 — As-of-dated currency conversion reference

- **Need / user outcome:** An FX rate with an explicit as-of date so a non-USD listing price can be shown with a USD equivalent for readers who do not price in the local currency.
- **Frontend consumer:** `components/stocks/StockTickerIdentity.tsx`, supplied by `lib/stock-ticker-chrome.ts`.
- **Why existing contracts are insufficient:** The ticker summary identifies the listing currency and exchange but provides no conversion rate or converted value.
- **Backend contract lookup result:** At `finance-backend` commit `6bf5f1ec87a1a3739888be62aa4af3222981c1c0`, searches of `docs/api-contract.json` followed by `docs/openapi.json` found no FX, currency-rate, or conversion endpoint or field.
- **Semantic owner:** `finance-data-ops` for source ingestion, then `finance-feature-store` for canonical/derived exposure.
- **Gap layer:** Source missing in `finance-data-ops` (no FX series is ingested) → canonical/derived exposure in `finance-feature-store` → HTTP exposure in `finance-backend`.
- **Upstream evidence:** None yet; an authoritative FX source, pair convention, valuation timestamp, market-calendar treatment, and lineage must be approved before transport is designed.
- **Why HTTP exposure is the correct missing layer:** It is not yet the only missing layer. Source and canonical semantics are absent, so an HTTP route must not be proposed as if the value already exists.
- **Proposed method and endpoint:** Deferred until upstream source and semantic contracts are approved.
- **Minimum request fields:** To be defined after the upstream contract exists; expected concerns include source currency, target currency, and as-of date.
- **Minimum response fields:** To be defined after the upstream contract exists; must include currencies, rate, as-of timestamp/date, source, and nullability semantics.
- **Authentication/authorization:** To be defined by `finance-backend` if and when HTTP exposure is approved.
- **Errors:** Must distinguish unsupported pairs, unavailable dates, stale/partial source data, upstream failure, and timeout; exact statuses are not yet approved.
- **Caching/pagination/rate limits:** To be defined from the approved series frequency and revision behavior; pagination is not expected for a single reference lookup.
- **Privacy and logging constraints:** No user data is required; avoid logging secrets or unnecessary request context.
- **Priority:** Normal.
- **Dependencies and owners:** `finance-data-ops` source ingestion, `finance-feature-store` canonical semantics, then `finance-backend` transport.
- **Compatibility/versioning:** Additive contract only; conversion semantics and timestamp basis must be versioned if they can change.
- **Approval state:** `draft`.
- **Contract evidence:** No backend schema or examples exist yet.
- **Frontend fallback until available:** Show the backend-supplied local listing currency only. Render no conversion, estimate, approximation, third-party lookup, or unavailable placeholder.

## Confirmed Phase 2 contract gaps

These are frontend-observed data requirements. Implemented portions are recorded explicitly; unresolved fields remain gaps and must not be inferred.

### Complete company and fund profile

- Stable asset kind and field applicability for equity, ETF, fund, and other supported instruments.
- Business/fund description, activity or objective, sector/category, industry, country/domicile, exchange, website, head office, employees, foundation/inception, issuer, structure, and identifiers.
- Explicit source, as-of/freshness, null semantics, and coverage/readiness.
- Confirmed error semantics for unavailable, unsupported, partial, malformed, and unauthorized responses.

The existing `/tickers/:ticker/profile` normalizer remains the only current source. No additional route is assumed.

### Financial statement series

Status: partially implemented through `GET /tickers/:ticker/financial-statements`.

- Statement type: Income Statement, Balance Sheet, or Cash Flow.
- Frequency: Annual or Quarterly.
- Ordered line items with stable keys, labels, values, period end, filing date, currency, unit, and scaling.
- Comparative periods and period-over-period growth where canonically supplied.
- Restatement/version metadata and source context.
- Explicit partial/empty/unsupported semantics and available history window.

The shared ticker contract supplies canonical line items, annual/quarterly periods, period end, currency, source, `knownAt`, methodology and quality flags. Filing date, backend-supplied ordering/hierarchy, scaling, comparative growth and explicit restatement relationships remain gaps. The frontend does not substitute summary fundamentals for missing statement rows.

### Valuation history

Status: partially implemented through `GET /tickers/:ticker/market-metrics`.

The Valuation History view now displays direct temporal observations for supported canonical metric keys, preserving observation date, `knownAt`, source and methodology. Current summary fields remain a narrow fallback for current P/E context only. The following contract gaps remain:

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

Status: partially implemented through `GET /tickers/:ticker/events` and `GET /tickers/:ticker/disclosures`.

The shared ticker-scoped surfaces provide canonical event identity, domain/type, date role, date, source, `knownAt`, candidate classification/confidence and disclosure links. The summary still supplies the richer next-earnings facts. The following richer product fields remain gaps:

- Stable event identity, type, date, time, timezone, fiscal/reporting period, source, certainty, as-of timestamp, and coverage state.
- Earnings actuals, estimates, surprise fields, guidance, revisions, restatements, and duplicate/version rules.
- Dividend and distribution events with declaration, record, ex-date, payment/distribution date, amount, currency, and source.
- Corporate actions including splits, issuance, buybacks, shareholder meetings, and filings with effective dates and asset applicability.
- Fund-specific distributions, rebalances, index changes, issuer events, splits, and structural changes.
- Optional event-to-price relationships with an approved methodology; the frontend must not infer event impact.

The page renders the canonical calendar/disclosure stream and preserves candidate semantics. Rich earnings actuals/estimates, action amounts, event detail fields and any event-to-price relationship need separate approved product contracts; the frontend does not derive them.

## Phase 3 Relationships contract gaps

The current reduced-scope Relationships view consumes only the existing `/relationships/:ticker` payload. The following fields are still future backend contracts and must not be inferred in the frontend:

### Canonical relationship semantics

- Stable relationship identity, source and target identity, category/layer, and asset applicability.
- Definition, scale, sign, and null semantics for `strength`.
- Canonical methodology, coverage meaning, and null semantics for `confidence`, beyond the frontend's existing 0–1/percentage normalization convention.
- Explicit direction semantics for directional relationships. Direction must not be treated as causality.
- Dataset and edge-level `asOf`, source timestamps, observed start/end, frequency, session, timezone, and currency/market compatibility.
- Methodology identifier/version and source metadata.

### Historical and directional evidence

- Historical or rolling correlation series with period and frequency semantics.
- Lead/lag interval, method, direction, statistical support, and non-causal interpretation.
- Relationship persistence or structural classification with a defined observation window.
- Canonical recent-relationship semantics rather than relying only on numeric windows.

### Entity and market relationships

- Canonical peers, sector, and industry membership with source and effective dates.
- Index and ETF membership, weights, and membership snapshots.
- Market sensitivity/beta and macro exposures for rates, currencies, commodities, and market factors.
- Supplier, customer, competitor, value-chain, and geographic relationships with evidence and source.

### Fund relationships

- Holdings overlap, issuer, index tracked, AUM, constituent comparison, fund-level factors, creation/redemption data, and fund relationship methodology.

Until these contracts are defined and verified by finance-backend owners, the frontend must keep these areas deferred. It must not label co-movement as influence, derive peers from prices, infer structural relationships, or fabricate strength/confidence values.
