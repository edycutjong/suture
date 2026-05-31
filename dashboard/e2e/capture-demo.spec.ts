import { test } from "@playwright/test";
import path from "path";

/**
 * Suture — Demo Capture Script
 *
 * Captures screenshots and recordings for the YouTube demo video.
 * Output: DemoStudio/010_Suture/screenshots/ and recordings/
 *
 * Usage:
 *   cd dashboard
 *   npx playwright test e2e/capture-demo.spec.ts --project=chromium
 *
 * Prerequisites:
 *   - Dashboard running on localhost:3000 (npm run dev)
 */

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../../../../DemoStudio/010_Suture/screenshots"
);
const RECORDING_DIR = path.resolve(
  __dirname,
  "../../../../DemoStudio/010_Suture/recordings"
);

const VIEWPORT = { width: 1920, height: 1080 };

test.describe("Suture — Demo Capture", () => {
  test.use({
    viewport: VIEWPORT,
    video: { mode: "on", size: VIEWPORT },
    launchOptions: { slowMo: 300 },
  });

  test("01 — Landing page (full page)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-landing.png"),
      fullPage: true,
    });
  });

  test("02 — Landing page (viewport only)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-landing-viewport.png"),
      fullPage: false,
    });
  });

  test("03 — Dashboard overview", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-dashboard.png"),
      fullPage: false,
    });
  });

  test("04 — Dashboard full page scroll", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-dashboard-full.png"),
      fullPage: true,
    });
  });

  test("05 — Pitch deck", async ({ page }) => {
    await page.goto("/pitch");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-pitch.png"),
      fullPage: false,
    });
  });

  test("06 — Video walkthrough recording", async ({ page, context }) => {
    // Landing page
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Scroll down slowly to show full landing
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const step = 3;
      const pixels = 5;
      for (
        let i = 0;
        i < document.body.scrollHeight;
        i += pixels
      ) {
        window.scrollBy(0, pixels);
        await delay(step);
      }
    });
    await page.waitForTimeout(1000);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    // Scroll dashboard slowly
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const step = 5;
      const pixels = 8;
      for (
        let i = 0;
        i < document.body.scrollHeight;
        i += pixels
      ) {
        window.scrollBy(0, pixels);
        await delay(step);
      }
    });
    await page.waitForTimeout(2000);

    // Hover over key interactive elements
    const cards = page.locator("[class*=card], [class*=Card]");
    const cardCount = await cards.count();
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        await card.hover();
        await page.waitForTimeout(800);
      }
    }

    await page.waitForTimeout(2000);

    // Video saved automatically by Playwright to test-results/
    // Copy to DemoStudio after run
  });

  test("07 — Dark mode hero screenshot (OG image quality)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Capture at 2x for retina quality
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-hero-2x.png"),
      fullPage: false,
    });
  });
});
