# Adaptive Agent Workflow

Use the smallest team that materially lowers risk. Main remains accountable for scope, integration, validation, and the final report.

## Small change

Main inspects the affected area, edits, runs focused and repository gates, reviews the diff, and reports. Do not create subagents for mechanical or single-file work unless an independent review is unusually valuable.

## Meaningful visual work

1. Main defines the brief, protected files, acceptance criteria, and evidence needed.
2. Design/Research reviews the current UI and references without editing. It returns at most ten findings tied to files or screenshots.
3. Implementation is the only editor for the assigned area. It receives the brief, confirmed repository patterns, and API contracts, not the whole exploration transcript.
4. Browser QA validates the running result without editing initially. It returns reproducible defects with viewport, steps, evidence, and severity.
5. Main assigns or applies targeted corrections, reruns relevant checks, and reconciles the final diff.

## Full page or complex change

Main acts as Product Lead. Add only roles justified by the task: Repo Architect for cross-boundary impact, Design Director for a new visual composition, Research when external evidence is needed, API Contract when runtime data is involved, one Implementation editor, Browser QA, Accessibility/Performance review, and an Independent Reviewer.

Do not create every role by default. A role should answer a distinct question that Main cannot answer as efficiently in the current context.

## Context and ownership

- Give each agent only: objective, constraints/non-goals, exact paths/symbols, expected output, and response limit. Do not send the full conversation, raw exploration, or extensive reports.
- Repo Explorer reads the supplied architecture paths. Design reads the target view, `app/globals.css`, primitives, and `docs/design`. API Contract reads the consumer, route/helper, types, `DATA_SOURCE_POLICY.md`, and `docs/api`. QA reads the brief, diff, and `docs/qa`.
- Declare file ownership before edits. One implementation agent owns a target area; no other agent edits it until handoff is accepted.
- Research and review agents are read-only unless Main explicitly transfers ownership after the previous editor stops.
- Deliver results with `handoff-template.md`. Link evidence; do not paste large source files, logs, screenshots, or the original request.
- Main stops an agent as soon as its question overlaps another agent's completed or active work. Use the persistent role defaults in `roles.md`; do not substitute Sol for routine execution or QA.

## Value check

A subagent was useful if it produced at least one of: a confirmed repo fact, a caught defect, a resolved design/API decision, independent browser evidence, or measurable critical-path savings. Record duplicated work, excessive context, or findings without evidence and reduce delegation next time.
