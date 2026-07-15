# Browser QA

## Setup

```bash
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` starts the application unless `PLAYWRIGHT_BASE_URL` points to an existing server. The committed smoke test is deliberately content-light and checks homepage load, console/page errors, horizontal overflow, and screenshot capture across representative viewports.

CI execution remains a follow-up until the repository has an agreed GitHub Actions policy. When that policy exists, the minimum browser job should run:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
```

## Visual and interaction pass

- Page and primary content load without uncaught errors, hydration warnings, failed essential resources, or unexpected console errors.
- No horizontal overflow, clipped text, overlapping UI, broken max-width, unstable hover sizing, or unintended layout shift.
- Alignment, hierarchy, line length, data formatting, image/canvas framing, and contrast remain coherent from small mobile to wide desktop.
- Navigation and mobile menu open, close, trap/release focus appropriately, restore focus, and respond to Escape and outside interaction when intended.
- All controls work with keyboard and have visible focus. Tab order follows the visual/task order; sticky content does not cover focus.
- Touch targets, scrolling, drag/pan alternatives, and input behavior work without hover dependence.
- Loading, empty, error, timeout, unauthorized, retry, partial, and stale states are exercised for changed integrations. Do not simulate only happy-path data.
- Reduced motion preserves content and state while removing smooth scroll, parallax, pinning, loops, and large travel as appropriate.

## Evidence and triage

Record route, commit/diff state, browser, viewport, steps, expected/actual, severity, console excerpt, and screenshot/trace path. Use traces or video for timing/scroll defects; avoid large baseline suites until a stable visual-review policy exists.

Severity: `blocker` prevents the core task or exposes data/security; `high` breaks a major viewport/input/state; `medium` degrades comprehension or consistency; `low` is a bounded polish issue. Browser QA reports first and does not edit until Main assigns ownership.
