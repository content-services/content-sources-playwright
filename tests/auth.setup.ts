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

describe("Setup", async () => {
  setup("Ensure needed ENV variables exist", async ({}) => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup("Authenticate user 1", async ({ page }) => {
    await closePopupsIfExist(page);
    await logInWithUsernameAndPassword(
      page,
      process.env.USER1USERNAME,
      process.env.USER1PASSWORD
    );
  });

  // Example of how to add another user
  setup("Authenticate user 2", async ({ page }) => {
    await closePopupsIfExist(page);
    await logout(page);
    await logInWithUsernameAndPassword(
        page,
        process.env.USER2USERNAME,
        process.env.USER2PASSWORD
    );
    // Example of how to switch to user
    // await switchToUser(page, process.env.USER1USERNAME!);
    // await ensureNotInPreview(page);
    // Other users for other tests can be added below after logging out
    // await switchToUser(page, process.env.USER2USERNAME!);
    // await ensureNotInPreview(page);
  });
});
