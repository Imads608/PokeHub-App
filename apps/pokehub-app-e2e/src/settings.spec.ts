import { test, expect, type Page } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Settings Page
 *
 * Approach: Parallel-safe tests with unique users for state-modifying tests
 *
 * Test Flows:
 * 1. Access Control - verify redirects for authenticated/unauthenticated users
 * 2. Profile Section - user info display
 * 3. Account Section - email and OAuth badge display
 * 4. Avatar Upload - file selection, preview, save, cancel
 * 5. Danger Zone - account deletion confirmation and execution
 * 6. User Menu Navigation - desktop and mobile menu access to settings
 */

const BASE_URL = 'http://127.0.0.1:4200';

/**
 * Creates a unique authenticated user with a completed profile.
 * Returns user info for assertions.
 *
 * @param page - Playwright page instance
 * @returns Object with email and username of the created user
 */
async function createAuthenticatedUserWithProfile(page: Page): Promise<{
  email: string;
  username: string;
}> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `settings-${uniqueId}@example.com`;
  // Use shorter username to stay under limits, using last 6 chars of uniqueId
  const username = `usr${uniqueId.slice(-6)}`;

  // Get CSRF token from NextAuth
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // Authenticate via NextAuth test-credentials provider
  await page.request.post(`${BASE_URL}/api/auth/callback/test-credentials`, {
    form: {
      csrfToken,
      email,
    },
  });

  // Navigate to create-profile and wait for page to load
  await page.goto('/create-profile');

  // Wait for the page heading to be visible first
  await expect(
    page.getByRole('heading', { name: 'Create Your Trainer Profile' })
  ).toBeVisible({ timeout: 20000 });

  // Wait for the form to be ready
  const usernameInput = page.getByTestId('username-input');
  await expect(usernameInput).toBeVisible({ timeout: 10000 });

  // Clear and fill username - use type instead of fill for better reliability
  await usernameInput.click();
  await usernameInput.fill(username);

  // Verify the username was entered correctly
  await expect(usernameInput).toHaveValue(username, { timeout: 5000 });

  // Wait for availability check to complete - this is critical for form submission
  await expect(page.getByTestId('username-available-indicator')).toBeVisible({
    timeout: 15000,
  });

  // Wait for submit button to be enabled
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeEnabled({ timeout: 5000 });

  // Submit the form
  await submitButton.click();

  // Wait for redirect to dashboard with generous timeout for CI/parallel execution
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  return { email, username };
}

// =============================================================================
// Access Control Tests
// =============================================================================

test.describe('Settings Page - Access Control', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/settings');
    // URL may include query params like /login?from=/settings
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('should allow authenticated user to access settings', async ({
    page,
  }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

// =============================================================================
// Profile Section Tests
// =============================================================================

test.describe('Settings Page - Profile Section', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display username in profile section', async ({ page }) => {
    const { username } = await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    // Wait for settings page to fully load
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText(username, { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display profile avatar', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    // Wait for settings page to fully load first
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    // Check that avatar element exists (either image or fallback)
    const avatarSection = page.locator('[data-testid="profile-section"]');
    await expect(avatarSection).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// Account Section Tests
// =============================================================================

test.describe('Settings Page - Account Section', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display user email', async ({ page }) => {
    const { email } = await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    // Wait for settings page to fully load
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
  });

  test('should show username cannot be changed note', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    // Wait for settings page to fully load
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText(/cannot.*change/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

// =============================================================================
// Avatar Upload Section Tests
// =============================================================================

test.describe('Settings Page - Avatar Upload', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show Choose File button', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(
      page.getByRole('button', { name: /Choose File/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show preview and save/cancel buttons when file selected', async ({
    page,
  }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 10000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    // Save and Cancel buttons should appear
    await expect(page.getByTestId('avatar-save-button')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('avatar-cancel-button')).toBeVisible();
  });

  test('should hide save/cancel buttons when cancel is clicked', async ({
    page,
  }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 10000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    // Wait for buttons to appear
    await expect(page.getByTestId('avatar-cancel-button')).toBeVisible({
      timeout: 5000,
    });

    // Click cancel
    await page.getByTestId('avatar-cancel-button').click();

    // Save/Cancel should disappear
    await expect(page.getByTestId('avatar-save-button')).toBeHidden();
  });

  test('should save avatar successfully', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 10000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    // Wait for Save button to appear
    await expect(page.getByTestId('avatar-save-button')).toBeVisible({
      timeout: 5000,
    });

    // Click save
    await page.getByTestId('avatar-save-button').click();

    // Save button should disappear after successful save
    await expect(page.getByTestId('avatar-save-button')).toBeHidden({
      timeout: 10000,
    });
  });
});

// =============================================================================
// Danger Zone Tests
// =============================================================================

test.describe('Settings Page - Danger Zone', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display danger zone section with warning', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByText(/Danger Zone/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/no going back/i)).toBeVisible();
  });

  test('should show Delete Account button', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByTestId('delete-account-button')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should open confirmation modal when Delete Account is clicked', async ({
    page,
  }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await page.getByTestId('delete-account-button').click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Are you sure/i)).toBeVisible();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await page.getByTestId('delete-account-button').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('dialog-cancel-button').click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('should delete account and redirect to login', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await page.getByTestId('delete-account-button').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Confirm deletion
    await page.getByTestId('dialog-confirm-delete-button').click();

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 15000 });

    // Verify we're logged out by trying to access settings again
    // Should redirect back to login since session is invalidated
    await page.goto('/settings');
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });
});

// =============================================================================
// User Menu Navigation - Desktop
// =============================================================================

test.describe('User Menu - Desktop Navigation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to Settings from user dropdown', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    // Open user dropdown
    await page.getByTestId('nav-user-avatar').click();

    // Click Settings menu item
    await page.getByRole('menuitem', { name: /Settings/i }).click();

    await page.waitForURL('**/settings', { timeout: 10000 });
  });

  test('should display Settings and Logout in user menu', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    // Open user dropdown
    await page.getByTestId('nav-user-avatar').click();

    // Should have Settings and Logout
    await expect(
      page.getByRole('menuitem', { name: /Settings/i })
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Logout/i })).toBeVisible();
  });
});

// =============================================================================
// User Menu Navigation - Mobile
// =============================================================================

test.describe('User Menu - Mobile Navigation', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 375, height: 667 },
  });

  test('should navigate to Settings from mobile menu', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    // Open mobile menu (hamburger)
    await page.getByTestId('mobile-menu-button').click();

    // Look for settings link in mobile menu
    await page.getByRole('link', { name: /Settings/i }).click();

    await page.waitForURL('**/settings', { timeout: 10000 });
  });
});
