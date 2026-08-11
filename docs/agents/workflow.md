# Adaptive Work → Codex Workflow

Main's first responsibility is **Product Lead**: classify the path, secure any scope-changing decisions, and remain accountable for integration and reporting. Main may complete either path alone. Every specialist is conditional; a gate does not imply an agent.

## Path 1: lightweight engineering change

Use when work is bounded, follows established product/experience/contract decisions, and does not change user journeys, data meaning, visual direction, entitlement, or scope.

1. Record a compact objective, owned area, invariants, and non-goals. The product-change issue and implementation packet are optional.
2. Inspect the target and minimum dependencies. Apply the established pattern.
3. Run proportional canonical validation and review the diff.
4. Report technical evidence, deviations, blockers, and any human acceptance that remains applicable.

Technical validation is mandatory. Product, visual, Preview, Browser QA, API Contract, release, and outcome gates are conditional on the change; mark non-applicable items with a reason.

## Path 2: meaningful product change

Use when work changes behavior, a journey, semantics, visual direction, entitlement, or material scope.

1. Product Lead completes `.github/ISSUE_TEMPLATE/product-change.md`: user evidence, desired outcome/non-goals, journey and states, responsive/accessibility behavior, semantic requirements, ownership, and acceptance tests.
2. Resolve all scope-changing product/data/contract questions. Discover backend contracts in the order in `AGENTS.md`; classify missing support with `system-topology.md`. An unresolved owned implementation gap may be recorded, but implementation cannot invent around it.
3. Create the compact inbound `implementation-packet.md`. This approved packet is the Work → Codex trigger and excludes the discovery transcript.
4. Implement within declared ownership. Escalate contradictions or packet requirements that would force invented product intent, data, or contract behavior.
5. Run the stronger applicable canonical check. For a frontend candidate, record the commit-addressed GitHub-connected Vercel Preview and evidence limited to affected routes, important states, and representative required viewports.
6. The founder records product and visual decisions; release acceptance is recorded separately. After release, link production/smoke and outcome evidence or declare the measurement limitation.

Approved product decisions, an owned boundary, verified contracts/owned gaps, invariants/non-goals, acceptance tests, technical CI, and explicit acceptance records are mandatory where applicable. Preview and visual acceptance may be N/A for non-visual/infrastructure work with a reason.

## Conditional specialist triggers

| Role | Use only when |
| --- | --- |
| Repo Explorer | Targeted cross-boundary discovery would resolve concrete uncertainty |
| Design Director | Meaningful visual direction, hierarchy, composition, motion, or responsive behavior is open |
| Implementation Agent | Isolated edit ownership/delegation adds value after packet approval |
| Browser QA | Independent browser evidence materially reduces risk or resolves residual uncertainty |
| API Contract Agent | Semantic ownership or contract behavior remains unresolved and risky |
| Accessibility / Performance Reviewer | Focus, motion, canvas, density, bundle, or runtime risk is material |
| Independent Reviewer | Complexity, criticality, or blast radius justifies independent review |

Running `qa:browser` does not require Browser QA. Data consumption does not automatically require API Contract Agent when authoritative evidence already resolves the contract. Do not create a mandatory sequence or team.

## Ownership and execution

- Main supplies only the compact packet and linked evidence. One editor owns an area at a time; reviewers are read-only unless ownership is explicitly transferred.
- A spawned role executes its assignment without restarting classification, orchestration, or broad discovery. It inspects only assigned files and minimum dependencies.
- Preserve unrelated changes and the last accepted baseline. On rejection, stop, diagnose the actual mechanism, restore an explicitly requested baseline from evidence, and test one causal hypothesis at a time.
- Infrastructure failures and packet/repository contradictions are reported exactly, not worked around by changing product or architecture decisions.
- Return `handoff-template.md`. Technical success can never be reported as product, visual, release, or outcome acceptance.

Detailed recovery is on demand: diagnose before retrying, do not interpret silence/timeouts as failure, and transfer ownership only after a terminal handoff or explicit stop. Escalate rather than duplicating active work.
