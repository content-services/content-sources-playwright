import { expect, test as setup, type Page } from "@playwright/test";
import {
  throwIfMissingEnvVariables,
  closePopupsIfExist,
  switchToUser,
  logInWithUsernameAndPassword,
  logout,
} from "./helpers/loginHelpers";
import { describe } from "node:test";

import { existsSync, mkdirSync } from 'fs';
const authDir = '.auth';
if (!existsSync(authDir)) {
  mkdirSync(authDir);
}

describe("Setup", async () => {
  setup("Ensure needed ENV variables exist", async ({}) => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup("Authenticate all the users", async ({ page }) => {
    await closePopupsIfExist(page);

    await logInWithUsernameAndPassword(
      page,
      process.env.READONLY_USERNAME,
      process.env.READONLY_PASSWORD
    );

    await logout(page);

    await logInWithUsernameAndPassword(
      page,
      process.env.ADMIN_USERNAME,
      process.env.ADMIN_PASSWORD
    );

    await switchToUser(page, process.env.ADMIN_USERNAME!);

    // We do this as we run admin tests first.
  });
});
