# Data Source Policy

## Canonical Runtime Sources

The frontend reads ticker data from our backend-facing routes only. Do not add browser or route-handler calls to third-party symbol lookup services.

Ticker autocomplete is intentionally narrow:

- Load `/api/tickers/index` once.
- Filter that index locally by symbol, company name, and exchange.
- Optionally enrich visible indexed symbols with `/api/tickers/enrich?symbols=...`.
- Keep base index suggestions visible if enrichment is slow or unavailable.

`/api/tickers/enrich` accepts only existing symbols from the caller, validates and deduplicates them server-side, caps requests at eight symbols, applies a short timeout, and returns basic rows when enrichment fails.

## Stock Page Data

Stock pages should use backend summary/profile/scorecard/history routes exposed through the local API and server helpers. If a field is missing, render a graceful empty state instead of adding a client-side provider lookup.

## Agent Checklist

- Do not create public free-text ticker lookup endpoints.
- Do not add autocomplete sources outside `/api/tickers/index`.
- Do not add direct-open/manual ticker suggestions that bypass the index.
- Keep optional enrichment background-only and fail-soft.
- Add or update tests when changing ticker autocomplete, enrichment, or data-source behavior.
