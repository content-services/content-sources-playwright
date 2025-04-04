import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI
        ? [
            [
                'playwright-ctrf-json-reporter',
                { useDetails: true, outputDir: 'playwright-ctrf', outputFile: 'playwright-ctrf.json' },
            ],
            ['html', { outputFolder: 'playwright-report' }],
            ['@currents/playwright'],
        ]
        : 'list',
    timeout: process.env.CI ? 60000 : 30000,
    expect: { timeout: process.env.CI ? 60000 : 20000 },
    use: {
        testIdAttribute: 'data-ouia-component-id',
        launchOptions: {
            args: ['--use-fake-device-for-media-stream'],
        },
        ...(process.env.TOKEN
            ? {
                extraHTTPHeaders: {
                    Authorization: process.env.TOKEN,
                },
            }
            : {}),
        baseURL: process.env.BASE_URL,
        trace: 'on',
        screenshot: 'on',
        video: 'on',
        ignoreHTTPSErrors: true,
        ...process.env.PROXY ? {
            proxy: {
                server: process.env.PROXY,
            }
        } : {}
    },
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
            name: 'chromium',
            grepInvert: !!process.env.PROD ? [/preview-only/, /switch-to-preview/, /local-only/] : [/switch-to-preview/, /local-only/],
            use: {
                ...devices['Desktop Chrome'],
                storageState: `.auth/${process.env.USER1USERNAME}.json`,
            },
            dependencies: ['setup'],
        },
        ...!!process.env.PROD ?
            [{
                name: 'Switch to preview',
                grep: [/switch-to-preview/],
                use: {
                    ...devices['Desktop Chrome'],
                    storageState: `.auth/${process.env.USER1USERNAME}.json`,

                },
                dependencies: ['setup'],//'chromium',
            },
            {
                name: 'Run preview only',
                grep: [/preview-only/],
                use: {
                    ...devices['Desktop Chrome'],
                    storageState: `.auth/${process.env.USER1USERNAME}.json`,
                },
                dependencies: ['Switch to preview'],
            }] : [],
    ],
});
