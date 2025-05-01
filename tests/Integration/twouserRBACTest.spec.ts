import { expect, test } from "@playwright/test";
import { navigateToRepositories } from "../UI/helpers/navHelpers";
import { randomName, randomUrl } from "../UI/helpers/repoHelpers";
import { closePopupsIfExist, getRowByNameOrUrl } from "../UI/helpers/helpers";
import fs from "fs";
import { deleteAllRepos } from "../UI/helpers/deleteRepositories";
import { switchToUser } from "../helpers/loginHelpers";

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

// Clean up the repo name file
test.beforeAll(async () => {
  if (fs.existsSync(repoNameFile)) {
    fs.unlinkSync(repoNameFile);
    console.log("Cleaned up repoName.txt");
  }
});

const url = randomUrl();

test.describe("Combined user tests", () => {
  test("Login as user 1 (admin)", async ({ page }) => {
    await test.step("Navigate to the repository page", async () => {
      console.log("\n   Try to delete old repos\n");
      await deleteAllRepos(page, `&search=${repoNamePrefix}`);
      await navigateToRepositories(page);
      await closePopupsIfExist(page);
    });

    await test.step("Create a repository", async () => {
      await page
        .getByRole("button", { name: "Add repositories" })
        .first()
        .click();
      await expect(
        page.getByRole("dialog", { name: "Add custom repositories" })
      ).toBeVisible();

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
      await expect(
        page.getByRole("dialog", { name: "Edit custom repository" })
      ).toBeVisible();
      await expect(
        page.getByPlaceholder("Enter name", { exact: true })
      ).toHaveValue(repoName);
      await expect(
        page.getByPlaceholder("https://", { exact: true })
      ).toHaveValue(url);
    });

    await test.step("Update the repository", async () => {
      const repoName = getRepoName();
      await page
        .getByPlaceholder("Enter name", { exact: true })
        .fill(`${repoName}-Edited`);
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
    });
  });

  test(
    "Login as user 2 (read-only)",
    { tag: "@read-only" },
    async ({ page }) => {
      await test.step("Navigate to the repository page", async () => {
        await navigateToRepositories(page);
        await closePopupsIfExist(page);
      });

      await test.step("Read the repo", async () => {
        const repoName = getRepoName();
        const row = await getRowByNameOrUrl(page, `${repoName}-Edited`);
        await expect(row.getByText("Valid")).toBeVisible({ timeout: 60000 });
        await row.getByLabel("Kebab toggle").click();
        await row.getByRole("menuitem", { name: "Edit" }).click();
        await expect(
          page.getByText(
            "You do not have the required permissions to perform this action"
          )
        ).toBeVisible();
        await expect(
          page.getByRole("dialog", { name: "Edit custom repository" })
        ).not.toBeVisible();
      });
    }
  );
});
