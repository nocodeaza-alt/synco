import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 1,                     // 1 retry on CI so flaky network isn't fatal
  workers: 1,                     // sequential — tests share Supabase state
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3002',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Keep cookies/localStorage between steps in the same test
    storageState: undefined,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // webServer is optional — comment in if you want Playwright to start the
  // dev server automatically before running E2E tests:
  //
  // webServer: {
  //   command: 'PORT=3002 npm run dev',
  //   url: 'http://localhost:3002/en/auth/login',
  //   reuseExistingServer: true,
  //   timeout: 60_000,
  // },
})
