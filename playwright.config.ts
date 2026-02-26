import { defineConfig } from "@playwright/test";

const PORT = 5050;

export default defineConfig({
  testDir: "./e2e",
  globalTimeout: 300000,
  timeout: 60000,
  retries: 0,
  expect: { timeout: 10000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: `npm install && npx next dev --hostname 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
