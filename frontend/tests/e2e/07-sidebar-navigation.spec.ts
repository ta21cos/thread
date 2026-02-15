import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test('should display sidebar with navigation items', async ({ page }) => {
    await page.goto('/');

    // NOTE: Sidebar should be visible on desktop
    await expect(page.getByText('Thread Notes')).toBeVisible();
    await expect(page.getByText('All Notes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bookmarks' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daily Notes' })).toBeVisible();
  });

  test('should navigate to bookmarks page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Bookmarks' }).click();
    await expect(page).toHaveURL('/bookmarks');
    await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible();
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByText('Tasks').first()).toBeVisible();
  });

  test('should navigate to daily notes page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Daily Notes' }).click();

    // NOTE: Daily notes navigates to /daily/YYYY-MM-DD
    await expect(page).toHaveURL(/\/daily\/\d{4}-\d{2}-\d{2}/);
    await expect(page.getByText('Daily Notes').first()).toBeVisible();
  });

  test('should navigate back to notes from bookmarks', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.getByText('Bookmarks').first()).toBeVisible();

    // NOTE: Click "All Notes" in sidebar to go back
    await page.getByRole('button', { name: 'All Notes' }).click();
    await expect(page).toHaveURL('/');
  });
});
