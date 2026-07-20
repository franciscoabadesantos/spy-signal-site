---
name: frontend-delivery
description: Plan and deliver user-facing frontend work in this Next.js repository. Use for changes to React or Next components, Tailwind/CSS, layouts, responsive behavior, interaction, inputs or search, animation, visual accessibility, or frontend performance. Apply the repository's risk classification, knowledge gates, agent ownership, recovery, and browser-validation workflow.
---

# Frontend Delivery

Use this skill as a reusable workflow guide. Until repo-local skill discovery is verified and installed, enforce the same rules directly through `AGENTS.md` and `docs/agents/workflow.md`.

## Knowledge gates

1. Read `AGENTS.md`, inspect Git state, list relevant files, and identify the rendered components.
2. Read the relevant Next 16 guide under `node_modules/next/dist/docs/` before changing Next code.
3. Read `app/globals.css`, `docs/design/design-system.md`, `docs/qa/browser-qa.md`, and `docs/qa/viewport-matrix.md` for user-facing work.
4. Read `DATA_SOURCE_POLICY.md`, `docs/api/available-endpoints.md`, and the consumer/route/types when changing ticker autocomplete, data loading, or a backend integration.

Do not duplicate those documents here. Use the smallest relevant subset and state which gates applied.

## Classify and delegate

- Treat a mechanical one-file change with no user-visible layout, interaction, data, motion, or accessibility effect as trivial. Main may implement it with focused validation.
- Treat any user-facing visual, responsive, interaction, search/input, animation, or visual accessibility change as significant. Use Design Director for a read-only brief, assign one Implementation Agent as editor, then use Browser QA.
- Treat high-blast-radius work or work with data/API, motion/focus/canvas/runtime, or bundle risk as critical. Require API Contract for data/API, Accessibility/Performance for motion/focus/canvas/runtime or bundle risk, and Independent Review for high blast radius; do not add roles whose trigger is absent.

Main owns repository discovery, knowledge gates, role selection, and task decomposition. Before spawning an Implementation Agent, provide a compact execution packet containing the objective, approved file ownership, authoritative Design Director decisions, relevant contracts and invariants, exact acceptance checks, and known code locations. The Implementation Agent should inspect only its assigned files and the minimum directly imported dependencies required to edit safely; it must not reload the full workflow, reread broad documentation, or rescan the repository unless the packet identifies a genuine unresolved question. One editor owns a path area at a time.

Subagents must not inspect or comment on multi-agent tool availability unless their assigned role requires spawning further agents. Only Main evaluates the orchestration tool surface.

## Recover visibly

1. For an Implementation Agent with no timely conclusion, wait once.
2. Request a checkpoint when no result arrives.
3. Allow one additional work interval after the checkpoint request.
4. Verifiable progress includes exact assigned files inspected, concrete edit locations identified, a patch in progress, changed files or diff, a validation command running, or a specific blocker requiring Main input.
5. An empty `git diff` during initial inspection is not, by itself, evidence of failure.
6. Stop and relaunch only when the agent gives no checkpoint after the additional interval, repeats broad discovery without narrowing, violates ownership, or reports no actionable progress.
7. After relaunch, apply the same checkpoint sequence once. Request user authorization for takeover only after both agents fail this full recovery sequence. Never replace a required role silently.

## Validate and report

Run the gates that match the changed surface. For visual work, perform browser QA across the applicable viewport matrix, including focus, keyboard, scroll, overflow, and reduced motion. Final reports list agents and handoffs, changed files, validations, unavailable checks, risks, and any authorized takeover.
