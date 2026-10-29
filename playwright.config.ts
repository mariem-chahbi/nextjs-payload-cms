import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Browser smoke tests (optional): pnpm test:e2e
 * Needs the stack running and seeded (docker compose up -d && pnpm seed), and a browser:
 *   pnpm exec playwright install chromium   — or use Edge/Chrome: E2E_CHANNEL=msedge pnpm test:e2e
 * Reuses a server already on :3000 (pnpm dev or pnpm start), otherwise starts `pnpm dev`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  // E2E_CHANNEL=msedge (or chrome) uses a browser already installed instead of downloading one.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHANNEL || undefined } }],
  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: true,
    url: 'http://localhost:3000/en',
    timeout: 300_000,
  },
})
