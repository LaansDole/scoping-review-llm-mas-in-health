import { test as base, expect, type Page } from '@playwright/test';
import { buildLocalStorageScript, type SeedData } from './storage';

export function fixture(data: SeedData) {
  return { data };
}

type TestFixture = { data: SeedData };

export const seededTest = base.extend<TestFixture>({
  data:({}, use) => use({}),
});

export async function seedAndNavigate(page: Page, data: SeedData) {
  const script = buildLocalStorageScript(data);
  await page.addInitScript(() => {
    eval(arguments[0]);
  }, script + ' window.__seed();');
  await page.goto('/');
}

export async function createProjectViaUI(page: Page, name: string) {
  await page.getByPlaceholder('Enter project name...').fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
}

export async function getToWorkspace(page: Page) {
  await page.goto('/');
  await page.getByRole('heading', { name: /Your Research Projects/ }).waitFor();
}

export { expect };
