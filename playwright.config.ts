import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config'


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    /* Run tests in files in parallel */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: !!process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: !!process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    // This may need to be increased for different environments and applications.
    expect: { timeout: 15000 },
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        launchOptions: {
            args: ['--use-fake-device-for-media-stream'],
        },
        /* Base URL to use in actions like `await page.goto('/')`. */
        // This is used for both the API and the UI navigation
        // This can be overridden in tests for external api's should that be needed.
        baseURL: process.env.BASE_URL,
        //We need to make sure the TOKEN exists before setting the extraHTTPHeader for the API
        ...process.env.TOKEN ? {
            extraHTTPHeaders: {
                Authorization: process.env.TOKEN
            }
        } : {},
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true,
    },
    /* Configure projects for major browsers */
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
            name: 'Google Chrome',
            testIgnore: /.*UploadRepo.spec.ts/,
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chrome',
                // Use prepared auth state.
                storageState: './.auth/user.json',
            },
            dependencies: ['setup'],
        },
        {
            // We need to use firefox for upload tests
            name: 'Firefox',
            testMatch: [/.*UploadRepo.spec.ts/],
            use: {
                ...devices['Desktop Firefox'],  // Use prepared auth state.
                storageState: './.auth/user.json',
            },
            dependencies: ['setup'],
        },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] },
        // },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //     name: 'chromium',
        //     use: { ...devices['Desktop Chrome'] },
        // },
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },

    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
