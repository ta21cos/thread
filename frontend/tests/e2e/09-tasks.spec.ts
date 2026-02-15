import { test, expect } from '@playwright/test';
import { createNote } from './setup/test-helpers';

// NOTE: Serial mode to ensure empty state test runs before task creation
test.describe.configure({ mode: 'serial' });

test.describe('Tasks Page', () => {
  test('should display tasks page with empty state', async ({ page }) => {
    await page.goto('/tasks');

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByText('No tasks yet')).toBeVisible();
    await expect(page.getByText('Tasks from your notes will appear here.')).toBeVisible();
  });

  test('should navigate to tasks page from sidebar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('should auto-create task from note with checkbox syntax', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with checkbox syntax
    await createNote(page, '- [ ] Buy groceries');

    // NOTE: Navigate to tasks page
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page).toHaveURL('/tasks');

    // NOTE: Verify task appears in To Do section (scoped to tasks list)
    const tasksList = page.getByTestId('tasks-list');
    await tasksList.waitFor({ state: 'visible', timeout: 10000 });
    await expect(tasksList.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByTestId('task-item')).toBeVisible();
  });

  test('should show completed task from note with checked checkbox', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with completed checkbox syntax
    await createNote(page, '- [x] Already done');

    // NOTE: Navigate to tasks page
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page).toHaveURL('/tasks');

    // NOTE: Verify task appears in Completed section (scoped to tasks list)
    const tasksList = page.getByTestId('tasks-list');
    await tasksList.waitFor({ state: 'visible', timeout: 10000 });
    await expect(tasksList.getByRole('heading', { name: /Completed/ })).toBeVisible();
    await expect(tasksList.getByText('Already done')).toBeVisible();
  });
});
