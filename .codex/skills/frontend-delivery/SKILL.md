---
name: frontend-delivery
description: Plan and deliver user-facing frontend work in this Next.js repository. Use for changes to React or Next components, Tailwind/CSS, layouts, responsive behavior, interaction, inputs or search, animation, visual accessibility, or frontend performance. Apply the repository's risk classification, knowledge gates, agent ownership, recovery, and browser-validation workflow.
---

# Frontend Delivery

Use this skill as a reusable workflow guide. Until repo-local skill discovery is verified and installed, enforce the same rules directly through `AGENTS.md` and `docs/agents/workflow.md`.

## Role gate

Before applying this workflow, determine whether the current agent is Main or a spawned role.

If the current prompt identifies the agent as Design Director, Implementation Agent, Browser QA, API Contract Agent, Accessibility/Performance Reviewer, or Independent Reviewer:

1. Do not run the Main orchestration workflow.
2. Do not classify the overall request again.
3. Do not inspect multi-agent tool availability.
4. Treat the spawn message or execution packet as authoritative.
5. Execute only the assigned role and return its handoff.

The remainder of this skill describes Main's orchestration workflow unless the role-specific instructions say otherwise. An Implementation Agent should not load the full skill as a prerequisite to executing an approved packet.

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

Main owns repository discovery, knowledge gates, role selection, and task decomposition. Before spawning an Implementation Agent, provide a compact execution packet containing the objective, approved file ownership, authoritative Design Director decisions, relevant contracts and invariants, exact acceptance checks, and known code locations. One editor owns a path area at a time.

Spawned agents execute only the role and assignment in their spawn message. They must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, request authorization for a single-agent fallback, reload the full workflow, reread broad documentation, or rescan the repository. An Implementation Agent should inspect only its assigned files and the minimum directly imported dependencies required to execute safely, then patch promptly, validate, and return its handoff.

## Recover visibly

1. For an Implementation Agent with no timely conclusion, wait once.
2. Request a checkpoint when no result arrives.
3. Allow one additional full work interval after the checkpoint request.
4. A checkpoint stating exact edit locations and no blocker counts as active, verifiable progress. After such a checkpoint, Main must allow the agent another full work interval without sending further prompts.
5. A subsequent checkpoint must add new evidence beyond the previous checkpoint, such as changed lines, a partial diff, a completed edit, a running validation, or a newly identified concrete blocker. Repeating the same planned edit locations does not count as continued progress.
6. Verifiable progress includes exact assigned files inspected, concrete edit locations identified, a patch in progress, changed files or diff, a validation command running, a specific blocker requiring Main input, an active checkpoint, or a completed handoff.
7. An empty `git diff` observed by Main while an agent is active is not, by itself, evidence of failure and must not be the primary progress criterion.
8. Main must not close an agent merely because no completion event arrived in the immediately following wait. “Conversation interrupted” is an execution interruption, not evidence that the agent was idle or incapable. Relaunch with the existing execution packet and no additional discovery instructions.
9. Stop and relaunch only when the agent gives no checkpoint after the additional interval, repeats broad discovery without narrowing, violates ownership, or reports no actionable progress.
10. After relaunch, apply the same checkpoint sequence once. Request user authorization for takeover only after both agents fail this full recovery sequence. Never replace a required role silently.

## Validate and report

Run the gates that match the changed surface. For visual work, perform browser QA across the applicable viewport matrix, including focus, keyboard, scroll, overflow, and reduced motion. Final reports list agents and handoffs, changed files, validations, unavailable checks, risks, and any authorized takeover.
