# Repository Working Agreement

## Sources of truth

- Stack: Next.js 16.2 App Router, React 19, strict TypeScript, Tailwind CSS 4, Clerk, and server-side access to `finance-backend`.
- Runtime UI truth is `app/globals.css` plus the rendered components in `components/ui`, `components/shells`, and the target route. Files under `design/` are references only.
- The homepage is `app/(marketing)/page.tsx` and `components/marketing/*`. Preserve its structure, copy, motion language, and visual identity unless homepage work is explicitly requested.
- Read `DATA_SOURCE_POLICY.md` before changing ticker autocomplete, stock-page data loading, or backend proxy routes. API contracts live under `docs/api/`.
- Study the runtime exemplars in `docs/design/visual-references.md` before reproducing a visual or interaction pattern. Tokens alone are not a design brief.

## Before editing

1. Check `git status --short --branch` and task-local instructions.
2. Use `rg --files` and targeted `rg` before opening large files. Ignore `.next`, artifacts, logs, and generated files.
3. Identify the rendered component, its direct dependencies, contracts, states, tests, and nearest existing pattern.
4. Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/`; this version has breaking changes.
5. Preserve unrelated local changes. Do not perform opportunistic cleanup or improvements inside otherwise legitimate files.

## Canonical commands

- `npm run verify`: lint, strict typecheck, and unit/contract tests.
- `npm run qa:browser`: browser preflight plus Playwright. Playwright owns the fixed test server, waits for readiness, and stops it.
- `npm run qa:frontend`: `verify`, production build, and browser QA.
- `npm run test:e2e` remains a compatibility alias for `qa:browser`. Use `npm run test:e2e:screenshots` only for deliberate captures.

Do not manually start a server, choose a QA port, kill processes, or launch Chromium for browser QA. Use `PLAYWRIGHT_BASE_URL` only when intentionally testing an already-running external server. Run checks in proportion to the changed surface; do not repeat expensive checks when no relevant code or configuration changed.

## Implementation boundaries

- Keep pages and layouts as Server Components unless a focused interactive boundary needs `'use client'`.
- Use semantic HTML, strict TypeScript, accessible React, existing primitives, and the current navy/electric, teal, and signal-color language. Do not introduce a parallel design system.
- Design mobile-first through wide desktop. Preserve keyboard operation, visible focus, contrast, zoom, touch behavior, and reduced motion.
- Use CSS for simple transitions, Framer Motion for React state/orchestration, and GSAP/ScrollTrigger only for complex scroll narratives. The homepage hero owns the single Lenis instance.
- Canvas, 3D, or force graphs need a real data/interaction requirement, cleanup, a nonblank fallback, reduced-motion behavior, and browser QA.
- Do not add dependencies unless the repository cannot meet the requirement without them; record cost, runtime impact, and rejected existing options.
- Do not copy third-party branding, layouts, copy, code, or assets. Record transformed reference principles in `docs/design/visual-references.md`.

## Data and integration

- Browser code calls local routes; server helpers call the configured backend. Never expose secrets or call data providers directly from the browser.
- Ticker autocomplete loads `/api/tickers/index` once and filters locally. It must not call enrichment, scorecard, per-symbol, or external lookup endpoints while opening, typing, or rendering suggestions.
- Do not invent endpoints, fields, authentication, or response shapes. Use existing types and normalizers; request missing backend support in `docs/api/requested-endpoints.md`.
- Cover the applicable success, loading, empty, malformed, authorization, upstream error, timeout, retry, and unavailable states. Preserve documented fail-open behavior.

## Browser QA and blockers

- For visual or interaction changes, use the relevant matrix in `docs/qa/viewport-matrix.md` and the checks in `docs/qa/browser-qa.md`.
- Review console errors, overflow, layout shift, focus order, keyboard, touch, bidirectional scroll, and reduced motion where applicable.
- If a command is blocked by missing browser binaries, system libraries, sandbox policy, secrets, or an unavailable service, stop improvising. Preserve the exact command, exit status, useful log excerpt, and artifact path; distinguish infrastructure/startup failure from an application assertion or runtime failure.
- Never hide essential stack traces to shorten output.

## Completion

- Keep the diff within the requested scope; do not format, reorganize, delete, commit, push, or open a PR unless asked.
- Inspect every changed file and the final diff. Report commands and exact results, pre-existing failures, unverified assumptions, remaining risks, and the next step.
