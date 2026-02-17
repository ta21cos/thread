import { test, expect } from '@playwright/test';

test.describe('Daily Notes', () => {
  test('should display daily notes page with calendar', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];

    // NOTE: Navigate directly to today's date (since /daily doesn't redirect)
    await page.goto(`/daily/${today}`);

    // NOTE: Calendar widget should be visible
    await expect(page.getByTestId('calendar-widget')).toBeVisible();
    await expect(page.getByText('Daily Notes').first()).toBeVisible();

    // NOTE: Today button should be visible
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
  });

  test('should show formatted date for today', async ({ page }) => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await page.goto(`/daily/${today.toISOString().split('T')[0]}`);

    // NOTE: Should show the formatted date
    await expect(page.getByText(formatted)).toBeVisible();
  });

  test('should navigate between months in calendar', async ({ page }) => {
    const today = new Date();
    await page.goto(`/daily/${today.toISOString().split('T')[0]}`);

    // NOTE: Get current month label
    const currentMonthLabel = today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    await expect(page.getByText(currentMonthLabel)).toBeVisible();

    // NOTE: Navigate to previous month - use the first button inside the calendar header (ChevronLeft)
    const calendarWidget = page.getByTestId('calendar-widget');
    const headerButtons = calendarWidget.locator('> div:first-child button');
    const prevButton = headerButtons.first();
    await prevButton.click();

    // NOTE: Verify month changed
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const prevMonthLabel = prevMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    await expect(page.getByText(prevMonthLabel)).toBeVisible();

    // NOTE: Navigate forward to go back - use the last header button (ChevronRight)
    const nextButton = headerButtons.last();
    await nextButton.click();

    // NOTE: Should be back to current month
    await expect(page.getByText(currentMonthLabel)).toBeVisible();
  });

  test('should select a date from calendar', async ({ page }) => {
    const today = new Date();
    await page.goto(`/daily/${today.toISOString().split('T')[0]}`);

    // NOTE: Click on day 15 of current month (safe choice - exists in all months)
    const dayButtons = page.getByTestId('calendar-day');
    const day15 = dayButtons.filter({ hasText: /^15$/ });
    await day15.click();

    // NOTE: URL should update to selected date
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    await expect(page).toHaveURL(`/daily/${year}-${month}-15`);
  });

  test('should auto-create daily note from template when visiting a new date', async ({ page }) => {
    // NOTE: Visit a past date - the API auto-creates a note from the default template
    await page.goto('/daily/2020-01-01');

    // NOTE: Template content is rendered in a textarea, verify textarea contains expected text
    const textarea = page.getByTestId('daily-note-textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await expect(textarea).toHaveValue(/2020-01-01/);
    await expect(textarea).toHaveValue(/## Today/);
  });
});
