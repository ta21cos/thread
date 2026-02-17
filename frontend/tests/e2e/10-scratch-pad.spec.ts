import { test, expect } from '@playwright/test';

// NOTE: Playwright's Desktop Chrome emulates Windows userAgentData even on macOS,
// so the app's isMac detection returns false. Use Control+/ instead of Meta+/.
const MOD_SLASH = 'Control+/';

// NOTE: Serial mode required - scratch pad is shared server-side state (one per user)
test.describe.configure({ mode: 'serial' });

test.describe('Scratch Pad', () => {
  test('should open and close scratch pad panel', async ({ page }) => {
    await page.goto('/');

    // NOTE: Scratch pad should be closed initially (translate-x-full)
    const panel = page.getByTestId('scratch-pad-panel');
    await expect(panel).toHaveClass(/translate-x-full/);

    // NOTE: Open scratch pad via keyboard shortcut
    await page.keyboard.press(MOD_SLASH);
    await expect(panel).toHaveClass(/translate-x-0/);

    // NOTE: Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(panel).toHaveClass(/translate-x-full/);
  });

  test('should type content and auto-save', async ({ page }) => {
    await page.goto('/');

    // NOTE: Set up response listener before opening scratch pad (GET fires on open)
    const scratchPadLoaded = page.waitForResponse(
      (response) =>
        response.url().includes('/api/scratch-pad') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    // NOTE: Open scratch pad
    await page.keyboard.press(MOD_SLASH);
    const panel = page.getByTestId('scratch-pad-panel');
    await expect(panel).toHaveClass(/translate-x-0/);

    // NOTE: Wait for initial GET scratch pad to complete before modifying content
    await scratchPadLoaded;

    // NOTE: Clear existing content and type new content
    const textarea = page.getByTestId('scratch-pad-textarea');
    await textarea.click();
    await textarea.fill('');
    await textarea.pressSequentially('Hello test', { delay: 20 });

    // NOTE: Verify auto-save completed via "Saved" indicator in UI
    await expect(panel.getByText('Saved')).toBeVisible({ timeout: 5000 });
  });

  test('should persist content after closing and reopening', async ({ page }) => {
    await page.goto('/');

    // NOTE: Set up response listener before opening scratch pad (GET fires on open)
    const scratchPadLoaded = page.waitForResponse(
      (response) =>
        response.url().includes('/api/scratch-pad') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    // NOTE: Open and clear any existing content, then type new content
    await page.keyboard.press(MOD_SLASH);
    const textarea = page.getByTestId('scratch-pad-textarea');

    // NOTE: Wait for initial GET scratch pad to complete before clearing
    await scratchPadLoaded;
    await textarea.click();
    await textarea.fill('');
    await textarea.pressSequentially('Persistent content', { delay: 20 });

    // NOTE: Wait for "Saved" indicator to confirm auto-save
    await expect(page.getByTestId('scratch-pad-panel').getByText('Saved')).toBeVisible({
      timeout: 5000,
    });

    // NOTE: Close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.getByTestId('scratch-pad-panel')).toHaveClass(/translate-x-full/);

    // NOTE: Click on main content area to ensure focus is not on textarea
    await page.locator('main').first().click();
    await page.waitForTimeout(100);

    // NOTE: Reopen
    await page.keyboard.press(MOD_SLASH);
    await expect(page.getByTestId('scratch-pad-panel')).toHaveClass(/translate-x-0/);

    // NOTE: Content should be persisted
    await expect(textarea).toHaveValue('Persistent content');
  });
});
