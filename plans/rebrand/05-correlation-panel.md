# Plan 05 — Global correlation network panel

Depends on Plans 00, 02. Files: `app/(app)/markets/network/page.tsx`, `components/MarketCorrelationNetwork.tsx`, `components/NetworkGraphCanvas.tsx`, `lib/network-regions.ts`, `lib/network.ts`.

The owner's verdict: the correlation system itself is the product's crown jewel ("insights que nunca vi ninguém a fazer") — zone/field coloring, edge threshold, top-K density all stay exactly as capabilities. What's missing is identity on everything *around* the canvas. **Do not change the simulation, the physics, or the analytical controls' semantics.**

## Scope

### Canvas

- Background/labels from `--graph-canvas-bg` / `--graph-node-*` tokens (Plan 00) so the canvas respects both themes (currently hardcoded `#07111f` even in light mode).
- Node/edge palette: zone and sector (field) color scales move to tokens (`lib/network-regions.ts` likely holds the maps — tokenize there). Keep hue assignments recognizable; tune for contrast per theme. Selected/hovered node gets the accent ring; everything else keeps its zone/field color.
- Progressive emphasis: on node hover/select, connected edges+nodes full opacity, rest dims (if not already); smooth with motion tokens.

### Control panel (the actual redesign)

Current: a raw sidebar of unstyled controls. Target: a `.material-surface` panel with kit components (Plan 02):

- **Colour (Zone/Field)** → segmented control, filter-label caption.
- **Edge threshold + Top-K sliders** → styled range inputs with the accent; live value chip; one-line plain-language caption under each ("higher = only the strongest links", "how many links each company keeps") — the lab-instrument feel with the Longbrunch voice.
- **Stats block** (nodes / visible edges / backbone / window) → StatChip row, formatted.
- **Zone legend / Sector spotlight** → consistent chip lists; scrollable legend gets a proper fade + count; sector chips act as filters if they already do (don't add filtering logic if absent — out of scope).
- Panel collapses on mobile into a bottom sheet (glass material — it floats over the canvas, which qualifies as chrome).

### Page furniture

- PageHeader with title + one interpretive subtitle (Plan 01 voice) explaining what the map is in one sentence.
- Keyboard/interaction hint overlay (the current floating "abc" hint card) restyled as a small glass tooltip, dismissible, shown once (localStorage).

## Acceptance criteria

1. Simulation behavior byte-identical (same data in → same layout out); only presentation changed.
2. Canvas + panel fully theme-aware; no hardcoded hexes left in the three components (grep).
3. Controls use kit components with plain-language captions; mobile shows the bottom-sheet panel.
4. Hover/select emphasis dims unrelated elements smoothly; `prefers-reduced-motion` respected.
