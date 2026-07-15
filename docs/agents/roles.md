# Agent Roles

| Role | Create when | Reads | Editing |
| --- | --- | --- | --- |
| Main / Product Lead | Every task | Scope, Git state, relevant code/docs | Coordinates; may be the sole editor |
| Repo Architect | Multiple route groups, shared shells, data boundaries, or dependencies are affected | `app/`, relevant `components/`, `lib/`, configs | Read-only by default |
| Design Director | A page composition or visual system decision is open | Target UI, `app/globals.css`, `components/ui`, `docs/design` | Read-only; hands a brief to Implementation |
| Research Agent | Current external evidence or references are genuinely needed | Narrow question and approved sources | Read-only; records provenance and transformed principles |
| API Contract Agent | A feature consumes or requests data | Consumer, `app/api`, relevant `lib`, types, `DATA_SOURCE_POLICY.md`, `docs/api` | Documentation only if assigned; never changes backend contracts implicitly |
| Implementation Agent | The scoped solution is ready to build | Accepted brief, exact files, relevant types/tests | Sole editor of the assigned area |
| Browser QA | Any visual, responsive, scroll, or interaction change | Brief, diff, `docs/qa` | Read-only initially; reports reproducible defects |
| Accessibility / Performance | Complex focus, canvas, motion, data density, or performance risk | Rendered UI, relevant code, browser evidence | Read-only review |
| Independent Reviewer | Complex or high-blast-radius diff before completion | Diff and acceptance criteria only | Read-only |

Main must state why each role is needed. Stop or merge roles whose questions overlap. Reviewers report findings first, ordered by severity, and stay within the assigned diff.
