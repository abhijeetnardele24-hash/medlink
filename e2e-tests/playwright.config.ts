import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  timeout: 120000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // run serially
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'start-all.bat',
    url: 'http://localhost:5173', 
    reuseExistingServer: !process.env.CI,
    cwd: '../',
    timeout: 120000,
  },
});
