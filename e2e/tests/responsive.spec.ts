import { test, expect, type Page } from '@playwright/test';

// Genuine responsiveness: the app reacts to the real viewport size (not just the
// preview toggle), and the reserved-band layout never lets the grid overlap the
// seat strips. Compact is a fixed-shape (non-scrolling) grid, so its buttons must
// all stay on-screen; Full is intentionally scrollable, so it is exempt.
test.describe('responsive layout', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one engine is enough');

  async function setLayout(page: Page, name: 'Full grid' | 'Compact' | 'Four grids') {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name }).click();
    await page.getByRole('button', { name: 'Close settings' }).click();
  }

  // Every grid button sits fully within the viewport (overflow:hidden clips the
  // rest). Only valid for the fixed Compact grid, not the scrollable Full grid.
  async function expectButtonsOnScreen(page: Page) {
    const w = page.viewportSize()!.width;
    const h = page.viewportSize()!.height;
    const boxes = await page.locator('.gb').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })),
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(-1);
      expect(b.top).toBeGreaterThanOrEqual(-1);
      expect(b.right).toBeLessThanOrEqual(w + 1);
      expect(b.bottom).toBeLessThanOrEqual(h + 1);
    }
  }

  test('flips desktop ↔ mobile on resize alone (no toggle)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wide: desktop full (auto-scroll) grid.
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'desktop');
    await expect(page.locator('.full')).toBeVisible();

    // Shrink the window only — the app switches to the mobile compact layout.
    await page.setViewportSize({ width: 380, height: 740 });
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'mobile');
    await expect(page.locator('.full')).toHaveCount(0);
    await expect(page.locator('.compact')).toBeVisible();
    await expectButtonsOnScreen(page);

    // Grow it back — desktop full grid returns (saved choice preserved).
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'desktop');
    await expect(page.locator('.full')).toBeVisible();
  });

  test('compact grid never overlaps the seat strips (all turns)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'mobile');
    await expect(page.locator('.compact')).toBeVisible();

    const overlaps = async () =>
      page.evaluate(() => {
        const grid = document.querySelector('.gridblock')?.getBoundingClientRect();
        const seats = [...document.querySelectorAll('.seat')].map((c) => c.getBoundingClientRect());
        if (!grid) return true;
        const pad = 2;
        return seats.some(
          (c) =>
            !(
              grid.right - pad <= c.left ||
              grid.left + pad >= c.right ||
              grid.bottom - pad <= c.top ||
              grid.top + pad >= c.bottom
            ),
        );
      });

    // Visit North → East → South → West (the grid rotates to face each).
    for (let i = 0; i < 4; i++) {
      expect(await overlaps(), `turn ${i}`).toBe(false);
      await expectButtonsOnScreen(page);
      if (i < 3) await page.getByRole('button', { name: 'Pass', exact: true }).click();
    }
  });

  test('compact grid stays on-screen across a range of sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await setLayout(page, 'Compact'); // fixed-shape grid (non-scrolling)
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 834, height: 1112 },
      { width: 768, height: 1024 },
      { width: 414, height: 896 },
      { width: 360, height: 640 },
    ]) {
      await page.setViewportSize(size);
      await expect(page.locator('.compact')).toBeVisible();
      await expectButtonsOnScreen(page);
    }
  });
});
