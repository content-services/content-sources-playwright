import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        [
          "playwright-ctrf-json-reporter",
          {
            useDetails: true,
            outputDir: "playwright-ctrf",
            outputFile: "playwright-ctrf.json",
          },
        ],
        ["html", { outputFolder: "playwright-report" }],
        ["@currents/playwright"],
      ]
    : "list",
  timeout: process.env.CI ? 60000 : 30000,
  expect: { timeout: process.env.CI ? 60000 : 20000 },
  use: {
    testIdAttribute: "data-ouia-component-id",
    launchOptions: {
      args: ["--use-fake-device-for-media-stream"],
    },
    ...(process.env.TOKEN
      ? {
          extraHTTPHeaders: {
            Authorization: process.env.TOKEN,
          },
        }
      : {}),
    baseURL: process.env.BASE_URL,
    trace: "on",
    screenshot: "on",
    video: "on",
    ignoreHTTPSErrors: true,
    ...(process.env.PROXY
      ? {
          proxy: {
            server: process.env.PROXY,
          },
        }
      : {}),
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "AdminTests", // 'Run admin user tests',
      grepInvert: [/read-only/], // !!process.env.PROD ? [/preview-only/, /switch-to-preview/],  ] : [/switch-to-preview/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: `./.auth/${process.env.ADMIN_USERNAME}.json`, // Thise is setting the cookies
      },
      dependencies: ["setup"],
    },
    {
      name: "SwitchToUser2",
      testMatch: /.switchToUser2\.setup\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "ReadOnlyTests", // 'Run read-only user tests',
      grep: [/read-only/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: `.auth/${process.env.READONLY_USERNAME}.json`,
      },
      dependencies: ["SwitchToUser2"],
    },
  ],
});
