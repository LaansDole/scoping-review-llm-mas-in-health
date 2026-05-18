import { test, expect } from '@playwright/test';
import { makeProject, makePaper, seedScript } from './helpers/storage';

test.describe('Multi-Select Mode', () => {
  test('enter multi-select mode shows checkboxes on cards', async ({ page }) => {
    const project = makeProject({ name: 'Multi Select', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'ms-1', title: 'Paper A' }),
      makePaper({ id: 'ms-2', title: 'Paper B' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await expect(page.getByRole('button', { name: 'Exit Select' })).toBeVisible();
    await expect(page.getByTestId('card-checkbox-ms-1')).toBeVisible();
  });

  test('exit multi-select mode clears selections', async ({ page }) => {
    const project = makeProject({ name: 'Exit Select', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'es-1', title: 'Paper C' }),
      makePaper({ id: 'es-2', title: 'Paper D' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper C').click();
    await expect(page.getByText('1 selected')).toBeVisible();

    await page.getByRole('button', { name: 'Exit Select' }).click();
    await expect(page.getByRole('button', { name: 'Multi-Select' })).toBeVisible();
  });

  test('select individual papers in multi-select mode', async ({ page }) => {
    const project = makeProject({ name: 'Select Papers', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'sp-1', title: 'Paper E' }),
      makePaper({ id: 'sp-2', title: 'Paper F' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper E').click();
    await page.getByText('Paper F').click();
    await expect(page.getByText('2 selected')).toBeVisible();
  });

  test('shift-click selects range of papers', async ({ page }) => {
    const project = makeProject({ name: 'Shift Select', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'ss-1', title: 'Paper G' }),
      makePaper({ id: 'ss-2', title: 'Paper H' }),
      makePaper({ id: 'ss-3', title: 'Paper I' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByTestId('card-checkbox-ss-1').click();
    await page.getByTestId('card-checkbox-ss-3').click({ modifiers: ['Shift'] });
    await expect(page.getByText(/selected/)).toBeVisible();
  });

  test('"Select all" selects all filtered papers', async ({ page }) => {
    const project = makeProject({ name: 'SelectAllTest', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'sa-1', title: 'Paper J' }),
      makePaper({ id: 'sa-2', title: 'Paper K' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper J').click();
    await expect(page.getByText('1 selected')).toBeVisible();
    await page.getByText('Select all').click();
    await expect(page.getByText('2 selected')).toBeVisible();
  });
});

test.describe('Batch Tag Operations', () => {
  test('batch add existing tag to selected papers', async ({ page }) => {
    const project = makeProject({ name: 'Batch Add', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'ba-1', title: 'Paper L', tags: [] }),
      makePaper({ id: 'ba-2', title: 'Paper M', tags: [] }),
    ];
    await page.addInitScript(seedScript({ project, papers, tags: ['ExistingTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper L').click();
    await page.getByText('Paper M').click();
    await page.getByRole('button', { name: 'Add Tag' }).click();
    await page.locator('.fixed.bottom-0').getByText('ExistingTag').click();

    await page.getByRole('button', { name: 'Exit Select' }).click();
    await page.getByText('Paper L').click();
    await expect(page.locator('.max-w-4xl .bg-amber-50').getByText('ExistingTag')).toBeVisible();
  });

  test('batch create and add new tag to selected papers', async ({ page }) => {
    const project = makeProject({ name: 'Batch Create', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'bc-1', title: 'Paper N', tags: [] }),
      makePaper({ id: 'bc-2', title: 'Paper O', tags: [] }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper N').click();
    await page.getByText('Paper O').click();
    await page.getByPlaceholder('New tag...').fill('BatchNewTag');
    await page.getByPlaceholder('New tag...').press('Enter');

    await page.getByRole('button', { name: 'Exit Select' }).click();
    await page.getByText('Paper N').click();
    await expect(page.locator('.max-w-4xl .bg-amber-50').getByText('BatchNewTag')).toBeVisible();
  });

  test('batch remove tag from selected papers', async ({ page }) => {
    const project = makeProject({ name: 'Batch Remove', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'br-1', title: 'Paper P', tags: ['SharedTag'] }),
      makePaper({ id: 'br-2', title: 'Paper Q', tags: ['SharedTag'] }),
    ];
    await page.addInitScript(seedScript({ project, papers, tags: ['SharedTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper P').click();
    await page.getByText('Paper Q').click();
    await page.getByRole('button', { name: 'Remove Tag' }).click();
    await page.locator('.fixed.bottom-0').getByText('SharedTag').click();

    await page.getByRole('button', { name: 'Exit Select' }).click();
    await page.getByText('Paper P').click();
    await expect(page.locator('.max-w-4xl .bg-amber-50').getByText('SharedTag')).not.toBeVisible();
  });

  test('batch action bar shows correct selection count', async ({ page }) => {
    const project = makeProject({ name: 'Bar Count', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'cnt-1', title: 'Paper R' }),
      makePaper({ id: 'cnt-2', title: 'Paper S' }),
      makePaper({ id: 'cnt-3', title: 'Paper T' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper R').click();
    await expect(page.getByText('1 selected')).toBeVisible();
    await page.getByText('Paper S').click();
    await expect(page.getByText('2 selected')).toBeVisible();
  });

  test('batch action bar hidden when no papers selected', async ({ page }) => {
    const project = makeProject({ name: 'Bar Hidden', lastOpened: new Date().toISOString() });
    const papers = [makePaper({ id: 'bh-1', title: 'Paper U' })];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await expect(page.getByText(/selected/)).not.toBeVisible();
  });
});
