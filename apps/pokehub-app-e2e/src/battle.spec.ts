import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for the Battle System (Frontend)
 *
 * These tests require TWO authenticated users to test matchmaking.
 * - User 1: existing user (from .auth/user.json)
 * - User 2: battle opponent (from .auth/battle-user.json)
 *
 * Uses random battles (no team needed) to simplify setup.
 */

const battleUserAuthFile = path.join(__dirname, '../.auth/battle-user.json');

/**
 * Wait for the battle lobby to be fully loaded and connected to the socket.
 */
async function waitForLobbyReady(page: Page) {
  await page.goto('/battle', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Battle' })).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole('button', { name: 'Find Random Battle' })
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Select a random format and click "Find Random Battle" on the given page.
 * Both players must select the same format — we use "[Gen 9] Random Battle".
 */
async function joinRandomQueue(page: Page) {
  // Click the specific format to ensure both players select the same one
  await page.getByRole('button', { name: '[Gen 9] Random Battle', exact: true }).click();

  // Click "Find Random Battle"
  const findButton = page.getByRole('button', { name: 'Find Random Battle' });
  await expect(findButton).toBeEnabled({ timeout: 5000 });
  await findButton.click();
}

/**
 * Wait for a match to be found and battle to start.
 * The matched -> battle transition can be instant, so we wait for the battle
 * page URL directly rather than the transient "Match Found!" text.
 */
async function waitForBattleStart(page: Page) {
  // The lobby navigates to /battle/{battleId} when a match starts
  await expect(page).toHaveURL(/\/battle\/[0-9a-f-]+/, { timeout: 30000 });
  // Wait for the battle container to render — indicated by Turn indicator
  await expect(page.getByText(/Turn \d+/)).toBeVisible({ timeout: 15000 });
}

/**
 * Forfeit the current battle on the given page.
 */
async function forfeitBattle(page: Page) {
  const forfeitButton = page.getByRole('button', { name: 'Forfeit' });
  if (await forfeitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await forfeitButton.click();
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dialog.getByRole('button', { name: 'Forfeit' }).click();
    }
    // Wait for end overlay
    await page.getByText(/Victory!|Defeat|Draw!/).waitFor({ timeout: 5000 }).catch(() => { /* best-effort cleanup */ });
  }
}

// All battle tests run serially — they share the same authenticated user,
// and the single-socket-per-user policy would disconnect parallel tabs.
test.describe.configure({ mode: 'serial' });

test.describe('Battle Lobby', () => {

  test('should load the battle lobby page', async ({ page }) => {
    await page.goto('/battle', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle' })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('Select a mode and find an opponent')).toBeVisible();
  });

  test('should show Random and Competitive tabs', async ({ page }) => {
    await page.goto('/battle', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: /Random/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('tab', { name: /Competitive/i })).toBeVisible();
  });

  test('should display random format options', async ({ page }) => {
    await waitForLobbyReady(page);
    await expect(page.getByText('Select a Format')).toBeVisible();
    await expect(
      page.getByRole('button', { name: '[Gen 9] Random Battle', exact: true })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should disable Find Random Battle when no format selected', async ({ page }) => {
    await waitForLobbyReady(page);
    const findButton = page.getByRole('button', { name: 'Find Random Battle' });
    await expect(findButton).toBeDisabled();
  });

  test('should enable Find Random Battle after selecting a format', async ({ page }) => {
    await waitForLobbyReady(page);
    await page.getByRole('button', { name: '[Gen 9] Random Battle', exact: true }).click();
    const findButton = page.getByRole('button', { name: 'Find Random Battle' });
    await expect(findButton).toBeEnabled();
  });

  test('should switch to Competitive tab and show team selector', async ({ page }) => {
    await waitForLobbyReady(page);
    await page.getByRole('tab', { name: /Competitive/i }).click();
    await expect(page.getByText('Select a Team')).toBeVisible();
  });

  test('should show queue status when searching', async ({ page }) => {
    await waitForLobbyReady(page);
    await joinRandomQueue(page);
    await expect(page.getByText('Searching for opponent...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should return to lobby when cancelling queue', async ({ page }) => {
    await waitForLobbyReady(page);
    await joinRandomQueue(page);
    await expect(page.getByText('Searching for opponent...')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Battle' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Searching for opponent...')).not.toBeVisible();
  });
});

test.describe('Battle Flow', () => {
  test.setTimeout(90000);

  let player2Context: BrowserContext;
  let player2Page: Page;

  test.beforeEach(async ({ browser }) => {
    player2Context = await browser.newContext({
      storageState: battleUserAuthFile,
    });
    player2Page = await player2Context.newPage();
  });

  test.afterEach(async ({ page }) => {
    // Forfeit any active battles to avoid leaking state
    await forfeitBattle(page);
    await forfeitBattle(player2Page).catch(() => { /* best-effort cleanup */ });
    await player2Page?.close().catch(() => { /* best-effort cleanup */ });
    await player2Context?.close().catch(() => { /* best-effort cleanup */ });
  });

  test('should match two players and start a battle', async ({ page }) => {
    await Promise.all([
      waitForLobbyReady(page),
      waitForLobbyReady(player2Page),
    ]);

    await Promise.all([
      joinRandomQueue(page),
      joinRandomQueue(player2Page),
    ]);

    await Promise.all([
      waitForBattleStart(page),
      waitForBattleStart(player2Page),
    ]);
  });

  test('should show forfeit confirmation dialog', async ({ page }) => {
    await Promise.all([
      waitForLobbyReady(page),
      waitForLobbyReady(player2Page),
    ]);
    await Promise.all([
      joinRandomQueue(page),
      joinRandomQueue(player2Page),
    ]);
    await Promise.all([
      waitForBattleStart(page),
      waitForBattleStart(player2Page),
    ]);

    // Click Forfeit button on player 1
    await page.getByRole('button', { name: 'Forfeit' }).click();

    // Confirmation dialog should appear
    await expect(page.getByText('Forfeit Battle?')).toBeVisible();
    await expect(page.getByText('Are you sure you want to forfeit?')).toBeVisible();

    // Cancel — should stay in battle
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Forfeit Battle?')).not.toBeVisible();
    await expect(page.getByText(/Turn \d+/)).toBeVisible();
  });

  test('should end battle when a player forfeits', async ({ page }) => {
    await Promise.all([
      waitForLobbyReady(page),
      waitForLobbyReady(player2Page),
    ]);
    await Promise.all([
      joinRandomQueue(page),
      joinRandomQueue(player2Page),
    ]);
    await Promise.all([
      waitForBattleStart(page),
      waitForBattleStart(player2Page),
    ]);

    // Player 1 forfeits
    await page.getByRole('button', { name: 'Forfeit' }).click();
    await expect(page.getByText('Forfeit Battle?')).toBeVisible();
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Forfeit' }).click();

    // Player 1 should see Defeat
    await expect(page.getByText('Defeat')).toBeVisible({ timeout: 10000 });
    // Player 2 should see Victory
    await expect(player2Page.getByText('Victory!')).toBeVisible({ timeout: 10000 });

    // Both should see navigation buttons
    await expect(page.getByRole('button', { name: 'Find New Battle' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible();
    await expect(player2Page.getByRole('button', { name: 'Find New Battle' })).toBeVisible();
    await expect(player2Page.getByRole('button', { name: 'Exit' })).toBeVisible();
  });

  test('should navigate back to lobby from end overlay', async ({ page }) => {
    await Promise.all([
      waitForLobbyReady(page),
      waitForLobbyReady(player2Page),
    ]);
    await Promise.all([
      joinRandomQueue(page),
      joinRandomQueue(player2Page),
    ]);
    await Promise.all([
      waitForBattleStart(page),
      waitForBattleStart(player2Page),
    ]);

    // Player 1 forfeits
    await page.getByRole('button', { name: 'Forfeit' }).click();
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Forfeit' }).click();
    await expect(page.getByText('Defeat')).toBeVisible({ timeout: 10000 });

    // Click "Find New Battle" to return to lobby
    await page.getByRole('button', { name: 'Find New Battle' }).click();
    await expect(page).toHaveURL('/battle', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Battle' })).toBeVisible();
  });

  test('should show opponent disconnected overlay', async ({ page }) => {
    await Promise.all([
      waitForLobbyReady(page),
      waitForLobbyReady(player2Page),
    ]);
    await Promise.all([
      joinRandomQueue(page),
      joinRandomQueue(player2Page),
    ]);
    await Promise.all([
      waitForBattleStart(page),
      waitForBattleStart(player2Page),
    ]);

    // Player 2 disconnects by closing their context
    await player2Page.close();
    await player2Context.close();

    // Player 1 should see opponent disconnected notification
    await expect(page.getByText('Opponent disconnected')).toBeVisible({ timeout: 15000 });
  });
});
