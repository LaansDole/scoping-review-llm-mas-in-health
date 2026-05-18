import { test, expect } from '@playwright/test';
import { makeProject, makePaper, makeTheme, seedScript } from './helpers/storage';

test.describe('Text Search', () => {
  test('text search filters papers by title', async ({ page }) => {
    const project = makeProject({ name: 'Search Title', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'st-1', title: 'Machine Learning in Healthcare' }),
      makePaper({ id: 'st-2', title: 'Natural Language Processing' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Search research...').fill('Machine Learning');
    await expect(page.getByText('Machine Learning in Healthcare')).toBeVisible();
    await expect(page.getByText('Natural Language Processing')).not.toBeVisible();
  });

  test('text search filters papers by abstract content', async ({ page }) => {
    const project = makeProject({ name: 'Search Abstract', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'sa-1', title: 'Paper X', abstract: 'Deep learning for radiological diagnosis' }),
      makePaper({ id: 'sa-2', title: 'Paper Y', abstract: 'Reinforcement learning for robotics' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Search research...').fill('radiological');
    await expect(page.getByText('Paper X')).toBeVisible();
    await expect(page.getByText('Paper Y')).not.toBeVisible();
  });

  test('text search filters papers by author name', async ({ page }) => {
    const project = makeProject({ name: 'Search Author', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'sau-1', title: 'Paper Z', authors: ['Maria Garcia'] }),
      makePaper({ id: 'sau-2', title: 'Paper W', authors: ['James Chen'] }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Search research...').fill('Garcia');
    await expect(page.getByText('Paper Z')).toBeVisible();
    await expect(page.getByText('Paper W')).not.toBeVisible();
  });

  test('search is case-insensitive', async ({ page }) => {
    const project = makeProject({ name: 'Case Search', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'cs-1', title: 'Clinical Decision Support' }),
      makePaper({ id: 'cs-2', title: 'Treatment Planning' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Search research...').fill('clinical');
    await expect(page.getByText('Clinical Decision Support')).toBeVisible();
    await expect(page.getByText('Treatment Planning')).not.toBeVisible();
  });
});

test.describe('Theme and Tag Filtering', () => {
  test('click theme in sidebar filters grid to papers with that theme', async ({ page }) => {
    const project = makeProject({ name: 'Theme Filter', lastOpened: new Date().toISOString() });
    const theme1 = makeTheme({ name: 'Diagnosis' });
    const theme2 = makeTheme({ name: 'Treatment' });
    const papers = [
      makePaper({ id: 'tf-1', title: 'Diagnosis Paper', themes: [theme1.id] }),
      makePaper({ id: 'tf-2', title: 'Treatment Paper', themes: [theme2.id] }),
    ];
    await page.addInitScript(seedScript({ project, papers, themes: [theme1, theme2] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Diagnosis' }).click();
    await expect(page.getByText('Diagnosis Paper')).toBeVisible();
    await expect(page.getByText('Treatment Paper')).not.toBeVisible();
  });

  test('theme filter includes papers with child themes', async ({ page }) => {
    const project = makeProject({ name: 'Child Theme Filter', lastOpened: new Date().toISOString() });
    const parent = makeTheme({ name: 'Clinical' });
    const child = makeTheme({ name: 'Clinical AI', parentId: parent.id });
    const papers = [
      makePaper({ id: 'ctf-1', title: 'Parent Paper', themes: [parent.id] }),
      makePaper({ id: 'ctf-2', title: 'Child Paper', themes: [child.id] }),
      makePaper({ id: 'ctf-3', title: 'Other Paper', themes: [] }),
    ];
    await page.addInitScript(seedScript({ project, papers, themes: [parent, child] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Clinical', exact: true }).click();
    await expect(page.getByText('Parent Paper')).toBeVisible();
    await expect(page.getByText('Child Paper')).toBeVisible();
    await expect(page.getByText('Other Paper')).not.toBeVisible();
  });

  test('click tag in sidebar filters grid to papers with that tag', async ({ page }) => {
    const project = makeProject({ name: 'Tag Filter', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'tgf-1', title: 'Tagged Paper', tags: ['radiology'] }),
      makePaper({ id: 'tgf-2', title: 'Untagged Paper', tags: ['oncology'] }),
    ];
    await page.addInitScript(seedScript({ project, papers, tags: ['radiology', 'oncology'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.locator('.group\\/tag').filter({ hasText: 'radiology' }).getByRole('button').first().click();
    await expect(page.getByRole('heading', { name: 'Tagged Paper', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Untagged Paper', exact: true })).not.toBeVisible();
  });
});

test.describe('Combined Filters', () => {
  test('combined search + theme + tag filters apply together', async ({ page }) => {
    const project = makeProject({ name: 'Combined Filter', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'AIFilter' });
    const papers = [
      makePaper({
        id: 'cf-1',
        title: 'AI in Radiology',
        abstract: 'Deep learning for diagnosis',
        themes: [theme.id],
        tags: ['radiology'],
      }),
      makePaper({
        id: 'cf-2',
        title: 'AI in Oncology',
        abstract: 'Treatment planning',
        themes: [theme.id],
        tags: ['oncology'],
      }),
      makePaper({
        id: 'cf-3',
        title: 'ML in Radiology',
        abstract: 'Machine learning for scans',
        themes: [],
        tags: ['radiology'],
      }),
    ];
    await page.addInitScript(seedScript({ project, papers, themes: [theme], tags: ['radiology', 'oncology'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Search research...').fill('radiology');
    await page.getByRole('button', { name: 'AIFilter' }).click();
    await page.locator('.group\\/tag').filter({ hasText: 'radiology' }).getByRole('button').first().click();

    await expect(page.getByText('AI in Radiology')).toBeVisible();
    await expect(page.getByText('AI in Oncology')).not.toBeVisible();
    await expect(page.getByText('ML in Radiology')).not.toBeVisible();
  });

  test('"All Research" button clears theme filter', async ({ page }) => {
    const project = makeProject({ name: 'Clear Theme', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'ClearMe' });
    const papers = [
      makePaper({ id: 'cl-1', title: 'Themed Paper', themes: [theme.id] }),
      makePaper({ id: 'cl-2', title: 'Unthemed Paper', themes: [] }),
    ];
    await page.addInitScript(seedScript({ project, papers, themes: [theme] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'ClearMe' }).click();
    await expect(page.getByRole('heading', { name: 'Unthemed Paper', exact: true })).not.toBeVisible();

    await page.getByText('All Research').click();
    await expect(page.getByRole('heading', { name: 'Themed Paper', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unthemed Paper', exact: true })).toBeVisible();
  });

  test('changing filter clears multi-select selection', async ({ page }) => {
    const project = makeProject({ name: 'FilterClear Select', lastOpened: new Date().toISOString() });
    const papers = [
      makePaper({ id: 'fcs-1', title: 'Paper AA' }),
      makePaper({ id: 'fcs-2', title: 'Paper BB' }),
    ];
    await page.addInitScript(seedScript({ project, papers }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Multi-Select' }).click();
    await page.getByText('Paper AA').click();
    await expect(page.getByText('1 selected')).toBeVisible();

    await page.getByPlaceholder('Search research...').fill('AA');
    await expect(page.getByText(/selected/)).not.toBeVisible();
  });
});
