import { test, expect } from '@playwright/test';
import { makeProject, makePaper, makeTheme, seedScript, getProjectDataKeys } from './helpers/storage';

test.describe('Data Persistence', () => {
  test('created project persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByPlaceholder('Enter project name...').fill('Persist Project');
    await page.getByPlaceholder('Enter project name...').press('Enter');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible();

    await page.reload();

    const searchBar = page.getByPlaceholder('Search research...');
    if (await searchBar.isVisible()) {
      await expect(searchBar).toBeVisible();
    } else {
      await expect(page.getByText('Persist Project').first()).toBeVisible();
    }
  });

  test('imported papers persist across page reload', async ({ page }) => {
    const project = makeProject({ name: 'Persist Papers', lastOpened: new Date().toISOString() });
    const paper = makePaper({ title: 'Persisted Paper' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByText('Persisted Paper')).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByText('Persisted Paper')).toBeVisible({ timeout: 5000 });
  });

  test('theme changes persist across page reload', async ({ page }) => {
    const project = makeProject({ name: 'Persist Themes', lastOpened: new Date().toISOString() });
    const theme = makeTheme({ name: 'Persisted Theme' });
    const paper = makePaper({ themes: [theme.id] });
    await page.addInitScript(seedScript({ project, papers: [paper], themes: [theme] }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Persisted Theme' })).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByRole('button', { name: 'Persisted Theme' })).toBeVisible({ timeout: 5000 });
  });

  test('tag changes persist across page reload', async ({ page }) => {
    const project = makeProject({ name: 'Persist Tags', lastOpened: new Date().toISOString() });
    const paper = makePaper({ tags: ['PersistedTag'] });
    await page.addInitScript(seedScript({ project, papers: [paper], tags: ['PersistedTag'] }));
    await page.goto('/');
    await expect(page.locator('.group\\/tag').filter({ hasText: 'PersistedTag' })).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.locator('.group\\/tag').filter({ hasText: 'PersistedTag' })).toBeVisible({ timeout: 5000 });
  });

  test('review status changes persist across page reload', async ({ page }) => {
    const project = makeProject({ name: 'Persist Status', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'ps-1', title: 'Status Paper', reviewStatus: 'included' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByText('Status Paper')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('included').first()).toBeVisible();

    await page.reload();
    await expect(page.getByText('Status Paper')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('included').first()).toBeVisible();
  });

  test('chat config persists across page reload', async ({ page }) => {
    const project = makeProject({ name: 'Persist Chat', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"https://custom.api.com","apiKey":"test-key","model":"test-model"}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.locator('button[title="API Settings"]').click();
    await expect(page.getByPlaceholder('https://api.deepseek.com')).toHaveValue('https://custom.api.com');

    await page.reload();
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Chat' }).click();
    await page.locator('button[title="API Settings"]').click();
    await expect(page.getByPlaceholder('https://api.deepseek.com')).toHaveValue('https://custom.api.com');
  });

  test('legacy localStorage data auto-migrates to project-based storage', async ({ page }) => {
    const paper = makePaper({ title: 'Legacy Paper' });
    const theme = makeTheme({ name: 'Legacy Theme' });
    const legacyScript = `
      localStorage.clear();
      localStorage.setItem('mas-health-papers', ${JSON.stringify(JSON.stringify([paper]))});
      localStorage.setItem('mas-health-themes', ${JSON.stringify(JSON.stringify([theme]))});
      localStorage.setItem('mas-health-tags', ${JSON.stringify(JSON.stringify(['LegacyTag']))});
    `;
    await page.addInitScript(legacyScript);
    await page.goto('/');

    await expect(page.getByText('Default Project').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.space-y-3').getByText('Default Project').click();
    await expect(page.getByText('Legacy Paper')).toBeVisible();

    const hasProjectIndex = await page.evaluate(() => {
      return localStorage.getItem('mas-health-projects') !== null;
    });
    expect(hasProjectIndex).toBe(true);

    const noLegacy = await page.evaluate(() => {
      return localStorage.getItem('mas-health-papers') === null &&
             localStorage.getItem('mas-health-themes') === null;
    });
    expect(noLegacy).toBe(true);
  });

  test('switching between projects loads correct data', async ({ page }) => {
    const project1 = makeProject({ name: 'Project Alpha' });
    const project2 = makeProject({ name: 'Project Beta' });
    const paper1 = makePaper({ title: 'Alpha Paper' });
    const paper2 = makePaper({ title: 'Beta Paper' });
    const keys1 = getProjectDataKeys(project1.id);
    const keys2 = getProjectDataKeys(project2.id);

    const script = `
      localStorage.clear();
      localStorage.setItem('mas-health-projects', ${JSON.stringify(JSON.stringify([project1, project2]))});
      localStorage.setItem('${keys1.papers}', ${JSON.stringify(JSON.stringify([paper1]))});
      localStorage.setItem('${keys2.papers}', ${JSON.stringify(JSON.stringify([paper2]))});
    `;
    await page.addInitScript(script);
    await page.goto('/');

    await page.locator('.space-y-3').getByText('Project Alpha').click();
    await expect(page.getByText('Alpha Paper')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Beta Paper')).not.toBeVisible();

    await page.locator('button[title="Back to projects"]').click();
    await page.locator('.space-y-3').getByText('Project Beta').click();
    await expect(page.getByText('Beta Paper')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Alpha Paper')).not.toBeVisible();
  });
});
