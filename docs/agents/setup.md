# Agent Development Setup

## Prerequisites

- Git and a configured Git identity.
- Node.js matching `.nvmrc` for reproducible local work; `package.json` records the supported minimum.
- npm and project dependencies installed with `npm ci`.

Run:

```bash
npm ci
npx playwright install chromium
./scripts/check-agent-environment.sh
npm run verify
npm run qa:browser
```

Copy variable names from `.env.example` into `.env.local` and obtain values through the team's approved secret channel. Never commit `.env.local`, tokens, cookies, browser storage, or credentials.

## Stored in Git

`AGENTS.md`, documentation, API contracts and request records, briefs and decisions, feature status files, scripts, test configuration, and non-secret fixtures belong in Git.

## Local only

Codex authentication, CLI preferences, bubblewrap/sandbox policy, actual environment values, Node installation, Playwright browser binaries, MCP configuration and indexes, tokens, Clerk/Stripe/backend credentials, GitHub permissions, and optional tool caches remain local.

Browser binaries are intentionally not installed by `npm ci`. Install only the required project with `npx playwright install chromium`; CI may need OS dependencies via `npx playwright install --with-deps chromium`.

Playwright owns the QA server lifecycle. Do not start `npm run dev` separately for browser QA; use `PLAYWRIGHT_BASE_URL` only when an existing external server is an intentional test target.

Use `docs/features/_template/status.md` when work must continue on another computer. Confirm Git state, environment check, and the feature's last validation before editing.

## Optional Codex adapter

The repository-local Codex profiles and skill are optional. They are not required for development, application tests, `npm run verify`, production builds, or browser QA. Codex users need the Codex CLI and any local sandbox such as bubblewrap configured outside the repository.

`docs/agents/codex/` is the versioned source of truth. `.codex/` is its versioned generated installation: do not edit its managed paths by hand. On a normal trusted clone, synchronize and verify the installation before starting a new Codex session:

```bash
npm run agents:sync
npm run agents:check
npm run test:agents
codex --strict-config -C .
```

`agents:sync` installs the versioned source, `agents:check` detects drift in the real project trees, and `test:agents` validates the synchronization mechanism. These commands are explicit adapter checks and are not part of the application or frontend gates. After changing `docs/agents/codex/`, run `agents:sync` followed by `agents:check`; run `test:agents` when changing the synchronizer or its tests.

If `.codex` already exists as a non-directory, stop and preserve it; resolve that local conflict before installing this project layer. Do not delete an unknown user file to make room for the directory.

Do not copy this configuration to `~/.codex`: it is repository-specific. `agents:sync` safely replaces each managed project path — `config.toml`, `agents/`, and `skills/` — using a temporary copy and rollback, so every replaced path exactly mirrors the source while unrelated files in `.codex/` are preserved. `agents:check` reports missing, modified, and unexpected managed files. The root `config.toml` defines Main's model and reasoning effort; use `npm run agents:check` to verify the installation. The role tables point to stable TOML files in `.codex/agents/`.

Codex accepts the model identifiers syntactically, but actual availability is controlled by the authenticated workspace and its model catalog. Check the assigned model in subagent activity after a real spawn; do not treat a successful TOML parse as proof of entitlement.

Start a new Codex session after `agents:sync` or any project-layer change so roles and skills are rediscovered. To use a role, Main explicitly asks to spawn the named role with its compact brief: `repo_explorer`, `design_director`, `implementation_agent`, `browser_qa`, `api_contract_agent`, `accessibility_performance_reviewer`, or `independent_reviewer`. These identifiers use underscores because Codex CLI v0.144.4 rejects hyphens in spawned agent names. Inspect the subagent activity/details (or CLI `/agent`) to confirm its role and assigned model. The role file is also the auditable source for `model` and `model_reasoning_effort`.

For a temporary Main override, use `codex -m gpt-5.6-luna -c 'model_reasoning_effort="high"'` for implementation-heavy work, or `codex -m gpt-5.6-sol -c 'model_reasoning_effort="medium"'` for the escalation cases in `roles.md`. These flags win over project defaults and affect only that session.

Role sandbox defaults are recorded in each role file: every role is read-only except `implementation-agent`, which is `workspace-write`. Codex can reapply a parent session's live sandbox override to children, so Main must also select a compatible parent permission mode and enforce file ownership; the role file is not a substitute for that runtime control.
