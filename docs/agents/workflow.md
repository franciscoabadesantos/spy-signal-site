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
3. Implementation is the only editor for the assigned area. Before spawning it, Main provides a compact execution packet containing only the role and approved paths, objective, 5–8 authoritative decisions, contracts/invariants, acceptance checks and focused validation, output format, and known code locations. It receives that packet, not the whole exploration transcript.
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

### Implementation-agent patience and recovery

- Implementation Agents should normally run uninterrupted after receiving an approved execution packet.
- A `wait_agent` timeout, an empty wait result, several minutes of silence, or an empty `git diff` observed while the agent is active do not indicate failure.
- Main must prefer waiting over polling, messaging, closing, relaunching, duplicating work, or requesting fallback.
- Do not request routine checkpoints. Request one only when the agent reports a blocker, violates ownership, restarts broad discovery, re-enters Main orchestration, explicitly cannot continue, or returns a terminal result without the required work. Do not request one solely because waits timed out, no diff is visible, or Main has no output.
- After an actionable checkpoint, send no further prompts and wait for the final handoff. Any subsequent checkpoint must add new evidence beyond the previous checkpoint, such as changed lines, a partial diff, a completed edit, a running validation, or a newly identified concrete blocker. Repeating the same planned edit locations does not count as continued progress.
- Do not close a quiet or timed-out agent unless there is strong evidence that it has failed, completed incorrectly, or become unrecoverable. A “conversation interrupted” state is not proof that the agent was idle or incapable.
- An implementation attempt fails only when the agent reaches a terminal state without the deliverable, reports an unrecoverable blocker, or repeatedly violates its assignment. Wait timeouts and silence do not consume an attempt.
- Only after a confirmed failed attempt may Main relaunch the same compact packet once, with no additional discovery instructions.
- Main may request user authorization for takeover only after two confirmed terminal failures, not after ambiguous timeouts or silence.

State agent status and handoffs in the final report, including unavailable validation and any authorized takeover.

## Value check

A subagent was useful if it produced at least one of: a confirmed repo fact, a caught defect, a resolved design/API decision, independent browser evidence, or measurable critical-path savings. Record duplicated work, excessive context, or findings without evidence and reduce delegation next time.
