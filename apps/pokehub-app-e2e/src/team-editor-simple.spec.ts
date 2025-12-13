import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Team Editor (Frontend) - WITH REAL BACKEND
 *
 * These tests use:
 * - Real backend API (pokehub-api running on localhost:3000)
 * - Real database
 * - Real authentication (via global setup)
 *
 * Authentication is handled in global-setup.ts which:
 * 1. Calls POST /test/auth/create-session to get a JWT token
 * 2. Sets up browser cookies/storage
 * 3. Saves auth state for all tests to reuse
 */

test.describe('Team Editor - Authenticated Access', () => {
  test('should access team builder page when authenticated', async ({
    page,
  }) => {
    // Navigate to team builder (new team)
    await page.goto('/team-builder/new');

    // Should successfully load (not redirect to login)
    await expect(page).toHaveURL('/team-builder/new');

    // Verify page loaded
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
    await expect(
      page.getByText('Build and customize your competitive Pokémon team')
    ).toBeVisible();
  });

  test('should show team configuration section', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Verify Team Configuration section is visible
    await expect(page.getByText('Team Configuration')).toBeVisible();
    await expect(page.getByLabel('Team Name')).toBeVisible();
    await expect(page.getByLabel('Generation')).toBeVisible();
    await expect(page.getByLabel('Format')).toBeVisible();
  });

  test('should allow entering team name', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Set team name
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.fill('My E2E Test Team');
    await expect(teamNameInput).toHaveValue('My E2E Test Team');
  });

  test('should show add Pokemon button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Verify empty team slots
    await expect(page.getByText('Add Pokémon').first()).toBeVisible();
  });

  test('should show save button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Verify Save button exists
    const saveButton = page.getByRole('button', { name: /Save Team/i });
    await expect(saveButton).toBeVisible();
  });
});

test.describe('Team Editor - Team List', () => {
  test('should access team list page', async ({ page }) => {
    await page.goto('/team-builder');

    // Should successfully load
    await expect(page).toHaveURL('/team-builder');
    await expect(page.getByRole('heading', { name: 'My Teams' })).toBeVisible();
  });

  test('should show create new team button', async ({ page }) => {
    await page.goto('/team-builder');

    await expect(
      page.getByRole('button', { name: /Create New Team/i })
    ).toBeVisible();
  });

  test('clicking create new team should navigate to builder', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    await page.getByRole('button', { name: /Create New Team/i }).click();

    // Should navigate to new team page
    await expect(page).toHaveURL('/team-builder/new');
  });
});

test.describe('Team Editor - Pokemon Selection', () => {
  test('should open Pokemon selector when clicking Add Pokemon', async ({
    page,
  }) => {
    await page.goto('/team-builder/new');

    // Click "Add Pokémon" button
    await page.getByText('Add Pokémon').first().click();

    // Verify Pokemon Selector dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Select a Pokémon')).toBeVisible();
  });

  test('Pokemon selector should have search', async ({ page }) => {
    await page.goto('/team-builder/new');

    await page.getByText('Add Pokémon').first().click();

    // Verify search functionality exists
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should be able to close Pokemon selector', async ({ page }) => {
    await page.goto('/team-builder/new');

    await page.getByText('Add Pokémon').first().click();

    // Dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close it (press Escape)
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Team Editor - Format Configuration', () => {
  test('should display format rules', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Format rules should be displayed
    await expect(
      page.getByRole('heading', { name: /Format Rules/i })
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should have team analysis button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Analyze Team button should be visible
    await expect(
      page.getByRole('button', { name: /Analyze Team/i })
    ).toBeVisible();
  });

  test('analyze button should be disabled for empty team', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Button should be disabled when team is empty
    const analyzeButton = page.getByRole('button', { name: /Analyze Team/i });
    await expect(analyzeButton).toBeDisabled();
  });
});

test.describe('Team Editor - Export/Import', () => {
  test('should show export button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Export button should be visible
    const exportButton = page.getByRole('button', { name: /Export/i });
    await expect(exportButton).toBeVisible();
  });

  test('should show import button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Import button should be visible
    const importButton = page.getByRole('button', { name: /Import/i });
    await expect(importButton).toBeVisible();
  });
});

test.describe('Team Editor - Generation Selection', () => {
  test('should have generation selector', async ({ page }) => {
    await page.goto('/team-builder/new');

    const generationSelect = page.getByLabel('Generation');
    await expect(generationSelect).toBeVisible();
  });

  test('should be able to open generation dropdown', async ({ page }) => {
    await page.goto('/team-builder/new');

    const generationSelect = page.getByLabel('Generation');
    await generationSelect.click();

    // Options should be visible
    await expect(
      page.getByRole('option', { name: /Generation/i }).first()
    ).toBeVisible();
  });
});

test.describe('Team Editor - URL Validation', () => {
  test('should handle invalid team ID gracefully', async ({ page }) => {
    // Try to access a team with invalid UUID format
    await page.goto('/team-builder/invalid-id');

    // Should show 404 page or error message
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should accept "new" as valid team ID', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Should load successfully
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
  });

  test('should accept valid UUID format for team ID', async ({ page }) => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    await page.goto(`/team-builder/${validUuid}`, {
      waitUntil: 'domcontentloaded',
    });

    // Should either load team or show 404 (depending on if team exists)
    // The key thing is it should NOT crash with an error page
    // Wait a bit for the page to render
    await page.waitForTimeout(500);

    // Check that we don't see a Next.js error page or crash
    const hasError = await page
      .getByText(/Application error|runtime error|unexpected/i)
      .isVisible()
      .catch(() => false);

    // If no error, the test passes - page handled the UUID gracefully
    expect(hasError).toBe(false);
  });
});

/**
 * NOTE: These tests run against REAL backend and database
 *
 * Setup requirements:
 * 1. Backend API must be running (handled by playwright.config.ts)
 * 2. Database must be accessible
 * 3. Test user created via global-setup.ts
 *
 * The tests are intentionally simple and focus on:
 * - Page loading and navigation
 * - UI element presence
 * - Basic interactions
 *
 * More complex tests (creating teams, adding Pokemon) would require:
 * - More sophisticated cleanup
 * - Handling async validation
 * - Dealing with real database state
 */
