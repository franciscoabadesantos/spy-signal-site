# Plan 02 — Material & component system ("liquid glass, disciplined")

Depends on Plan 00 (tokens). This plan turns the look the owner loves — the liquid-glass ticker bar, the glass nav, the floating market-posture cards — into a *system*, and retires the elements that fight it.

## The material rule

Two materials, strict separation:

1. **Glass (chrome layer).** Translucent, `backdrop-filter` blur, subtle inner top-light, floats above content. Reserved for: `Nav.tsx`, the market ticker bar + its card fly-out, premium locks/unlock modals, overlays/tooltips/popovers, floating per-ticker cards (posture cards, related-asset cards), sticky section nav (`StickySectionNav.tsx`).
2. **Solid (content layer).** Opaque surface tokens, crisp 1px border, small shadow, **no** backdrop-filter. Used by: all data tables, chart panels, graph canvases, KPI grids, text sections.

Hard constraints: never glass on glass (a glass card may not sit on another glass surface); max ~3 glass elements in a viewport; glass never contains dense data (tables/charts); `backdrop-filter` appears **only** in the glass utilities.

## Implementation

### Surface utilities (globals.css)

Today `.surface-card`, `.surface-elevated`, `.surface-primary/secondary/tertiary`, `.emphasis-*` all apply blur+glass at different intensities — that's why everything looks vaguely glassy and nothing pops. Replace with exactly three utilities and migrate all usages:

- `.material-glass` — the chrome recipe (one blur value, one saturation, top-light gradient, `--radius-xl`).
- `.material-surface` — solid content card (opaque `--surface-*` token, border, `--shadow-sm`).
- `.material-surface-raised` — solid + `--shadow-md` for the rare hero-level content block.

Delete the old utilities when migration is complete (grep must return nothing). Keep `state-interactive`, motion tokens, and glow utilities (glows become accent-only per Plan 00).

### Typography

- Keep Geist Sans for UI; keep `text-data-*` tabular styles for all numbers.
- Add a serif italic via `next/font` (suggest trying Newsreader italic or Source Serif 4 italic; owner picks from a side-by-side) exposed as `.text-interpretive` — used exclusively for interpretive sentences (Plan 01 formula) and nothing else. This replaces every former script-font moment.
- Type hierarchy audit: section titles on the ticker page are currently ALL-CAPS spaced labels ("TECHNICAL SIGNALS · 1D", "PEER WEB") — keep small-caps labels for *metadata*, but real section titles move to `text-heading-*` sentence case. Caps-tracking is demoted to the `text-filter-label` role only.

### Component kit (components/ui/)

Audit what exists in `components/ui/` (Card, Button, DataTable, EmptyState, PageHeader, etc.) and normalize to the two materials. New/changed pieces needed by later plans:

- **IconButton** — for watchlist star (replaces the giant "Add to Watchlist" pill; `WatchlistButton.tsx` gets an `icon` variant with tooltip + optimistic state).
- **TickerCard** — the beloved posture-card pattern generalized: ticker + name, price + change (signal-colored), sparkline, one interpretive sentence, optional badge. Glass material, used on home, related assets, lab gallery.
- **PressureBar** — linear buy/neutral/sell composition bar + directional arrow chip, replacing the three skeuomorphic speedometer gauges in technical signals (they're off-identity and misuse amber). Keep the arrows the owner loves as the summary glyph.
- **StatChip / KpiCell** — one KPI presentation (today some KPI cards have an indigo tint, some don't, radii differ). Value via data styles, label via filter-label style, optional interpretive sentence.
- **LockPanel** — the premium lock done properly: glass panel, lock icon, one-line value prop (copy from Plan 01), CTA; sits over genuinely blurred *real* content, never over placeholder data.
- **SectionHeader** — title + optional plain-language subtitle + optional "info" popover for methodology notes, so explanations have a consistent home.

### Motion

Use existing motion tokens; define three standard behaviors and apply them consistently: card hover lift (already in `state-interactive`), section fade-up on first reveal (respecting `prefers-reduced-motion`), and the ticker-bar → card fly-out transition (the owner's favorite; extract whatever the marketing hero currently does into a reusable pattern and keep its timing).

## Deliverable: kit page

Add a dev-only route `app/(app)/design/page.tsx` (or Storybook-less equivalent) rendering every material, type style, and kit component in both themes side by side. This is the review surface for the owner and the regression reference for later plans.

## Acceptance criteria

1. `grep -r "backdrop-filter" app components` hits only the glass utility definitions.
2. Old surface/emphasis utilities gone; every card in the app is `.material-glass` or `.material-surface*`.
3. Gauges no longer rendered anywhere; PressureBar + arrows replace them (behind the same data, no logic change).
4. Watchlist is an icon button on the ticker page.
5. Serif italic appears on interpretive sentences and nowhere else; script/cursive font files removed from the bundle.
6. `/design` kit page renders correctly in both themes.
