import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;

/**
 * Kiểm thử E2E chạy trên Chromium headless. Playwright tự bật dev server và tắt khi xong.
 * Chạy bằng: npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
