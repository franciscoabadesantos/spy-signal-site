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
