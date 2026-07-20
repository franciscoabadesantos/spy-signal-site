# Visual References Log

External work is inspiration for principles, never a source to copy branding, layouts, copy, code, or assets. Record enough provenance to review rights and transformation.

## Current repository references

| Reference | Status | Use |
| --- | --- | --- |
| `app/globals.css` and rendered components | Runtime source of truth | Tokens, utilities, responsive and interaction patterns |
| `design/direction-board.html` | Internal exploration | Directional comparison only |
| `design/hero-constellation-scroll.html` | Internal exploration | Related to the implemented homepage hero |
| `design/brand-navy-teal-system.html` | Internal exploration | Closest internal study of the current brand palette |
| Other `design/*.html` and `design/brand-tokens.css` | Historical/internal studies | Not canonical; verify against runtime before reuse |

## Runtime implementation exemplars

Study the rendered pattern, its responsive states, and its direct styling before extending it. These are implementation references, not components to copy wholesale.

| Pattern | Study | What to preserve |
| --- | --- | --- |
| Marketing navigation and glass disclosure | `components/marketing/HeaderBar.tsx`, `components/marketing/SiteChromeMotion.tsx`, and the `.site-header*` rules in `app/globals.css` | One continuous surface, content hierarchy, CSS-owned morphing, open/close states, outside/Escape handling, and the desktop/mobile search transition |
| App navigation composition | `components/Nav.tsx`, `components/BrandHomeMenu.tsx`, and `components/marketing/site-chrome.tsx` | Active-state hierarchy, portal positioning, compact information density, and responsive search placement; treat it as a visual/compositional reference and re-check focus semantics for any new disclosure |
| Editorial typography and premium surfaces | `MarketingPageShell`, `SectionHeading`, and `GlassPanel` in `components/marketing/site-chrome.tsx` | Display/body contrast, constrained line length, asymmetric accent moments, layered highlights, and restrained use of glass rather than token-by-token imitation |
| Dense financial cards | `components/ScreenerSignalCard.tsx` with `components/ui/Card.tsx` and `components/ui/SignalBlock.tsx` | Label/value hierarchy, tabular numerals, signal redundancy, progressive density, and mobile readability |
| Responsive narrative motion | `components/marketing/HomeTickerStory.tsx` | Separate mobile/desktop geometry, transform/opacity animation, stable scroll reversal, and a meaningful reduced-motion final state |
| Complex hero motion | `components/marketing/HeroConstellation.tsx` plus `docs/design/motion-guidelines.md` | The single Lenis owner, scoped GSAP lifecycle, cleanup, nonblank static content, and reduced-motion behavior |
| Focus and compact control states | `components/ui/Button.tsx`, `Input.tsx`, `SegmentedControl.tsx`, and `FilterChip.tsx` | Visible focus rings, state semantics, touch sizing, pressed/selected contrast, shared timing, and `motion-reduce` behavior |

There is not yet a repository-wide modal or drawer exemplar with a complete focus-management contract. Inspect current implementations for local context, but do not promote one to a shared pattern until focus entry, containment, Escape, backdrop behavior, and focus restoration are verified.

## Add a reference

| Field | Value |
| --- | --- |
| URL or approved file |  |
| Owner/creator |  |
| Date accessed |  |
| Why it is relevant |  |
| Principles extracted |  |
| Planned transformation |  |
| Assets/code copied | None; otherwise stop and obtain explicit rights |
| Licensing/privacy notes |  |
| Decision owner |  |

Do not add an external reference merely to justify a predetermined visual. State what was learned, what was rejected, and how the result remains specific to Longbrunch.
