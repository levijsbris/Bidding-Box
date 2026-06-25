import { test, expect } from '@playwright/test';

// F9: offline resume — start a game, reload, and the game continues from
// IndexedDB rather than dropping back to New Game (US-19).
test('reload mid-game resumes from local storage', async ({ page }, info) => {
  test.skip(info.project.name === 'phone', 'uses the full grid to place a bid');
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.getByLabel('1 Clubs').click();

  // Give IndexedDB a moment to flush, then reload.
  await page.waitForTimeout(200);
  await page.reload();

  // Still in the auction (New Game's Start button is gone).
  await expect(page.getByRole('button', { name: 'Start Game' })).toHaveCount(0);
  await expect(page.getByText("'s turn")).toBeVisible();
});
