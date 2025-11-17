import { expect, Page } from '@playwright/test';

// NOTE: Page object selectors for E2E tests

export const selectors = {
  // NOTE: Note Editor (using data-testid)
  noteEditor: {
    textarea: '[data-testid="note-editor-textarea"]',
    submitButton: '[data-testid="note-editor-submit"]',
    cancelButton: '[data-testid="note-editor-cancel"]',
    charCount: '[data-testid="note-editor-char-count"]',
    error: '[data-testid="note-editor-error"]',
  },

  // NOTE: Note List (using data-testid)
  noteList: {
    container: '[data-testid="note-list"]',
    items: '[data-testid="note-item"]',
    itemContent: '[data-testid="note-item-content"]',
    itemId: '[data-testid="note-item-id"]',
    selected: '[data-testid="note-item"].bg-accent\\/50',
    empty: '[data-testid="note-list-empty"]',
    loading: '[data-testid="note-list-loading"]',
  },

  // NOTE: Thread View (using data-testid)
  threadView: {
    container: '[data-testid="thread-view"]',
    node: '[data-testid="thread-node"]',
    nodeId: '[data-testid="thread-node-id"]',
    nodeContent: '[data-testid="thread-node-content"]',
    replyButton: '[data-testid="thread-reply-submit"]',
    editButton: '[data-testid="thread-action-edit"]',
    deleteButton: '[data-testid="thread-action-delete"]',
    mention: 'a.text-primary:has-text("@")',
  },

  // NOTE: Search Bar (using data-testid)
  searchBar: {
    input: '[data-testid="note-list-search"]',
    clearButton: 'button:has-text("Clear")', // NOTE: No longer exists in new design
    status: '[data-testid="note-list-count"]',
  },
};

// NOTE: Common test actions

export async function createNote(page: Page, content: string): Promise<string> {
  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/notes') && response.request().method() === 'POST',
    { timeout: 5000 }
  );

  await page.fill(selectors.noteEditor.textarea, content);
  await page.click(selectors.noteEditor.submitButton);

  // NOTE: Wait for API response
  const response = await responsePromise;
  const data = await response.json();
  const noteId = data.note?.id || data.id;

  // NOTE: Wait for note to appear in list
  await waitForNoteWithContent(page, content);

  return noteId;
}

export async function waitForNoteWithContent(page: Page, content: string, timeout: number = 5000) {
  await page.waitForFunction(
    ({ contentText }) => {
      const contentElements = Array.from(
        document.querySelectorAll('[data-testid="note-item-content"]')
      );
      return contentElements.some((el) => el.textContent?.includes(contentText));
    },
    { contentText: content },
    { timeout }
  );
}

export async function findNoteByContent(page: Page, content: string): Promise<number> {
  const notes = page.locator(selectors.noteList.items);
  const count = await notes.count();

  for (let i = 0; i < count; i++) {
    const noteContent = await notes.nth(i).locator(selectors.noteList.itemContent).textContent();
    if (noteContent?.includes(content)) {
      return i;
    }
  }

  throw new Error(`Note with content "${content}" not found`);
}

export async function replyToNote({
  page,
  content,
}: {
  page: Page;
  content: string;
}): Promise<string> {
  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/notes') && response.request().method() === 'POST',
    { timeout: 5000 }
  );

  // NOTE: Fill reply input (now at bottom of thread view)
  const replyInput = page.locator('[data-testid="thread-reply-textarea"]');
  await replyInput.fill(content);

  // NOTE: Click send button
  await page.click('[data-testid="thread-reply-submit"]');

  // NOTE: Wait for API response
  const response = await responsePromise;
  const data = await response.json();
  const noteId = data.note?.id || data.id;

  // NOTE: Wait for reply to appear in thread
  await page.waitForFunction(
    ({ contentText }) => {
      const nodes = Array.from(document.querySelectorAll('[data-testid="thread-node-content"]'));
      return nodes.some((node) => node.textContent?.includes(contentText));
    },
    { contentText: content },
    { timeout: 5000 }
  );

  return noteId;
}

export async function selectNoteFromList(page: Page, noteIndex: number = 0) {
  const notes = page.locator(selectors.noteList.items);
  await notes.nth(noteIndex).click();

  // NOTE: Wait for thread view to load
  await page.waitForSelector(selectors.threadView.container, { timeout: 5000 });
}

export async function selectNoteByContent(page: Page, content: string) {
  const noteIndex = await findNoteByContent(page, content);
  await selectNoteFromList(page, noteIndex);
}

export async function getNoteIdFromList(page: Page, noteIndex: number = 0): Promise<string> {
  const noteId = page
    .locator(selectors.noteList.items)
    .nth(noteIndex)
    .locator(selectors.noteList.itemId);
  const text = await noteId.textContent();
  return text?.replace('#', '') || '';
}

export async function searchNotes(page: Page, query: string) {
  await page.fill(selectors.searchBar.input, query);

  // NOTE: Wait for search to complete (debounced)
  await page.waitForTimeout(500);
}

export async function clearSearch(page: Page) {
  // NOTE: Clear by setting input value to empty (no clear button in new design)
  await page.fill(selectors.searchBar.input, '');

  // NOTE: Wait for full list to return
  await page.waitForTimeout(500);
}

export async function deleteNote(page: Page) {
  // NOTE: This function should NOT set up dialog handler
  // The test should set it up before calling this function
  // to avoid race conditions

  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/notes/') && response.request().method() === 'DELETE',
    { timeout: 15000 }
  );

  // NOTE: Hover over thread node to show menu button
  const threadNode = page.locator('[data-testid="thread-node"]').first();
  await threadNode.hover();

  // NOTE: Find and click the dropdown menu button
  const menuButton = threadNode.locator('button').first();
  await menuButton.waitFor({ state: 'visible', timeout: 5000 });
  await menuButton.click();

  // NOTE: Wait for dropdown menu to be visible (portal rendered)
  const deleteButton = page.locator('[data-testid="thread-action-delete"]');
  await deleteButton.waitFor({ state: 'visible', timeout: 10000 });

  // NOTE: Click delete menu item (force click as it might be in a portal/dropdown)
  await deleteButton.click({ force: true });

  // NOTE: Wait for deletion to complete
  await responsePromise;

  // NOTE: Give UI time to update
  await page.waitForTimeout(500);
}

export async function waitForNoteCount(page: Page, expectedCount: number) {
  await page.waitForFunction(
    ({ selector, count }) => {
      const notes = document.querySelectorAll(selector);
      return notes.length === count;
    },
    { selector: selectors.noteList.items, count: expectedCount },
    { timeout: 5000 }
  );
}

export async function getNoteCount(page: Page): Promise<number> {
  const notes = page.locator(selectors.noteList.items);
  return await notes.count();
}

export async function verifyNoteContent(page: Page, content: string, noteIndex?: number) {
  if (noteIndex !== undefined) {
    const noteContent = page
      .locator(selectors.noteList.items)
      .nth(noteIndex)
      .locator(selectors.noteList.itemContent);
    await expect(noteContent).toContainText(content);
  } else {
    // NOTE: Verify note exists anywhere in the list
    await expect(
      page.locator(selectors.noteList.itemContent).filter({ hasText: content })
    ).toBeVisible();
  }
}

export async function verifyNoteExists(page: Page, content: string) {
  await expect(
    page.locator(selectors.noteList.itemContent).filter({ hasText: content })
  ).toBeVisible();
}

export async function verifyThreadNodeContent(page: Page, content: string, nodeIndex: number = 0) {
  const nodeContent = page
    .locator(selectors.threadView.node)
    .nth(nodeIndex)
    .locator(selectors.threadView.nodeContent);
  await expect(nodeContent).toContainText(content);
}

export async function clickMentionLink(page: Page, noteId: string) {
  await page.click(`a:has-text("@${noteId}")`);

  // NOTE: Wait for navigation
  await page.waitForTimeout(500);
}
