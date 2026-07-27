import { defineConfig, devices } from "@playwright/test";

/** Overridable so the suite can dodge a port that is already taken locally. */
const port = Number(process.env.E2E_PORT) || 3100;
const baseURL = `http://127.0.0.1:${port}`;
const unitTests = /content-mapping\.spec\.ts/;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    // Pure mapping tests - no browser, so they run once instead of per device.
    { name: "unit", testMatch: unitTests },
    {
      name: "chromium",
      testIgnore: unitTests,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: unitTests,
      use: { ...devices["Pixel 5"] },
    },
  ],
});
