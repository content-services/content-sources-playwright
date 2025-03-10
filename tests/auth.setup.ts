import { expect, test as setup, type Page } from "@playwright/test";
import {
  throwIfMissingEnvVariables,
  closePopupsIfExist,
  setCookieForUser,
  logInWithUsernameAndPassword,
  ensureNotInPreview,
  logout,
} from "./helpers/loginHelpers";
import { describe } from "node:test";

describe("Setup", async () => {
  setup("Ensure needed ENV variables exist", async ({}) => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup("Authenticate all users", async ({ page }) => {
    await closePopupsIfExist(page);
    await logInWithUsernameAndPassword(
      page,
      process.env.USER1USERNAME,
      process.env.USER1PASSWORD
    );
    await setCookieForUser(page, process.env.USER1USERNAME!);
    await ensureNotInPreview(page);

    await logout(page);

    await logInWithUsernameAndPassword(
      page,
      process.env.USER2USERNAME,
      process.env.USER2PASSWORD
    );

    await setCookieForUser(page, process.env.USER2USERNAME!);
    await ensureNotInPreview(page);
    // Other users for other tests can be added below after logging out
  });
});
