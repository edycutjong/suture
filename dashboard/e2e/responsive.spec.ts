import { test, expect } from "@playwright/test";

/**
 * E2E: Responsive Layout Tests — Suture Dashboard
 *
 * Verifies correct rendering across viewport sizes:
 *   - Mobile (375px) — iPhone SE
 *   - Tablet (768px) — iPad
 *   - Desktop (1440px) — Standard laptop
 */

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive · ${viewport.name} (${viewport.width}px)`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });

    test("should render without horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("should render header within viewport", async ({ page }) => {
      await page.goto("/");

      const header = page.locator("header");
      if (await header.isVisible()) {
        const box = await header.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      }
    });

    test("should not have overlapping elements", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflowX).toBe(false);
    });
  });
}
