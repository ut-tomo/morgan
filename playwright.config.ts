import { defineConfig, devices } from '@playwright/test';

// We exercise the production build served under a subpath to prove the
// GitHub Pages base-path configuration works end to end.
const PORT = 4173;
const BASE_PATH = '/morgan-fingerprint-playground/';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build AND serve under the subpath. BASE_PATH must be exported for both
    // commands (vite.config.ts and `vite preview` both read it), so we set it
    // once for the whole shell rather than only for the build.
    command: `export BASE_PATH=${BASE_PATH}; npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
