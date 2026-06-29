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
  /* Serialise workers in CI. With the build-time NEXT_PUBLIC_POKEHUB_API_URL
   * fix in place (so mutations actually hit the MSW proxy), workers=2 still
   * shows 60s click/hover timeouts on heavier specs (team-editor, team-viewer)
   * — pure CPU saturation on the GitHub-hosted 2 vCPU / 7 GB runner. Adds
   * ~4-5 min wall-clock vs workers=2 but eliminates the contention flake. */
  workers: process.env.CI ? 1 : undefined,
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
      // In CI, use a production build (compiled once at build time) instead
      // of `next dev` (JIT compilation on first request). The dev server's
      // per-route compile cost on the runner regularly exceeds element
      // timeouts and produces flaky failures, especially on heavy lazy
      // chunks (@pkmn/dex on /team-builder, @pkmn/sim on /battle).
      // Locally we keep `nx serve` for fast iteration with HMR.
      // CI must run `nx build pokehub-app` before invoking the suite — see
      // the E2E job in .github/workflows/ci.yml.
      //
      // HOSTNAME pins Next's bind address and is the value Auth.js uses to
      // construct its canonical URL (post-sign-in redirect, callback-url
      // cookie value, etc.). Without it, `next start` defaults HOSTNAME
      // to `localhost`, so Auth.js redirects after sign-in to
      // `http://localhost:4200/...` even though the test client hit
      // `http://127.0.0.1:4200`. The redirect follow-up sets duplicate
      // `authjs.csrf-token` cookies on the second domain, and the next
      // sign-in's CSRF check fails with MissingCSRF. (AUTH_URL is not
      // sufficient here — Auth.js v5 with trustHost still constructs
      // redirect URLs from the bound HOSTNAME.)
      command: process.env.CI
        ? 'E2E_TESTING=true HOSTNAME=127.0.0.1 API_URL=http://localhost:9876/api NEXT_PUBLIC_POKEHUB_API_URL=http://localhost:9876/api npx nx start pokehub-app'
        : 'E2E_TESTING=true API_URL=http://localhost:9876/api NEXT_PUBLIC_POKEHUB_API_URL=http://localhost:9876/api npx nx serve pokehub-app',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: false, // Always start fresh to get latest code
      cwd: workspaceRoot,
      timeout: 180000, // 3 minutes for frontend to start
      ignoreHTTPSErrors: true,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
