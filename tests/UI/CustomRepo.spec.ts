import { describe } from 'node:test';
import { test, expect, type Page } from '@playwright/test';
import { navigateToRepositories } from './helpers/navHelpers';
import { deleteAllRepos } from './helpers/deleteRepositories';
import { closePopupsIfExist } from '../helpers/loginHelpers';


describe("Custom Repositories", () => {
    test("Clean - Delete any current repos that exist", async ({ page }) => {
        await deleteAllRepos(page)
    })

    test('Create two custom repositories', async ({ page }) => {
        await navigateToRepositories(page)

        const nameList = [
            'one',
            'current',
        ]

        //Do not use chain methods when using await (like foreach/map/etc..)
        for (const name of nameList) {
            await addRepository(page, name, 'https://jlsherrill.fedorapeople.org/fake-repos/revision/' + name)
        }
    });

    test('Delete one custom repository', async ({ page }) => {
        await navigateToRepositories(page)
        await closePopupsIfExist(page)

        if (await page.getByLabel('Kebab toggle').first().isDisabled()) throw Error("Kebab is disabled when it really shouldn't be")
        await page.getByLabel('Kebab toggle').first().click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await expect(page.getByText('Remove repositories?')).toBeVisible()
        await page.getByRole('button', { name: 'Remove' }).click();

        // Example of waiting for a successful api call
        await page.waitForResponse(resp => resp.url().includes('/api/content-sources/v1/repositories/bulk_delete') && resp.status() === 204)
    });
})


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
    await page.getByPlaceholder('Enter name').click()

    await page.getByPlaceholder('Enter name').fill(name);
    await page.getByPlaceholder('https://').fill(url);

    // These short timeouts are mostly to allow for animations to complete
    // And can prevent the test getting stuck at certain points due to too rapid automation
    // await page.waitForTimeout(100)

    await page.getByRole('button', { name: 'filter architecture' }).click()

    await page.getByRole('option', { name: 'x86_64' }).click();

    await page.getByRole('button', { name: 'filter version' }).click()

    await page.getByRole('menuitem', { name: 'el9' }).locator('label').click();
    await page.getByRole('menuitem', { name: 'el8' }).locator('label').click();
    await page.getByRole('button', { name: 'filter version' }).click();

    await page.getByRole('button', { name: 'Save' }).click()

    // Example of waiting for a successful api call
    await page.waitForResponse(resp => resp.url().includes('/api/content-sources/v1.0/repositories/bulk_create/') && resp.status() === 201)

    await expect(page.locator(`div[id^="pf-modal-part"]`).first()).not.toBeVisible()
}