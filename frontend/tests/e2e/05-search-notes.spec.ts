import { test, expect } from '@playwright/test';
import {
  createNote,
  searchNotes,
  clearSearch,
  selectors,
  verifyNoteExists,
} from './setup/test-helpers';

test.describe('Search Notes', () => {
  test('should display search bar', async ({ page }) => {
    await page.goto('/');

    // NOTE: Verify search bar is visible
    await expect(page.locator(selectors.searchBar.input)).toBeVisible();
  });

  test('should filter notes by content', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique identifiable content
    const timestamp = Date.now();
    const searchTerm = `UniqueSearch${timestamp}`;
    const note1 = `${searchTerm} JavaScript is awesome`;
    const note2 = `Python is great ${timestamp}`;
    const note3 = `TypeScript rocks ${timestamp}`;

    await createNote(page, note1);
    await createNote(page, note2);
    await createNote(page, note3);

    // NOTE: Search for unique term
    await searchNotes(page, searchTerm);

    // NOTE: Verify only matching note is displayed
    await verifyNoteExists(page, note1);

    // NOTE: Verify non-matching notes are not visible
    const allVisibleNotes = page.locator(selectors.noteList.itemContent);
    const count = await allVisibleNotes.count();
    expect(count).toBe(1);
  });

  test('should show all notes when search is cleared', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create multiple notes with unique content
    const timestamp = Date.now();
    const searchTerm = `Searchable${timestamp}`;
    const note1 = `${searchTerm} First note`;
    const note2 = `Second note ${timestamp}`;
    const note3 = `Third note ${timestamp}`;

    await createNote(page, note1);
    await createNote(page, note2);
    await createNote(page, note3);

    // NOTE: Perform search
    await searchNotes(page, searchTerm);

    // NOTE: Verify filtered results
    const filteredNotes = page.locator(selectors.noteList.itemContent);
    await expect(filteredNotes).toHaveCount(1);

    // NOTE: Clear search
    await clearSearch(page);

    // NOTE: Verify all 3 notes are visible again
    await verifyNoteExists(page, note1);
    await verifyNoteExists(page, note2);
    await verifyNoteExists(page, note3);
  });

  test('should display search query in status', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const timestamp = Date.now();
    const searchQuery = `SearchStatus${timestamp}`;
    const noteContent = `Test content with ${searchQuery}`;

    await createNote(page, noteContent);

    // NOTE: Perform search
    await searchNotes(page, searchQuery);

    // NOTE: Verify search results are shown (current UI shows note count, not query)
    await expect(page.locator(selectors.searchBar.status)).toBeVisible();
  });

  test('should handle no search results', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique content
    const timestamp = Date.now();
    const noteContent = `Available note ${timestamp}`;

    await createNote(page, noteContent);

    // NOTE: Search for non-existent unique content
    const nonExistentQuery = `nonexistent${timestamp}xyz`;
    await searchNotes(page, nonExistentQuery);

    // NOTE: Verify no results
    const notes = page.locator(selectors.noteList.itemContent);
    await expect(notes).toHaveCount(0);
  });

  test('should search case-insensitively', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique mixed case content
    const timestamp = Date.now();
    const uniqueTerm = `CaseTEST${timestamp}`;
    const noteContent = `This is a ${uniqueTerm} note`;

    await createNote(page, noteContent);

    // NOTE: Search with lowercase
    await searchNotes(page, uniqueTerm.toLowerCase());

    // NOTE: Verify note is found
    await verifyNoteExists(page, noteContent);

    // NOTE: Clear and search with uppercase
    await clearSearch(page);
    await searchNotes(page, uniqueTerm.toUpperCase());

    // NOTE: Verify note is still found
    await verifyNoteExists(page, noteContent);
  });

  test('should search partial matches', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique content
    const timestamp = Date.now();
    const fullTerm = `JavaScriptFrameworks${timestamp}`;
    const noteContent = `Testing ${fullTerm} here`;

    await createNote(page, noteContent);

    // NOTE: Search with partial unique term
    const partialTerm = `Frameworks${timestamp}`;
    await searchNotes(page, partialTerm);

    // NOTE: Verify note is found
    await verifyNoteExists(page, noteContent);
  });

  test('should clear search by emptying input', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique content
    const timestamp = Date.now();
    const searchTerm = `ClearTest${timestamp}`;
    const note1 = `${searchTerm} First`;
    const note2 = `Second ${timestamp}`;

    await createNote(page, note1);
    await createNote(page, note2);

    // NOTE: Perform search
    await searchNotes(page, searchTerm);

    // NOTE: Clear search by emptying input (no clear button in current design)
    await clearSearch(page);

    // NOTE: Verify search input is cleared
    const inputValue = await page.locator(selectors.searchBar.input).inputValue();
    expect(inputValue).toBe('');

    // NOTE: Verify both notes are shown
    await verifyNoteExists(page, note1);
    await verifyNoteExists(page, note2);
  });
});
