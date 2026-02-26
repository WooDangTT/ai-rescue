import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 5050;

export default defineConfig({
  testDir: './e2e/tests',
  globalTimeout: 300000,
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `python3 web/app.py`,
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 120000,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
