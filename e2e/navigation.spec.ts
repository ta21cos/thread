import { test, expect } from "./fixtures/auth";

const uniqueName = () => `Nav Test ${Date.now()}`;

async function deleteTestChannel(
  page: import("@playwright/test").Page,
  name: string,
) {
  const channelItem = page.locator("aside li").filter({ hasText: name });
  await channelItem.hover();
  await channelItem.getByRole("button").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await expect(
    page.locator("nav").getByRole("link", { name }),
  ).not.toBeVisible({ timeout: 10000 });
}

test.describe.serial("Navigation", () => {
  test("welcome screen on initial login", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome to Thread" }),
    ).toBeVisible();
    await expect(page.getByText("Select a channel")).toBeVisible();
  });

  test("switch between channels", async ({ authenticatedPage: page }) => {
    const channel1 = `${uniqueName()} A`;
    const channel2 = `${uniqueName()} B`;

    await page.getByRole("button", { name: "Create channel" }).click();
    await page.getByLabel("Name").fill(channel1);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.locator("nav").getByRole("link", { name: channel1 }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Create channel" }).click();
    await page.getByLabel("Name").fill(channel2);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.locator("nav").getByRole("link", { name: channel2 }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: channel1 }).click();
    await expect(page).toHaveURL(/\/channels\//, { timeout: 10000 });
    await expect(page.locator("h2", { hasText: channel1 })).toBeVisible();

    const post1 = `Post in ch1 ${Date.now()}`;
    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(post1);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(post1)).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: channel2 }).click();
    await expect(page.locator("h2", { hasText: channel2 })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(post1)).not.toBeVisible();

    const post2 = `Post in ch2 ${Date.now()}`;
    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(post2);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(post2)).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: channel1 }).click();
    await expect(page.getByText(post1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(post2)).not.toBeVisible();

    await deleteTestChannel(page, channel1);
    await deleteTestChannel(page, channel2);
  });

  test("mobile sidebar opens and shows channels", async ({
    authenticatedPage: page,
  }) => {
    const channelName = `${uniqueName()} Mobile`;
    await page.getByRole("button", { name: "Create channel" }).click();
    await page.getByLabel("Name").fill(channelName);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.locator("nav").getByRole("link", { name: channelName }),
    ).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Toggle sidebar" }).click();

    await expect(
      page.getByRole("link", { name: channelName }),
    ).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    await deleteTestChannel(page, channelName);
  });

  test("theme toggle", async ({ authenticatedPage: page }) => {
    const htmlElement = page.locator("html");

    const wasDark = await htmlElement.evaluate((el) =>
      el.classList.contains("dark"),
    );

    await page
      .getByRole("button", {
        name: wasDark ? "Switch to light mode" : "Switch to dark mode",
      })
      .click();

    if (wasDark) {
      await expect(htmlElement).not.toHaveClass(/dark/);
    } else {
      await expect(htmlElement).toHaveClass(/dark/);
    }

    await page
      .getByRole("button", {
        name: wasDark ? "Switch to dark mode" : "Switch to light mode",
      })
      .click();
  });
});
