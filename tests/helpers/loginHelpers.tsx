import { expect, type Page } from "@playwright/test";
import path from "path";

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
    expect(page.url()).not.toBe("/insights/content/repositories");
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

  await page.goto("/insights/content/repositories");

  await expect(async () => {
    expect(page.url()).not.toBe(
      process.env.BASE_URL + "/insights/content/repositories"
    );
  }).toPass();

  await expect(async () =>
    expect(page.getByText("Log in to your Red Hat account")).toBeVisible()
  ).toPass();
  const login = page.getByRole("textbox");
  await login.fill(username);
  await login.press("Enter");
  const passwordField = page.getByRole("textbox", { name: "Password" });
  await passwordField.fill(password);
  await passwordField.press("Enter");
  //   await page.waitForResponse(
  //     (resp) =>
  //       resp
  //         .url()
  //         .includes(
  //           "/auth/realms/redhat-external/protocol/openid-connect/token"
  //         ) && resp.status() === 200
  //   );
  await expect(async () => {
    expect(page.url()).toBe(
      `${process.env.BASE_URL}/insights/content/repositories`
    );
  }).toPass();

  //   await expect(
  //     page.locator("button > span.pf-v5-c-menu-toggle__icon")
  //   ).toBeVisible();
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
};

export const storeStorageStateAndToken = async (page: Page) => {
  const { cookies } = await page
    .context()
    .storageState({ path: path.join(__dirname, "../../.auth/user.json") });
  process.env.TOKEN = `Bearer ${
    cookies.find((cookie) => cookie.name === "cs_jwt")?.value
  }`;
  await page.waitForTimeout(100);
};

export const closePopupsIfExist = async (page: Page) => {
  const locatorsToCheck = [
    page.locator(`button[id^="pendo-close-guide-"]`),
    page.locator(`button[id="truste-consent-button"]`),
    page.getByLabel("close-notification"),
  ];

  for (const locator of locatorsToCheck) {
    await page.addLocatorHandler(locator, async () => {
      await locator.click();
    });
  }
};

export const throwIfMissingEnvVariables = () => {
  const ManditoryEnvVariables = [
    "USER1USERNAME",
    "USER1PASSWORD",
    "BASE_URL",
    "PROXY",
  ];

  const missing: string[] = [];
  ManditoryEnvVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    throw new Error("Missing env variables:" + missing.join(","));
  }
};
