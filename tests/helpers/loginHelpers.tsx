import { expect, type Page } from "@playwright/test";
import path from 'path';

export const logout = async (page: Page) => {
    const button = await page.locator(
        "div.pf-v5-c-toolbar__item.pf-m-hidden.pf-m-visible-on-lg.pf-v5-u-mr-0 > button"
    );
    await button.click();

    await expect(async () =>
        page.getByRole("menuitem", { name: "Log out" }).isVisible()
    ).toPass();

    await page.getByRole("menuitem", { name: "Log out" }).click();

    await expect(async () => {
        expect(page.url()).not.toBe(
            '/insights/content/repositories'
        );
    }).toPass();
    await expect(async () =>
        expect(page.getByText("Log in to your Red Hat account")).toBeVisible()
    ).toPass();
};

export const logInWithUsernameAndPassword = async (
    page: Page,
    username?: string,
    password?: string
) => {
    if (!username || !password) {
        throw new Error("Username or password not found");
    }

    await page.goto('/insights/content/repositories');

    await expect(async () => {
        expect(page.url()).not.toBe(
            process.env.BASE_URL + '/insights/content/repositories'
        );
    }).toPass();

    await expect(async () =>
        expect(page.getByText("Log in to your Red Hat account")).toBeVisible()
    ).toPass();
    const login = page.getByRole("textbox");
    await login.fill(username);
    await login.press("Enter");
    await expect(async () =>
        page.getByRole("textbox", { name: "Password" }).isVisible()
    ).toPass();
    const passwordField = page.getByRole("textbox", { name: "Password" });
    await passwordField.fill(password);
    await passwordField.press("Enter");
    await expect(async () => {
        expect(page.url()).toBe(
            `${process.env.BASE_URL}/insights/content/repositories`
        );
    }).toPass();

    await expect(async () => {
        // const zeroState = page.locator("div.pf-v5-l-grid__item.bannerBefore > div > div.pf-v5-u-pt-lg > h1")
        // const repositoriesListPage = page.getByText("View all repositories within your organization.")
        // return expect(repositoriesListPage.or(zeroState)).toBeVisible()
        const topRightNavButton = page.locator(
            "div.pf-v5-c-toolbar__item.pf-m-hidden.pf-m-visible-on-lg.pf-v5-u-mr-0 > button"
        )
        return expect(topRightNavButton).toBeVisible()
    }
    ).toPass();
};

export const logInWithUser1 = async (page: Page) =>
    await logInWithUsernameAndPassword(
        page,
        process.env.USER1USERNAME,
        process.env.USER1PASSWORD
    );

export const convertProxyToPlaywrightFormat = (proxyUrl: string) => {
    const url = new URL(proxyUrl);
    return {
        server: `${url.protocol}//${url.host}`,
        // username: url.username,
        // password: url.password
    };
}
const authFile = path.join(__dirname, '../.auth/user.json');

export const storeStorageStateAndToken = async (page: Page) => {
    const { cookies } = await page.context().storageState({ path: authFile });
    process.env.TOKEN = `Bearer ${cookies.find(cookie => cookie.name === "cs_jwt")?.value}`
}

export const closePopupsIfExist = async (page: Page) => {
    if (await page.locator(`button[id^="pendo-close-guide-"]`).isVisible()) {
        await page.locator(`button[id^="pendo-close-guide-"]`).click()
    }
    if (await page.locator(`button[id="truste-consent-button"]`).isVisible()) {
        await page.locator(`button[id="truste-consent-button"]`).click()
    }
}