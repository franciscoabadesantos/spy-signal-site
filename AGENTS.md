<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Runtime Data Sources

Read `DATA_SOURCE_POLICY.md` before changing ticker autocomplete, ticker enrichment, stock-page data loading, or backend proxy routes. Ticker autocomplete uses `/api/tickers/index` as its source of truth and may only call `/api/tickers/enrich?symbols=...` for background enrichment of already-indexed symbols.
