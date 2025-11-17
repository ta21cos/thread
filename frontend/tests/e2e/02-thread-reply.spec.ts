import { test, expect } from '@playwright/test';
import { createNote, selectNoteByContent, replyToNote, selectors } from './setup/test-helpers';

test.describe('Thread Reply', () => {
  test('should create a reply to a note', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const rootContent = `Root note for thread ${timestamp}`;
    const replyContent = `This is a reply ${timestamp}`;

    await createNote(page, rootContent);

    // NOTE: Select the note to view thread
    await selectNoteByContent(page, rootContent);

    // NOTE: Reply to the note
    await replyToNote({ page, content: replyContent });

    // NOTE: Verify reply appears in thread
    const threadNodes = page.locator(selectors.threadView.node);
    await expect(threadNodes).toHaveCount(2); // Root + 1 reply

    // NOTE: Verify reply content is visible
    await expect(
      page.locator(selectors.threadView.nodeContent).filter({ hasText: replyContent })
    ).toBeVisible();
  });

  test('should display parent-child relationship', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const parentContent = `Parent note ${timestamp}`;
    const childContent = `Child note ${timestamp}`;

    await createNote(page, parentContent);

    // NOTE: Select and reply
    await selectNoteByContent(page, parentContent);
    await replyToNote({ page, content: childContent });

    // NOTE: Verify thread structure - parent comes first
    const rootNode = page.locator(selectors.threadView.node).first();
    await expect(rootNode).toContainText(parentContent);

    // NOTE: Verify child is present in thread
    const childNodes = page.locator(selectors.threadView.node);
    await expect(childNodes).toHaveCount(2);
    await expect(
      page.locator(selectors.threadView.nodeContent).filter({ hasText: childContent })
    ).toBeVisible();
  });

  test('should display reply indicator in note list', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const rootContent = `Root note ${timestamp}`;
    const replyContent = `Reply note ${timestamp}`;

    await createNote(page, rootContent);

    // NOTE: Select and reply
    await selectNoteByContent(page, rootContent);
    await replyToNote({ page, content: replyContent });

    // NOTE: Wait for refetch and verify reply indicator appears
    await page.waitForTimeout(2000); // Wait for refetch

    // NOTE: Find the parent note in the list and verify it has a reply indicator
    const parentNote = page.locator('[data-testid="note-item"]').filter({ hasText: rootContent });
    const replyIndicator = parentNote.locator('[data-testid="note-item-reply-count"]');

    // NOTE: Just verify the indicator exists (don't check exact count due to parallel test runs)
    await expect(replyIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should create multiple replies in a thread', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const rootContent = `Root note ${timestamp}`;
    const reply1Content = `First reply ${timestamp}`;
    const reply2Content = `Second reply ${timestamp}`;

    await createNote(page, rootContent);

    // NOTE: Select the note
    await selectNoteByContent(page, rootContent);

    // NOTE: Create first reply
    await replyToNote({ page, content: reply1Content });

    // NOTE: Create second reply
    await replyToNote({ page, content: reply2Content });

    // NOTE: Verify all content is present in thread (navigate to thread view to check)
    await selectNoteByContent(page, rootContent);

    const threadNodes = page.locator(selectors.threadView.node);
    await expect(threadNodes).toHaveCount(3); // Root + 2 replies

    await expect(
      page.locator(selectors.threadView.nodeContent).filter({ hasText: rootContent })
    ).toBeVisible();
    await expect(
      page.locator(selectors.threadView.nodeContent).filter({ hasText: reply1Content })
    ).toBeVisible();
    await expect(
      page.locator(selectors.threadView.nodeContent).filter({ hasText: reply2Content })
    ).toBeVisible();

    // NOTE: Verify parent note shows reply indicator with multiple replies
    const parentNote = page.locator('[data-testid="note-item"]').filter({ hasText: rootContent });
    const replyIndicator = parentNote.locator('[data-testid="note-item-reply-count"]');
    await expect(replyIndicator).toBeVisible({ timeout: 10000 });
    // NOTE: Reply count should show 2
    await expect(replyIndicator).toHaveText('2');
  });
});
