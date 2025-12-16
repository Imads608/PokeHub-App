import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://127.0.0.1:4200';
const authFile = path.join(__dirname, '.auth/user.json');
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Global setup - runs once before all tests */
  globalSetup: require.resolve('./src/global-setup.ts'),
  /* Configure parallel workers - use 2 in CI for faster execution */
  workers: process.env.CI ? 2 : undefined,
  /* Increase timeouts for CI environment */
  timeout: process.env.CI ? 60000 : 30000, // Test timeout: 60s in CI, 30s locally
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // Assertion timeout: 10s in CI, 5s locally
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Use saved auth state */
    storageState: authFile,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'on' : 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'E2E_TESTING=true npx nx serve pokehub-api --skip-nx-cache',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: false, // Always start fresh to get latest code
      cwd: workspaceRoot,
      timeout: 180000, // 3 minutes for backend to start
      ignoreHTTPSErrors: true,
    },
    {
      command: 'npx tsx src/mocks/proxy-server.ts',
      url: 'http://127.0.0.1:9876/health',
      reuseExistingServer: false,
      cwd: path.join(workspaceRoot, 'apps/pokehub-app-e2e'),
      timeout: 30000, // 30 seconds for MSW proxy to start
      ignoreHTTPSErrors: true,
    },
    {
      command:
        'E2E_TESTING=true API_URL=http://localhost:9876/api NEXT_PUBLIC_POKEHUB_API_URL=http://localhost:9876/api npx nx serve pokehub-app',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: false, // Always start fresh to get latest code
      cwd: workspaceRoot,
      timeout: 180000, // 3 minutes for frontend to start
      ignoreHTTPSErrors: true,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
