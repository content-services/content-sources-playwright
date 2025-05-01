import { expect, test as setup, type Page } from "@playwright/test";
import {
  throwIfMissingEnvVariables,
  closePopupsIfExist,
  switchToUser,
  logInWithUsernameAndPassword,
  ensureNotInPreview,
  logout,
} from "./helpers/loginHelpers";
import { describe } from "node:test";

const authFile = '.auth/contentPlaywrightUserAdmin.json';
const authFileRO = '.auth/contentPlaywrightReader.json';

describe("Setup", async () => {
  setup("Ensure needed ENV variables exist", async ({}) => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup("Authenticate all the users", async ({ page }) => {
    await closePopupsIfExist(page);
    await expect(page.locator('body')).toBeVisible();
    console.log('Page URL before login:', page.url());
    await logInWithUsernameAndPassword(
      page,
      process.env.USER1USERNAME,
      process.env.USER1PASSWORD
    );
    const cookies = await page.context().cookies();
    console.log('Cookies after Admin login:', cookies);
    // wait longer to see if cookie is available
    await expect(
      page.getByRole('heading', { name: 'Repositories', exact: false }),
    ).toBeVisible();
    await page.context().storageState({ path: authFile });

    console.log('Cookies before Admin logout:', await page.context().cookies());
    await logout(page);
    console.log('Cookies after Admin logout:', await page.context().cookies());

    await logInWithUsernameAndPassword(
      page,
      process.env.RO_USER_USERNAME,
      process.env.RO_USER_PASSWORD
    );
    await page.context().storageState({ path: authFileRO });
    await logout(page);
    // Example of how to add another user
    // await logout(page)
    // await logInWithUsernameAndPassword(
    //     page,
    //     process.env.USER2USERNAME,
    //     process.env.USER2PASSWORD
    // );
    // Example of how to switch to said user
    // await switchToUser(page, process.env.USER1USERNAME!);
    // await ensureNotInPreview(page);
    // Other users for other tests can be added below after logging out
  });
});
