import { test, expect } from '@playwright/test';
import { makeProject, makePaper, makeTheme, seedScript } from './helpers/storage';

test.describe('Review Status Cycling', () => {
  test('cycle review status on paper card (unreviewed -> included -> excluded)', async ({ page }) => {
    const project = makeProject({ name: 'Cycle Status', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'cycle-1', title: 'Status Paper', reviewStatus: 'unreviewed' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const statusBtn = page.getByTestId(`status-cycle-${paper.id}`);
    await statusBtn.click();
    await expect(page.getByText('included').first()).toBeVisible();
    await statusBtn.click();
    await expect(page.getByRole('heading', { name: 'Reason for Exclusion' })).toBeVisible();
  });

  test('clicking excluded opens exclusion dialog', async ({ page }) => {
    const project = makeProject({ name: 'Exclusion Dialog', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'excl-1', title: 'To Exclude', reviewStatus: 'included' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const statusBtn = page.getByTestId(`status-cycle-${paper.id}`);
    await statusBtn.click();
    await expect(page.getByText('Reason for Exclusion')).toBeVisible();
  });
});

test.describe('Exclusion Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const project = makeProject({ name: 'Excl Test', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'Theme A' });
    const paper = makePaper({
      id: 'excl-dialog-1',
      title: 'Paper To Exclude',
      reviewStatus: 'included',
      themes: [theme.id],
    });
    await page.addInitScript(seedScript({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const statusBtn = page.getByTestId(`status-cycle-excl-dialog-1`);
    await statusBtn.click();
    await expect(page.getByText('Reason for Exclusion')).toBeVisible();
  });

  test('exclusion dialog allows selecting predefined reasons', async ({ page }) => {
    const reasonBtn = page.locator('.fixed.inset-0.z-\\[200\\] button').filter({ hasText: 'Not LLM-based MAS' });
    await reasonBtn.click();
    await expect(reasonBtn).toHaveClass(/bg-red-50/);
  });

  test('exclusion dialog allows custom reason text input', async ({ page }) => {
    await page.getByPlaceholder('Or type a custom reason...').fill('Custom reason here');
    expect(await page.getByPlaceholder('Or type a custom reason...').inputValue()).toBe('Custom reason here');
  });

  test('exclusion confirm button disabled when no reason provided', async ({ page }) => {
    const dialog = page.locator('.fixed.inset-0.z-\\[200\\]');
    await expect(dialog.getByRole('button', { name: 'Exclude Paper' })).toBeDisabled();
  });

  test('confirm exclusion marks paper excluded and clears themes', async ({ page }) => {
    const dialog = page.locator('.fixed.inset-0.z-\\[200\\]');
    await dialog.locator('button').filter({ hasText: 'Not LLM-based MAS' }).click();
    await dialog.getByRole('button', { name: 'Exclude Paper' }).click();
    await expect(page.getByText('Reason for Exclusion')).not.toBeVisible();
    await expect(page.getByText('excluded').first()).toBeVisible();
  });

  test('cancel exclusion dialog makes no changes', async ({ page }) => {
    const dialog = page.locator('.fixed.inset-0.z-\\[200\\]');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Reason for Exclusion')).not.toBeVisible();
    await expect(page.getByText('included').first()).toBeVisible();
  });

  test('Enter key confirms exclusion when reason selected', async ({ page }) => {
    const dialog = page.locator('.fixed.inset-0.z-\\[200\\]');
    await dialog.locator('button').filter({ hasText: 'Duplicate paper' }).click();
    await dialog.getByPlaceholder('Or type a custom reason...').press('Enter');
    await expect(page.getByText('Reason for Exclusion')).not.toBeVisible();
    await expect(page.getByText('excluded').first()).toBeVisible();
  });
});

test.describe('Full-Text Review Mode', () => {
  test('switch to Full-Text Review mode via sidebar', async ({ page }) => {
    const project = makeProject({ name: 'Review Mode', lastOpened: new Date().toISOString() });
    const paper = makePaper({ title: 'Review Paper' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Full-Text Review' }).click();
    await expect(page.getByText('Review Status')).toBeVisible();
    await expect(page.getByRole('button', { name: /Unreviewed/ })).toBeVisible();
  });

  test('filter by review status with correct counts', async ({ page }) => {
    const project = makeProject({ name: 'Filter Status', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ title: 'Unreviewed One', reviewStatus: 'unreviewed' }),
      makePaper({ title: 'Included One', reviewStatus: 'included' }),
      makePaper({ title: 'Excluded One', reviewStatus: 'excluded', exclusionReason: 'Test' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Full-Text Review' }).click();
    await expect(page.getByRole('button', { name: /Unreviewed \d/ })).toBeVisible();

    await page.getByRole('button', { name: /^Included/ }).click();
    await expect(page.getByRole('heading', { name: /Included Papers/ })).toBeVisible();
    await expect(page.getByText('Included One')).toBeVisible();
    await expect(page.getByText('Unreviewed One')).not.toBeVisible();
  });
});

test.describe('Screening Dialog', () => {
  test('"Move Back to Screening" opens confirmation dialog', async ({ page }) => {
    const project = makeProject({ name: 'Screening', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'screen-1', title: 'Screen Paper' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Screen Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    await page.locator('.max-w-4xl').getByRole('button', { name: 'Move Back to Screening' }).click();
    await expect(page.getByRole('heading', { name: 'Move Back to Screening' })).toBeVisible();
  });

  test('confirm screening removes paper and shows success message', async ({ page }) => {
    const project = makeProject({ name: 'Confirm Screening', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'confirm-screen-1', title: 'ToRemove Paper' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('ToRemove Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    await page.locator('.max-w-4xl').getByRole('button', { name: 'Move Back to Screening' }).click();
    const dialog = page.locator('.fixed.inset-0.z-\\[200\\]');
    await dialog.getByRole('button', { name: 'Move Back to Screening' }).click();
    await expect(page.getByText(/Moved.*back to screening/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.grid.grid-cols-1').getByText('ToRemove Paper')).not.toBeVisible();
  });
});

test.describe('Archived Project Restrictions', () => {
  test('review status buttons disabled when project is archived', async ({ page }) => {
    const project = makeProject({ name: 'Archived Review', archived: true });
    const paper = makePaper({ id: 'archived-review-1', title: 'Archived Paper' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await page.getByRole('button', { name: /Archived Projects/ }).click();
    await expect(page.getByText('Archived Review')).toBeVisible({ timeout: 5000 });
    await page.getByText('Archived Review').click();
    await expect(page.getByText('Archived (Read-only)')).toBeVisible({ timeout: 5000 });
    await page.getByText('Archived Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    await expect(page.locator('.max-w-4xl').getByRole('button', { name: 'Included' })).toBeDisabled();
    await expect(page.locator('.max-w-4xl').getByRole('button', { name: 'Excluded' })).toBeDisabled();
    await expect(page.locator('.max-w-4xl').getByRole('button', { name: 'Unreviewed' })).toBeDisabled();
    await expect(page.locator('.max-w-4xl').getByRole('button', { name: 'Move Back to Screening' })).toBeDisabled();
  });
});
