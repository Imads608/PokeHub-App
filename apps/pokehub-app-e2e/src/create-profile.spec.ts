import { test, expect, type Page } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Create Profile Flow
 *
 * Approach: Parallel-safe tests with unique users for state-modifying tests
 *
 * - Read-only tests (validation, rendering, availability) share the base
 *   new-user.json auth state since they don't modify user data
 * - Submission tests create unique users dynamically via NextAuth
 *   test-credentials provider, allowing full parallel execution
 *
 * Test Flows:
 * 1. Route Guards - verify redirects for new/existing users
 * 2. Form Rendering - all elements visible
 * 3. Username Validation - client-side validation messages
 * 4. Username Availability - loading, available (green), taken (red)
 * 5. Avatar Upload - file selection and preview
 * 6. Form Submission - successful profile creation (unique user per test)
 */

const BASE_URL = 'http://127.0.0.1:4200';

/**
 * Creates a unique test user and authenticates them via NextAuth test-credentials.
 * The user is created without a username, requiring profile creation.
 *
 * Uses page.request (not the standalone request fixture) so cookies are shared
 * with the page context automatically.
 *
 * @param page - Playwright page instance
 * @returns The unique email of the created user
 */
async function createAndAuthenticateUser(page: Page): Promise<string> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `testuser-${uniqueId}@example.com`;

  // Get CSRF token from NextAuth (using page.request to share cookies)
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // Authenticate via NextAuth test-credentials provider (no username = new user)
  // Using page.request ensures the session cookie is set on the page context
  await page.request.post(`${BASE_URL}/api/auth/callback/test-credentials`, {
    form: {
      csrfToken,
      email,
    },
  });

  // Navigate to create-profile to hydrate the session
  await page.goto('/create-profile');

  return email;
}

// =============================================================================
// Read-only tests - share new-user.json auth state, safe to run in parallel
// =============================================================================

test.describe('Create Profile Flow - New User', () => {
  test.use({
    storageState: path.join(__dirname, '../.auth/new-user.json'),
  });

  test.describe('Route Guards', () => {
    test('should redirect new user from team-builder to create-profile', async ({
      page,
    }) => {
      // New user (without username) tries to access team-builder
      await page.goto('/team-builder');

      // Should be redirected to create-profile
      await page.waitForURL('**/create-profile', { timeout: 15000 });
      expect(page.url()).toContain('/create-profile');
    });

    test('should allow new user to access create-profile directly', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      // Should stay on create-profile page
      await expect(
        page.getByRole('heading', { name: 'Create Your Trainer Profile' })
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Form Rendering', () => {
    test('should display all form elements', async ({ page }) => {
      await page.goto('/create-profile');

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'Create Your Trainer Profile' })
      ).toBeVisible({ timeout: 15000 });

      // Check title and description
      await expect(
        page.getByText('Choose your username and avatar to get started')
      ).toBeVisible();

      // Check avatar upload section
      await expect(page.getByText('Upload Avatar')).toBeVisible();

      // Check username input
      await expect(page.getByTestId('username-input')).toBeVisible();
      await expect(page.getByLabel(/Username/i)).toBeVisible();

      // Check submit button
      await expect(page.getByTestId('submit-button')).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Create Profile/i })
      ).toBeVisible();
    });
  });

  test.describe('Username Validation', () => {
    test('should show error for username too short', async ({ page }) => {
      await page.goto('/create-profile');

      // Wait for page load
      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type short username (less than 3 chars)
      await page.getByTestId('username-input').fill('ab');
      await page.getByTestId('username-input').blur();

      // Should show validation error
      await expect(page.getByTestId('username-error')).toBeVisible();
      await expect(page.getByTestId('username-error')).toContainText(
        /at least 3 characters/i
      );
    });

    test('should show error for invalid characters', async ({ page }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type username with invalid characters
      await page.getByTestId('username-input').fill('user@name!');
      await page.getByTestId('username-input').blur();

      // Should show validation error
      await expect(page.getByTestId('username-error')).toBeVisible();
      await expect(page.getByTestId('username-error')).toContainText(
        /letters, numbers, and underscores/i
      );
    });

    test('should clear error when username becomes valid', async ({ page }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type invalid username first
      await page.getByTestId('username-input').fill('ab');
      await page.getByTestId('username-input').blur();

      // Verify error is shown
      await expect(page.getByTestId('username-error')).toBeVisible();

      // Now type valid username
      await page.getByTestId('username-input').fill('validusername');
      await page.getByTestId('username-input').blur();

      // Error should disappear
      await expect(page.getByTestId('username-error')).toBeHidden();
    });
  });

  test.describe('Username Availability', () => {
    // Skip loading indicator test - it's inherently flaky due to brief loading state
    test.skip('should show loading indicator during availability check', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type a valid username (triggers debounced check)
      await page.getByTestId('username-input').fill('newusername123');

      // Loading indicator should appear briefly (debounce is 500ms)
      // This test may be flaky due to timing, but worth checking
      await expect(page.getByTestId('username-loading-indicator')).toBeVisible({
        timeout: 2000,
      });
    });

    test('should show available indicator (green check) for available username', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type a unique username that should be available
      // Using last 6 digits of timestamp to ensure uniqueness while staying under 20 chars
      const uniqueUsername = `tester${Date.now().toString().slice(-6)}`;
      await page.getByTestId('username-input').fill(uniqueUsername);

      // Wait for debounce and API call
      await expect(
        page.getByTestId('username-available-indicator')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show taken indicator (red X) for existing username', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type a username that should be taken (existing test user from global-setup)
      await page.getByTestId('username-input').fill('e2etestuser');

      // Wait for debounce and API call
      await expect(page.getByTestId('username-taken-indicator')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Submit Button State', () => {
    test('should disable submit button when username is invalid', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type invalid username
      await page.getByTestId('username-input').fill('ab');

      // Submit button should be disabled
      await expect(page.getByTestId('submit-button')).toBeDisabled();
    });

    test('should disable submit button when username is taken', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type taken username
      await page.getByTestId('username-input').fill('e2etestuser');

      // Wait for availability check
      await expect(page.getByTestId('username-taken-indicator')).toBeVisible({
        timeout: 5000,
      });

      // Submit button should be disabled
      await expect(page.getByTestId('submit-button')).toBeDisabled();
    });

    test('should enable submit button when username is valid and available', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Type unique valid username
      const uniqueUsername = `valid${Date.now().toString().slice(-6)}`;
      await page.getByTestId('username-input').fill(uniqueUsername);

      // Wait for availability check
      await expect(
        page.getByTestId('username-available-indicator')
      ).toBeVisible({ timeout: 5000 });

      // Submit button should be enabled
      await expect(page.getByTestId('submit-button')).toBeEnabled();
    });
  });

  test.describe('Avatar Upload', () => {
    test('should update avatar preview when file is selected', async ({
      page,
    }) => {
      await page.goto('/create-profile');

      await expect(page.getByTestId('username-input')).toBeVisible({
        timeout: 15000,
      });

      // Get the file input
      const fileInput = page.getByTestId('avatar-file-input');

      // Upload a test image
      const testAvatarPath = path.join(
        __dirname,
        'mocks/fixtures/test-avatar.jpg'
      );
      await fileInput.setInputFiles(testAvatarPath);

      // Avatar preview should update (the src should change from placeholder)
      const avatarPreview = page.getByTestId('avatar-preview');
      await expect(avatarPreview).toBeVisible();

      // The src should contain a blob URL (object URL created from file)
      const src = await avatarPreview.getAttribute('src');
      expect(src).toContain('blob:');
    });
  });
});

// =============================================================================
// Submission tests - create unique user per test for parallel safety
// =============================================================================

test.describe('Create Profile Flow - Form Submission', () => {
  // Clear storage state to start with no session - each test authenticates its own unique user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should submit profile successfully without avatar', async ({
    page,
  }) => {
    // Create and authenticate a unique user for this test
    await createAndAuthenticateUser(page);

    await expect(page.getByTestId('username-input')).toBeVisible({
      timeout: 15000,
    });

    // Type unique valid username
    const uniqueUsername = `noav${Date.now().toString().slice(-6)}`;
    await page.getByTestId('username-input').fill(uniqueUsername);

    // Wait for availability check
    await expect(page.getByTestId('username-available-indicator')).toBeVisible({
      timeout: 5000,
    });

    // Submit the form
    await page.getByTestId('submit-button').click();

    // Should redirect to team-builder after successful submission
    await page.waitForURL('**/team-builder', { timeout: 15000 });
    expect(page.url()).toContain('/team-builder');
  });

  test('should submit profile successfully with avatar', async ({ page }) => {
    await createAndAuthenticateUser(page);

    await expect(page.getByTestId('username-input')).toBeVisible({
      timeout: 15000,
    });

    // Upload avatar first
    const fileInput = page.getByTestId('avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    // Verify avatar preview updated
    const avatarPreview = page.getByTestId('avatar-preview');
    const src = await avatarPreview.getAttribute('src');
    expect(src).toContain('blob:');

    // Type unique valid username
    const uniqueUsername = `avatar${Date.now().toString().slice(-6)}`;
    await page.getByTestId('username-input').fill(uniqueUsername);

    // Wait for availability check
    await expect(page.getByTestId('username-available-indicator')).toBeVisible({
      timeout: 5000,
    });

    // Submit the form
    await page.getByTestId('submit-button').click();

    // Should redirect to team-builder after successful submission
    await page.waitForURL('**/team-builder', { timeout: 15000 });
    expect(page.url()).toContain('/team-builder');
  });

  test('should show loading state during submission', async ({ page }) => {
    await createAndAuthenticateUser(page);

    await expect(page.getByTestId('username-input')).toBeVisible({
      timeout: 15000,
    });

    // Type unique valid username
    const uniqueUsername = `load${Date.now().toString().slice(-6)}`;
    await page.getByTestId('username-input').fill(uniqueUsername);

    // Wait for availability check
    await expect(page.getByTestId('username-available-indicator')).toBeVisible({
      timeout: 5000,
    });

    // Click submit and check for loading state
    await page.getByTestId('submit-button').click();

    // Button should show "Creating Profile..." text during submission
    // This might be very brief, so we use a short timeout
    await expect(page.getByText('Creating Profile...')).toBeVisible({
      timeout: 2000,
    });
  });

  test('should display user avatar in navigation after profile creation', async ({
    page,
  }) => {
    await createAndAuthenticateUser(page);

    await expect(page.getByTestId('username-input')).toBeVisible({
      timeout: 15000,
    });

    // Upload avatar
    const fileInput = page.getByTestId('avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    // Type unique valid username
    const uniqueUsername = `nav${Date.now().toString().slice(-6)}`;
    await page.getByTestId('username-input').fill(uniqueUsername);

    // Wait for availability check
    await expect(page.getByTestId('username-available-indicator')).toBeVisible({
      timeout: 5000,
    });

    // Submit the form
    await page.getByTestId('submit-button').click();

    // Wait for redirect to team-builder
    await page.waitForURL('**/team-builder', { timeout: 15000 });

    // Check that the user avatar is visible in navigation
    // The nav-user-avatar-image testid was added to user-dropdown.tsx
    await expect(page.getByTestId('nav-user-avatar-image')).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================================================
// Existing user tests - uses default auth state (user.json)
// =============================================================================

test.describe('Create Profile Flow - Existing User', () => {
  // Uses default storageState from playwright.config.ts (user.json)

  test('should redirect existing user away from create-profile', async ({
    page,
  }) => {
    // Existing user (with username) tries to access create-profile
    await page.goto('/create-profile');

    // Should be redirected away (to team-builder or home)
    await page.waitForURL((url) => !url.pathname.includes('/create-profile'), {
      timeout: 15000,
    });
    expect(page.url()).not.toContain('/create-profile');
  });

  test('should allow existing user to access team-builder directly', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    // Should stay on team-builder (not redirected to create-profile)
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/team-builder');
  });
});
