import { defineConfig, devices } from "@playwright/test";

/** Overridable so the suite can dodge a port that is already taken locally. */
const port = Number(process.env.E2E_PORT) || 3100;
const baseURL = `http://127.0.0.1:${port}`;
const unitTests =
  /(content-mapping|content-source|trip-text|trip-studio-text|edit-access|edit-fields|edit-frame|edit-locale|edit-photos|edit-write)\.spec\.ts/;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  // Workeři schválně zůstávají na výchozí půlce jader. Zkoušené `100%` na
  // dvoujádrovém runneru testy nezrychlilo a rozhodilo scénáře, které měří
  // scroll a překreslení mapy. Běh se v CI dělí na runnery přes `--shard`.
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  // Projekt `unit` prohlížeč ani server nepotřebuje. Když jede sám, ušetří
  // `E2E_NO_SERVER` build a start webu, který by stejně nikdo neotevřel.
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
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
