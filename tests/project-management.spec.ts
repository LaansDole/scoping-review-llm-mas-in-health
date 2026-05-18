import { test, expect } from '@playwright/test';
import { makeProject, buildLocalStorageScript } from './helpers/storage';

test.describe('Project Management', () => {
  test('create a new project via input + Enter', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await page.goto('/');
    await page.getByPlaceholder('Enter project name...').fill('My First Project');
    await page.getByPlaceholder('Enter project name...').press('Enter');
    await expect(page.getByText('My First Project').first()).toBeVisible();
    await expect(page.getByPlaceholder('Search research...')).toBeVisible();
  });

  test('create a new project via Create button', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await page.goto('/');
    await page.getByPlaceholder('Enter project name...').fill('Button Project');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Button Project').first()).toBeVisible();
  });

  test('open existing project by clicking its card', async ({ page }) => {
    const project = makeProject({ name: 'Existing Project' });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    await page.locator('.space-y-3').getByText('Existing Project').click();
    await expect(page.getByPlaceholder('Search research...')).toBeVisible();
  });

  test('rename project from ProjectsView card', async ({ page }) => {
    const project = makeProject({ name: 'Original Name' });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    await page.getByRole('button', { name: 'Rename' }).click();
    const input = page.locator('.space-y-3 input[type="text"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('Renamed Project');
    await input.press('Enter');
    await expect(page.getByText('Renamed Project').first()).toBeVisible();
  });

  test('rename project from WorkspaceHeader inline edit', async ({ page }) => {
    const project = makeProject({ name: 'Header Rename', lastOpened: new Date().toISOString() });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    await expect(page.getByText('Header Rename').first()).toBeVisible({ timeout: 5000 });
    await page.locator('header button[title="Rename project"]').click();
    const input = page.locator('header h1 input[type="text"]');
    await input.clear();
    await input.fill('New Header Name');
    await input.press('Enter');
    await expect(page.getByText('New Header Name').first()).toBeVisible();
  });

  test('archive a project and verify it appears in archived section', async ({ page }) => {
    const project = makeProject({ name: 'To Archive' });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    const card = page.locator('.space-y-3 > div').filter({ hasText: 'To Archive' });
    await card.hover();
    await card.locator('button[title="Archive project"]').click({ force: true });
    await page.getByRole('button', { name: /Archived Projects/ }).click();
    await expect(page.getByText('To Archive').last()).toBeVisible();
  });

  test('restore an archived project', async ({ page }) => {
    const project = makeProject({ name: 'Archived One', archived: true });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    await page.getByRole('button', { name: /Archived Projects/ }).click();
    await page.locator('button[title="Restore project"]').click();
    await expect(page.locator('.space-y-3').getByText('Archived One')).toBeVisible();
  });

  test('toggle archived section visibility', async ({ page }) => {
    const project = makeProject({ name: 'Hidden Archive', archived: true });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    const toggleBtn = page.getByRole('button', { name: /Archived Projects/ });
    await toggleBtn.click();
    await expect(page.getByText('Hidden Archive')).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByText('Hidden Archive')).not.toBeVisible();
  });

  test('auto-open last used project on page load', async ({ page }) => {
    const project = makeProject({ name: 'Auto Open Project', lastOpened: new Date().toISOString() });
    await page.addInitScript((s) => { eval(s); }, buildLocalStorageScript({ projects: [project] }) + ' window.__seed();');
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
  });

  test('empty state when no projects exist', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await page.goto('/');
    await expect(page.getByText('No projects yet')).toBeVisible();
    await expect(page.getByPlaceholder('Enter project name...')).toBeVisible();
  });
});
