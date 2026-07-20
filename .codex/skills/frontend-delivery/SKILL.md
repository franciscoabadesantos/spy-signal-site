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

## Select roles by value and risk

- Main may discover and implement a localized change directly when it is confined to one surface or a small file set, reuses an existing pattern, adds no complex architecture or state, has limited blast radius, and needs no new visual direction. This includes spacing, overflow, cursor, copy, small responsive adjustments, applying an existing visual pattern, localized interactions, and a motion correction whose cause is confirmed, architecture is unchanged, and state or focus management is not made more complex.
- Homepage dropdown work is not significant by default. Classify it as significant when it introduces a new composition, interaction, responsive behavior, visual direction, or comparable risk; an existing easing or trajectory correction may remain localized.
- For a substantial visual decision, new composition or motion choreography, multiple breakpoints, or non-trivial pattern adaptation, use Design Director when a read-only brief will reduce real uncertainty. Main may remain the implementer. Spawn a separate Implementation Agent only for a concrete delegation benefit or isolated ownership.
- For a page or flow redesign, multiple surfaces, complex interaction/state, focus management, complex motion, canvas, performance risk, data/API contracts, high blast radius, or an ambitious visual request without a strong internal reference, require the specialists that address the actual risks. A complete specialist pipeline may be appropriate; do not add roles based only on the generic label “visual change”.
- Tie API Contract to data/API risk, Accessibility/Performance to focus/motion/canvas/runtime or performance risk, Independent Review to high blast radius or residual uncertainty, and Browser QA Agent to a concrete need for independent browser evidence.

Use the relevant canonical validation commands for every classification. Running `qa:browser` is not the same as spawning a Browser QA Agent and does not require one.

Main owns repository discovery, knowledge gates, role selection, task decomposition, and may own implementation. Before spawning an Implementation Agent, provide a compact execution packet containing only the role and approved paths, objective, 5–8 authoritative decisions, contracts/invariants, acceptance checks and focused validation, output format, and known code locations. One editor owns a path area at a time.

Spawned agents execute only the role and assignment in their spawn message. They must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, request authorization for a single-agent fallback, reload the full workflow, reread broad documentation, or rescan the repository. An Implementation Agent should inspect only its assigned files and the minimum directly imported dependencies required to execute safely, then patch promptly, validate, and return its handoff.

## Conditional visual acceptance

- Run a visual acceptance gate for significant visual changes, commercial surfaces, claims about hierarchy or perceptibility, tasks with a previously rejected visual result, or residual visual uncertainty. Keep technical correctness and visual acceptance separate: passing technical checks alone does not justify declaring visual polish complete.
- Compare before and after evidence captured with the same viewport, state, content, theme, and scroll position. Main may perform this comparison for localized, objective changes. For redesigns, pricing, homepage, hierarchy changes, or subjective outcomes, use an independent read-only reviewer when it adds value; it is not mandatory by default.
- Keep an independent reviewer blind to implementation. Provide only the before and after screenshots, visual objective, primary user action, elements to preserve, captured viewport and state, and an internal reference when applicable. Do not provide the diff, changed CSS properties, passing tests, or the implementer's explanation or defense.
- Ask the reviewer to assess only the visible result, avoid proposing a redesign by default, and allow `PASS` with no findings. Require this compact output and never require three findings:

```text
Verdict: PASS | NOT YET
Perceptible change: yes | weak | no
Findings: 0-3
- Evidence
  Impact
  Severity
  Regression | pre-existing | insufficient result
```

## Rejection recovery

- Distinguish polish on an accepted direction from rejection that the result is wrong, unchanged, or worse. Treat a rollback request or evidence that the assumed cause is wrong as rejection.
- After the first rejection, stop editing and diagnose before another attempt. Inspect the actual runtime element, relevant computed styles, competing rules, current diff, and reload/cache state; distinguish adjacent mechanisms such as pointer cursor, text I-beam, input caret, hover, focus, and background contrast.
- Preserve the last accepted baseline. If the result became worse, revert only the rejected attempt. If asked to restore the original, restore it exactly from recorded evidence instead of reconstructing it from memory or broadly resetting a dirty worktree.
- Test one causal hypothesis per attempt and do not change adjacent properties without evidence. After two consecutive rejections, freeze edits and request focused clarification or use an independent read-only reviewer when it can provide concrete evidence.
- Treat canonical QA commands as technical validation, not proof of visual acceptance or causal correctness.

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

Run the gates that match the changed surface. For visual work, perform browser QA across the applicable viewport matrix, including focus, keyboard, scroll, overflow, and reduced motion. Final reports list any agents and handoffs used, changed files, validations, unavailable checks, risks, and any authorized takeover.
