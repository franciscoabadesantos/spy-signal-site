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
