import { defineConfig, devices } from '@playwright/test';

const CLIENT_URL = process.env.E2E_CLIENT_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'e2e',
  // Next.js compiles each page the first time it is opened in dev mode, so allow for that.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: CLIENT_URL,
    trace: 'retain-on-failure',
    // Optional: use an already-installed Chromium instead of the one Playwright downloads.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: CLIENT_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
