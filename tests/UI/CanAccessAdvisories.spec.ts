import { test, expect } from '@playwright/test';
import { closePopupsIfExist } from '../helpers/loginHelpers';

test('Can navigate to other services', async ({ page }) => {
    await closePopupsIfExist(page)
    await page.goto('/insights/patch/advisories');
    await expect(async () =>
        expect(
            page.getByText('Get started with Insights by registering your systems with us.'),
        ).toBeVisible(),
    ).toPass();
});

