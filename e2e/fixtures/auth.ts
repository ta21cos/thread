import { test as base, type Page } from "@playwright/test";

const TEST_EMAIL = "e.st1.ta2altr5+thread02@gmail.com";
const TEST_PASSWORD = "kX9mPq!vR4nw7Ld";

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(TEST_EMAIL);
    await page.getByLabel("パスワード").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();
    await page.waitForURL("/", { timeout: 15000 });
    await use(page);
  },
});

export { expect } from "@playwright/test";
