# MCP and Tool Choices

No optional context tool is required for this repository today. Prefer built-in shell search, repository docs, Playwright, and narrowly scoped agents until a recurring bottleneck is measured.

## Codex roles

The persistent role configuration is local and versioned in `docs/agents/codex/`; it adds no MCP server, connector, dependency, browser binary, or network permission. Roles inherit the parent tool surface. Read-only role files set a read-only sandbox default, but Main must keep the parent session compatible because a live parent sandbox override can be inherited by spawned agents. See `setup.md` for installation and `roles.md` for when to use each role.

| Option | Purpose and expected benefit | Complexity / risk | Data it may store | Recommendation |
| --- | --- | --- | --- | --- |
| RTK | Compress or structure terminal/repository context | Extra wrapper and operational convention; compression can omit decisive errors | Command inputs/outputs or summaries, depending on setup | Evaluate only after measuring repeated large-output cost; never treat savings as guaranteed |
| sqz | Condense context or command output | Another compression layer and possible loss of trace detail | Prompts, outputs, cached summaries depending on deployment | Defer; local bounded scripts cover current needs |
| Context-Mode | Manage retrieval and working context across tasks | Configuration, indexing, staleness, and privacy review | Repository indexes, chunks, metadata, possibly conversation context | Pilot only for a large repeated workstream with explicit retention settings |
| Serena | Semantic code navigation and persistent project memory | MCP setup, language-server/index maintenance, stale memories | Symbol index and project memories | Potentially useful as the codebase grows; test read-only on a narrow task first |
| Figma MCP | Read design files and metadata | External auth, source-of-truth drift, possible proprietary design exposure | Figma document metadata/assets subject to provider policy | Add only when an approved Figma file is an explicit input |

Before enabling any MCP, document owner, version, permissions, network destinations, retention, secret handling, failure mode, uninstall path, and the repository problem it solves. Do not install overlapping tools simultaneously.

Local helpers in `scripts/agent/` provide bounded repo summaries, changed-file lists, symbol search, and validation summaries. They never replace full error output when a command fails.
