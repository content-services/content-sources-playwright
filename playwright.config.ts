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
            ['list'],
            [
                'playwright-ctrf-json-reporter',
                { useDetails: true, outputDir: 'playwright-ctrf', outputFile: 'playwright-ctrf.json' },
            ],
            ['html', { outputFolder: 'playwright-report' }],
        ]
        : 'list',
    timeout: process.env.CI ? 60000 : 30000,
    expect: { timeout: process.env.CI ? 30000 : 20000 },
    use: {
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
        trace: 'on-first-retry',
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
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],
});
