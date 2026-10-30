import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'unit/**',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Tests run against the production build, not the dev server.
  webServer: {
    command: 'npm run preview -- --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
  },
});
