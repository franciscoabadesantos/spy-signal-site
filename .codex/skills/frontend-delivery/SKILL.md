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

Main owns repository discovery, knowledge gates, role selection, and task decomposition. Before spawning an Implementation Agent, provide a compact execution packet containing only the role and approved paths, objective, 5–8 authoritative decisions, contracts/invariants, acceptance checks and focused validation, output format, and known code locations. One editor owns a path area at a time.

Spawned agents execute only the role and assignment in their spawn message. They must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, request authorization for a single-agent fallback, reload the full workflow, reread broad documentation, or rescan the repository. An Implementation Agent should inspect only its assigned files and the minimum directly imported dependencies required to execute safely, then patch promptly, validate, and return its handoff.

## Implementation-agent patience and recovery

- Implementation Agents should normally run uninterrupted after receiving an approved execution packet.
- A `wait_agent` timeout, an empty wait result, several minutes of silence, or an empty `git diff` observed while the agent is active do not indicate failure.
- Main must prefer waiting over polling, messaging, closing, relaunching, duplicating work, or requesting fallback.
- Do not request routine checkpoints. Request one only when the agent reports a blocker, violates ownership, restarts broad discovery, re-enters Main orchestration, explicitly cannot continue, or returns a terminal result without the required work. Do not request one solely because waits timed out, no diff is visible, or Main has no output.
- After an actionable checkpoint, send no further prompts and wait for the final handoff. Any subsequent checkpoint must add new evidence beyond the previous checkpoint, such as changed lines, a partial diff, a completed edit, a running validation, or a newly identified concrete blocker. Repeating the same planned edit locations does not count as continued progress.
- Do not close a quiet or timed-out agent unless there is strong evidence that it has failed, completed incorrectly, or become unrecoverable. A “conversation interrupted” state is not proof that the agent was idle or incapable.
- An implementation attempt fails only when the agent reaches a terminal state without the deliverable, reports an unrecoverable blocker, or repeatedly violates its assignment. Wait timeouts and silence do not consume an attempt.
- Only after a confirmed failed attempt may Main relaunch the same compact packet once, with no additional discovery instructions.
- Main may request user authorization for takeover only after two confirmed terminal failures, not after ambiguous timeouts or silence. Never replace a required role silently.

## Validate and report

Run the gates that match the changed surface. For visual work, perform browser QA across the applicable viewport matrix, including focus, keyboard, scroll, overflow, and reduced motion. Final reports list agents and handoffs, changed files, validations, unavailable checks, risks, and any authorized takeover.
