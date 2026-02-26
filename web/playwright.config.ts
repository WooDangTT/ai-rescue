import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5050",
  },
  webServer: {
    command: "npm install && npm run dev",
    port: 5050,
    reuseExistingServer: !process.env.CI,
  },
});
