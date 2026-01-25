import {
  chromium,
  type FullConfig,
  type BrowserContext,
} from '@playwright/test';
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
 * Creates two auth states:
 * 1. user.json - Existing user WITH username (for most tests)
 * 2. new-user.json - New user WITHOUT username (for create-profile tests)
 *
 * Industry-standard approach used by:
 * - Microsoft (who built Playwright)
 * - Major SaaS companies
 * - Any app with OAuth/SSO
 *
 * Documentation: https://playwright.dev/docs/auth
 */

interface TestUser {
  email: string;
  username?: string;
}

/**
 * Authenticates a test user via NextAuth test-credentials provider
 */
async function authenticateUser(
  context: BrowserContext,
  baseURL: string,
  user: TestUser,
  authFile: string
): Promise<void> {
  const page = await context.newPage();

  // Listen to console messages from the browser
  page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));

  // Navigate to the app first
  await page.goto(baseURL);
  await page.waitForLoadState('domcontentloaded');

  // Get CSRF token
  const csrfRes = await page.goto(`${baseURL}/api/auth/csrf`);
  const csrfData = await csrfRes?.json();
  const csrfToken = csrfData?.csrfToken;

  if (!csrfToken) {
    throw new Error('Failed to get CSRF token');
  }

  // Build form data - include username only if provided
  const formData: Record<string, string> = {
    csrfToken,
    email: user.email,
  };
  if (user.username) {
    formData.username = user.username;
  }

  // POST to signin callback endpoint
  const response = await context.request.post(
    `${baseURL}/api/auth/callback/test-credentials`,
    { form: formData }
  );

  if (response.status() >= 400) {
    const body = await response.text();
    throw new Error(
      `NextAuth signin failed with status ${response.status()}: ${body.substring(
        0,
        500
      )}`
    );
  }

  // Save the storage state
  await context.storageState({ path: authFile });
  console.log(`✓ Authentication state saved to ${authFile}`);

  await page.close();
}

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const authFile = path.join(__dirname, '../.auth/user.json');
  const newUserAuthFile = path.join(__dirname, '../.auth/new-user.json');
  const apiURL = process.env.API_URL || 'http://localhost:3000';

  // Check if we should skip auth setup
  if (process.env.SKIP_AUTH_SETUP === 'true') {
    console.log('Skipping authentication setup');
    return;
  }

  console.log('Setting up authentication for E2E tests...');
  console.log(`Frontend URL: ${baseURL}`);
  console.log(`Backend API URL: ${apiURL}`);

  // Define test users
  const existingUser: TestUser = {
    email: process.env.TEST_USER_EMAIL || 'e2etest@example.com',
    username: process.env.TEST_USER_USERNAME || 'e2etestuser',
  };

  const newUser: TestUser = {
    email: 'newuser@example.com',
    // No username - this user needs to create profile
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
      } catch {
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

    // Step 2: Set up browser and authenticate both users
    const browser = await chromium.launch();

    // Authenticate existing user (with username)
    console.log(`\nAuthenticating existing user: ${existingUser.email}`);
    const existingUserContext = await browser.newContext();
    await authenticateUser(
      existingUserContext,
      baseURL || 'http://localhost:4200',
      existingUser,
      authFile
    );

    // Verify existing user can reach team-builder
    const verifyPage = await existingUserContext.newPage();
    await verifyPage.goto(`${baseURL}/team-builder`);
    await verifyPage.waitForTimeout(2000);
    const currentUrl = verifyPage.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/api/auth')) {
      console.warn(
        'Warning: Still redirected to login. Auth may not be working correctly.'
      );
      console.warn(`Current URL: ${currentUrl}`);
    } else {
      console.log(
        `✓ Existing user authentication verified - reached team-builder`
      );
    }
    await existingUserContext.close();

    // Authenticate new user (without username) for create-profile tests
    console.log(`\nAuthenticating new user: ${newUser.email}`);
    const newUserContext = await browser.newContext();
    await authenticateUser(
      newUserContext,
      baseURL || 'http://localhost:4200',
      newUser,
      newUserAuthFile
    );

    // Verify new user auth by checking they get redirected to create-profile
    const verifyNewUserPage = await newUserContext.newPage();
    await verifyNewUserPage.goto(`${baseURL}/team-builder`);
    await verifyNewUserPage.waitForTimeout(3000);
    const newUserUrl = verifyNewUserPage.url();
    if (newUserUrl.includes('/login') || newUserUrl.includes('/api/auth')) {
      console.error(
        `ERROR: New user redirected to login instead of create-profile. URL: ${newUserUrl}`
      );
      // Check cookies to see if session was created
      const cookies = await newUserContext.cookies();
      const sessionCookie = cookies.find(
        (c) =>
          c.name === 'authjs.session-token' ||
          c.name === '__Secure-authjs.session-token'
      );
      if (!sessionCookie) {
        throw new Error(
          'New user authentication failed - no session cookie found. Check backend logs for errors.'
        );
      }
      console.warn('Session cookie exists but user still redirected to login');
    } else if (newUserUrl.includes('/create-profile')) {
      console.log(
        '✓ New user authentication verified - redirected to create-profile'
      );
    } else {
      console.log(`✓ New user authentication completed - URL: ${newUserUrl}`);
    }
    await newUserContext.close();

    await browser.close();
    console.log('\n✓ All authentication states saved successfully');
  } catch (error) {
    console.error('Failed to set up authentication:', error);
    throw error;
  }
}

export default globalSetup;
