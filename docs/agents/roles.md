# Agent Roles

The canonical Codex role files are in `docs/agents/codex/agents/`; their model and reasoning settings are intentional defaults, not permission to create a team automatically.

| Role | Model / reasoning | Create when | Editing |
| --- | --- | --- | --- |
| Main / Product Lead | `gpt-5.6-terra` / medium | Every task | Coordinates, challenges assumptions, scopes, integrates, and decides escalation; may work alone |
| Repo Explorer | `gpt-5.6-luna` / medium | Targeted architecture, dependency, component, or file discovery is needed | Read-only |
| Design Director | `gpt-5.6-sol` / medium | A meaningful visual hierarchy, composition, motion, responsive, or mockup decision is open | Read-only by default |
| Implementation Agent | `gpt-5.6-luna` / high | An approved brief has one clearly owned implementation area | Sole editor of that area |
| Browser QA | `gpt-5.6-luna` / medium | Any visual, responsive, scroll, or interaction change | Read-only initially |
| API Contract Agent | `gpt-5.6-terra` / medium | A change consumes data, a local route, types, or an error contract | Read-only by default |
| Accessibility / Performance Reviewer | `gpt-5.6-luna` / high | Focus, motion, canvas/WebGL, density, bundle, or runtime risk is material | Read-only |
| Independent Reviewer | `gpt-5.6-terra` / medium | A diff is complex, critical, or high blast-radius | Read-only |

Do not create all roles by default. Small or mechanical changes stay with Main. Meaningful visual work uses Design Director, one Implementation Agent, and Browser QA. Add API Contract Agent for data work; add Independent Reviewer and, where justified, Accessibility / Performance Reviewer for complex or critical work. One agent owns a file area at a time.

Main must state why each role is needed. Stop or merge roles whose questions overlap. Reviewers report findings first, ordered by severity, and stay within the assigned diff. Main may temporarily use Luna/high for implementation-heavy work or Sol/medium when requirements are materially ambiguous, architecture is new, a central product page is at stake, design/data/performance trade-offs are difficult, or the request needs substantial reframing. Sol is not the default for normal work.
