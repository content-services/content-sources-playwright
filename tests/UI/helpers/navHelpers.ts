import { expect, type Page } from "@playwright/test";

export const navigateToRepositories = async (page: Page) => {
    await page.goto('/insights/content/repositories');

    const zeroState = page.locator("div.pf-v5-l-grid__item.bannerBefore > div > div.pf-v5-u-pt-lg > h1")
    const repositoriesListPage = page.getByText("View all repositories within your organization.")

    // Wait for either list page or zerostate
    await expect(async () => {
        return expect(repositoriesListPage.or(zeroState)).toBeVisible()
    }).toPass();
    if (await zeroState.isVisible()) {
        await page.getByRole('button', { name: 'Add repositories now' }).click();
    }
}
