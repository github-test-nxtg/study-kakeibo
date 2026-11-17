import { defineConfig, devices } from '@playwright/test';

/**
 * 画面操作の自動テスト（E2E）。
 * dist/index.html を実際のブラウザ（Chromium）で開いて操作する。
 * Electron 化した後は、Playwright の Electron 対応（_electron.launch）に切り替える。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
  ],
});
