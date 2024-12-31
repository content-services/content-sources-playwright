import { test, expect, chromium, type Browser, type Page } from '@playwright/test';
import { navigateToRepositories, waitForLocatorThenClick } from './helpers/navHelpers';

test.beforeEach(async ({ page }) => {
    await deleteAllRepos(page)
})

test.afterEach(async ({ page }) => {
    await deleteAllRepos(page)
})

test('Create custom repositories', async ({ page }) => {
    await navigateToRepositories(page)

    const nameList = [
        'one',
        'current',
        //can uncomment below to add 3 more repos
        // 'two',
        // 'three', 
        // 'four'
    ]

    //Do not use chain methods when using await (like foreach/map/etc..)
    for (const name of nameList) {
        await addRepository(page, name, 'https://jlsherrill.fedorapeople.org/fake-repos/revision/' + name)
    }
});


const deleteAllRepos = async (page: Page) => {
    await navigateToRepositories(page)

    // Delete all repos
    while (await page.getByLabel('Kebab toggle').first().isVisible()) {
        await page.getByLabel('Kebab toggle').first().click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await expect(page.getByText('Remove repositories?')).toBeVisible()
        await page.getByRole('button', { name: 'Remove' }).click();

        // Example of waiting for a successful api call
        await page.waitForResponse(resp => resp.url().includes('/api/content-sources/v1/repositories/bulk_delete/') && resp.status() === 204)
    }

    await expect(async () => {
        return expect(page.getByText('To get started, create a custom repository')).toBeVisible()
    }).toPass();
}

const addRepository = async (page: Page, name: string, url: string) => {
    // Close toast messages if present (they can get in the way)
    if (await page.locator(`button[aria-label="close-notification"]`).isVisible()) {
        await page.locator(`button[aria-label="close-notification"]`).click()
    }
    await page.getByRole('button', { name: 'Add repositories' }).first().click();
    // An example of a partial matching locator 
    // note the "first()" as the modal has children with the same starting id
    await expect(page.locator(`div[id^="pf-modal-part"]`).first()).toBeVisible()

    // An example of a custom method that accepts a locator
    await waitForLocatorThenClick(page.getByPlaceholder('Enter name'))

    await page.getByPlaceholder('Enter name').fill(name);
    await page.getByPlaceholder('https://').fill(url);

    // These short timeouts are mostly to allow for animations to complete
    // And can prevent the test getting stuck at certain points due to too rapid automation
    // await page.waitForTimeout(100)

    await waitForLocatorThenClick(page.getByRole('button', { name: 'filter architecture' }))

    await page.getByRole('option', { name: 'x86_64' }).click();

    await waitForLocatorThenClick(page.getByRole('button', { name: 'filter version' }))

    await page.getByRole('menuitem', { name: 'el9' }).locator('label').click();
    await page.getByRole('menuitem', { name: 'el8' }).locator('label').click();
    await page.getByRole('button', { name: 'filter version' }).click();

    await waitForLocatorThenClick(
        page.getByRole('button', { name: 'Save' })
    )

    // Example of waiting for a successful api call
    await page.waitForResponse(resp => resp.url().includes('/api/content-sources/v1.0/repositories/bulk_create/') && resp.status() === 201)

    await expect(page.locator(`div[id^="pf-modal-part"]`).first()).not.toBeVisible()
}