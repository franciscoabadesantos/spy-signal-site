# Plan 04 — Home / marketing surface

Depends on Plans 00, 01 (copy must land first), 02. Files: `app/(marketing)/page.tsx`, `components/marketing/HomePage.tsx`, `home-content.ts`, `HomeTickerStory.tsx`, `site-chrome.tsx`, `components/page/HeroSignalNetwork*.tsx`, `lib/network-fixture.ts`.

## Direction

Reference feeling: BlackRock's insight pages — big typography, generous space, institutional calm. Our twist: **the live product is the hero image**. The current AI-generated desk photo is removed (owner: "faz sentir pouco profissional"); no illustration replaces it — the correlation network does.

The page tells the brand story in three acts: **See → Understand → Experiment.** Nothing on the page may promise predictions, weekly trades, or performance (all copy from Plan 01; old hero copy is deleted, not restyled).

## Structure

**Hero.** Full-viewport, near-black (dark theme) / paper (light). Left: the headline (Plan 01 copy; observatory framing) + one CTA ("Explore a company" → search focus) + secondary ("How it works"). Right / background: the **live network animation** — either the existing `HeroSignalNetwork` (drifting nodes, flowing edges, already has CSS keyframes `signal-network-*`) upgraded with relationship-layer token colors, or the real `NetworkGraphCanvas` running on `lib/network-fixture.ts` data in ambient auto-play (slow pan, hover-free). Choose whichever performs better on mid-range mobile; the animation must be interruptible and `prefers-reduced-motion`-aware (falls back to a static rendered frame). This animation *is* the brand image — invest polish here.

**Market ticker bar.** The glass ticker bar + card fly-out (the owner's favorite interaction) survives and gets connected to real quote data from finance-backend instead of hardcoded samples. It runs as the seam between hero and content. The fly-out cards become `TickerCard`s (Plan 02) with real prices; interpretive sentences only if backed by real logic (e.g. derived from technical summary), otherwise omit the sentence line — no fabricated commentary (Plan 00 flag discipline applies).

**Act: See.** "See what surrounds any company." An embedded, *interactive* peer-web demo for one curated ticker (fixture data acceptable if labeled "sample"), with the layer toggles working. Let visitors feel the toggle → reveal moment; that's the conversion moment.

**Act: Understand.** Scorecard + plain-language row: the disc for a sample company + 2–3 interpretive sentences in serif italic showing the voice. This is also where "insight, not prediction" is said explicitly.

**Act: Experiment.** The lab pitch: "test your own market theories." Show a real experiment artifact rendered as a readable card (from Plan 06's result-page pattern) or, until Plan 06 lands, a designed static preview clearly marked as preview. CTA → membership/pricing.

**Footer band.** Membership CTA (Plan 01 wording), methodology link, disclaimer (Plan 01).

## Also in scope

- `site-chrome.tsx` / nav: apply glass material, remove script-font CTA, logo slot renders plain wordmark placeholder (final logo out of scope — name may change).
- Kill `HomeTickerStory` if redundant with the new structure, or fold its content into the acts.
- Marketing subpages (`how-it-works`, `methodology`, `pricing`, `about`, `faq`) get material + copy pass only (no structural redesign in this plan). `performance` page: remove from nav while signals are flagged off.
- Delete the AI desk image asset and any other stock/AI imagery from `public/`.

## Acceptance criteria

1. No raster marketing imagery on the home page; hero is live/animated product, with reduced-motion static fallback.
2. Lighthouse perf ≥ 85 mobile for the marketing page (animation must not tank it).
3. Ticker bar shows real quotes; no hardcoded sample prices in production build.
4. Zero prediction-promise copy (Plan 01 banned-pattern grep passes).
5. All three acts present; peer-web demo interactive; both themes pass.
6. Owner sign-off on the hero (animation + headline) before merge.
