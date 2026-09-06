import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:4178",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "PORT=4178 pnpm start",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
