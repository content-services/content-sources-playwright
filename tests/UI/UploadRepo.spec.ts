import { test, expect, type Page } from '@playwright/test';
import { navigateToRepositories } from './helpers/navHelpers';
import path from 'path';
import { closePopupsIfExist } from '../helpers/loginHelpers';

test.beforeEach(async ({ page }) => {
    await deleteAllRepos(page)
})

test.afterEach(async ({ page }) => {
    await deleteAllRepos(page)
})

test('Create upload repositories', async ({ page }) => {
    await closePopupsIfExist(page)
    await navigateToRepositories(page)
    await page.getByRole('button', { name: 'Add repositories' }).first().click();
    // An example of a partial matching locator 
    // note the "first()" as the modal has children with the same starting id
    await expect(page.locator(`div[id^="pf-modal-part"]`).first()).toBeVisible()

    // An example of a custom method that accepts a locator
    await page.getByPlaceholder('Enter name').click()

    await page.getByPlaceholder('Enter name').fill("Upload Repo!");
    await page.getByLabel('Upload', { exact: true }).check();

    page.getByRole('button', { name: 'filter architecture' }).click()

    await page.getByRole('option', { name: 'x86_64' }).click();

    await page.getByRole('button', { name: 'filter version' }).click()

    await page.getByRole('menuitem', { name: 'el9' }).locator('label').click();
    await page.getByRole('menuitem', { name: 'el8' }).locator('label').click();
    await page.getByRole('button', { name: 'filter version' }).click();

    await page.getByRole('button', { name: 'Save and upload content' }).click()

    // Example of waiting for a successful api call
    await page.waitForResponse(resp =>
        resp.url().includes('/api/content-sources/v1.0/repositories/bulk_create/')
        && resp.status() === 201)

    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('div.pf-v5-c-multiple-file-upload__upload > button').click()
    ]);

    await fileChooser.setFiles(path.join(__dirname, './fixtures/libreOffice.rpm'));

    await expect(page.getByText("All uploads completed!")).toBeVisible()

    await page.getByRole('button', { name: 'Confirm changes' }).click()

    await expect(page.getByText("In progress")).toBeVisible()
});


const deleteAllRepos = async (page: Page) => {
    await navigateToRepositories(page)

    // Delete all repos
    while (await page.getByLabel('Kebab toggle').first().isVisible()) {
        if (await page.getByLabel('Kebab toggle').first().isDisabled()) throw Error("Permissions issue found on kebab for table")
        await page.getByLabel('Kebab toggle').first().click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await expect(page.getByText('Remove repositories?')).toBeVisible()
        await page.getByRole('button', { name: 'Remove' }).click();

        // Example of waiting for a successful api call
        await page.waitForResponse(resp => resp.url().includes('/api/content-sources/v1/repositories/bulk_delete') && resp.status() === 204)
    }

    return expect(page.getByText('To get started, create a custom repository')).toBeVisible()
}


