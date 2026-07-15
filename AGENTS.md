# Codex Project Instructions

## Repository facts

- Stack: Next.js 16.2 App Router, React 19, strict TypeScript, Tailwind CSS 4, Clerk, and server-side access to `finance-backend`.
- Route groups live in `app/(marketing)`, `app/(app)`, and `app/(auth)`. Pages and layouts are Server Components unless a focused interactive boundary needs `'use client'`.
- Runtime visual truth is `app/globals.css` plus `components/ui`, `components/shells`, and the components currently rendered. Files under `design/` are references, not canonical runtime tokens.
- The homepage is `app/(marketing)/page.tsx` and its `components/marketing/*` composition. Preserve its structure, content, motion language, and visual identity unless a task explicitly requests homepage work.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes; APIs, conventions, and file structure may differ from prior knowledge. Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Inspect before editing

1. Check `git status --short --branch`, the current branch, and task-local instructions.
2. List and search relevant files before opening large files. Do not scan `node_modules` except the specific Next.js guide required above; ignore `.next`, builds, artifacts, logs, and generated files.
3. Read `DATA_SOURCE_POLICY.md` before changing ticker autocomplete, stock-page data loading, or backend proxy routes.
4. Identify existing components, types, contracts, states, tests, and visual patterns before proposing new ones. Do not edit unrelated files or overwrite local user changes.

## Implementation standards

- Use semantic HTML, strict TypeScript, accessible React, and current Next.js 16 App Router patterns. Keep Server Components as the default and client boundaries small.
- Reuse existing primitives and tokens. Preserve the restrained financial-product density and the current navy/electric, teal, and signal-color language; do not introduce a parallel design system.
- Design mobile-first through wide desktop. Validate intermediate widths, long content, touch, keyboard, visible focus, contrast, zoom, and `prefers-reduced-motion`.
- Keep animation intentional, interruptible, and performant. Prefer opacity and transform; avoid layout-thrashing scroll handlers and decorative motion with no information or navigation value.
- Use CSS for simple state transitions, Framer Motion only for component state/orchestration, and GSAP/ScrollTrigger for genuinely complex scroll narratives. The homepage hero owns the single Lenis instance; never create a competing smooth-scroll controller. Three.js/R3F, force graphs, or canvas require a real data/interaction need, cleanup, a nonblank fallback, reduced-motion behavior, and browser QA. Presence in `package.json` is not permission to use a tool.
- Do not add dependencies unless the repository cannot meet the requirement clearly without them. Record the need, maintenance cost, bundle/runtime impact, and rejected existing options.
- Never copy a third-party site, proprietary layout, branding, text, or assets. External references are inputs for transformed principles only; record provenance in `docs/design/visual-references.md`.

## Data and integration rules

- Browser code talks to local routes; server helpers talk to the configured backend. Never expose secrets or add direct browser calls to data providers.
- Ticker autocomplete loads `/api/tickers/index` once and filters locally. It must not call enrichment, scorecard, per-symbol, or external lookup endpoints while opening, typing, or rendering suggestions.
- Do not invent endpoints, fields, authentication, or response shapes. Use types and normalizers already in `lib/`; mark unknown contracts and request missing backend support in `docs/api/requested-endpoints.md`.
- For every integration change, cover success, loading, empty, malformed data, authorization, upstream error, timeout, retry, and offline/unavailable behavior as applicable. Preserve intentional fail-open behavior where documented.

## Quality gates

- Real commands: `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. Use `npm run test:e2e:screenshots` only for deliberate screenshot capture, not automatic baseline churn.
- Any visual or interaction change must be exercised in a real browser across the relevant matrix in `docs/qa/viewport-matrix.md`. Check console errors, overflow, layout shift, focus order, touch, scroll in both directions, and reduced motion.
- Tests should target behavior and contracts rather than fragile copy or implementation details. Do not hide essential stack traces to keep output short.

## Agents and context

- Small changes: Main inspects, implements, validates, and reports.
- Meaningful visual work: Main coordinates a read-only design/research pass, one implementation editor, and read-only browser QA. Main integrates fixes.
- Complex pages: create only the roles justified by risk from `docs/agents/roles.md`; do not instantiate the full roster by default.
- One agent owns edits to a file area at a time. Other agents receive task goal, constraints, exact files to inspect, and a compact output schema. Handoffs follow `docs/agents/handoff-template.md` and should report decisions, evidence, blockers, and next action without replaying the prompt.
- A subagent adds value only if it finds evidence, reduces uncertainty, performs independent validation, or shortens the critical path. Stop it when its work duplicates Main.
- Prefer `rg --files`, targeted `rg`, small excerpts, and `git diff --stat` before a full diff. Reuse prior findings, keep command output bounded, and pass summaries rather than raw transcripts.

## Git and completion

- Keep changes within the requested scope. Do not revert, delete, format, commit, push, pull, or open a PR unless explicitly asked.
- Before finishing, inspect every changed file, run applicable gates, and separate failures caused by the change from pre-existing failures.
- Final reports must list changed files, key decisions, validations and results, unverified assumptions, risks, and the exact next step.

See `docs/agents/workflow.md`, `docs/design/design-system.md`, `docs/api/available-endpoints.md`, and `docs/qa/browser-qa.md` for operational detail.
