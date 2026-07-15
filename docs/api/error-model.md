# Current Error Model

The repository does not yet have a uniform public error envelope. Consumers must follow the exact route contract and should not assume every failure is a non-2xx `{error}` response.

## Observed forms

- JSON `{error: string}` or `{ok: false, error: string}` with 4xx/5xx.
- Ticker onboarding intentionally maps some backend failure modes to HTTP 200 or 202 with a `status` value.
- Analytics intentionally returns 204 when configuration or upstream delivery fails, after logging server-side.
- Export returns CSV on success and JSON on failure.
- AI analyst returns JSON before stream setup and SSE after setup.
- Server helpers throw `BackendDataError` with `context`, message, and nullable upstream status; the default timeout is 9 seconds.

## Frontend handling

For each integration, distinguish loading, empty, invalid/malformed payload, unauthorized/forbidden, not found, upstream error, timeout, aborted request, offline/unreachable, and retry success where relevant. Keep the last trustworthy state only when the product behavior supports it. Announce actionable errors accessibly and never expose internal secrets or raw upstream bodies.

Do not globally normalize existing routes as part of a frontend feature. A future error-envelope migration needs backend/frontend ownership, compatibility strategy, observability requirements, and contract tests.

When adding a new documented contract, specify status code, content type, stable machine code if present, user-safe message policy, retryability, timeout behavior, and partial-data semantics. Mark every unknown explicitly.
