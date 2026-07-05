# Plan 00 — Foundations: token consolidation, data polish, placeholder flags

Prerequisite for every other rebrand plan. Three independent workstreams; they can land as separate PRs in this order: (A) tokens, (B) data formatting, (C) feature flags.

## A. Token consolidation (`app/globals.css`)

### Current problems (verified)

1. **Three generations of tokens coexist**: the `--nl-*` set (green/paper marketing look), the `--brand-electric`/`--brand-cyan` set, and a generic set with duplicate names for the same concept (`--page-bg` vs `--bg-page` vs `--color-bg`; `--text-primary` vs `--content-primary` vs `--color-text-primary`).
2. **The dark theme is defined twice in full** — once under `@media (prefers-color-scheme: dark)` and again under `:root.dark, :root[data-theme="dark"]`. Any edit must currently be made in two places; they *will* diverge.
3. **The brand accent changes hue between themes**: light `--brand-cyan: #6f79ff` (violet) vs dark `--brand-cyan: #ff8b2b` (orange). Body background gradients mix violet + orange glows.
4. **Graph components hardcode colors**: `components/RelationshipOrbit.tsx` hardcodes edge hexes (`#36B3FF`, `#A7F3D0`, `#FF867B`, `#FFCB47`, `#F59E0B`, `#73CBFF`, `#94A3B8`) in both the SVG and the legend; `components/NetworkGraphCanvas.tsx` hardcodes canvas background `#07111f` and label colors, so the global network ignores the light theme entirely.

### Target state

- **One semantic token layer.** Keep the good foundations as-is: `--bull-*`/`--bear-*`/`--neutral-*`/`--warn-*` ramps, `--signal-*` aliases, spacing/radius/shadow/motion tokens, the type-scale utilities. Collapse the three background/text/border families into a single set (recommend keeping the `--content-*` / `--surface-*` / `--border` naming since Tailwind's `@theme` block already maps those). Migrate usages of the deprecated names, then delete them — the point of this plan is that a grep for `--nl-` or `--bg-page` or `--color-text-` returns nothing.
- **Dark defined once.** Use class/data-attribute switching (`:root[data-theme="dark"]`) as the single source of truth; if system-preference support is kept, resolve it in JS at bootstrap (set the attribute) rather than duplicating every token in a media query.
- **Single accent family in both themes.** New tokens `--accent-*` = the indigo/electric family (light already has `#0757ff` → `#6f79ff`; pick dark-theme values from the same hue, tuned for contrast). Delete `--brand-cyan` orange in dark and the orange/violet body glows; replace body background treatment with a single-accent version.
- **Relationship-layer tokens.** Add named tokens consumed by graphs and legends so Plan 03/05 can restyle without touching component logic:
  - `--rel-residual`, `--rel-theme`, `--rel-inverse`, `--rel-leadlag`, `--rel-market`, `--rel-spurious` (light + dark values; spurious must be visibly muted).
  - `--graph-canvas-bg`, `--graph-node-label`, `--graph-node-stroke` (theme-aware; kills the hardcoded `#07111f`).
  - Migrate `RelationshipOrbit.tsx`, `NetworkGraphCanvas.tsx`, `MarketCorrelationNetwork.tsx`, `CorrelationNetwork.tsx` and any other consumers (grep for the hexes above) to these tokens. No visual redesign in this plan — same look, tokenized.
- Remove `.marketing-logo-type` / `.marketing-hero-type` Arial rules and any script/cursive font usage (grep for the font-family; used by "Join the lounge" / "Start membership" / "Signal before the open." accents). Replace with plain Geist styles for now; Plan 02 introduces the serif accent properly.

## B. Data formatting polish

Add/extend a single formatting module (check `lib/` for an existing one before creating) and route all display values through it. Verified offenders on the ticker page (META):

- Dividend yield rendered raw as `0.003816447` in the overview KPIs while the Financial Summary tab shows `0.38%` — one formatter, one rule (ratio → percent, 2 decimals).
- Fund details render raw floats: `25,558,249,472.0` → `$25.56B`; `0.07633587786259542` → `7.63%`; `2,196,045,588.0` → `2.20B`. Compact-notation currency/number helpers with sensible unit steps (K/M/B/T).
- Horizon column renders literal `d` — either format as `1d`/`5d` or drop the column until real.
- **Empty means absent, not dashed.** The overview stat strip shows `Open —, 52W High —, 52W Low —, Volume —` as permanent furniture. Rule: a KPI with no value is not rendered; grids reflow. Same for the Holdings tab's double empty-state (two stacked "no data" cards) — collapse to one, or hide the section per Plan 03.
- Sweep: grep ticker-page components (`components/stocks/`, `app/(app)/stocks/`) for `toFixed`, ad-hoc `toLocaleString`, and template-string percent signs; replace with the module.

## C. Placeholder signal flags

No public ML models exist; every stance/conviction/signal-history surface currently shows fabricated data. Trust is the product — fabricated numbers must not render.

- Introduce one flag, e.g. `NEXT_PUBLIC_ENABLE_MODEL_SIGNALS` (default **off**), read through a small helper (`lib/flags.ts`) so it can later become per-model/per-user.
- Gate behind it (render nothing when off — no teasers):
  - Ticker page: Signal History tab, Performance tab, "Neutral regime / Signal: <date>" chips, regime-history block, signal flow/distribution components (`SignalFlowStream.tsx`, `SignalDistributionBubbleCluster.tsx`).
  - Screener/premium table: stance, conviction %, "Range conviction" rows (`ScreenerSignalCard.tsx`, `PremiumSignalWidget.tsx`, screener page).
  - Community page's direction/conviction columns.
  - Home/marketing: any "signal" proof numbers (Plan 04 rewrites this surface anyway).
- The premium-lock *pattern* stays (it will gate real premium content); what disappears is placeholder signal data behind it.
- Acceptance: with the flag off, no route renders a stance/conviction/grade-of-signal value; with it on, current behavior returns unchanged.

## Acceptance criteria (whole plan)

1. `grep -r "nl-\|--bg-page\|--color-text\|#07111f\|#ff8b2b" app components` → no hits (excluding this plans dir).
2. Dark theme tokens exist in exactly one CSS block; toggling `data-theme` flips the whole app including graph canvases.
3. Both themes show the same accent hue; no orange brand elements remain.
4. Ticker page for META shows no raw ratios/floats, no dash-only KPIs, and (flag off) no signal placeholders.
5. Visual appearance otherwise unchanged — this plan is plumbing, not redesign.
