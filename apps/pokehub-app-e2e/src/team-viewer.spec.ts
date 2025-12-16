import { mockTeam } from './mocks/handlers';
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Team Viewer (/team-builder)
 *
 * Approach: MSW Proxy Server for API mocking
 * - Real authentication via global-setup
 * - MSW proxy intercepts API calls (works for both client-side AND server-side requests)
 * - Focus on UI/UX flows and filtering/sorting behavior
 *
 * Test Flows:
 * 1. View Team List - Display teams with filters and sorting
 * 2. Search Teams - Filter by name
 * 3. Sort Teams - By name, created, and updated date
 * 4. Delete Team - With confirmation dialog
 * 5. Duplicate Team - Create copy and navigate to editor
 * 6. View Mode Toggle - Switch between grid and list view
 * 7. Empty States - No teams, no filtered results
 * 8. Create Team Navigation - Navigate to new team page
 */

test.describe('Team Viewer - View Team List', () => {
  test('should display user teams', async ({ page }) => {
    await page.goto('/team-builder');

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'My Teams' })).toBeVisible();
    await expect(
      page.getByText('Manage your competitive Pokemon teams')
    ).toBeVisible();

    // Verify "Create New Team" button exists
    await expect(page.getByTestId('create-team-button')).toBeVisible();

    // Verify teams are displayed (from MSW mock)
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Verify filter section exists
    await expect(page.getByText('Filter Teams')).toBeVisible();
  });

  test('should show filter controls', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Verify filter controls are present using test IDs
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByTestId('generation-filter')).toBeVisible();
    await expect(page.getByTestId('format-filter')).toBeVisible();
    await expect(page.getByTestId('sort-filter')).toBeVisible();
  });

  test('should display team cards in grid view by default', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Verify grid view is active
    await expect(page.getByTestId('teams-grid')).toBeVisible();
    await expect(page.getByTestId(`team-card-${mockTeam.id}`)).toBeVisible();
  });
});

test.describe('Team Viewer - Search Teams', () => {
  test('should filter teams by search term', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Type in search box
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('Test');

    // Team should still be visible (matches search)
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });

  test('should show no results when search matches nothing', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Search for non-existent team
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('NONEXISTENT');

    // Should show no results message
    await expect(page.getByText('No teams found')).toBeVisible();
    await expect(
      page.getByText(/no teams match your current filters/i)
    ).toBeVisible();
  });

  test('should clear search when Clear Filters is clicked', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Apply search filter
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('NONEXISTENT');

    // Verify no results
    await expect(page.getByText('No teams found')).toBeVisible();

    // Click Clear Filters button (in the no-results card)
    await page.getByTestId('no-results-clear-filters').click();

    // Team should be visible again
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });
});

test.describe('Team Viewer - Sort Teams', () => {
  test('should change sort field', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open sort dropdown
    const sortSelect = page.getByTestId('sort-filter');
    await sortSelect.click();

    // Select "Name" sort option
    await page.getByRole('option', { name: 'Name' }).click();

    // Verify sort changed (teams should still be visible)
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });

  test('should toggle sort order', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Click toggle sort order button
    const toggleButton = page.getByTestId('sort-order-toggle');
    await toggleButton.click();

    // Teams should still be visible (order changed)
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });
});

test.describe('Team Viewer - Delete Team', () => {
  test('should open delete confirmation dialog', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open team menu using test ID
    const menuButton = page.getByTestId(`team-card-menu-${mockTeam.id}`);
    await menuButton.click({ force: true }); // Force click as it might be hidden

    // Click delete option
    await page.getByTestId(`team-card-delete-${mockTeam.id}`).click();

    // Verify confirmation dialog opens
    await expect(page.getByTestId('delete-team-dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /delete team/i })
    ).toBeVisible();
    await expect(
      page.getByText(/are you sure you want to delete/i)
    ).toBeVisible();

    // Verify buttons exist
    await expect(page.getByTestId('delete-team-cancel')).toBeVisible();
    await expect(page.getByTestId('delete-team-confirm')).toBeVisible();
  });

  test('should close delete dialog on cancel', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open menu and click delete
    await page.getByTestId(`team-card-menu-${mockTeam.id}`).click({ force: true });
    await page.getByTestId(`team-card-delete-${mockTeam.id}`).click();

    // Verify dialog is open
    await expect(page.getByTestId('delete-team-dialog')).toBeVisible();

    // Click cancel
    await page.getByTestId('delete-team-cancel').click();

    // Dialog should close
    await expect(page.getByTestId('delete-team-dialog')).toBeHidden();

    // Team should still exist
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });

  test('should delete team on confirm', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open menu and click delete
    await page.getByTestId(`team-card-menu-${mockTeam.id}`).click({ force: true });
    await page.getByTestId(`team-card-delete-${mockTeam.id}`).click();

    // Verify dialog is open
    await expect(page.getByTestId('delete-team-dialog')).toBeVisible();

    // Click confirm delete
    await page.getByTestId('delete-team-confirm').click();

    // Wait for dialog to close (indicates mutation completed)
    await expect(page.getByTestId('delete-team-dialog')).toBeHidden({ timeout: 10000 });

    // Verify success toast appears
    await expect(page.getByText('Team deleted')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Team Viewer - Duplicate Team', () => {
  test('should duplicate team and navigate to editor', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open menu and click duplicate
    await page.getByTestId(`team-card-menu-${mockTeam.id}`).click({ force: true });
    await page.getByTestId(`team-card-duplicate-${mockTeam.id}`).click();

    // Should navigate to the new team's editor page (this happens on success)
    await expect(page).toHaveURL(/\/team-builder\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Verify we're on the team editor
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible({ timeout: 10000 });

    // Should show success toast
    await expect(page.getByText('Team duplicated')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Team Viewer - View Mode Toggle', () => {
  test('should switch to list view', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Default should be grid view
    await expect(page.getByTestId('teams-grid')).toBeVisible();

    // Click list view button
    await page.getByTestId('view-mode-list').click();

    // Should switch to list view
    await expect(page.getByTestId('teams-list')).toBeVisible();
    await expect(page.getByTestId(`team-list-item-${mockTeam.id}`)).toBeVisible();
  });

  test('should switch back to grid view', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Switch to list view first
    await page.getByTestId('view-mode-list').click();
    await expect(page.getByTestId('teams-list')).toBeVisible();

    // Switch back to grid view
    await page.getByTestId('view-mode-grid').click();

    // Should show grid view
    await expect(page.getByTestId('teams-grid')).toBeVisible();
    await expect(page.getByTestId(`team-card-${mockTeam.id}`)).toBeVisible();
  });
});

test.describe('Team Viewer - Create Team Navigation', () => {
  test('should navigate to create new team page', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'My Teams' })).toBeVisible();

    // Click "Create New Team" button
    await page.getByTestId('create-team-button').click();

    // Should navigate to /team-builder/new
    await expect(page).toHaveURL('/team-builder/new');

    // Verify we're on the team editor
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
  });
});

test.describe('Team Viewer - Generation Filter', () => {
  test('should filter by generation', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open generation dropdown
    await page.getByTestId('generation-filter').click();

    // Select Generation 9
    await page.getByRole('option', { name: 'Generation 9' }).click();

    // Team should still be visible (it's Gen 9)
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });
});

test.describe('Team Viewer - Format Filter', () => {
  test('should filter by format', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open format dropdown
    await page.getByTestId('format-filter').click();

    // Select OU format
    await page.getByRole('option', { name: 'OU' }).click();

    // Team should still be visible (it's OU format)
    await expect(page.getByText(mockTeam.name)).toBeVisible();
  });
});

test.describe('Team Viewer - Active Filters Badge', () => {
  test('should show active filters badge when filters applied', async ({
    page,
  }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Initially no active badge
    await expect(page.getByText('Active')).toBeHidden();

    // Apply a search filter
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('Test');

    // Active badge should appear
    await expect(page.getByText('Active')).toBeVisible();

    // Filter count should appear
    await expect(page.getByText(/Showing \d+ of \d+ teams/i)).toBeVisible();
  });
});

test.describe('Team Viewer - Team Card Actions', () => {
  test('should navigate to team editor on edit', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Open menu and click edit
    await page.getByTestId(`team-card-menu-${mockTeam.id}`).click({ force: true });
    await page.getByTestId(`team-card-edit-${mockTeam.id}`).click();

    // Should navigate to team editor
    await expect(page).toHaveURL(`/team-builder/${mockTeam.id}`);
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
  });

  test('should navigate to team editor on card click', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Click on team card (the link inside)
    const teamCard = page.getByTestId(`team-card-${mockTeam.id}`);
    await teamCard.getByRole('link').click();

    // Should navigate to team editor
    await expect(page).toHaveURL(`/team-builder/${mockTeam.id}`);
    await expect(
      page.getByRole('heading', { name: 'Team Builder' })
    ).toBeVisible();
  });
});

test.describe('Team Viewer - List View Actions', () => {
  test('should show action buttons in list view', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load
    await expect(page.getByText(mockTeam.name)).toBeVisible();

    // Switch to list view
    await page.getByTestId('view-mode-list').click();
    await expect(page.getByTestId('teams-list')).toBeVisible();

    // Hover over the list item to show action buttons
    const listItem = page.getByTestId(`team-list-item-${mockTeam.id}`);
    await listItem.hover();

    // Action buttons should be visible
    await expect(page.getByTestId(`team-list-edit-${mockTeam.id}`)).toBeVisible();
    await expect(page.getByTestId(`team-list-duplicate-${mockTeam.id}`)).toBeVisible();
    await expect(page.getByTestId(`team-list-delete-${mockTeam.id}`)).toBeVisible();
  });

  test('should edit team from list view', async ({ page }) => {
    await page.goto('/team-builder');

    // Wait for teams to load and switch to list view
    await expect(page.getByText(mockTeam.name)).toBeVisible();
    await page.getByTestId('view-mode-list').click();

    // Hover and click edit button
    const listItem = page.getByTestId(`team-list-item-${mockTeam.id}`);
    await listItem.hover();
    await page.getByTestId(`team-list-edit-${mockTeam.id}`).click();

    // Should navigate to team editor
    await expect(page).toHaveURL(`/team-builder/${mockTeam.id}`);
  });
});
