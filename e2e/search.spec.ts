import { test, expect } from "./fixtures/auth";

const uniqueName = () => `Search Test ${Date.now()}`;

async function deleteTestChannel(
  page: import("@playwright/test").Page,
  name: string,
) {
  const channelItem = page.locator("li").filter({ hasText: name });
  await channelItem.hover();
  await channelItem.getByRole("button").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await expect(
    page.locator("nav").getByRole("link", { name }),
  ).not.toBeVisible({ timeout: 10000 });
}

test.describe.serial("Search", () => {
  test("search finds posts by content", async ({
    authenticatedPage: page,
  }) => {
    const channelName = uniqueName();
    await page.getByRole("button", { name: "Create channel" }).click();
    await page.getByLabel("Name").fill(channelName);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.locator("nav").getByRole("link", { name: channelName }),
    ).toBeVisible({ timeout: 10000 });

    await page.locator("nav").getByRole("link", { name: channelName }).click();
    await expect(page).toHaveURL(/\/channels\//, { timeout: 10000 });

    const searchableContent = `UniqueSearchTerm${Date.now()} findme`;
    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(searchableContent);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(searchableContent)).toBeVisible({
      timeout: 10000,
    });

    await page.keyboard.press("Meta+k");
    await expect(
      page.getByPlaceholder("Search posts and replies..."),
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByPlaceholder("Search posts and replies...")
      .fill(searchableContent);

    await expect(
      page.getByText(searchableContent).last(),
    ).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Escape");

    await deleteTestChannel(page, channelName);
  });

  test("search shows no results for non-existent term", async ({
    authenticatedPage: page,
  }) => {
    await page.keyboard.press("Meta+k");
    await expect(
      page.getByPlaceholder("Search posts and replies..."),
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByPlaceholder("Search posts and replies...")
      .fill(`nonexistent${Date.now()}`);

    await expect(page.getByText("No results found.")).toBeVisible({
      timeout: 10000,
    });

    await page.keyboard.press("Escape");
  });
});
