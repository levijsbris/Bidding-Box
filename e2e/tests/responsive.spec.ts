import { test, expect, type Page } from '@playwright/test';

// Genuine responsiveness: the app must react to the real viewport size, not only
// to the preview toggle. These run on the tablet project but drive the viewport
// directly, so the device descriptor is irrelevant.
test.describe('responsive layout', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one engine is enough');

  const deviceAttr = (page: Page) =>
    page.locator('#preview').getAttribute('data-device');

  // Every call button must sit fully within the viewport (the app uses
  // overflow:hidden, so anything off-screen is genuinely clipped/lost).
  async function expectButtonsOnScreen(page: Page) {
    const w = page.viewportSize()!.width;
    const h = page.viewportSize()!.height;
    const boxes = await page.locator('.call-btn').evaluateAll((els) =>
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

    // Wide: desktop layout with the full 7×5 grid.
    expect(await deviceAttr(page)).toBe('desktop');
    await expect(page.locator('.grid-table')).toBeVisible();
    await expectButtonsOnScreen(page);

    // Shrink the window only — the app should switch to the mobile compact layout.
    await page.setViewportSize({ width: 380, height: 740 });
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'mobile');
    await expect(page.locator('.grid-table')).toHaveCount(0);
    await expect(page.locator('.compact-levels')).toBeVisible();
    await expectButtonsOnScreen(page);

    // Grow it back — desktop full grid returns (saved choice preserved).
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#preview')).toHaveAttribute('data-device', 'desktop');
    await expect(page.locator('.grid-table')).toBeVisible();
  });

  test('call buttons stay on-screen across a range of sizes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 834, height: 1112 },
      { width: 768, height: 1024 },
      { width: 414, height: 896 },
      { width: 360, height: 640 },
    ]) {
      await page.setViewportSize(size);
      await expectButtonsOnScreen(page);
    }
  });
});
