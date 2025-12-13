import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

/**
 * Global setup for Playwright E2E tests
 *
 * This runs ONCE before all tests and handles authentication.
 * The authenticated state is saved and reused across all tests.
 *
 * Uses NextAuth's signIn() with test-credentials provider to create
 * a proper authenticated session (encrypted session token).
 *
 * Industry-standard approach used by:
 * - Microsoft (who built Playwright)
 * - Major SaaS companies
 * - Any app with OAuth/SSO
 *
 * Documentation: https://playwright.dev/docs/auth
 */

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const authFile = path.join(__dirname, '../.auth/user.json');
  const apiURL = process.env.API_URL || 'http://localhost:3000';

  // Check if we should skip auth setup
  if (process.env.SKIP_AUTH_SETUP === 'true') {
    console.log('Skipping authentication setup');
    return;
  }

  console.log('Setting up authentication for E2E tests...');
  console.log(`Frontend URL: ${baseURL}`);
  console.log(`Backend API URL: ${apiURL}`);

  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'e2etest@example.com',
    username: process.env.TEST_USER_USERNAME || 'e2etestuser',
  };

  try {
    // Step 1: Wait for backend to be ready
    console.log('Waiting for backend to be ready...');
    const maxRetries = 30;
    let retries = 0;
    let backendReady = false;

    while (retries < maxRetries && !backendReady) {
      try {
        const healthResponse = await fetch(`${apiURL}/api/health`);
        if (healthResponse.ok) {
          console.log('✓ Backend is ready');
          backendReady = true;
        }
      } catch (error) {
        // Backend not ready yet, wait and retry
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
    }

    if (!backendReady) {
      throw new Error(
        `Backend failed to start after ${
          maxRetries * 2
        } seconds. Check if database is accessible.`
      );
    }

    // Step 2: Set up browser and authenticate using NextAuth signIn
    console.log(`Authenticating test user: ${testUser.email}`);
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen to console messages from the browser
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));

    // Navigate to the app first
    console.log('Navigating to frontend...');
    await page.goto(baseURL || 'http://localhost:4200');

    // Wait for page to be fully loaded (using domcontentloaded instead of networkidle)
    await page.waitForLoadState('domcontentloaded');

    // Authenticate using NextAuth credentials provider
    // POST directly to the callback endpoint - this will:
    // 1. Trigger our test-credentials provider
    // 2. Run through JWT callback to create session
    // 3. Set the NextAuth session cookie in the browser context
    console.log('Authenticating with test-credentials provider...');

    // Get CSRF token first
    const csrfRes = await page.goto(`${baseURL}/api/auth/csrf`);
    const csrfData = await csrfRes?.json();
    const csrfToken = csrfData?.csrfToken;

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    console.log('Got CSRF token, calling signin callback...');

    // POST to signin callback endpoint using context.request
    // This shares cookies with the browser context
    const response = await context.request.post(
      `${baseURL}/api/auth/callback/test-credentials`,
      {
        form: {
          csrfToken,
          email: testUser.email,
          username: testUser.username,
        },
      }
    );

    console.log(`Signin response status: ${response.status()}`);
    console.log(`Final URL after redirects: ${response.url()}`);

    // NextAuth redirects after successful signin, so 200-399 is success
    if (response.status() >= 400) {
      const body = await response.text();
      throw new Error(
        `NextAuth signin failed with status ${response.status()}: ${body.substring(
          0,
          500
        )}`
      );
    }

    console.log('✓ NextAuth session created');

    // Step 3: Verify authentication works by visiting a protected page
    await page.goto(`${baseURL}/dashboard`);

    // Wait a bit to see if we get redirected to login
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/api/auth')) {
      console.warn(
        'Warning: Still redirected to login. Auth may not be working correctly.'
      );
      console.warn(`Current URL: ${currentUrl}`);
    } else {
      console.log(`✓ Authentication verified - reached dashboard`);
    }

    // Step 5: Save the storage state for reuse in tests
    await context.storageState({ path: authFile });
    console.log(`✓ Authentication state saved to ${authFile}`);

    await browser.close();
  } catch (error) {
    console.error('Failed to set up authentication:', error);
    throw error;
  }
}

export default globalSetup;
