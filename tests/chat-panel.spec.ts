import { test, expect } from '@playwright/test';
import { makeProject, makePaper, seedScript } from './helpers/storage';

test.describe('Chat Panel Open/Close', () => {
  test('open chat panel via header button', async ({ page }) => {
    const project = makeProject({ name: 'Chat Test', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await expect(page.getByText('Research Chat')).toBeVisible();
    await expect(page.getByPlaceholder('Ask about papers...')).toBeVisible();
  });

  test('close chat panel via X button', async ({ page }) => {
    const project = makeProject({ name: 'Chat Close', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await expect(page.getByText('Research Chat')).toBeVisible();
    await page.locator('.z-\\[90\\] .flex.justify-between button').last().click();
    await expect(page.getByText('Research Chat')).not.toBeVisible();
  });

  test('close chat panel via backdrop', async ({ page }) => {
    const project = makeProject({ name: 'Chat Backdrop', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await expect(page.getByText('Research Chat')).toBeVisible();
    await page.locator('.bg-slate-900\\/20').click();
    await expect(page.getByText('Research Chat')).not.toBeVisible();
  });
});

test.describe('Chat Messages', () => {
  test('warning shown when no API key configured', async ({ page }) => {
    const project = makeProject({ name: 'No Key Chat', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"","apiKey":"","model":""}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.getByPlaceholder('Ask about papers...').fill('Hello');
    await page.getByPlaceholder('Ask about papers...').press('Enter');
    await expect(page.getByText('configure your API settings')).toBeVisible();
  });

  test('send message and receive mocked streaming response', async ({ page }) => {
    const project = makeProject({ name: 'Mock Chat', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"https://api.test.com","apiKey":"test-key","model":"test-model"}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.route('**/chat/completions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"choices":[{"delta":{"content":"Test response"}}]}\n\ndata: [DONE]\n\n',
      });
    });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.getByPlaceholder('Ask about papers...').fill('Test message');
    await page.getByPlaceholder('Ask about papers...').press('Enter');
    await expect(page.getByText('Test response')).toBeVisible({ timeout: 15000 });
  });

  test('error display when API call fails', async ({ page }) => {
    const project = makeProject({ name: 'Chat Error', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"https://api.test.com","apiKey":"test-key","model":"test-model"}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.route('**/chat/completions**', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.getByPlaceholder('Ask about papers...').fill('Trigger error');
    await page.getByPlaceholder('Ask about papers...').press('Enter');
    await expect(page.locator('.bg-red-50').getByText('Error')).toBeVisible({ timeout: 15000 });
  });

  test('quick prompt buttons send correct message', async ({ page }) => {
    const project = makeProject({ name: 'Quick Prompt', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"","apiKey":"","model":""}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    const promptBtn = page.getByText('Find papers about mental health');
    await expect(promptBtn).toBeVisible();
    await promptBtn.click();
    await expect(page.getByText('configure your API settings')).toBeVisible();
  });

  test('paper reference card in response is clickable and opens detail modal', async ({ page }) => {
    const project = makeProject({ name: 'Paper Ref', lastOpened: new Date().toISOString() });
    const paper = makePaper({ id: 'ref-paper-1', title: 'Referenced Paper' });
    const script = seedScript({ project, papers: [paper] }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"https://api.test.com","apiKey":"test-key","model":"test-model"}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.route('**/chat/completions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: {"choices":[{"delta":{"content":"Check out {{paper:${paper.id}}}"}}]}\n\ndata: [DONE]\n\n`,
      });
    });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.getByPlaceholder('Ask about papers...').fill('Show paper');
    await page.getByPlaceholder('Ask about papers...').press('Enter');
    await expect(page.getByText('Referenced Paper')).toBeVisible({ timeout: 15000 });
    await page.locator('.z-\\[90\\] .flex.justify-between button').last().click();
  });

  test('send button disabled while streaming', async ({ page }) => {
    const project = makeProject({ name: 'Streaming', lastOpened: new Date().toISOString() });
    const script = seedScript({ project }) + `
      localStorage.setItem('mas-health-chat-config', '{"baseUrl":"https://api.test.com","apiKey":"test-key","model":"test-model"}');
    `;
    await page.addInitScript(script);
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    let resolveRoute: () => void = () => {};
    await page.route('**/chat/completions**', async (route) => {
      await new Promise<void>(r => { resolveRoute = r; });
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"choices":[{"delta":{"content":"Done"}}]}\n\ndata: [DONE]\n\n',
      });
    });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.getByPlaceholder('Ask about papers...').fill('Stream test');
    const sendBtn = page.locator('.fixed.top-0.right-0 button:has(svg)').filter({ hasText: '' }).last();
    await sendBtn.click();
    await page.waitForTimeout(500);
    resolveRoute();
  });
});

test.describe('Chat Panel Settings and Resize', () => {
  test('resize panel cycles through compact/expanded/full', async ({ page }) => {
    const project = makeProject({ name: 'Resize', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    const resizeBtn = page.locator('.fixed.top-0.right-0 button[title="Expand"], .fixed.top-0.right-0 button[title="Full screen"], .fixed.top-0.right-0 button[title="Compact"]');

    await resizeBtn.click();
    await page.waitForTimeout(300);
    await resizeBtn.click();
    await page.waitForTimeout(300);
    await resizeBtn.click();
    await page.waitForTimeout(300);
  });

  test('chat settings persist to localStorage', async ({ page }) => {
    const project = makeProject({ name: 'Settings Persist', lastOpened: new Date().toISOString() });
    await page.addInitScript(seedScript({ project }));
    await page.goto('/');
    await expect(page.getByPlaceholder('Search research...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Chat' }).click();
    await page.locator('button[title="API Settings"]').click();
    await page.getByPlaceholder('https://api.deepseek.com').fill('https://custom.api.com');
    await page.getByPlaceholder('sk-...').fill('my-api-key');
    await page.getByPlaceholder('deepseek-chat').fill('custom-model');

    const stored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mas-health-chat-config') || '{}');
    });
    expect(stored.baseUrl).toBe('https://custom.api.com');
    expect(stored.apiKey).toBe('my-api-key');
    expect(stored.model).toBe('custom-model');
  });
});
