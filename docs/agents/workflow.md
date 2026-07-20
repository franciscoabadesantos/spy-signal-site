# Adaptive Agent Workflow

Use the smallest team that materially lowers risk. Main remains accountable for scope, integration, validation, and the final report.

## Main-agent orchestration rules

The following workflow applies only to the root/Main agent that received the user's request. A spawned role must skip the Main workflow and follow the execution rules below instead of restarting it.

## Classify the work

Classify frontend work before delegation or editing.

| Level | Criteria | Required roles |
| --- | --- | --- |
| Trivial | Mechanical, one file, no user-visible layout, interaction, data, motion, or accessibility change | Main plus focused validation |
| Significant | Any user-facing visual, responsive, interaction, input/search, animation, or visual accessibility change | Design Director → Implementation Agent → Browser QA |
| Critical | Significant work with data/API, focus/motion/canvas/runtime risk, or high blast radius | Significant roles plus every role whose trigger is present: API Contract for data/API, Accessibility/Performance for focus/motion/canvas/runtime, Independent Review for high blast radius |

Do not inflate routine work into a full team. Do not downgrade a significant change merely to avoid delegation.

## Significant frontend work

1. Main owns repository discovery, knowledge gates, role selection, and task decomposition. Main defines the brief, protected files, acceptance criteria, and evidence needed.
2. Design/Research reviews the current UI and references without editing. It returns at most ten findings tied to files or screenshots.
3. Implementation is the only editor for the assigned area. Before spawning it, Main provides a compact execution packet with the objective, approved file ownership, authoritative Design Director decisions, relevant contracts and invariants, exact acceptance checks, and known code locations. It receives that packet, not the whole exploration transcript.
4. Browser QA validates the running result without editing initially. It returns reproducible defects with viewport, steps, evidence, and severity.
5. Main reviews the diff, assigns targeted corrections to the current editor where possible, reruns relevant checks, and reconciles the final diff.

## Critical frontend work

Main acts as Product Lead. Add every role whose risk trigger is present: Repo Architect for cross-boundary impact, Design Director for a new visual composition, Research for external evidence, API Contract for runtime data, one Implementation editor and Browser QA for significant work, Accessibility/Performance for focus/motion/canvas/runtime risk, and Independent Review for high blast radius.

Do not create every role by default. A role should answer a distinct question that Main cannot answer as efficiently in the current context.

## Spawned-agent execution rules

- A spawned agent executes only the role and assignment in its spawn message.
- Receiving an execution packet means Main has already completed classification, knowledge gates, role selection, ownership assignment, and prerequisite reviews.
- A spawned agent must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, or request authorization for a single-agent fallback.
- The absence of `multi_agent_v1__spawn_agent` inside a spawned agent is expected and irrelevant unless its assignment explicitly authorizes further delegation.
- Design Director → Implementation Agent → Browser QA is an orchestration sequence for Main, not a prerequisite for an already-spawned role.
- A spawned agent must inspect only its assigned files and the minimum directly imported dependencies required to execute safely. It must not reload the full workflow, reread broad documentation, or rescan the repository unless the packet identifies a genuine unresolved question.
- An Implementation Agent with an approved packet edits promptly, validates, and returns its handoff.

## Context, ownership, and recovery

- Give each agent only the context needed for its role. The Implementation Agent receives the compact execution packet: objective, approved file ownership, authoritative Design Director decisions, relevant contracts and invariants, exact acceptance checks, known code locations, expected output, and response limit. Do not send the full conversation, raw exploration, or extensive reports.
- Repo Explorer reads the supplied architecture paths. Design reads the target view, `app/globals.css`, primitives, and `docs/design`. API Contract reads the consumer, route/helper, types, `DATA_SOURCE_POLICY.md`, and `docs/api`. QA reads the brief, diff, and `docs/qa`.
- Declare file ownership before edits. One implementation agent owns a target area; no other agent edits it until handoff is accepted.
- Ownership is temporary. It ends when the agent hands off, reports a blocker, is stopped after the recovery protocol, or the user explicitly authorizes Main to take over.
- Research and review agents are read-only unless Main explicitly transfers ownership after the previous editor stops.
- Deliver results with `handoff-template.md`. Link evidence; do not paste large source files, logs, screenshots, or the original request.
- Main stops an agent as soon as its question overlaps another agent's completed or active work. Use the persistent role defaults in `roles.md`; do not substitute Sol for routine execution or QA.

### Recovery protocol

1. For an Implementation Agent with no timely conclusion, wait once.
2. If there is no conclusion, request a checkpoint.
3. Allow one additional full work interval after the checkpoint request.
4. A checkpoint stating exact edit locations and no blocker counts as active, verifiable progress. After such a checkpoint, Main must allow the agent another full work interval without sending further prompts.
5. A subsequent checkpoint must add new evidence beyond the previous checkpoint, such as changed lines, a partial diff, a completed edit, a running validation, or a newly identified concrete blocker. Repeating the same planned edit locations does not count as continued progress.
6. Accept as verifiable progress: exact assigned files inspected, concrete edit locations identified, a patch in progress, changed files or diff, a validation command running, a specific blocker requiring Main input, an active checkpoint, or a completed handoff.
7. An empty `git diff` observed by Main while an agent is active is not, by itself, evidence of failure and must not be the primary progress criterion.
8. Main must not close an agent merely because no completion event arrived in the immediately following wait. “Conversation interrupted” is an execution interruption, not evidence that the agent was idle or incapable. Relaunch with the existing execution packet and no additional discovery instructions.
9. Stop and relaunch only when the agent gives no checkpoint after the additional interval, repeats broad discovery without narrowing, violates ownership, or reports no actionable progress.
10. After relaunch, apply the same checkpoint sequence once. If that full recovery sequence also fails, report the blocker and request explicit user authorization before Main takes ownership. Never substitute silently for a role required by the classification.

State agent status and handoffs in the final report, including unavailable validation and any authorized takeover.

## Value check

A subagent was useful if it produced at least one of: a confirmed repo fact, a caught defect, a resolved design/API decision, independent browser evidence, or measurable critical-path savings. Record duplicated work, excessive context, or findings without evidence and reduce delegation next time.
