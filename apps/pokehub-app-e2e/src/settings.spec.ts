import { test, expect, type Page } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Settings Page
 *
 * Approach:
 * - Read-only tests use the shared user.json auth state (existing user with profile)
 * - State-modifying tests (delete account) create unique users dynamically
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
 * Only used for tests that modify user state (like delete account).
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

  // Fill username
  await usernameInput.click();
  await usernameInput.fill(username);

  // Verify the username was entered correctly
  await expect(usernameInput).toHaveValue(username, { timeout: 5000 });

  // Wait for availability check to complete
  await expect(page.getByTestId('username-available-indicator')).toBeVisible({
    timeout: 15000,
  });

  // Wait for submit button to be enabled
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeEnabled({ timeout: 5000 });

  // Submit the form
  await submitButton.click();

  // Wait for redirect to team-builder
  await page.waitForURL('**/team-builder', { timeout: 30000 });

  return { email, username };
}

// =============================================================================
// Access Control Tests
// =============================================================================

test.describe('Settings Page - Access Control', () => {
  test('should redirect unauthenticated user to login', async ({ browser }) => {
    // Use fresh context without auth
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('/settings');
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');

    await context.close();
  });

  test('should allow authenticated user to access settings', async ({
    page,
  }) => {
    // Uses default auth state (user.json)
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });
  });
});

// =============================================================================
// Profile Section Tests - Read-only, uses shared auth state
// =============================================================================

test.describe('Settings Page - Profile Section', () => {
  test('should display username in profile section', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    // The existing test user has username 'e2etestuser'
    await expect(page.getByText('e2etestuser', { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display profile avatar section', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    const avatarSection = page.locator('[data-testid="profile-section"]');
    await expect(avatarSection).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// Account Section Tests - Read-only, uses shared auth state
// =============================================================================

test.describe('Settings Page - Account Section', () => {
  test('should display user email', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    // The existing test user has email 'e2etest@example.com'
    await expect(page.getByText('e2etest@example.com')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show username cannot be changed note', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText(/cannot.*change/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

// =============================================================================
// Avatar Upload Section Tests - Read-only interactions, uses shared auth state
// =============================================================================

test.describe('Settings Page - Avatar Upload', () => {
  test('should show Choose File button', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByRole('button', { name: /Choose File/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show preview and save/cancel buttons when file selected', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    await expect(page.getByTestId('avatar-save-button')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('avatar-cancel-button')).toBeVisible();
  });

  test('should hide save/cancel buttons when cancel is clicked', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    await expect(page.getByTestId('avatar-cancel-button')).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId('avatar-cancel-button').click();

    await expect(page.getByTestId('avatar-save-button')).toBeHidden();
  });

  // This test modifies state, so it creates a unique user
  test('should save avatar successfully', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    const fileInput = page.getByTestId('settings-avatar-file-input');
    const testAvatarPath = path.join(
      __dirname,
      'mocks/fixtures/test-avatar.jpg'
    );
    await fileInput.setInputFiles(testAvatarPath);

    await expect(page.getByTestId('avatar-save-button')).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId('avatar-save-button').click();

    await expect(page.getByTestId('avatar-save-button')).toBeHidden({
      timeout: 10000,
    });

    await context.close();
  });
});

// =============================================================================
// Danger Zone Tests - Read-only interactions use shared auth,
// Delete account test creates unique user
// =============================================================================

test.describe('Settings Page - Danger Zone', () => {
  test('should display danger zone section with warning', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText(/Danger Zone/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/no going back/i)).toBeVisible();
  });

  test('should show Delete Account button', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByTestId('delete-account-button')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should open confirmation modal when Delete Account is clicked', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('delete-account-button').click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Are you sure/i)).toBeVisible();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('delete-account-button').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('dialog-cancel-button').click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  // This test modifies state, so it creates a unique user
  test('should delete account and redirect to login', async ({ browser }) => {
    // Create fresh context without shared auth
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await createAuthenticatedUserWithProfile(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('delete-account-button').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('dialog-confirm-delete-button').click();

    await page.waitForURL('**/login', { timeout: 15000 });

    // Verify we're logged out
    await page.goto('/settings');
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');

    await context.close();
  });
});

// =============================================================================
// User Menu Navigation - Desktop - Uses shared auth state
// =============================================================================

test.describe('User Menu - Desktop Navigation', () => {
  test('should navigate to Settings from user dropdown', async ({ page }) => {
    await page.goto('/team-builder');

    await expect(page.getByTestId('nav-user-avatar')).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('nav-user-avatar').click();

    await page.getByRole('menuitem', { name: /Settings/i }).click();

    await page.waitForURL('**/settings', { timeout: 10000 });
  });

  test('should display Settings and Logout in user menu', async ({ page }) => {
    await page.goto('/team-builder');

    await expect(page.getByTestId('nav-user-avatar')).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('nav-user-avatar').click();

    await expect(
      page.getByRole('menuitem', { name: /Settings/i })
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Logout/i })).toBeVisible();
  });
});

// =============================================================================
// User Menu Navigation - Mobile - Uses shared auth state
// =============================================================================

test.describe('User Menu - Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should navigate to Settings from mobile menu', async ({ page }) => {
    await page.goto('/team-builder');

    await expect(page.getByTestId('mobile-menu-button')).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('mobile-menu-button').click();

    await page.getByRole('link', { name: /Settings/i }).click();

    await page.waitForURL('**/settings', { timeout: 10000 });
  });
});
