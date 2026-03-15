import { test, expect } from "./fixtures/auth";

const uniqueName = () => `Test Channel ${Date.now()}`;

async function createChannel(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.getByRole("button", { name: "Create channel" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.locator("nav").getByRole("link", { name }),
  ).toBeVisible({ timeout: 10000 });
}

async function navigateToChannel(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(/\/channels\//, { timeout: 10000 });
}

async function openChannelMenu(
  page: import("@playwright/test").Page,
  name: string,
) {
  const channelItem = page.locator("li").filter({ hasText: name });
  await channelItem.hover();
  await channelItem.getByRole("button").first().click();
}

async function deleteChannel(
  page: import("@playwright/test").Page,
  name: string,
) {
  await openChannelMenu(page, name);
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await expect(
    page.locator("nav").getByRole("link", { name }),
  ).not.toBeVisible({ timeout: 10000 });
}

test.describe.serial("Channels", () => {
  test("create channel", async ({ authenticatedPage: page }) => {
    const name = uniqueName();
    await createChannel(page, name);
    await expect(
      page.locator("nav").getByRole("link", { name }),
    ).toBeVisible();
    await deleteChannel(page, name);
  });

  test("navigate to channel", async ({ authenticatedPage: page }) => {
    const name = uniqueName();
    await createChannel(page, name);
    await navigateToChannel(page, name);
    await expect(page.locator("h2", { hasText: name })).toBeVisible();
    await deleteChannel(page, name);
  });

  test("edit channel name", async ({ authenticatedPage: page }) => {
    const name = uniqueName();
    const newName = `Edited ${Date.now()}`;
    await createChannel(page, name);
    await openChannelMenu(page, name);
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(newName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator("nav").getByRole("link", { name: newName }),
    ).toBeVisible({ timeout: 10000 });
    await deleteChannel(page, newName);
  });

  test("delete channel", async ({ authenticatedPage: page }) => {
    const name = uniqueName();
    await createChannel(page, name);
    await deleteChannel(page, name);
    await expect(
      page.locator("nav").getByRole("link", { name }),
    ).not.toBeVisible();
  });
});
