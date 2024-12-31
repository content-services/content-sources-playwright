import { test, expect, chromium, type Browser } from '@playwright/test';
import { closePopupsIfExist, convertProxyToPlaywrightFormat, logInWithUser1, logInWithUsernameAndPassword, logout } from '../helpers/loginHelpers';
import { waitInfinitely } from '../helpers/testHelpers';


test('Can navigate to other services', async ({ page }) => {
    await page.goto('/insights/patch/advisories');
    await closePopupsIfExist(page)
    await expect(async () =>
        expect(
            page.getByText('Get started with Insights by registering your systems with us.'),
        ).toBeVisible(),
    ).toPass();
});

