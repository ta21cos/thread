import { test, expect } from "@playwright/test";

const TEST_EMAIL = "e.st1.ta2altr5+thread02@gmail.com";
const TEST_PASSWORD = "kX9mPq!vR4nw7Ld";

test.describe("Authentication", () => {
  test("signup creates account and redirects to home", async ({ page }) => {
    const uniqueEmail = `e.st1.ta2altr5+e2e-${Date.now()}@gmail.com`;

    await page.goto("/signup");
    await page.getByLabel("メールアドレス").fill(uniqueEmail);
    await page.getByLabel("パスワード").fill("testpassword123");
    await page.getByRole("button", { name: "サインアップ" }).click();

    await page.waitForURL("/", { timeout: 15000 });
    await expect(page.getByText("Welcome to Thread")).toBeVisible();
  });

  test("unauthenticated user redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(TEST_EMAIL);
    await page.getByLabel("パスワード").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForURL("/", { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Welcome to Thread" }),
    ).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(TEST_EMAIL);
    await page.getByLabel("パスワード").fill("wrongpassword123");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/error=invalid_credentials/, {
      timeout: 15000,
    });
  });
});
