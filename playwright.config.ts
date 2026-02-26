import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./web/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5050",
  },
  webServer: {
    command: "npm run dev",
    port: 5050,
    cwd: "./web",
    reuseExistingServer: !process.env.CI,
  },
});
