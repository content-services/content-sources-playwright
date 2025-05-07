import { expect, test } from "@playwright/test";
import { navigateToRepositories } from "../UI/helpers/navHelpers";
import { randomName, randomUrl } from "../UI/helpers/repoHelpers";
import { closePopupsIfExist, getRowByNameOrUrl } from "../UI/helpers/helpers";
import fs from "fs";
import { deleteAllRepos } from "../UI/helpers/deleteRepositories";
import { switchToUser, logInWithUsernameAndPassword, logout } from "../helpers/loginHelpers";

const repoNamePrefix = "Repo-RBAC";
const repoNameFile = "repoName.txt";

// Function to get or generate repo name using file persistence
const getRepoName = (): string => {
  if (fs.existsSync(repoNameFile)) {
    const repoName = fs.readFileSync(repoNameFile, "utf8");
    console.log(`Loaded repo name from file: ${repoName}`);
    return repoName;
  }
  const repoName = `${repoNamePrefix}-${randomName()}`;
  fs.writeFileSync(repoNameFile, repoName);
  console.log(`Generated and saved repo name: ${repoName}`);
  return repoName;
};



const url = randomUrl();

test.describe("Combined user tests", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Ensure fresh context per test

  test("Login as user 1 (admin)", async ({ page, browser }) => {
    // // Log in as admin
    await logInWithUsernameAndPassword(
      page,
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!
    );
    await switchToUser(page, process.env.ADMIN_USERNAME!);

    await test.step("Navigate to the repository page", async () => {
      // Clean up the repo name file
      if (fs.existsSync(repoNameFile)) {
        fs.unlinkSync(repoNameFile);
      }
      console.log("Cleaned up repoName.txt");
      console.log("\n   Try to delete old repos\n");
      await deleteAllRepos(page, `&search=${repoNamePrefix}`);
      await navigateToRepositories(page);
      await closePopupsIfExist(page);
    });

    await test.step("Create a repository", async () => {
      await page.getByRole("button", { name: "Add repositories" }).first().click();
      await expect(page.getByRole("dialog", { name: "Add custom repositories" })).toBeVisible();

      const repoName = getRepoName();
      await page.getByLabel("Name").fill(repoName);
      await page.getByLabel("Introspect only").click();
      await page.getByLabel("URL").fill(url);
      await page.getByRole("button", { name: "Save", exact: true }).click();
    });

    await test.step("Read the repo", async () => {
      const repoName = getRepoName();
      const row = await getRowByNameOrUrl(page, repoName);
      await expect(row.getByText("Valid")).toBeVisible();
      await row.getByLabel("Kebab toggle").click();
      await row.getByRole("menuitem", { name: "Edit" }).click();
      await expect(page.getByRole("dialog", { name: "Edit custom repository" })).toBeVisible();
      await expect(page.getByPlaceholder("Enter name", { exact: true })).toHaveValue(repoName);
      await expect(page.getByPlaceholder("https://", { exact: true })).toHaveValue(url);
    });

    await test.step("Update the repository", async () => {
      const repoName = getRepoName();
      await page.getByPlaceholder("Enter name", { exact: true }).fill(`${repoName}-Edited`);
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await page.context().clearCookies();
      await page.context().close(); //  This, on its own,  does not help
      await browser.close(); // This, on its own, does not help
    });
  });

  test("Login as user 2 (read-only)", { tag: "@read-only" }, async ({ page, browser }) => {
    // Create a new context for read-only user
    await page.context().clearCookies();
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const newPage = await context.newPage();
    await newPage.context().clearCookies();
    await logInWithUsernameAndPassword(
      newPage,
      process.env.READONLY_USERNAME!,
      process.env.READONLY_PASSWORD!
    );
    await switchToUser(newPage, process.env.READONLY_USERNAME!);
    const cookies = await context.cookies();
    const jwtCookie = cookies.find(cookie => cookie.name === "cs_jwt");
    console.log(`Cookies after login for ${process.env.READONLY_USERNAME}:`, cookies);
    console.log(`cs_jwt cookie value: ${jwtCookie?.value || "Not found"}`);

    await test.step("Navigate to the repository page", async () => {
      await navigateToRepositories(newPage);
      await closePopupsIfExist(newPage);
    });

    await test.step("Read the repo", async () => {
      const repoName = getRepoName();
      const row = await getRowByNameOrUrl(newPage, `${repoName}-Edited`);
      await expect(row.getByText("Valid")).toBeVisible({ timeout: 60000 });
      await row.getByLabel("Kebab toggle").click();
      await expect(row.locator(".pf-v5-c-menu__list")).toBeVisible({ timeout: 5000 }); // Confirm menu is open
      await expect(row.getByRole("menuitem", { name: "Edit" })).not.toBeVisible({ timeout: 1000 });
      await page.pause();
    });

    // Clean up
    await context.close();
  });
});
