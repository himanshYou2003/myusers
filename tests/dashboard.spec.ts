import { test, expect } from '@playwright/test';
test('sample analysis, rewrite, persona inspection, chat, export and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PersonaPulse Elite' })).toBeVisible();
  await page.getByRole('button', { name: 'Draft manuscript', exact: true }).click();
  await page.getByLabel('Hero headline (required)').fill('Intelligent Revenue Orchestration for Modern Ecosystems');
  await page.getByLabel('Value statement').fill('Create invoices for your customers.');
  await page.getByLabel('Pricing and billing terms').fill('$29 per month');
  await page.getByLabel('Call to action', { exact: true }).fill('Get started');
  await page.getByRole('button', { name: 'Analyze manuscript' }).click();
  await expect(page.getByText('Last analysis saved on this device.')).toBeVisible();
  await page.getByRole('button', { name: 'Apply Redline', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Revert to Unproofed', exact: false })).toBeVisible();
  await page.getByLabel('Inspect persona', { exact: true }).selectOption('agent_1');
  await expect(page.getByText('AGENT_1', { exact: true })).toBeVisible();
  await page.getByLabel('Question for synthetic personas').fill('What is confusing about the headline?');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('I evaluated the headline');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('personapulse-report.json');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Intelligent Revenue Orchestration for Modern Ecosystems', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('responsive layout fits mobile and tablet', async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    await expect(page.getByLabel('Inspect persona', { exact: true })).toBeVisible();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fits, `overflow at ${width}px`).toBeTruthy();
    await page.screenshot({ path: "test-results/dashboard-" + width + ".png", fullPage: true });
  }
});
test('URL failures preserve prior report and API rejects private networks', async ({ page, request }) => {
  const blocked = await request.post('/api/scrape', { data: { url: 'http://127.0.0.1' } });
  expect(blocked.status()).toBe(400);
  await page.goto('/');
  await page.getByLabel('Public website URL').fill('http://127.0.0.1');
  await page.getByRole('button', { name: 'Analyze website', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Private' })).toContainText('Private');
  await expect(page.getByLabel('Inspect persona', { exact: true })).toBeVisible();
});

test('simulation API validates copy and returns the same outcomes', async ({ request }) => {
  const data = { headline: 'Send invoices and track payments', subhead: 'Create invoices for customers.', pricing: 'Free', cta: 'Get started' };
  const first = await request.post('/api/simulate', { data });
  expect(first.status()).toBe(200);
  const result = await first.json();
  expect(result.nodes).toHaveLength(50);
  const second = await request.post('/api/simulate', { data });
  expect((await second.json()).metrics).toEqual(result.metrics);
  const invalid = await request.post('/api/simulate', { data: { headline: '' } });
  expect(invalid.status()).toBe(400);
});


