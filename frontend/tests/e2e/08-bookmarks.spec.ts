import { test, expect } from '@playwright/test';
import { createNote, selectNoteByContent } from './setup/test-helpers';

// NOTE: Serial mode to ensure empty state test runs before bookmark creation
test.describe.configure({ mode: 'serial' });

test.describe('Bookmarks', () => {
  test('should show empty state on bookmarks page', async ({ page }) => {
    await page.goto('/bookmarks');

    await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible();
    await expect(page.getByText('No bookmarks yet')).toBeVisible();
  });

  test('should show bookmarked note on bookmarks page', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note via UI (NoteEditor)
    await createNote(page, 'Bookmarked note for E2E test');

    // NOTE: Select the note to open ThreadView
    await selectNoteByContent(page, 'Bookmarked note for E2E test');

    // NOTE: Hover over thread node to reveal inline action buttons
    const threadNode = page.locator('[data-testid="thread-node"]').first();
    await threadNode.hover();

    // NOTE: Click bookmark button directly in the inline action bar
    const bookmarkButton = threadNode.getByRole('button', { name: /bookmark/i });
    await bookmarkButton.waitFor({ state: 'visible', timeout: 5000 });

    const bookmarkResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/bookmarks/') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
    await bookmarkButton.click();
    await bookmarkResponse;

    // NOTE: Navigate to bookmarks page and verify
    await page.getByRole('button', { name: 'Bookmarks' }).click();
    await expect(page).toHaveURL('/bookmarks');
    await expect(page.getByTestId('bookmark-item')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Bookmarked note for E2E test')).toBeVisible();
  });

  test('should bookmark note using thread view header button', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note via UI
    await createNote(page, 'Header bookmark button test');

    // NOTE: Select the note to open ThreadView
    await selectNoteByContent(page, 'Header bookmark button test');

    // NOTE: Click the BookmarkButton in the thread header and wait for API response
    const bookmarkButton = page.getByTestId('thread-bookmark-button');
    await bookmarkButton.waitFor({ state: 'visible', timeout: 5000 });

    const bookmarkResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/bookmarks/') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
    await bookmarkButton.click();
    await bookmarkResponse;

    // NOTE: Navigate to bookmarks page and verify
    await page.getByRole('button', { name: 'Bookmarks' }).click();
    await expect(page).toHaveURL('/bookmarks');
    await expect(page.getByTestId('bookmark-item').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Header bookmark button test')).toBeVisible();
  });
});
