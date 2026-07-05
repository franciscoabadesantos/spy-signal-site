# Longbrunch Frontoffice Rebrand — Plan Index

Planning docs for the spy-signal-site rebrand. Each plan is self-contained and written for an implementing agent. Read this file first for the shared direction; do not re-litigate decisions recorded here — they were made with the product owner.

> Repo note: follow `AGENTS.md` at the repo root (this Next.js version has breaking changes; read `node_modules/next/dist/docs/` before writing code).

## Positioning (the "why" behind every decision)

Longbrunch is about **insight, not prediction**. It is an *observatory* (understand what surrounds a company: relationships, themes, technical signals, a readable scorecard) plus a *laboratory* (test your own ML theories about the market). We never promise trades, never advise, never show a black box. Target user: curious retail investors who want to understand how markets work.

Two hard truths that shape scope:

1. **All per-ticker ML signals currently shown are placeholders.** No public models exist yet. Placeholder signal surfaces must go behind a feature flag (Plan 00) — not fake data, not "coming soon" noise; simply absent until real.
2. **All site copy was AI-generated and generic.** It gets rewritten systematically (Plan 01). Do not reuse existing headlines/taglines as reference for tone. The exception that *is* on-voice: the plain-language relationship phrases in the peer-web legend ("moves together beyond the market", "probably just market noise").

## Design direction (decided)

- **Material: liquid glass is chrome, not content.** Glass (backdrop-blur surfaces) is reserved for the floating chrome layer: nav, market ticker bar, premium locks, overlays, tooltips, floating cards. Data surfaces (tables, charts, graph canvases) are solid and quiet. Never glass on glass. This is both a clarity rule and a performance rule (`backdrop-filter` is expensive; graphs must stay fluid).
- **One accent across both themes: the indigo/electric-blue family** (light theme already uses `#0757ff`/`#6f79ff`). The dark theme's orange accent (`--brand-cyan: #ff8b2b` in dark) is removed — the brand must not change color between themes.
- **Color = meaning, always.** Green/red/amber are reserved exclusively for signal semantics (bullish/bearish/warn, existing `--bull-*`/`--bear-*`/`--warn-*` ramps stay). No green/red/amber for decoration or brand.
- **Typography:** Geist Sans for UI and data (keep `tabular-nums` styles). Add one serif italic face (via `next/font`) used *only* for interpretive sentences — the brand's human voice. The cursive/script font ("Join the lounge", "Start membership", "Signal before the open.") is removed everywhere, as is the Arial placeholder logo type.
- **Dark theme is primary, light theme is a first-class sibling.** Both ship; tokens must make theme parity automatic, not manual.
- **The product is the brand image.** No stock/AI illustrations. Hero and marketing visuals are the live product (network animations, real components with fixture data).
- Name may change later; nothing in these plans may depend on the "Longbrunch"/"lb" wordmark. Logo/wordmark work is explicitly out of scope.

## Plan sequence and dependencies

| Plan | File | Depends on |
|------|------|-----------|
| 00 — Foundations: tokens, data polish, flags | `00-foundations.md` | — |
| 01 — Voice & copy system | `01-voice-and-copy.md` | — (parallel with 00) |
| 02 — Material & component system | `02-material-system.md` | 00 |
| 03 — Ticker page reorganization | `03-ticker-page.md` | 00, 02 (01 for copy) |
| 04 — Home / marketing | `04-home.md` | 00, 01, 02 |
| 05 — Global correlation network panel | `05-correlation-panel.md` | 00, 02 |
| 06 — Public lab showcase | `06-lab-showcase.md` | 00, 01, 02 (backend deps inside) |

Suggested order: 00 → 02 → 03 → 05 → 04 → 06, with 01 running alongside and landing before 04.

Each plan lists its own acceptance criteria. A plan is done when its criteria pass in **both themes** and at laptop + mobile widths.
