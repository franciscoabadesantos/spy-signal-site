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

### Main-agent orchestration rules

The following rules apply only to the root/Main agent that received the user's request.

- Persistent Codex role definitions are versioned in `docs/agents/codex/`. Install them as `.codex/` in a trusted clone as described in `docs/agents/setup.md`; do not change user-global Codex configuration for this repository.
- Main classifies frontend work as trivial, significant, or critical and selects the required roles. A frontend request includes user-facing Next/React/Tailwind UI, layout, responsive behavior, interaction, search/input, animation, visual accessibility, or frontend performance.
- Trivial frontend changes are mechanical, confined to one file, and do not alter user-visible behavior, layout, interaction, data loading, motion, or accessibility. Main may implement them directly with focused validation.
- Significant frontend changes require Design Director (read-only brief) → Implementation Agent (sole editor for assigned paths) → Browser QA (read-only). The homepage dropdown work is significant by default.
- Critical frontend changes require Accessibility/Performance Review when motion, focus, canvas, runtime, or bundle risk exists and Independent Review when blast radius or regression risk is high. Require API Contract whenever data, local routes, or response states change.
- Main runs the applicable knowledge gates before delegation: the relevant Next 16 guide, `app/globals.css`, rendered components, `docs/design/design-system.md`, `docs/qa/browser-qa.md`, and `docs/qa/viewport-matrix.md`; additionally read `DATA_SOURCE_POLICY.md` and API docs for ticker/autocomplete or data work. The versioned `docs/agents/codex/skills/frontend-delivery/` skill is a reusable workflow layer, but `AGENTS.md` remains the authoritative enforcement source.
- Main owns repository discovery, knowledge gates, role selection, and task decomposition. Main is the Product Lead and must not send the full conversation or long transcripts.
- Before spawning an Implementation Agent, Main must provide a compact execution packet containing:
  - objective;
  - approved file ownership;
  - authoritative Design Director decisions;
  - relevant contracts and invariants;
  - exact acceptance checks;
  - known code locations when already identified.
- Before claiming that multi-agent support is unavailable, Main must inspect the exposed tool surface for the namespaced V1 tool `multi_agent_v1__spawn_agent`. The absence of an unqualified `spawn_agent` does not mean agent support is unavailable.
- For significant or critical frontend work, if `multi_agent_v1__spawn_agent` is available, Main must use the configured roles required by the classification. Main must not simulate Design Director, Implementation Agent, Browser QA, API Contract, Accessibility/Performance Review, or Independent Review as local passes.
- If the required multi-agent tool or configured `agent_type` is genuinely unavailable, Main must stop before repository exploration or editing, report the exact missing tool or role, and request explicit user authorization for a single-agent fallback.
- One implementation agent owns edits to a file area at a time. Ownership is temporary and ends on handoff, reported blocker, agent shutdown after recovery, or explicit user authorization for Main to assume it. Handoffs follow `docs/agents/handoff-template.md` and should report decisions, evidence, blockers, and next action without replaying the prompt.
- Main performs recovery, relaunch, handoffs, final validation, and final reporting. Main must not silently substitute for a required agent.
- For an Implementation Agent with no timely conclusion: wait once, request a checkpoint, then allow one additional full work interval after the checkpoint request.
- A checkpoint stating exact edit locations and no blocker counts as active, verifiable progress. After such a checkpoint, Main must allow the agent another full work interval without sending further prompts.
- A subsequent checkpoint must add new evidence beyond the previous checkpoint, such as changed lines, a partial diff, a completed edit, a running validation, or a newly identified concrete blocker. Repeating the same planned edit locations does not count as continued progress.
- Verifiable progress includes exact assigned files inspected, concrete edit locations identified, a patch in progress, changed files or diff, a validation command running, a specific blocker requiring Main input, an active checkpoint, or a completed handoff.
- An empty `git diff` observed by Main while an agent is active is not, by itself, evidence of failure and must not be the primary progress criterion. Main should use the agent's response/checkpoint, reported state, and completed handoff first; inspect the diff after the agent returns control.
- Main must not close an agent merely because no completion event arrived in the immediately following wait. A “conversation interrupted” state is an execution interruption, not evidence that the agent was idle or incapable. Relaunch with the existing execution packet and no additional discovery instructions.
- Stop and relaunch only when the agent gives no checkpoint after the additional interval, repeats broad discovery without narrowing, violates ownership, or reports no actionable progress. After relaunch, apply the same checkpoint sequence once. Request user authorization for takeover only after both agents fail this full recovery sequence.
- A subagent adds value only if it finds evidence, reduces uncertainty, performs independent validation, or shortens the critical path. Stop agents that duplicate completed work.
- Prefer `rg --files`, targeted `rg`, small excerpts, and `git diff --stat` before a full diff when Main is performing repository discovery or post-handoff review. Do not use Main's live diff observation as a substitute for agent state.

### Spawned-agent execution rules

The following rules apply to every configured subagent created by Main.

For spawned agents, these rules supersede the broad repository-discovery requirements in `Inspect before editing` and the Main-agent rules above.

- A spawned agent must execute only the role and assignment in its spawn message.
- Receiving an execution packet means Main has already completed classification, knowledge gates, role selection, ownership assignment, and prerequisite reviews.
- A spawned agent must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, or request authorization for a single-agent fallback.
- The absence of `multi_agent_v1__spawn_agent` inside a spawned agent is expected and irrelevant unless its assignment explicitly authorizes further delegation.
- Repository rules describing Design Director → Implementation Agent → Browser QA are orchestration instructions for Main, not prerequisites that an already-spawned agent must satisfy again.
- A spawned agent must not reload the full workflow, reread broad repository documentation, or rescan the repository. It should inspect only its assigned files and the minimum directly imported dependencies required to execute safely, unless the execution packet identifies a genuine unresolved question.
- An Implementation Agent with an approved execution packet must inspect the owned files and minimum necessary imports, edit promptly, validate, and return its handoff.

## Git and completion

- Keep changes within the requested scope. Do not revert, delete, format, commit, push, pull, or open a PR unless explicitly asked.
- Before finishing, inspect every changed file, run applicable gates, and separate failures caused by the change from pre-existing failures.
- Final reports must list changed files, key decisions, validations and results, unverified assumptions, risks, and the exact next step.

See `docs/agents/workflow.md`, `docs/design/design-system.md`, `docs/api/available-endpoints.md`, and `docs/qa/browser-qa.md` for operational detail.
