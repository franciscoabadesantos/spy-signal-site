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

Give every agent a compact brief with objective, constraints, exact paths, expected output, and response limit. One editor owns a path area at a time.

## Recover visibly

1. Wait once for the assigned result.
2. Request a checkpoint when no result arrives.
3. Require evidence of progress: inspected paths, changed files/diff, command in progress, or a concrete blocker.
4. Stop and relaunch once with reduced scope when evidence is absent.
5. After that recovery fails, report the block and ask the user before Main takes ownership. Never replace a required role silently.

## Validate and report

Run the gates that match the changed surface. For visual work, perform browser QA across the applicable viewport matrix, including focus, keyboard, scroll, overflow, and reduced motion. Final reports list agents and handoffs, changed files, validations, unavailable checks, risks, and any authorized takeover.
