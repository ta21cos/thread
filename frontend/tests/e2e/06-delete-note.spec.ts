import { test, expect } from '@playwright/test';
import {
  createNote,
  selectNoteByContent,
  replyToNote,
  selectors,
  deleteNote,
  verifyNoteExists,
} from './setup/test-helpers';

test.describe('Delete Note', () => {
  test('should delete a single note', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const timestamp = Date.now();
    const noteContent = `Note to delete ${timestamp}`;

    await createNote(page, noteContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteContent);

    // NOTE: Set up dialog handler
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // NOTE: Delete the note
    await deleteNote(page);

    // NOTE: Verify note is removed from list
    const noteItems = page.locator(selectors.noteList.itemContent).filter({ hasText: noteContent });
    await expect(noteItems).toHaveCount(0);
  });

  test('should show confirmation dialog before deleting', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const timestamp = Date.now();
    const noteContent = `Test note for dialog ${timestamp}`;

    await createNote(page, noteContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteContent);

    // NOTE: Set up dialog handler to verify message
    let dialogShown = false;
    let dialogMessage = '';

    page.on('dialog', async (dialog) => {
      dialogShown = true;
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    // NOTE: Hover over thread node to reveal menu button
    const threadNode = page.locator('[data-testid="thread-node"]').first();
    await threadNode.hover();

    // NOTE: Open dropdown menu
    const menuButton = threadNode.locator('button').first();
    await menuButton.waitFor({ state: 'visible', timeout: 5000 });
    await menuButton.click();

    // NOTE: Click delete from dropdown
    const deleteButton = page.locator(selectors.threadView.deleteButton);
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click({ force: true });

    // NOTE: Wait a moment for dialog
    await page.waitForTimeout(500);

    // NOTE: Verify dialog was shown
    expect(dialogShown).toBe(true);
    expect(dialogMessage).toContain('Delete');
  });

  test('should cascade delete child notes', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const parentContent = `Parent note ${timestamp}`;
    const child1Content = `Child 1 ${timestamp}`;
    const child2Content = `Child 2 ${timestamp}`;

    await createNote(page, parentContent);

    // NOTE: Select and add replies
    await selectNoteByContent(page, parentContent);
    await replyToNote({ page, content: child1Content });
    await replyToNote({ page, content: child2Content });

    // NOTE: Verify thread has 3 notes
    const threadNodes = page.locator(selectors.threadView.node);
    await expect(threadNodes).toHaveCount(3);

    // NOTE: Set up dialog handler
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // NOTE: Delete parent note
    await deleteNote(page);

    // NOTE: Verify all notes are deleted (including children)
    const parentNote = page
      .locator(selectors.noteList.itemContent)
      .filter({ hasText: parentContent });
    const child1Note = page
      .locator(selectors.noteList.itemContent)
      .filter({ hasText: child1Content });
    const child2Note = page
      .locator(selectors.noteList.itemContent)
      .filter({ hasText: child2Content });

    await expect(parentNote).toHaveCount(0);
    await expect(child1Note).toHaveCount(0);
    await expect(child2Note).toHaveCount(0);
  });

  test('should cancel deletion when dialog is dismissed', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const timestamp = Date.now();
    const noteContent = `Note to keep ${timestamp}`;

    await createNote(page, noteContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteContent);

    // NOTE: Set up dialog handler to dismiss
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    // NOTE: Hover over thread node to reveal menu button
    const threadNode = page.locator('[data-testid="thread-node"]').first();
    await threadNode.hover();

    // NOTE: Open dropdown menu
    const menuButton = threadNode.locator('button').first();
    await menuButton.waitFor({ state: 'visible', timeout: 5000 });
    await menuButton.click();

    // NOTE: Click delete from dropdown
    const deleteButton = page.locator(selectors.threadView.deleteButton);
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click({ force: true });

    // NOTE: Wait a moment
    await page.waitForTimeout(500);

    // NOTE: Verify note still exists
    await verifyNoteExists(page, noteContent);
  });

  test('should delete only selected note from multiple notes', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create multiple notes with unique content
    const timestamp = Date.now();
    const note1Content = `Note 1 ${timestamp}`;
    const note2Content = `Note 2 ${timestamp}`;
    const note3Content = `Note 3 ${timestamp}`;

    await createNote(page, note1Content);
    await createNote(page, note2Content);
    await createNote(page, note3Content);

    // NOTE: Verify all notes exist
    await verifyNoteExists(page, note1Content);
    await verifyNoteExists(page, note2Content);
    await verifyNoteExists(page, note3Content);

    // NOTE: Select second note
    await selectNoteByContent(page, note2Content);

    // NOTE: Set up dialog handler
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // NOTE: Delete second note
    await deleteNote(page);

    // NOTE: Verify correct notes remain
    await verifyNoteExists(page, note1Content);
    await verifyNoteExists(page, note3Content);

    // NOTE: Verify second note is deleted
    const deletedNote = page
      .locator(selectors.noteList.itemContent)
      .filter({ hasText: note2Content });
    await expect(deletedNote).toHaveCount(0);
  });

  test('should update thread view after deletion', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with reply using unique content
    const timestamp = Date.now();
    const parentContent = `Parent ${timestamp}`;
    const childContent = `Child ${timestamp}`;

    await createNote(page, parentContent);
    await selectNoteByContent(page, parentContent);
    await replyToNote({ page, content: childContent });

    // NOTE: Verify thread has 2 nodes
    const threadNodes = page.locator(selectors.threadView.node);
    await expect(threadNodes).toHaveCount(2);

    // NOTE: Set up dialog handler
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // NOTE: Delete parent (cascade deletes child)
    await deleteNote(page);

    // NOTE: Verify thread view is no longer shown (navigated back to main view)
    await expect(page.locator(selectors.threadView.container)).not.toBeVisible();
  });
});
