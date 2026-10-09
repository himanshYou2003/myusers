import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', workers: 1, timeout: 90000, expect: { timeout: 15000 }, testMatch: '**/*.spec.ts', use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true }, webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 120000 } });


