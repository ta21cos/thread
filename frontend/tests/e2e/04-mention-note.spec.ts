import { test, expect } from '@playwright/test';
import { createNote, selectNoteByContent, selectors, clickMentionLink } from './setup/test-helpers';

test.describe('Mention Note', () => {
  test('should create note with mention using @ID syntax', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create first note to mention with unique content
    const timestamp = Date.now();
    const firstNoteContent = `First note to be mentioned ${timestamp}`;
    const firstNoteId = await createNote(page, firstNoteContent);

    // NOTE: Create second note with mention
    const secondNoteContent = `This mentions @${firstNoteId} in the content ${timestamp}`;
    await createNote(page, secondNoteContent);

    // NOTE: Select second note
    await selectNoteByContent(page, secondNoteContent);

    // NOTE: Verify mention is displayed as a link
    const mentionLink = page.locator(selectors.threadView.mention);
    await expect(mentionLink).toBeVisible();
    await expect(mentionLink).toContainText(`@${firstNoteId}`);
  });

  test('should navigate to mentioned note when clicking mention link', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create first note with unique content
    const timestamp = Date.now();
    const targetNoteContent = `Target note ${timestamp}`;
    const targetNoteId = await createNote(page, targetNoteContent);

    // NOTE: Create second note with mention
    const mentioningNoteContent = `This mentions @${targetNoteId} ${timestamp}`;
    await createNote(page, mentioningNoteContent);

    // NOTE: Select second note to view thread
    await selectNoteByContent(page, mentioningNoteContent);

    // NOTE: Click mention link
    await clickMentionLink(page, targetNoteId);

    // NOTE: Verify URL changed to target note
    await page.waitForURL(`**/notes/${targetNoteId}`);

    // NOTE: Verify target note content is visible in thread view
    await expect(
      page.locator('[data-testid="thread-node-content"]').filter({ hasText: targetNoteContent })
    ).toBeVisible();
  });

  test('should support multiple mentions in one note', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create two notes to mention with unique content
    const timestamp = Date.now();
    const firstNoteContent = `First note ${timestamp}`;
    const secondNoteContent = `Second note ${timestamp}`;

    const firstId = await createNote(page, firstNoteContent);
    const secondId = await createNote(page, secondNoteContent);

    // NOTE: Create note with multiple mentions
    const multiMentionContent = `Mentioning @${firstId} and @${secondId} ${timestamp}`;
    await createNote(page, multiMentionContent);

    // NOTE: Select the note with mentions
    await selectNoteByContent(page, multiMentionContent);

    // NOTE: Verify both mentions are displayed as links
    const mentions = page.locator(selectors.threadView.mention);
    await expect(mentions).toHaveCount(2);

    // NOTE: Verify both mention texts
    await expect(mentions.nth(0)).toContainText(`@${firstId}`);
    await expect(mentions.nth(1)).toContainText(`@${secondId}`);
  });

  test('should display mention as clickable link', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note to mention with unique content
    const timestamp = Date.now();
    const mentionedNoteContent = `Mentioned note ${timestamp}`;
    const noteId = await createNote(page, mentionedNoteContent);

    // NOTE: Create note with mention
    const mentioningContent = `Check out @${noteId} for details ${timestamp}`;
    await createNote(page, mentioningContent);

    // NOTE: Select the mentioning note
    await selectNoteByContent(page, mentioningContent);

    // NOTE: Verify mention is displayed as a clickable link
    const mentionLink = page.locator(`a:has-text("@${noteId}")`).first();
    await expect(mentionLink).toBeVisible();

    // NOTE: Verify it's an anchor tag with href
    const tagName = await mentionLink.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');

    // NOTE: Verify href contains note ID
    const href = await mentionLink.getAttribute('href');
    expect(href).toContain(noteId);
  });

  test('should preserve mention in edited note', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note to mention with unique content
    const timestamp = Date.now();
    const targetContent = `Target note ${timestamp}`;
    const targetId = await createNote(page, targetContent);

    // NOTE: Create note with mention
    const noteWithMentionContent = `Original content with @${targetId} ${timestamp}`;
    await createNote(page, noteWithMentionContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteWithMentionContent);

    // NOTE: Verify mention exists
    const mentions = page.locator(selectors.threadView.mention);
    await expect(mentions).toHaveCount(1);
    await expect(mentions.first()).toContainText(`@${targetId}`);
  });
});
