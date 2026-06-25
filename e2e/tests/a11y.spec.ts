import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated WCAG 2.1 A/AA audit of every screen across all four palettes. The
// dev-only preview toggle is excluded; it never ships.
const PALETTES = ['Felt Green', 'Navy Blue', 'High Contrast', 'Warm Parchment'] as const;

async function scan(page: Page) {
  return new AxeBuilder({ page })
    // wcag22aa adds target-size (min 24x24 interactive targets).
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('#device-toggle')
    .analyze();
}

async function setPalette(page: Page, name: string) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

test.describe('accessibility (axe)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one engine is enough');

  for (const palette of PALETTES) {
    test(`palette: ${palette}`, async ({ page }, info) => {
      test.skip(info.project.name === 'phone', 'full-grid flow runs on desktop/tablet');
      await page.goto('/');
      await setPalette(page, palette);

      // New Game
      expect((await scan(page)).violations, 'New Game').toEqual([]);

      // Settings overlay
      await page.getByRole('button', { name: 'Settings' }).click();
      expect((await scan(page)).violations, 'Settings').toEqual([]);
      await page.getByRole('button', { name: 'Close settings' }).click();

      // Bidding
      await page.getByRole('button', { name: 'Start Game' }).click();
      expect((await scan(page)).violations, 'Bidding').toEqual([]);

      // Complete the auction in place (1NT by North, three passes) → Contract.
      await page.getByLabel('1 No Trump').click();
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Pass', exact: true }).click();
      expect((await scan(page)).violations, 'Contract').toEqual([]);

      // Bid History overlay
      await page.getByRole('button', { name: 'Bid History' }).click();
      expect((await scan(page)).violations, 'Bid History').toEqual([]);
      await page.getByRole('button', { name: 'Close' }).click();

      // Tricks
      await page.getByRole('button', { name: 'Add Score' }).first().click();
      expect((await scan(page)).violations, 'Tricks').toEqual([]);

      // Score
      await page.getByRole('button', { name: 'Add Score' }).first().click();
      expect((await scan(page)).violations, 'Score').toEqual([]);
    });
  }

  // Mobile/compact pass: the phone layout (compact grid, mobile settings with the
  // "needs a tablet" reasons) gets its own scan in the two most-used palettes.
  for (const palette of ['Felt Green', 'High Contrast'] as const) {
    test(`mobile compact: ${palette}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'phone', 'mobile-only layout');
      await page.goto('/');
      await setPalette(page, palette);
      expect((await scan(page)).violations, 'New Game (mobile)').toEqual([]);

      await page.getByRole('button', { name: 'Settings' }).click();
      expect((await scan(page)).violations, 'Settings (mobile)').toEqual([]);
      await page.getByRole('button', { name: 'Close settings' }).click();

      await page.getByRole('button', { name: 'Start Game' }).click();
      expect((await scan(page)).violations, 'Bidding compact (mobile)').toEqual([]);
    });
  }
});
