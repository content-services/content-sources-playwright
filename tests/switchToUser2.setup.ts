import { expect, test as setup, type Page } from "@playwright/test";
import {
  throwIfMissingEnvVariables,
  switchToUser,
} from "./helpers/loginHelpers";
import { describe } from "node:test";

setup("Switch to user 2", async ({ page }) => {
  await switchToUser(page, process.env.READONLY_USERNAME!);
});
