import { test, expect } from '@playwright/test';

// Key user flows from ARCHITECTURE.md §11.1. The tablet project uses the full
// grid; bids are reached by their accessible labels (suit shape + label).

test.describe('full grid (desktop / tablet)', () => {
  test('F1/F3: new game → full auction → contract with correct declarer', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'full-grid flow runs on desktop/tablet');
    await page.goto('/');

    await page.getByRole('button', { name: 'Start Game' }).click();

    // North opens 1NT, then three passes complete the auction.
    await page.getByLabel('1 No Trump').click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();

    // Contract screen shows the declarer.
    await expect(page.getByText('by', { exact: true })).toBeVisible();
    await expect(page.getByText('North', { exact: true }).first()).toBeVisible();
  });

  test('F6: bid history opens from the contract screen', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'full-grid flow runs on desktop/tablet');
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.getByLabel('1 No Trump').click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();
    await page.getByRole('button', { name: 'Pass', exact: true }).click();

    await page.getByRole('button', { name: 'Bid History' }).click();
    await expect(page.getByText('Bidding History')).toBeVisible();
  });
});

test('F8: palette and settings overlay open', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Navy Blue' }).click();
  // Closing returns to the game.
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByRole('heading', { name: 'New Game' })).toBeVisible();
});

// Regression: special call buttons (Pass/X/XX) must keep their gold background on
// hover — the generic green hover used to bleed through and stick under the
// cursor after a click, showing green-on-black for the next bidder.
test('Pass button stays gold on hover', async ({ page }, info) => {
  test.skip(info.project.name === 'phone', 'hover semantics differ on touch');
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  const pass = page.getByRole('button', { name: 'Pass', exact: true });
  await pass.hover();
  // Felt Green accent (gold), not the green hover surface (rgb(54,117,86)).
  await expect.poll(() => pass.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(233, 196, 106)',
  );
});
