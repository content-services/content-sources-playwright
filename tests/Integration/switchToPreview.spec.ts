import { expect, test } from "@playwright/test";
import { navigateToRepositories } from "../UI/helpers/navHelpers";
import { ensureInPreview } from "../helpers/loginHelpers";

test.describe("Switch to preview", { tag: "@switch-to-preview" }, async () => {
    test("Click preview button", async ({ page }) => {
        await navigateToRepositories(page);
        await ensureInPreview(page)
    });
});
