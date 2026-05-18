import { test, expect } from '@playwright/test';
import path from 'path';
import { makeProject, makePaper, seedScript } from './helpers/storage';

test.describe('Paper Import', () => {
  test('import CSV file and verify papers appear in grid', async ({ page }) => {
    const project = makeProject({ name: 'Import CSV', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const csvPath = path.join(import.meta.dirname, 'fixtures', 'papers.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await expect(page.getByText('Imported 2 papers')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('CSV Test Paper One')).toBeVisible();
    await expect(page.getByText('CSV Test Paper Two')).toBeVisible();
  });

  test('import RIS file and verify papers appear in grid', async ({ page }) => {
    const project = makeProject({ name: 'Import RIS', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const risPath = path.join(import.meta.dirname, 'fixtures', 'papers.ris');
    await page.locator('input[type="file"]').setInputFiles(risPath);
    await expect(page.getByText('Imported 2 papers')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('RIS Test Paper One')).toBeVisible();
    await expect(page.getByText('RIS Test Paper Two')).toBeVisible();
  });

  test('import CSV skips duplicates', async ({ page }) => {
    const project = makeProject({ name: 'Dup Test', lastOpened: new Date().toISOString() });
    const existingPaper = makePaper({ title: 'CSV Test Paper One', authors: ['John Doe', 'Jane Smith'] });
    await page.addInitScript(seedScript({ project, papers: [existingPaper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const csvPath = path.join(import.meta.dirname, 'fixtures', 'papers.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await expect(page.getByText('1 duplicates skipped')).toBeVisible({ timeout: 10000 });
  });

  test('import shows error message for invalid file', async ({ page }) => {
    const project = makeProject({ name: 'Bad Import', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const txtPath = path.join(import.meta.dirname, 'fixtures', 'invalid.txt');
    await page.locator('input[type="file"]').setInputFiles(txtPath);
    await expect(page.getByText('Error')).toBeVisible({ timeout: 10000 });
  });

  test('import success message auto-dismisses after ~5 seconds', async ({ page }) => {
    const project = makeProject({ name: 'Dismiss Test', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const csvPath = path.join(import.meta.dirname, 'fixtures', 'papers.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    const successMsg = page.getByText('Imported 2 papers');
    await expect(successMsg).toBeVisible({ timeout: 10000 });
    await expect(successMsg).not.toBeVisible({ timeout: 10000 });
  });

  test('import button hidden when project is archived', async ({ page }) => {
    const project = makeProject({ name: 'Archived Import', archived: true });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await page.getByRole('button', { name: /Archived Projects/ }).click();
    await page.getByText('Archived Import').click();
    await expect(page.getByText('Archived (Read-only)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Import' })).not.toBeVisible();
  });
});

test.describe('Paper Export', () => {
  test('export CSV downloads a file', async ({ page }) => {
    const project = makeProject({ name: 'Export Test', lastOpened: new Date().toISOString() });
    const paper = makePaper({ title: 'Export Me' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('papers-export');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('export button disabled when no papers exist', async ({ page }) => {
    const project = makeProject({ name: 'Empty Export', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});

test.describe('Paper Grid Display', () => {
  test('paper cards display title, abstract snippet, journal, year', async ({ page }) => {
    const project = makeProject({ name: 'Grid Display', lastOpened: new Date().toISOString() });
    const paper = makePaper({
      title: 'Grid Test Paper',
      abstract: 'Abstract content for grid display testing',
      journal: 'Test Med Journal',
      year: 2024,
    });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Grid Test Paper' })).toBeVisible();
    await expect(page.getByText('Abstract content for grid display')).toBeVisible();
    await expect(page.getByText(/Test Med Journal/)).toBeVisible();
  });

  test('click paper card opens detail modal', async ({ page }) => {
    const project = makeProject({ name: 'Modal Test', lastOpened: new Date().toISOString() });
    const paper = makePaper({ title: 'Click For Modal' });
    await page.addInitScript(seedScript({ project, papers: [paper] }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });
    await page.getByText('Click For Modal').click();
    await expect(page.getByText('Full Text Review Abstract')).toBeVisible();
  });
});

test.describe('Paper Detail Modal', () => {
  let modalPage: import('@playwright/test').Page;

  test.beforeEach(async ({ page: p }) => {
    modalPage = p;
    const project = makeProject({ name: 'Detail Test', lastOpened: new Date().toISOString() });
    const paper = makePaper({
      id: 'detail-paper-1',
      title: 'Detail Modal Paper',
      abstract: 'Detailed abstract content here.',
      journal: 'Detail Journal',
      year: 2024,
      authors: ['Alice Author', 'Bob Writer'],
      doi: '10.1234/detail-test',
      keyFindings: ['Key finding A', 'Key finding B'],
      systemArchitecture: 'Three-agent pipeline',
      comparisonWithSingleLLM: '20% improvement',
      notes: 'Some review notes',
    });
    await modalPage.addInitScript(seedScript({ project, papers: [paper] }));
    await modalPage.goto('/');
    await expect(modalPage.getByRole('heading', { name: /All Papers/ })).toBeVisible({ timeout: 5000 });
    await modalPage.getByText('Detail Modal Paper').click();
    await expect(modalPage.getByText('Full Text Review Abstract')).toBeVisible();
  });

  test('detail modal shows all metadata fields', async () => {
    const modal = modalPage.locator('.max-w-4xl');
    await expect(modal.getByText('Detailed abstract content here.')).toBeVisible();
    await expect(modal.getByText('Detail Journal')).toBeVisible();
    await expect(modal.getByText('2024')).toBeVisible();
    await expect(modal.getByText('Alice Author, Bob Writer')).toBeVisible();
    await expect(modal.getByText('10.1234/detail-test')).toBeVisible();
    await expect(modal.getByText('Key finding A')).toBeVisible();
    await expect(modal.getByText('Three-agent pipeline')).toBeVisible();
    await expect(modal.getByText('20% improvement')).toBeVisible();
    await expect(modal.getByText('Some review notes')).toBeVisible();
  });

  test('inline edit journal field via pencil + Enter', async () => {
    const modal = modalPage.locator('.max-w-4xl');
    const editBtn = modalPage.getByTestId('edit-journal');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    const input = modalPage.locator('.max-w-4xl input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.clear();
    await input.fill('Updated Journal');
    await input.press('Enter');
    await expect(modal.getByText('Updated Journal')).toBeVisible();
  });

  test('inline edit abstract field via blur', async () => {
    const modal = modalPage.locator('.max-w-4xl');
    const editBtn = modalPage.getByTestId('edit-abstract');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    const textarea = modalPage.locator('.max-w-4xl textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.clear();
    await textarea.fill('Updated abstract text');
    await textarea.blur();
    await expect(modal.getByText('Updated abstract text')).toBeVisible();
  });

  test('inline edit cancels on Escape', async () => {
    const modal = modalPage.locator('.max-w-4xl');
    const editBtn = modalPage.getByTestId('edit-journal');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    const input = modalPage.locator('.max-w-4xl input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.clear();
    await input.fill('Should Not Save');
    await input.press('Escape');
    await expect(modal.locator('.bg-slate-50.p-5.rounded-2xl').getByText('Detail Journal')).toBeVisible();
  });

  test('close detail modal via X button', async () => {
    const modal = modalPage.locator('.max-w-4xl');
    await modal.locator('.p-6.border-b button').click();
    await expect(modalPage.getByText('Full Text Review Abstract')).not.toBeVisible();
  });

  test('close detail modal via Close button', async () => {
    await modalPage.getByRole('button', { name: 'Close' }).click();
    await expect(modalPage.getByText('Full Text Review Abstract')).not.toBeVisible();
  });

  test('close detail modal via backdrop click', async () => {
    const backdrop = modalPage.locator('.bg-slate-900\\/40.backdrop-blur-sm');
    await backdrop.click({ position: { x: 5, y: 5 } });
    await expect(modalPage.getByText('Full Text Review Abstract')).not.toBeVisible();
  });
});
