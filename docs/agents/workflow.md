# Adaptive Agent Workflow

Use the smallest team that materially lowers risk. Main remains accountable for scope, integration, validation, and the final report.

## Classify the work

Classify frontend work before delegation or editing.

| Level | Criteria | Required roles |
| --- | --- | --- |
| Trivial | Mechanical, one file, no user-visible layout, interaction, data, motion, or accessibility change | Main plus focused validation |
| Significant | Any user-facing visual, responsive, interaction, input/search, animation, or visual accessibility change | Design Director → Implementation Agent → Browser QA |
| Critical | Significant work with data/API, focus/motion/canvas/runtime risk, or high blast radius | Significant roles plus every role whose trigger is present: API Contract for data/API, Accessibility/Performance for focus/motion/canvas/runtime, Independent Review for high blast radius |

Do not inflate routine work into a full team. Do not downgrade a significant change merely to avoid delegation.

## Significant frontend work

1. Main defines the brief, protected files, acceptance criteria, and evidence needed.
2. Design/Research reviews the current UI and references without editing. It returns at most ten findings tied to files or screenshots.
3. Implementation is the only editor for the assigned area. It receives the brief, confirmed repository patterns, and API contracts, not the whole exploration transcript.
4. Browser QA validates the running result without editing initially. It returns reproducible defects with viewport, steps, evidence, and severity.
5. Main reviews the diff, assigns targeted corrections to the current editor where possible, reruns relevant checks, and reconciles the final diff.

## Critical frontend work

Main acts as Product Lead. Add every role whose risk trigger is present: Repo Architect for cross-boundary impact, Design Director for a new visual composition, Research for external evidence, API Contract for runtime data, one Implementation editor and Browser QA for significant work, Accessibility/Performance for focus/motion/canvas/runtime risk, and Independent Review for high blast radius.

Do not create every role by default. A role should answer a distinct question that Main cannot answer as efficiently in the current context.

## Context, ownership, and recovery

- Give each agent only: objective, constraints/non-goals, exact paths/symbols, expected output, and response limit. Do not send the full conversation, raw exploration, or extensive reports.
- Repo Explorer reads the supplied architecture paths. Design reads the target view, `app/globals.css`, primitives, and `docs/design`. API Contract reads the consumer, route/helper, types, `DATA_SOURCE_POLICY.md`, and `docs/api`. QA reads the brief, diff, and `docs/qa`.
- Declare file ownership before edits. One implementation agent owns a target area; no other agent edits it until handoff is accepted.
- Ownership is temporary. It ends when the agent hands off, reports a blocker, is stopped after the recovery protocol, or the user explicitly authorizes Main to take over.
- Research and review agents are read-only unless Main explicitly transfers ownership after the previous editor stops.
- Deliver results with `handoff-template.md`. Link evidence; do not paste large source files, logs, screenshots, or the original request.
- Main stops an agent as soon as its question overlaps another agent's completed or active work. Use the persistent role defaults in `roles.md`; do not substitute Sol for routine execution or QA.

### Recovery protocol

1. Wait once for the assigned outcome.
2. If there is no conclusion, request a checkpoint.
3. Accept only verifiable progress: inspected paths, changed files or diff, a command in progress, or a concrete blocker.
4. If progress is absent, stop the agent and relaunch once with fewer paths, a narrower outcome, and no additional exploration.
5. If recovery also fails, report the blocker and request explicit user authorization before Main takes ownership. Never substitute silently for a role required by the classification.

State agent status and handoffs in the final report, including unavailable validation and any authorized takeover.

## Value check

A subagent was useful if it produced at least one of: a confirmed repo fact, a caught defect, a resolved design/API decision, independent browser evidence, or measurable critical-path savings. Record duplicated work, excessive context, or findings without evidence and reduce delegation next time.
