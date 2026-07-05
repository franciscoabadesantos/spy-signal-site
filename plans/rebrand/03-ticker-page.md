# Plan 03 — Ticker page reorganization

Depends on Plans 00 and 02. The features are right; the page lacks narrative order. This plan reorders `app/(app)/stocks/[ticker]` into a story and fixes the owner's specific complaints. Copy changes ride on Plan 01.

Key files: `components/stocks/StockOverviewClient.tsx` (+ module.css), `StockTabsAuto.tsx`, `stock-nav-config.ts`, `StockSubnav.tsx`, `ScorecardDisc.tsx`, `OrbitMini.tsx`, `StockInsightSummary.tsx`, `components/StockChartPanel.tsx`, `components/RelationshipOrbit.tsx`, `components/WatchlistButton.tsx`.

## Tab structure: 5 → 3 (+1 conditional)

Current: Overview · Financial Summary · Holdings/Dividend Status · Signal History · Performance.

Target:

- **Overview** — the narrative page below.
- **Financials** — merged Financial Summary content, curated (see below).
- **Signals** — merge of Signal History + Performance (they share KPIs and framing today). Entire tab behind `NEXT_PUBLIC_ENABLE_MODEL_SIGNALS` (Plan 00) — with the flag off the tab does not render.
- **Holdings** — only rendered when the asset is a fund/ETF *and* holdings data exists (today META shows an ETF badge and an empty Holdings tab — also fix the mislabeled ETF badge if it's a data bug upstream, or hide the badge when asset type is uncertain).

Breadcrumbs (`Breadcrumbs.tsx`) shrink to Home › Ticker; the current four-level trail restates the tabs.

## Overview narrative order

**Act 1 — Who it is (compact header).** One row: ticker + company name + country/sector chips; price + change (signal-colored); **the scorecard grade chip right next to the price** — the at-a-glance verdict belongs at the top, not buried mid-page. Watchlist = IconButton (Plan 02). The full `ScorecardDisc` (5-axis disc) moves to a compact popover/expand from the grade chip, plus its permanent home further down (Act 3) — the disc is identity, don't lose it; just stop making it compete with the chart.

**Act 2 — How it's behaving.** Chart gets the full content width (owner: "o gráfico devia ser maior") — `StockChartPanel` becomes the act's single surface, KPI strip (via StatChip, empties hidden per Plan 00) beneath it. When the signals flag is on, regime shading renders *inside* the chart timeline instead of the separate "Regime history" block (which is removed either way — flat placeholder line today).

**Act 3 — What the signals say.** Technical signals **collapsed by default**: summary row = three PressureBars (Summary / Oscillators / Moving Averages) with the arrow glyphs; the full oscillator/MA table opens on demand (accordion). No more forced detail dump. The scorecard disc lives here as the fundamental counterpart to the technical read, with one interpretive sentence.

**Act 4 — What surrounds it (the star).** Peer web becomes the visual protagonist:
- Canvas sizes to content: with ≤5 neighbors, shrink height/orbit radii instead of floating 3 nodes in a huge void (today's 252d residual view is mostly empty space).
- Layer toggles stay; **probable-spurious defaults off**; the "+38 more" counts move into a single "show more" affordance.
- Theme set (Venn) docks *inside* the peer-web panel as a side tab ("Themes"), not a random sibling card — fixes "mal localizado"; give it hover-sync with the graph (hovering a theme highlights its members) for the missing "dinamismo".
- The table below becomes **TickerCards** (Plan 02) grouped by relationship type, each carrying the plain-language relation phrase + strength + confidence; full table remains as a "view as table" toggle for power users.
- Related-assets chip strip (current separate block) merges into this act — it duplicates the peer web at lower fidelity. Keep the chips only as the fallback when relationship data is missing.

**Act 5 — Company facts.** Curated, formatted fundamentals (Plan 00 formatters): ~8 owner-relevant facts (market cap, P/E, revenue, margin, dividend if any, next earnings). The current "Fund details" raw dump ("random fund details com lista que nunca vou ver") is removed; complete data lives behind a "All financials →" link to the Financials tab.

**Act 6 — Go deeper.** Research copilot panel (`AiAnalystPanel.tsx`) with LockPanel treatment; lab cross-link once Plan 06 lands.

## Financials tab

Merge the current Financial Summary + Financial Data views: KPI row (StatChip), then one clean DataTable of formatted metrics with period end. Remove meta-noise rows shown to users today ("Displayed Metrics: 9", "Coverage View: Summary Snapshot").

## Acceptance criteria

1. Tab bar shows Overview/Financials (+Holdings only for funds with data; +Signals only with flag on).
2. Grade chip visible without scrolling on a 13" laptop; watchlist is an icon.
3. Technical detail tables hidden until expanded; no gauges anywhere.
4. Peer web with 3 neighbors renders compact (no giant empty canvas); spurious layer off by default; theme set lives inside the peer-web panel and highlights on hover.
5. Relationship data shown as cards by default with table toggle.
6. No raw-format numbers, no dash-only KPIs, no "Canonical backend fundamentals" style internal language anywhere on the page.
7. Both themes, laptop + mobile pass.
