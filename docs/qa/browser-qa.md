# Browser QA

## Setup

```bash
npm ci
npx playwright install chromium
npm run qa:browser
```

`qa:browser` first checks that the project Chromium executable exists, then delegates the full run to Playwright. `playwright.config.ts` starts `npm run dev` on the fixed internal URL `http://127.0.0.1:3100`, uses the isolated `.next-playwright` output directory, waits for readiness, pipes server logs, applies a startup timeout, and shuts the process down. The isolated output avoids contention with a normal `.next/dev/lock`; Playwright does not silently reuse a process on the QA port. `PLAYWRIGHT_BASE_URL` is the explicit opt-in for an intentionally managed external server.

Do not start or stop a server manually, select another port, invoke Chromium directly, or repair browser locks during a QA run. The committed smoke test is deliberately content-light and checks homepage load, console/page errors, horizontal overflow, and deliberate screenshot capture across representative viewports.

CI execution remains a follow-up until the repository has an agreed GitHub Actions policy. When that policy exists, the minimum browser job should run:

```bash
npm ci
npx playwright install --with-deps chromium
npm run qa:frontend
```

No CI workflow is currently committed. A future CI job should call the same `qa:frontend` command rather than duplicate its steps.

## Infrastructure blockers

- A missing package/browser binary, blocked loopback, or occupied QA port fails before server startup with a `[qa:browser:infra]` message and the direct remediation.
- Missing system libraries or a browser sandbox restriction should be reported from Playwright's launch error; do not replace the runner or add process-management workarounds.
- Server startup output is piped into the run. A readiness timeout or early server exit is a startup/infrastructure failure, not a browser assertion.
- Application failures retain traces, screenshots, and video under `test-results/`; report the assertion or runtime error separately from infrastructure failures.

## Visual and interaction pass

- Page and primary content load without uncaught errors, hydration warnings, failed essential resources, or unexpected console errors.
- No horizontal overflow, clipped text, overlapping UI, broken max-width, unstable hover sizing, or unintended layout shift.
- Alignment, hierarchy, line length, data formatting, image/canvas framing, and contrast remain coherent from small mobile to wide desktop.
- Navigation and mobile menu open, close, trap/release focus appropriately, restore focus, and respond to Escape and outside interaction when intended.
- All controls work with keyboard and have visible focus. Tab order follows the visual/task order; sticky content does not cover focus.
- Touch targets, scrolling, drag/pan alternatives, and input behavior work without hover dependence.
- Loading, empty, error, timeout, unauthorized, retry, partial, and stale states are exercised for changed integrations. Do not simulate only happy-path data.
- Reduced motion preserves content and state while removing smooth scroll, parallax, pinning, loops, and large travel as appropriate.

## Evidence and triage

Record route, commit/diff state, browser, viewport, steps, expected/actual, severity, console excerpt, and screenshot/trace path. Use traces or video for timing/scroll defects; avoid large baseline suites until a stable visual-review policy exists.

Severity: `blocker` prevents the core task or exposes data/security; `high` breaks a major viewport/input/state; `medium` degrades comprehension or consistency; `low` is a bounded polish issue. Browser QA reports first and does not edit until Main assigns ownership.
