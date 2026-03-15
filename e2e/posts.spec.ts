import { test, expect } from "./fixtures/auth";

const uniqueName = () => `Post Test ${Date.now()}`;

async function createChannelAndNavigate(page: import("@playwright/test").Page) {
  const channelName = uniqueName();
  await page.getByRole("button", { name: "Create channel" }).click();
  await page.getByLabel("Name").fill(channelName);
  await page.getByRole("button", { name: "Create" }).click();
  const channelLink = page.locator("nav").getByRole("link", { name: channelName });
  await expect(channelLink).toBeVisible({ timeout: 10000 });
  await channelLink.click();
  await expect(page).toHaveURL(/\/channels\//, { timeout: 10000 });
  return channelName;
}

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

test.describe.serial("Posts", () => {
  let channelName: string;

  test("create post", async ({ authenticatedPage: page }) => {
    channelName = await createChannelAndNavigate(page);
    const postContent = `Hello world ${Date.now()}`;

    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(postContent);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    await deleteTestChannel(page, channelName);
  });

  test("edit post", async ({ authenticatedPage: page }) => {
    channelName = await createChannelAndNavigate(page);
    const originalContent = `Original ${Date.now()}`;
    const editedContent = `Edited ${Date.now()}`;

    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(originalContent);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(originalContent)).toBeVisible({
      timeout: 10000,
    });

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: originalContent });
    await postItem.hover();
    const editButton = postItem.getByRole("button", { name: "Edit post" });
    await editButton.waitFor({ state: "visible", timeout: 5000 });
    await editButton.click({ force: true });

    await page.waitForTimeout(500);
    const editTextarea = postItem.locator("textarea");
    await editTextarea.waitFor({ state: "visible", timeout: 5000 });
    await editTextarea.fill(editedContent);
    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.waitFor({ state: "visible", timeout: 5000 });
    await saveButton.click();

    await expect(page.getByText(editedContent)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(originalContent)).not.toBeVisible();

    await deleteTestChannel(page, channelName);
  });

  test("delete post", async ({ authenticatedPage: page }) => {
    channelName = await createChannelAndNavigate(page);
    const postContent = `To delete ${Date.now()}`;

    await page
      .getByPlaceholder("Write a message... (Cmd+Enter to send)")
      .fill(postContent);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.hover();
    await postItem.getByRole("button", { name: "Delete post" }).click();

    await expect(page.getByText(postContent)).not.toBeVisible({
      timeout: 10000,
    });

    await deleteTestChannel(page, channelName);
  });
});
