# Adaptive Agent Workflow

Use the smallest team that materially lowers risk. Main remains accountable for scope, integration, validation, and the final report.

## Main-agent orchestration rules

The following workflow applies only to the root/Main agent that received the user's request. A spawned role must skip the Main workflow and follow the execution rules below instead of restarting it.

## Classify the work and select roles

Classify frontend work before delegation or editing. Select a role only when it resolves concrete uncertainty, isolates ownership, adds independent evidence, or reduces risk.

| Level | Criteria | Role selection |
| --- | --- | --- |
| Localized | One surface or small file set; existing pattern; no complex architecture/state, new visual direction, or broad blast radius; includes a confirmed-cause motion correction within the existing architecture | Main may discover and implement directly, with focused canonical validation |
| Significant visual | Substantial visual decision, new composition or motion choreography, multiple breakpoints, or non-trivial pattern adaptation | Design Director when a brief reduces uncertainty; Main may implement; separate Implementation or Browser QA Agent only for a concrete delegation or independent-evidence need |
| High risk or ambitious | Page/flow redesign, multiple surfaces, complex state, focus management, complex motion, canvas, performance or API risk, high blast radius, or ambitious visuals without a strong internal reference | Use every specialist tied to an actual risk; a complete specialist pipeline may be required |

Localized examples include spacing, overflow, cursor, copy, small responsive adjustments, applying an existing visual pattern, localized interactions, and easing or trajectory corrections whose cause is confirmed. Homepage dropdown work is significant only when it adds new composition, interaction, responsive behavior, visual direction, or comparable risk. Do not inflate localized work into a team workflow solely because it is visible or involves motion. Running `qa:browser` is a validation command; it does not require spawning a Browser QA Agent. Independent review remains conditional on actual risk, residual uncertainty, or a concrete need for independent evidence.

## Localized and significant frontend work

1. Main owns repository discovery, knowledge gates, role selection, and task decomposition. Main defines the brief, protected files, acceptance criteria, and evidence needed.
2. Main may implement a localized or significant change directly while remaining the sole editor.
3. Use Design Director for a substantial visual decision; it reviews the current UI and references without editing and returns at most ten findings tied to files or screenshots.
4. Use a separate Implementation Agent only when delegation or isolated ownership adds value. It becomes the sole editor for the assigned area and receives a compact execution packet, not the exploration transcript.
5. Use Browser QA Agent when independent browser evidence adds value. It validates without editing initially and returns reproducible defects with viewport, steps, evidence, and severity.
6. Main reviews the diff, reruns the relevant canonical commands, and reconciles the final result.

## High-risk or ambitious frontend work

Main acts as Product Lead. Add every role whose risk trigger is present: Repo Architect for cross-boundary impact, Design Director for new visual direction or composition, Research for external evidence, API Contract for runtime data, Accessibility/Performance for focus/motion/canvas/runtime or performance risk, Browser QA Agent for independent browser evidence, and Independent Review for high blast radius. Use a separate Implementation Agent only when delegation or isolated ownership adds value.

Do not create every role by default. A role should answer a distinct question that Main cannot answer as efficiently in the current context.

## Rejection recovery

1. Distinguish polish on an accepted direction from rejection that the result is wrong, unchanged, or worse. Treat “restore the original”, “the cause is different”, and equivalent feedback as rejection or rollback, not as requests for another variant.
2. After the first rejection, stop editing and diagnose. Inspect the actual runtime element, relevant computed styles, competing rules, current diff, and reload/cache state; distinguish adjacent mechanisms before choosing another fix.
3. Preserve the last accepted baseline. Revert a result that became worse and restore an explicitly requested original exactly from recorded evidence; never reconstruct it from memory or broadly reset unrelated work.
4. Test one causal hypothesis per attempt. Do not edit adjacent properties without evidence. After two consecutive rejections, freeze edits and request focused clarification or use an independent read-only reviewer when it can add concrete evidence.
5. Use canonical QA commands for technical validation, but do not treat passing checks as proof of visual acceptance or causal correctness.

## Spawned-agent execution rules

- A spawned agent executes only the role and assignment in its spawn message.
- Receiving an execution packet means Main has already completed classification, knowledge gates, role selection, ownership assignment, and prerequisite reviews.
- A spawned agent must not reclassify the overall task, verify multi-agent availability, invoke other project roles, enforce the full delivery pipeline, or request authorization for a single-agent fallback.
- The absence of `multi_agent_v1__spawn_agent` inside a spawned agent is expected and irrelevant unless its assignment explicitly authorizes further delegation.
- Any role sequence selected by Main is orchestration for Main, not a prerequisite for an already-spawned role.
- A spawned agent must inspect only its assigned files and the minimum directly imported dependencies required to execute safely. It must not reload the full workflow, reread broad documentation, or rescan the repository unless the packet identifies a genuine unresolved question.
- An Implementation Agent with an approved packet edits promptly, validates, and returns its handoff.

## Context, ownership, and recovery

- Give each agent only the context needed for its role. The Implementation Agent receives the compact execution packet: objective, approved file ownership, authoritative design decisions, relevant contracts and invariants, exact acceptance checks, known code locations, expected output, and response limit. Do not send the full conversation, raw exploration, or extensive reports.
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

State agent status and handoffs in the final report when agents were used, including unavailable validation and any authorized takeover.

## Value check

A subagent was useful if it produced at least one of: a confirmed repo fact, a caught defect, a resolved design/API decision, independent browser evidence, or measurable critical-path savings. Record duplicated work, excessive context, or findings without evidence and reduce delegation next time.
