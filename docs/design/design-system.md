# Existing Design System

This document describes the runtime UI as it exists. `app/globals.css` and rendered components are authoritative; `design/*.html`, `design/brand-tokens.css`, and planning documents are references only.

## Foundations

- **Typography:** root app uses Geist and Geist Mono. The homepage sets Sora for display, Inter for body, and JetBrains Mono for technical labels; selected headers also use Caveat. Existing utilities cover display, heading, body, label, and tabular data styles. Font consolidation is not yet decided.
- **Color:** semantic tokens cover page/surface/content/border, navy/electric brand bases, restrained teal `--brand-spark`, and bullish green, bearish red, neutral slate, and warning amber. Light is default; dark follows system preference or `[data-theme="dark"]`. The homepage and stock experience explicitly use dark themes.
- **Spacing:** runtime scale is 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, and 96 px. Prefer this scale before arbitrary values.
- **Shape and depth:** tokens include radii 6-24 px plus pill, restrained shadow levels, and glass/surface helpers. Some runtime surfaces use 24-28 px radii and blur; preserve them when extending an existing view, but do not spread glass treatment by default.
- **Motion:** shared durations are 120, 180, 280, and 420 ms with standard and soft easings. See `motion-guidelines.md`.

## Layout and responsive behavior

- Tailwind is mobile-first. Current usage concentrates on `sm`, `md`, `lg`, and `xl`; custom behavior also occurs around 480, 768, 820, and 1024 px.
- Containers are approximately 720, 1120, and 1280 px with 16 px mobile and 24 px `md` gutters. Header content can extend to 1500 px.
- Marketing pages favor immersive, full-width narrative bands. App pages use denser shells, tables, charts, metrics, and compact controls. Do not convert operational screens into marketing compositions.
- Preserve natural document flow on small screens. Collapse or scroll dense controls intentionally, keep touch targets usable, and test the 820-1024 transition where sticky and desktop/mobile modes change.

## Components and density

Reuse `components/ui` primitives for buttons, cards, badges, tables, tabs, segmented controls, inputs, skeletons, empty states, and retry/error states. Reuse `components/shells` and shared navigation before creating page chrome.

The visual language is information-led: compact labels, tabular figures, clear signal color, strong hierarchy, and limited accent moments. Cards should represent real grouped objects or tools, not every section. Avoid cards nested inside cards.

## Accessibility

- Use semantic landmarks and native controls; preserve logical heading order and accessible names.
- All actions must work by keyboard with visible `:focus-visible`; focus must not be hidden by sticky chrome.
- Never rely on signal color alone. Pair it with text, icons, shape, or position and verify contrast in light and dark modes.
- Support zoom, long labels, dynamic data, touch, and reduced motion. Canvas or chart content needs a meaningful textual/DOM alternative where the data matters.

## Preserve and avoid

Preserve the homepage's dark constellation, docking search, sticky ticker story, restrained teal accent, and current brand voice unless a brief explicitly changes it.

Avoid generic AI output: repeated equal cards, interchangeable SaaS heroes, gratuitous glassmorphism, glow everywhere, decorative gradients or blobs, excessive pills, one-note blue/purple palettes, oversized headings in dense product views, stock imagery without product meaning, and animation that does not clarify state or navigation.

## Known unresolved areas

- Dark token declarations and legacy `--nl-*` tokens overlap; no consolidation decision is approved.
- Reduced motion coverage is partial, particularly around the homepage hero/canvas.
- Framer Motion, R3F/Drei, and 3D force-graph packages are installed but no current runtime use was confirmed.
- Formal contrast, type-scale, and component-state audits remain pending. Treat these as review work, not permission for an unscoped redesign.
