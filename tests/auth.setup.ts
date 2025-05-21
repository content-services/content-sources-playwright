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
    await logInWithUsernameAndPassword(
      page,
      process.env.USER1USERNAME,
      process.env.USER1PASSWORD
    );
    await page.context().storageState({ path: authFile });

    await logout(page);
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
