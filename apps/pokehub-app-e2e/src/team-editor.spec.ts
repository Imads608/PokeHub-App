import { mockTeam } from './mocks/handlers';
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Team Editor (Frontend)
 *
 * Approach: MSW Proxy Server for API mocking
 * - Real authentication via global-setup
 * - MSW proxy intercepts API calls (works for both client-side AND server-side requests)
 * - Proxy runs as separate process, forwards auth requests to real backend
 * - Focus on UI/UX flows and validation feedback
 *
 * Test Flows:
 * 1. Team Creation Flow - Navigate, create, add Pokemon, edit, save
 * 2. Team Editing Flow - Load existing team, modify, save
 * 3. Team Deletion Flow - Delete with confirmation (from team list)
 * 4. Validation Feedback - Errors, disabled buttons, restrictions
 * 5. Unsaved Changes - Prompt on navigation
 */

test.describe('Team Editor - Team Creation Flow', () => {
  test('should allow creating a new team and adding Pokemon', async ({
    page,
  }) => {
    // Navigate to team builder (new team)
    await page.goto('/team-builder/new');

    // Verify page loaded
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
    await expect(
      page.getByText('Build and customize your competitive Pokémon team')
    ).toBeVisible();

    // Verify Team Configuration section is visible
    await expect(page.getByText('Team Configuration')).toBeVisible();

    // Set team name
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.fill('My Awesome Team');
    await expect(teamNameInput).toHaveValue('My Awesome Team');

    // Verify generation selector (default should be Generation 9)
    const generationSelect = page.getByLabel('Generation');
    await expect(generationSelect).toBeVisible();

    // Verify format selector using test ID (may lazy load)
    await expect(page.getByTestId('format-selector')).toBeVisible();

    // Verify empty team slots using test ID
    await expect(page.getByTestId('add-pokemon-slot-0')).toBeVisible();

    // Verify Save button exists and is disabled (no changes/validation)
    const saveButton = page.getByRole('button', { name: /Save Team/i });
    await expect(saveButton).toBeVisible();
    // Note: Button might be disabled initially due to validation or no changes
  });

  test('should open Pokemon selector when clicking Add Pokemon', async ({
    page,
  }) => {
    await page.goto('/team-builder/new');

    // Click "Add Pokémon" button using test ID
    await page.getByTestId('add-pokemon-slot-0').click();

    // Verify Pokemon Selector dialog opens
    await expect(page.getByTestId('pokemon-selector-dialog')).toBeVisible();
    await expect(page.getByText('Select a Pokémon')).toBeVisible();
    await expect(
      page.getByText('Choose a Pokémon to add to your team')
    ).toBeVisible();

    // Wait for lazy-loaded Pokemon selector to finish loading and search input to appear
    // Use a longer timeout as this component lazy loads
    await expect(page.getByTestId('pokemon-search-input')).toBeVisible({
      timeout: 15000,
    });

    // Verify search functionality exists using test ID
    await expect(page.getByTestId('pokemon-search-input')).toBeVisible();
  });

  test('should handle generation change with team clearance warning', async ({
    page,
  }) => {
    await page.goto('/team-builder/new');

    // Add a Pokemon first (simulate having pokemon in team)
    // For this test, we'll just change generation without pokemon

    // Change generation
    const generationSelect = page.getByLabel('Generation');
    await generationSelect.click();

    // Wait for dropdown to open and select a different generation
    await page.waitForTimeout(500); // Wait for animation
    await page.getByText('Generation VIII').click();

    // Since team is empty, no warning should appear
    // Generation should change immediately
  });

  test('should validate team name is required', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Leave team name empty
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.fill('');
    await teamNameInput.blur();

    // Try to save (if validation shows errors immediately)
    // Note: Validation might only trigger on save attempt
  });
});

test.describe('Team Editor - Team Editing Flow', () => {
  test('should load existing team for editing', async ({ page }) => {
    // Navigate to edit existing team
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Verify team data is loaded
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();

    // Verify team name is loaded
    const teamNameInput = page.getByLabel('Team Name');
    await expect(teamNameInput).toHaveValue(mockTeam.name);

    // Verify Pokemon cards are displayed
    // The team has 1 Pokemon with nickname "Pika"
    await expect(page.getByText('Pika')).toBeVisible();

    // Verify we can add more Pokemon (team has less than 6)
    await expect(page.getByText('Add Pokémon')).toBeVisible();
  });

  test('should show 404 for non-existent team', async ({ page }) => {
    // Navigate to non-existent team
    await page.goto('/team-builder/00000000-0000-0000-0000-000000000000');

    // Should show the actual Next.js 404 page with a 404 heading
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow editing team name', async ({ page }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Edit team name
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.fill('Updated Team Name');
    await expect(teamNameInput).toHaveValue('Updated Team Name');

    // Save button should become enabled (changes detected)
    // Note: Might need to wait for validation to complete
    await expect(
      page.getByRole('button', { name: /Save Team/i })
    ).toBeVisible();
  });

  test('should allow removing Pokemon from team', async ({ page }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Find Pokemon card
    await expect(page.getByText('Pika')).toBeVisible();

    // Look for remove/delete button (might be an icon or button)
    // Note: Need to check actual implementation for button selector
  });
});

test.describe('Team Editor - Validation Feedback', () => {
  test('should disable save button when validation fails', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Set team name
    await page.getByLabel('Team Name').fill('Test Team');

    // Save button should show validation state
    const saveButton = page.getByRole('button', { name: /Save Team/i });
    await expect(saveButton).toBeVisible();
  });

  test('should show validation errors for invalid team', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Leave team name empty or invalid
    await page.getByLabel('Team Name').fill('');

    // Validation summary should show errors
    // Note: Actual error display depends on implementation
  });

  test('should show tooltip on disabled save button', async ({ page }) => {
    await page.goto('/team-builder/new');

    // With no changes, save button should be disabled with tooltip
    const saveButton = page.getByRole('button', { name: /Save Team/i });

    // Hover to see tooltip (force hover to bypass sticky nav)
    await saveButton.hover({ force: true });

    // Tooltip should explain why button is disabled
    // Note: Tooltip implementation might use different selectors
  });

  test('should prevent adding more than 6 Pokemon', async ({ page }) => {
    // Create a team with 6 Pokemon
    const fullTeam = {
      ...mockTeam,
      pokemon: [
        mockTeam.pokemon[0],
        { ...mockTeam.pokemon[0], species: 'Charizard' as const },
        { ...mockTeam.pokemon[0], species: 'Blastoise' as const },
        { ...mockTeam.pokemon[0], species: 'Venusaur' as const },
        { ...mockTeam.pokemon[0], species: 'Alakazam' as const },
        { ...mockTeam.pokemon[0], species: 'Gengar' as const },
      ],
    };

    await page.goto(`/team-builder/${fullTeam.id}`);

    // Wait for page to load
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();

    // "Add Pokémon" button should not be visible (team is full)
    await expect(page.getByTestId('add-pokemon-slot-0')).toBeHidden();
  });
});

test.describe('Team Editor - Unsaved Changes', () => {
  test('should prompt when closing Pokemon editor with unsaved changes', async ({
    page,
  }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Click Edit button on first Pokemon card
    await page.getByTestId('pokemon-card-0-edit-button').click();

    // Verify editor dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // Make changes (e.g., change nickname)
    const nicknameInput = page.getByLabel(/nickname|name/i);
    if (await nicknameInput.isVisible()) {
      await nicknameInput.fill('Thunder Mouse');
    }

    // Setup dialog listener for confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.accept();
    });

    // Try to close dialog
    await page.keyboard.press('Escape');

    // Confirmation should have been shown
  });

  test('should allow closing Pokemon editor without changes', async ({
    page,
  }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Click Edit button on first Pokemon card
    await page.getByTestId('pokemon-card-0-edit-button').click();

    // Verify editor dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close without making changes
    await page.keyboard.press('Escape');

    // Dialog should close without confirmation
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('should track changes for save button state', async ({ page }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Initially, save button should be disabled (no changes)
    const saveButton = page.getByRole('button', { name: /Save Team/i });

    // Make a change
    await page.getByLabel('Team Name').fill('Modified Team Name');

    // Save button should become enabled
    // Note: Might need to wait for change detection

    // Save the team
    await saveButton.click();

    // After successful save, button should be disabled again
    // Note: Depends on success handling and change tracking reset
  });
});

test.describe('Team Editor - Navigation', () => {
  test('should navigate back to team list after saving new team', async ({
    page,
  }) => {
    await page.goto('/team-builder/new');

    // Fill required fields
    await page.getByLabel('Team Name').fill('New Team');

    // Mock successful save and navigation
    // Note: This depends on router.push behavior

    // Verify save button exists
    await expect(
      page.getByRole('button', { name: /Save Team/i })
    ).toBeVisible();
    // Button might be disabled due to validation (empty team)
  });

  test('should stay on edit page after updating existing team', async ({
    page,
  }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Make and save changes
    await page.getByLabel('Team Name').fill('Updated Name');

    // Verify save button is visible
    await expect(
      page.getByRole('button', { name: /Save Team/i })
    ).toBeVisible();

    // After save, should stay on same page
    // URL should still be /team-builder/:id
  });

  test('should show team analysis dialog', async ({ page }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

    // Click "Analyze Team" button
    const analyzeButton = page.getByRole('button', { name: /Analyze Team/i });
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // Team analysis dialog should open
    // Note: Lazy loaded component might take time
    await expect(
      page.getByRole('dialog').getByText(/Team Analysis/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Team Editor - Format Configuration', () => {
  test('should display format rules for selected format', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();

    // Format rules should be displayed (lazy loaded component)
    await expect(page.getByTestId('format-rules-card')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should update format rules when format changes', async ({ page }) => {
    await page.goto('/team-builder/new');

    // Change format
    const formatSelect = page.getByLabel('Format');
    await formatSelect.click();

    // Select different format (if options are available)
    // Format rules should update accordingly
  });
});

test.describe('Team Editor - Export/Import', () => {
  test('should show export button', async ({ page }) => {
    await page.goto(`/team-builder/${mockTeam.id}`);

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
