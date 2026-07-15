# Agent Development Setup

## Prerequisites

- Git and a configured Git identity.
- Node.js matching `.nvmrc` (`20.19.0`) or a compatible newer release; `package.json` currently permits `>=20.9.0`.
- npm and project dependencies installed with `npm ci`.
- Codex CLI and any local sandbox such as bubblewrap, configured outside the repository.

Run:

```bash
npm ci
npx playwright install chromium
./scripts/check-agent-environment.sh
npm run dev
```

Copy variable names from `.env.example` into `.env.local` and obtain values through the team's approved secret channel. Never commit `.env.local`, tokens, cookies, browser storage, or credentials.

## Stored in Git

`AGENTS.md`, documentation, API contracts and request records, briefs and decisions, feature status files, scripts, test configuration, and non-secret fixtures belong in Git.

## Local only

Codex authentication, CLI preferences, bubblewrap/sandbox policy, actual environment values, Node installation, Playwright browser binaries, MCP configuration and indexes, tokens, Clerk/Stripe/backend credentials, GitHub permissions, and optional tool caches remain local.

Browser binaries are intentionally not installed by `npm ci`. Install only the required project with `npx playwright install chromium`; CI may need OS dependencies via `npx playwright install --with-deps chromium`.

Use `docs/features/_template/status.md` when work must continue on another computer. Confirm Git state, environment check, and the feature's last validation before editing.

## Codex role setup

The versioned source of truth is `docs/agents/codex/`. On a normal trusted clone, install it as the project-local Codex layer before starting a new Codex session:

```bash
mkdir -p .codex
cp docs/agents/codex/config.toml .codex/config.toml
cp -R docs/agents/codex/agents .codex/agents
codex --strict-config -C .
```

If `.codex` already exists as a non-directory, stop and preserve it; resolve that local conflict before installing this project layer. Do not delete an unknown user file to make room for the directory.

Do not copy this configuration to `~/.codex`: it is repository-specific. The root config sets Main to `gpt-5.6-terra` with medium reasoning. It caps concurrent agent threads at 3 and nesting depth at 1. The role tables point to stable TOML files in `.codex/agents/`.

Codex accepts the model identifiers syntactically, but actual availability is controlled by the authenticated workspace and its model catalog. Check the assigned model in subagent activity after a real spawn; do not treat a successful TOML parse as proof of entitlement.

Start a new Codex session after installing or changing the files. To use a role, Main explicitly asks to spawn the named role with its compact brief: `repo_explorer`, `design_director`, `implementation_agent`, `browser_qa`, `api_contract_agent`, `accessibility_performance_reviewer`, or `independent_reviewer`. These identifiers use underscores because Codex CLI v0.144.4 rejects hyphens in spawned agent names. Inspect the subagent activity/details (or CLI `/agent`) to confirm its role and assigned model. The role file is also the auditable source for `model` and `model_reasoning_effort`.

For a temporary Main override, use `codex -m gpt-5.6-luna -c 'model_reasoning_effort="high"'` for implementation-heavy work, or `codex -m gpt-5.6-sol -c 'model_reasoning_effort="medium"'` for the escalation cases in `roles.md`. These flags win over project defaults and affect only that session.

Role sandbox defaults are recorded in each role file: every role is read-only except `implementation-agent`, which is `workspace-write`. Codex can reapply a parent session's live sandbox override to children, so Main must also select a compatible parent permission mode and enforce file ownership; the role file is not a substitute for that runtime control.
