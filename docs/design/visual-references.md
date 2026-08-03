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

## Expanding selector study — 2026-07-21

The reusable expanding selector transforms mechanics from the references below into a Longbrunch-specific analytical control. It carries no ticker, investment-horizon, URL, or routing semantics. No reference code, assets, branding, or layout was copied.

| Reference | Source inspected | Principle retained | Rejected or replaced |
| --- | --- | --- | --- |
| [Glass Calendar](https://21st.dev/community/components/ravikatiyar/glass-calendar/default) | Rendered demo, registry component, demo source, and compiled CSS | Native horizontal overflow inside one glass vessel; touch-friendly item selection | Calendar composition, date state, and the absence of snap/radio semantics |
| [Expandable Tabs](https://21st.dev/community/components/victorwelander/expandable-tabs/default) | Rendered demo, component source, demo source, and compiled CSS | Compact-to-expanded disclosure and short label continuity | Conventional tab row, spring bounce, and button-only semantics |
| [Sliding Tabs](https://21st.dev/community/components/ruixen.ui/sliding-tabs) | Rendered demo, registry source, and demo source | Measured active geometry, `ResizeObserver`, keyboard model, and continuous indicator motion | A moving tab pill and permanently visible four-option layout |
| [Tubelight Navbar](https://21st.dev/community/components/ayushmxxn/tubelight-navbar/default) | Rendered demo, component source, and demo source | Restrained shared active-state continuity and responsive density | Navbar styling, icon substitution, and pronounced glow |
| [Liquid Weather Glass](https://21st.dev/community/components/ui-layouts/liquid-weather-glass/default), [Liquid Glass by Suraj](https://21st.dev/community/components/suraj-xd/liquid-glass), and [Liquid Glass by Pace](https://21st.dev/community/components/paceui/liquid-glass/default) | Rendered demos, registry/component source, demo source, and compiled CSS where exposed | Separate tint, highlight, edge, blur, and content layers | SVG displacement over text, global pointer followers, hidden cursors, elastic drag, and strong refraction |
| [Skewed Adjacent Hover Tabs](https://recent.design/i/nnkaerr-skewed-adjacent-hover-tabs) | Public demo description and rendered reference | Adjacent choices react with small opacity and scale changes | Skew and decorative hover choreography |
| [Mixing Horizontal and Vertical Scroll](https://www.awwwards.com/inspiration/mixing-horizontal-and-vertical-scroll) and [Horizontal and Vertical Scroll](https://www.awwwards.com/inspiration/horizontal-and-vertical-scroll) | Rendered inspiration pages and linked project context | Clipped continuation cues for local horizontal movement inside a stable vertical page | Page-level scroll hijacking and narrative scroll effects |

Longbrunch transformation: a stationary center window sits over a native snap viewport; real radio inputs remain the semantic source of truth; drag previews a controlled choice and the parent owns the committed state. Reduced motion removes smooth travel and scale transitions because none of the inspected implementations supplied a complete reduced-motion path.

## Ticker selected-node direction — 2026-08-03

| Reference | Principle retained | Rejected or replaced |
| --- | --- | --- |
| User-provided ticker-page composition sketch | A selected colored node establishes identity before company name and price; a sparse relationship field connects the product page to the homepage topology | Exact spacing, typography, navigation geometry, chart styling, decorative density, and any implied third-party brand language |
| `components/marketing/HeroConstellation.tsx` | Focused-node projection, slow spatial drift, depth-based de-emphasis, separate blurred-background and sharp-connection passes, deterministic static reduced-motion state, and clear foreground/background separation | Homepage pinning, ScrollTrigger, Lenis ownership, node focus dialog, fabricated ticker values, and page-level scroll narrative |

Longbrunch transformation: the ticker hero uses a non-interactive, hero-local 3D Canvas field built from the relationship data already loaded for the page. The Canvas measures the semantic-color DOM node beside company identity and uses its exact center as the origin of every relevant edge. Relationship strength and confidence control sharp edge and endpoint prominence; unrelated points remain grey in a separately scaled and blurred depth layer. GSAP animates only the initial 550ms focus interpolation—there is no ticker-page ScrollTrigger, pinning, or Lenis instance. The field pauses offscreen and when the document is hidden, reduces density and relation count on mobile, and renders its final state without a loop under reduced motion. No external assets or code were copied.

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
