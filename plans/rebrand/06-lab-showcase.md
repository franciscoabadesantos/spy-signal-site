# Plan 06 — Public lab, phase "showcase"

Depends on Plans 00, 01, 02. This plan puts the laboratory pillar on the public site as a **showcase**: curated experiments rendered as readable, shareable stories. User-created experiments (multi-tenant lab) are explicitly **later phases** — see Dependencies.

## Current state (verified across repos)

- **The real lab lives in backoffice + backend.** finance-backend exposes admin-scoped endpoints (`/analyst/research/experiments`, `/analyst/research/batches`, per-experiment events/artifacts, plus the registry lifecycle: candidates, readiness, bundles, promotions, monitoring). Capabilities are catalog-driven (materialized by ml-lab via `ml_lab_capabilities_path`). spy-signal-backoffice's Research console submits cross-sectional experiments over axes: label, model, horizon days, top-K, feature sets, universe, walk-forward windows.
- **The frontoffice already has a `/models` scaffold** (`components/models/`: ModelsHubClient, ModelBuilderClient, ModelDetailClient, ModelCompareClient) running entirely on sample data (`lib/model-samples`), not connected to the backend lab. `/community` is a crowd-watchlist page, not the lab.
- Everything under `/analyst/*` is single-tenant admin; there is no user isolation, quota, or public read model.

## Product framing

Public users don't see "labels/horizons/walk-forward" — they see **theories and verdicts**. The translation layer:

> **Theory** ("does momentum carry European banks?") → **Test** (the config that ran, in plain language, full config inspectable) → **Verdict** (what happened, stated honestly, charts + caveats).

Transparency rule: the raw config and artifacts are always one disclosure away — plain language is the default view, never a replacement for the truth.

## Scope (this phase)

1. **Lab hub route** (`/lab` — decide whether to rename `/models` or mount alongside and redirect; avoid two competing entries in nav). Hero line (Plan 01 voice) + gallery of **curated experiment cards** (TickerCard-family styling): theory title, universe/period chips, verdict line, mini result chart.
2. **Experiment result page** — the shareable story: theory → test (plain-language summary of axes + "view full config" disclosure) → verdict (equity/metric charts from artifacts, honest caveats incl. decay/overfitting notes) → provenance footer (run date, data window, experiment id). OG/social meta so a shared link previews well. This page is the template later phases reuse for user experiments.
3. **Content pipeline for curation.** Owner curates in backoffice; frontoffice reads via **new public read endpoints** (see Dependencies) — no scraping of `/analyst/*` from the public site. Until endpoints exist, build against typed fixtures matching the agreed contract, flagged `NEXT_PUBLIC_ENABLE_LAB_SHOWCASE` (default off in prod).
4. **`/models` scaffold reconciliation.** The builder/compare scaffolds are good UX groundwork for the *creation* phase — keep the code, but unlink from nav while sample-data-driven (same no-fake-data rule as Plan 00). Sample model entry points on home/hub are removed.
5. **Nav + home integration.** "Lab" becomes a first-class nav item next to Markets; home Act "Experiment" (Plan 04) links here.

## Dependencies on other repos (for those agents; not this repo's work)

- **finance-backend**: public, cached, read-only endpoints, e.g. `GET /lab/showcase` (curated list) and `GET /lab/experiments/{id}/story` (summary + selected artifacts). Curation flag lives backend-side (e.g. `is_public` mark set from backoffice). No auth-side changes to `/analyst/*`.
- **spy-signal-backoffice**: a "publish to showcase" action on an experiment (pick artifacts, write the plain-language theory/verdict lines — owner-authored, not AI-generated).
- **Later phases (separate plans, not now):** guided theory-builder wizard for members (maps presets → catalog axes), per-user experiment submission with quotas/isolation in backend + orchestrator, community sharing/profiles.

## Acceptance criteria

1. With `NEXT_PUBLIC_ENABLE_LAB_SHOWCASE` on and fixtures/endpoints present: `/lab` gallery + result pages render in both themes; shared links carry OG previews.
2. Result page passes the "curious retail" read test: no undefined jargon above the disclosure fold.
3. Full config/artifacts reachable from every result page (transparency rule).
4. No sample/fake models reachable from nav or home; `/models` builder unlinked but code intact.
5. Contract for the two public endpoints documented in this repo (`docs/lab-contract.md`) and agreed with the finance-backend agent before UI work starts.
