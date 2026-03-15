import { test, expect } from "./fixtures/auth";

const uniqueName = () => `Reply Test ${Date.now()}`;

async function createChannelWithPost(page: import("@playwright/test").Page) {
  const channelName = uniqueName();
  await page.getByRole("button", { name: "Create channel" }).click();
  await page.getByLabel("Name").fill(channelName);
  await page.getByRole("button", { name: "Create" }).click();
  const channelLink = page.locator("nav").getByRole("link", { name: channelName });
  await expect(channelLink).toBeVisible({ timeout: 10000 });
  await channelLink.click();
  await expect(page).toHaveURL(/\/channels\//, { timeout: 10000 });

  const postContent = `Parent post ${Date.now()}`;
  await page
    .getByPlaceholder("Write a message... (Cmd+Enter to send)")
    .fill(postContent);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

  return { channelName, postContent };
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

test.describe.serial("Replies", () => {
  test("open thread panel", async ({ authenticatedPage: page }) => {
    const { channelName, postContent } = await createChannelWithPost(page);

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.click();

    await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible({
      timeout: 10000,
    });

    await deleteTestChannel(page, channelName);
  });

  test("create reply", async ({ authenticatedPage: page }) => {
    const { channelName, postContent } = await createChannelWithPost(page);

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.click();
    await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible({
      timeout: 10000,
    });

    const replyContent = `Reply ${Date.now()}`;
    await page
      .getByPlaceholder("Reply in thread... (Cmd+Enter to send)")
      .fill(replyContent);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });

    await deleteTestChannel(page, channelName);
  });

  test("edit reply", async ({ authenticatedPage: page }) => {
    const { channelName, postContent } = await createChannelWithPost(page);

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.click();
    await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible({
      timeout: 10000,
    });

    const replyContent = `Reply to edit ${Date.now()}`;
    await page
      .getByPlaceholder("Reply in thread... (Cmd+Enter to send)")
      .fill(replyContent);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });

    const replyItem = page
      .locator(".group")
      .filter({ hasText: replyContent });
    await replyItem.hover();
    const editButton = replyItem.getByRole("button", { name: "Edit reply" });
    await editButton.waitFor({ state: "visible", timeout: 5000 });
    await editButton.click({ force: true });

    const editedContent = `Edited reply ${Date.now()}`;
    const editTextarea = replyItem.locator("textarea");
    await editTextarea.waitFor({ state: "visible", timeout: 5000 });
    await editTextarea.fill(editedContent);
    const saveButton = page.getByRole("button", { name: "Save" });
    await saveButton.waitFor({ state: "visible", timeout: 5000 });
    await saveButton.click();

    await expect(page.getByText(editedContent)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(replyContent)).not.toBeVisible();

    await deleteTestChannel(page, channelName);
  });

  test("delete reply", async ({ authenticatedPage: page }) => {
    const { channelName, postContent } = await createChannelWithPost(page);

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.click();
    await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible({
      timeout: 10000,
    });

    const replyContent = `Reply to delete ${Date.now()}`;
    await page
      .getByPlaceholder("Reply in thread... (Cmd+Enter to send)")
      .fill(replyContent);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });

    const replyItem = page
      .locator(".group")
      .filter({ hasText: replyContent });
    await replyItem.hover();
    const deleteButton = replyItem.getByRole("button", {
      name: "Delete reply",
    });
    await deleteButton.waitFor({ state: "visible", timeout: 5000 });
    await deleteButton.click({ force: true });

    await expect(page.getByText(replyContent)).not.toBeVisible({
      timeout: 10000,
    });

    await deleteTestChannel(page, channelName);
  });

  test("reply count shown on post", async ({ authenticatedPage: page }) => {
    const { channelName, postContent } = await createChannelWithPost(page);

    const postItem = page
      .locator(`[id^="post-"]`)
      .filter({ hasText: postContent });
    await postItem.click();
    await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible({
      timeout: 10000,
    });

    const replyContent = `Reply for count ${Date.now()}`;
    await page
      .getByPlaceholder("Reply in thread... (Cmd+Enter to send)")
      .fill(replyContent);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Close thread" }).click();
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("1 reply")).toBeVisible({ timeout: 10000 });

    const channelItem = page.locator("li").filter({ hasText: channelName });
    await channelItem.hover();
    await channelItem.getByRole("button").first().click();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(
      page.locator("nav").getByRole("link", { name: channelName }),
    ).not.toBeVisible({ timeout: 10000 });
  });
});
