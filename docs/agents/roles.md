# Agent Roles

Executable model and reasoning defaults live only in `docs/agents/codex/config.toml` and its referenced role files. A role is conditional and never permission to create a team automatically.

| Role | Create when | Editing |
| --- | --- | --- |
| Main / Product Lead | Every task | Owns classification, approved decisions, scope, integration, validation, and escalation; may work alone |
| Repo Explorer | Targeted architecture, dependency, component, or file discovery is needed | Read-only |
| Design Director | A meaningful visual hierarchy, composition, motion, responsive, or mockup decision is open | Read-only by default |
| Implementation Agent | An approved packet has one clearly owned implementation area and delegation adds value | Sole editor of that area |
| Browser QA | Independent browser evidence would materially reduce risk or resolve residual uncertainty | Read-only initially |
| API Contract Agent | Semantic ownership or contract behavior remains unresolved after the discovery order, creating material data/contract risk | Read-only by default |
| Accessibility / Performance Reviewer | Focus, motion, canvas/WebGL, density, bundle, or runtime risk is material | Read-only |
| Independent Reviewer | A diff is complex, critical, or high blast-radius and independent review adds value | Read-only |

Do not create all roles by default. Main states the concrete question each selected role resolves and stops overlapping work. One editor owns a file area at a time. Reviewers report evidence-backed findings by severity; passing specialist or technical checks does not grant product, visual, or release acceptance.
