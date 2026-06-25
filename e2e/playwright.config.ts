import { defineConfig, devices } from '@playwright/test';

// E2E runs against the built web app served by `vite preview`. The web build is
// produced in CI before this runs (ARCHITECTURE.md §7.2, e2e.yml).
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    // Desktop + tablet are the full-grid targets; a phone project exercises the
    // Compact fallback (US-17/US-18). Desktop uses Chromium; tablet WebKit.
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { ...devices['iPad (gen 7) landscape'] } },
    { name: 'phone', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run preview -w @btc/web -- --port ' + PORT + ' --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
