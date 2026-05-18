import { test, expect } from '@playwright/test';
import { makeProject, makePaper, makeTheme, seedScript } from './helpers/storage';

function seedWithThemes(overrides: { project: ReturnType<typeof makeProject>; papers: ReturnType<typeof makePaper>[]; themes: ReturnType<typeof makeTheme>[]; tags?: string[] }) {
  return seedScript({ ...overrides, themes: overrides.themes, tags: overrides.tags ?? [] });
}

test.describe('Theme Management', () => {
  test('add top-level theme via sidebar', async ({ page }) => {
    const project = makeProject({ name: 'Theme Test', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Add theme').click();
    await page.getByPlaceholder('Theme name...').fill('New Theme');
    await page.getByPlaceholder('Theme name...').press('Enter');
    await expect(page.getByRole('button', { name: 'New Theme' })).toBeVisible();
  });

  test('add sub-theme to existing parent theme', async ({ page }) => {
    const project = makeProject({ name: 'SubTheme Test', lastOpened: new Date().toISOString() });
    const parentTheme = makeTheme({ name: 'Parent Theme' });
    const paper = makePaper({ themes: [parentTheme.id] });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [parentTheme] }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Parent Theme' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Parent Theme' }).hover();
    await page.locator('aside button[title="Add sub-theme"]').click({ force: true });
    await page.getByPlaceholder('Sub-theme name...').fill('Child Theme');
    await page.getByPlaceholder('Sub-theme name...').press('Enter');
    await expect(page.getByText('Child Theme')).toBeVisible();
  });

  test('rename theme via hover pencil icon', async ({ page }) => {
    const project = makeProject({ name: 'Rename Theme', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'Old Name' });
    const paper = makePaper({ themes: [theme.id] });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Old Name' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Old Name' }).hover();
    await page.locator('aside button[title="Rename theme"]').click({ force: true });
    const input = page.locator('aside input[type="text"]').filter({ hasText: '' }).first();
    await input.clear();
    await input.fill('Renamed Theme');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Renamed Theme' })).toBeVisible();
  });

  test('delete theme shows confirmation dialog with affected counts', async ({ page }) => {
    const project = makeProject({ name: 'Delete Theme', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'ToDelete' });
    const paper = makePaper({ themes: [theme.id] });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'ToDelete' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'ToDelete' }).hover();
    await page.locator('aside button[title="Delete theme"]').click({ force: true });
    await expect(page.locator('.fixed.inset-0.z-\\[200\\]').getByRole('heading', { name: 'Delete Theme', exact: true })).toBeVisible();
    await expect(page.getByText(/1 paper/)).toBeVisible();
  });

  test('confirm theme delete removes theme from papers and sidebar', async ({ page }) => {
    const project = makeProject({ name: 'Confirm Delete', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'RemoveMe' });
    const paper = makePaper({ id: 'del-paper-1', title: 'Paper With Theme', themes: [theme.id] });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'RemoveMe' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'RemoveMe' }).hover();
    await page.locator('aside button[title="Delete theme"]').click({ force: true });
    await page.getByRole('button', { name: 'Delete Theme' }).click();
    await expect(page.getByRole('button', { name: 'RemoveMe' })).not.toBeVisible();
  });

  test('assign theme to paper via detail modal dropdown', async ({ page }) => {
    const project = makeProject({ name: 'Assign Theme', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'Assignable Theme' });
    const paper = makePaper({ id: 'assign-theme-1', title: 'Themeless Paper' });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Themeless Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await modal.getByText('Add theme').click();
    await modal.getByText('Assignable Theme').click();
    await expect(modal.getByText('Assignable Theme')).toBeVisible();
  });

  test('remove theme from paper via detail modal X button', async ({ page }) => {
    const project = makeProject({ name: 'Remove Theme', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'Removable' });
    const paper = makePaper({ id: 'remove-theme-1', title: 'Themed Paper', themes: [theme.id] });
    await page.addInitScript(seedWithThemes({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Themed Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await modal.locator('.bg-indigo-50 button[title^="Remove"]').click();
    await expect(modal.getByText('No themes assigned')).toBeVisible();
  });

  test('create new theme from paper detail modal', async ({ page }) => {
    const project = makeProject({ name: 'Create Theme Modal', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'create-theme-1', title: 'Paper For Theme' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Paper For Theme').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await modal.getByText('Create new theme').click();
    await modal.getByPlaceholder('Theme name...').fill('Brand New Theme');
    await modal.getByPlaceholder('Theme name...').press('Enter');
    await expect(modal.locator('.bg-indigo-50').getByText('Brand New Theme')).toBeVisible();
  });
});

test.describe('Tag Management', () => {
  test('rename tag via sidebar hover pencil icon', async ({ page }) => {
    const project = makeProject({ name: 'Rename Tag', lastOpened: new Date().toISOString() });
    const paper = makePaper({ tags: ['OldTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['OldTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.locator('.group\\/tag').filter({ hasText: 'OldTag' }).hover();
    await page.locator('.group\\/tag button[title="Rename tag"]').click({ force: true });
    const input = page.locator('.group\\/tag input[type="text"]');
    await input.clear();
    await input.fill('NewTag');
    await input.press('Enter');
    await expect(page.locator('.group\\/tag').filter({ hasText: 'NewTag' })).toBeVisible();
  });

  test('delete tag shows confirmation dialog with paper count', async ({ page }) => {
    const project = makeProject({ name: 'Delete Tag', lastOpened: new Date().toISOString() });
    const paper = makePaper({ tags: ['ToDeleteTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['ToDeleteTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.locator('.group\\/tag').filter({ hasText: 'ToDeleteTag' }).hover();
    await page.locator('.group\\/tag button[title="Delete tag"]').click({ force: true });
    await expect(page.locator('.fixed.inset-0.z-\\[200\\]').getByRole('heading', { name: 'Delete Tag', exact: true })).toBeVisible();
    await expect(page.getByText(/1 paper/)).toBeVisible();
  });

  test('confirm tag delete removes tag from all papers', async ({ page }) => {
    const project = makeProject({ name: 'Confirm Tag Del', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'tag-del-1', title: 'Tagged Paper', tags: ['RemoveMeTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['RemoveMeTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.locator('.group\\/tag').filter({ hasText: 'RemoveMeTag' }).hover();
    await page.locator('.group\\/tag button[title="Delete tag"]').click({ force: true });
    await page.getByRole('button', { name: 'Delete Tag' }).click();
    await expect(page.locator('.group\\/tag').filter({ hasText: 'RemoveMeTag' })).not.toBeVisible();
  });

  test('assign tag to paper via detail modal dropdown', async ({ page }) => {
    const project = makeProject({ name: 'Assign Tag', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'assign-tag-1', title: 'Tagless Paper', tags: [] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['ExistingTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Tagless Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await modal.getByText('Add tag').click();
    await page.locator('.absolute.top-full').getByRole('button', { name: 'ExistingTag' }).click();
    await expect(modal.locator('.bg-amber-50').getByText('ExistingTag')).toBeVisible();
  });

  test('remove tag from paper via detail modal X button', async ({ page }) => {
    const project = makeProject({ name: 'Remove Tag', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'remove-tag-1', title: 'Tagged Paper', tags: ['RemovableTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['RemovableTag'] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Tagged Paper').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await expect(modal.locator('.bg-amber-50').getByText('RemovableTag')).toBeVisible();
    await modal.locator('.bg-amber-50 button[title^="Remove"]').click();
    await expect(modal.getByText('No tags assigned')).toBeVisible();
  });

  test('create new tag from paper detail modal', async ({ page }) => {
    const project = makeProject({ name: 'Create Tag', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'create-tag-1', title: 'Paper For Tag' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Paper For Tag').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();

    const modal = page.locator('.max-w-4xl');
    await modal.getByText('Create new tag').click();
    await modal.getByPlaceholder('Tag name...').fill('BrandNewTag');
    await modal.getByPlaceholder('Tag name...').press('Enter');
    await expect(modal.locator('.bg-amber-50').getByText('BrandNewTag')).toBeVisible();
  });

  test('tag edit/delete actions hidden when project is archived', async ({ page }) => {
    const project = makeProject({ name: 'Archived Tags', archived: true });
    const paper = makePaper({ tags: ['ArchivedTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['ArchivedTag'] }));
    await page.goto('/');
    await page.getByRole('button', { name: /Archived Projects/ }).click();
    await page.getByText('Archived Tags').click();
    await expect(page.getByText('Archived (Read-only)')).toBeVisible({ timeout: 5000 });

    await page.locator('.group\\/tag').filter({ hasText: 'ArchivedTag' }).hover();
    await expect(page.locator('.group\\/tag button[title="Rename tag"]')).not.toBeVisible();
    await expect(page.locator('.group\\/tag button[title="Delete tag"]')).not.toBeVisible();
  });
});
