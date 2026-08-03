# Motion Guidelines

Motion should explain hierarchy, state, continuity, or data change. A static interface must remain complete and understandable.

## Tool choice

- **CSS transitions/keyframes:** hover, focus, disclosure, simple reveal, and small state changes. Start with shared duration/easing tokens.
- **Framer Motion:** React-owned enter/exit, layout continuity, or coordinated component states when CSS would create brittle orchestration. It is installed but current runtime use is unconfirmed; do not introduce it for a single fade.
- **GSAP + ScrollTrigger:** complex scroll narratives with explicit start/end geometry. The homepage hero is the current use. Scope selectors, register once, kill triggers/tickers/listeners, and restore styles on cleanup.
- **Lenis:** `components/motion/ScrollRuntime.tsx` is mounted by the root layout and owns the site's single document instance. The homepage declares `narrative`, app routes declare `operational`, and ordinary routes inherit `standard`; never instantiate Lenis inside a page or smooth-scroll an inner document without an approved interaction need.
- **Three.js/R3F/force graph/canvas:** only for a data or spatial interaction that benefits from them. Bound device pixel ratio and work per frame, pause offscreen work, handle resize, dispose resources, and provide loading/error/empty and DOM fallback states.
- **Native scroll/RAF:** use passive listeners, throttle DOM work with one RAF, avoid repeated layout reads/writes, and remove all listeners.

## Behavior

- Prefer transform and opacity. Avoid animating layout dimensions during scroll unless measured and necessary.
- Interactions must be interruptible and stable on reverse scroll, refresh mid-page, rapid input, and route changes.
- Document overscroll is contained and Lenis inertia stops on internal navigation. Mark intentionally scrollable descendants with the applicable `data-lenis-prevent*` attribute so tables, menus, and local panels retain native input.
- Reuse `scrollMotionTokens` for input smoothing, scrub bands, depth rates, and approved narrative distances. Treat these as a motion grammar, not a requirement to animate every section.
- Use the runtime lock API for dialogs and protected focus. Direct `lenis.stop()` / `lenis.start()` calls are not composable and must remain inside the runtime.
- Keep microinteractions within the existing 120-420 ms scale. Long narrative motion needs a brief and browser evidence.
- `prefers-reduced-motion: reduce` must remove smooth scrolling, parallax, looping decoration, large travel, and scroll pinning where possible. Show the meaningful final/static state without delaying content.
- Do not autoplay essential explanations once, hide content behind animation completion, or make pointer movement the only input.

## Validation

Use `docs/qa/scroll-qa.md` and the viewport matrix. Check frame stability, layout shift, console warnings, cleanup after navigation, keyboard/touch equivalence, background-tab behavior, and reduced motion. For canvas/3D, verify nonblank pixels and framing at mobile and desktop sizes.
