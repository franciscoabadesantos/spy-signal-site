# Plan 01 — Voice & copy system

All current site copy was AI-generated without direction; treat it as lorem ipsum. This plan defines the voice and rewrites copy surface by surface. It can run parallel to Plan 00 and must land before Plan 04 (home).

## Voice definition

**Longbrunch explains; it never predicts, never advises, never hypes.** The voice is a knowledgeable friend walking you through what the data shows — scientific in substance, plain in language.

Rules:

1. **Plain language over jargon, always.** The canon examples already in the product (peer-web legend) are the reference: "moves together beyond the market", "same theme basket", "tends to lead/follow", "probably just market noise". When a technical term is unavoidable, define it inline in one clause.
2. **The interpretive-sentence formula.** Wherever a number appears prominently, it gets context and one human sentence: *number + what it is + what it suggests*. (The old market-posture cards had the right shape: "14.3 · Volatility · Volatility compression is helping risk stay clean." — the shape survives, the sentences get rewritten from real data logic.) Interpretive sentences are rendered in the serif italic style (Plan 02) — this pairing of voice and typography is a brand signature.
3. **No promises, no imperatives about money.** Banned patterns: "buy/sell", "don't miss", "before the open", "one trade", "AI-driven signals", win-rate framing, urgency framing. Signals (when they exist) are described as *outputs of experiments you can inspect*, never recommendations.
4. **Honest uncertainty.** Confidence and spurious-risk are stated plainly ("66% confidence", "this link is probably noise"). Absence of data is silent (Plan 00) — never "N/A", never fake.
5. **Sentence case everywhere**; short sentences; no exclamation marks; no emoji in product surfaces.

Deliverable: a `docs/VOICE.md` in the repo capturing the above with a good/bad example table per rule, so future features quote it.

## Copy inventory to rewrite

Work through these files; rewrite in place following the voice. Where copy describes features that are flagged off (Plan 00), remove it rather than rewriting.

- `components/marketing/home-content.ts`, `site-config.ts`, `HomePage.tsx`, `HomeTickerStory.tsx` — hero, taglines, CTAs. The tagline "Signal before the open." and "AI-driven signals. One trade. Every Sunday before the market opens." are removed entirely (they promise a product that doesn't exist and contradicts positioning). New hero copy leads with the observatory ("see what surrounds any company") and the lab ("test your own market theories") — final lines to be approved by the product owner before merge.
- `HowItWorksPage.tsx`, `MethodologyPage.tsx`, `AboutPage.tsx`, `FaqPage.tsx`, `PricingPage.tsx`, `PerformancePage.tsx` — rewrite for observatory + laboratory framing; PerformancePage content is placeholder-signal territory: gate or cut.
- Membership CTAs: "Join the lounge" / "Start membership" → plain, e.g. "Become a member" (final wording with owner). The lounge/brunch metaphor is retired from product copy (name may change; copy must not lean on it).
- Ticker page section titles and helper lines (`components/stocks/`, `components/ui/` empty states): e.g. "Peer web — multi-layer relationship map with residual links first" stays conceptually but gets the plain-language treatment; "Canonical backend fundamentals" (user-facing!) becomes "Company facts" or similar.
- Premium lock copy (`PremiumSignalWidget.tsx` and the unlock modal): sell inspection depth, not secrets — "See the full picture: every layer, every confidence score, exportable research."
- Empty/error states: human, specific, no stack-trace tone ("Holdings data isn't available for this company." — nothing more).

## Disclaimers

Add a short standard footer disclaimer (not legal advice here — owner supplies/approves final text): research and education, not investment advice. Rendered once in `SiteFooter.tsx`, not repeated per component.

## Acceptance criteria

1. `docs/VOICE.md` exists with rules + examples.
2. Banned patterns return zero grep hits in `components/` and `app/` (case-insensitive: "before the open", "one trade", "AI-driven", "lounge").
3. Every prominent metric on home and ticker overview has an interpretive sentence or deliberately stands alone — no orphaned mystery numbers.
4. Peer-web legend phrasing unchanged (it is the canon).
5. Owner has signed off on hero copy and CTA wording before merge (leave a PR comment thread for this).
