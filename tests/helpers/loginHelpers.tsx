import { expect, type Page } from "@playwright/test";
import path from "path";

export const logout = async (page: Page) => {
  const button = await page
    .locator(".pf-v6-c-menu-toggle.data-hj-suppress.sentry-mask")
    .first();

  await button.click();

  await expect(async () =>
    page.getByRole("menuitem", { name: "Log out" }).isVisible()
  ).toPass();

  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(async () => {
    expect(page.url()).not.toBe("/insights/content/repositories");
  }).toPass();
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

  await expect(async () => {
    expect(page.url()).toBe(
      `${process.env.BASE_URL}/insights/content/repositories`
    );
  }).toPass();
};

export const switchToUser = async (page: Page, userName: string) => {
  const { cookies } = await page.context().storageState({
    path: path.join(__dirname, `../../.auth/${userName}.json`),
  });
  process.env.TOKEN = `Bearer ${
    cookies.find((cookie) => cookie.name === "cs_jwt")?.value
  }`;
  await page.waitForTimeout(100);
};

export const closePopupsIfExist = async (page: Page) => {
  const locatorsToCheck = [
    page.locator(".pf-v6-c-modal-box__close > button"),
    page.locator(".pf-v5-c-alert.notification-item button"), // This closes all toast pop-ups
    page.locator(`button[id^="pendo-close-guide-"]`), // This closes the pendo guide pop-up
    page.locator(`button[id="truste-consent-button"]`), // This closes the trusted consent pup-up
    page.getByLabel("close-notification"), // This closes a one off info notification (May be covered by the toast above, needs recheck.)
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
    "ORG_ID_1",
    "ACTIVATION_KEY_1",
  ];

  if (!process.env.PROD) ManditoryEnvVariables.push("PROXY");

  const missing: string[] = [];
  ManditoryEnvVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    throw new Error("Missing env variables:" + missing.join(","));
  }

  if (process.env.PROXY && process.env.BASE_URL?.includes("stage.foo.redhat")) {
    throw new Error(
      "If testing against a local machine you need to unset '' your proxy in the .env file!"
    );
  }
};

export const ensureNotInPreview = async (page: Page) => {
  const toggle = page.locator(".pf-v6-c-switch__toggle");
  if ((await toggle.isVisible()) && (await toggle.isChecked())) {
    await toggle.click();
  }
};

export const ensureInPreview = async (page: Page) => {
  const toggle = page.locator(".pf-v6-c-switch__toggle");
  await expect(toggle).toBeVisible();
  if (!(await toggle.isChecked())) {
    await toggle.click();
  }
  const turnOnButton = page.getByRole("button", { name: "Turn on" });
  if (await turnOnButton.isVisible()) {
    await turnOnButton.click();
  }
  await expect(toggle).toBeChecked();
};
