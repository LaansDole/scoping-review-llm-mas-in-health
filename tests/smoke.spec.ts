import { test, expect } from '@playwright/test';

test('app loads and shows projects view', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your Research Projects' })).toBeVisible();
  await expect(page.getByText('No projects yet')).toBeVisible();
});
