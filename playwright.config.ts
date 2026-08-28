import { defineConfig, devices } from '@playwright/test'

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim()
const baseURL = externalBaseUrl || 'http://127.0.0.1:3100'
const stubBaseUrl = `http://127.0.0.1:${process.env.E2E_BACKEND_STUB_PORT || 3101}`

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // The fixture backend starts first: the Market Universe page fetches its atlas
  // server-side, so the Next server must be able to reach it from the first
  // request. It serves repository-owned synthetic data only, and needs no
  // credentials and no external host.
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: 'node scripts/e2e-backend-stub.mjs',
          url: `${stubBaseUrl}/health`,
          reuseExistingServer: false,
          timeout: 30_000,
          stdout: 'pipe',
          stderr: 'pipe',
          gracefulShutdown: {
            signal: 'SIGTERM',
            timeout: 5_000,
          },
        },
        {
          command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
          env: {
            NEXT_DIST_DIR: '.next-playwright',
            BACKEND_BASE_URL: stubBaseUrl,
            // Not a credential. The proxy routes require this to be present
            // before they will call upstream at all; the fixture backend never
            // reads it. No real secret is involved and nothing external is
            // reachable with it.
            BACKEND_SHARED_SECRET: 'e2e-fixture-not-a-secret',
          },
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
          gracefulShutdown: {
            signal: 'SIGTERM',
            timeout: 5_000,
          },
        },
      ],
})
