import { test, expect } from "@playwright/test";

/**
 * E2E: Demo Mode Verification — Suture Dashboard
 *
 * Verifies that the dashboard works fully without external dependencies:
 *   - No Fivetran API key needed
 *   - No Gemini API key needed
 *   - No Supabase connection needed
 *   - All UI components render with mock data
 */

test.describe("Demo Mode", () => {
  test("should load without any API keys configured", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("should not show any error banners or crash screens", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const errorOverlay = page.locator("#__next-build-error");
    await expect(errorOverlay).not.toBeVisible();

    const errorText = page.getByText(/something went wrong|error occurred|500/i);
    await expect(errorText).not.toBeVisible();
  });

  test("should render all critical UI sections", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Header should exist
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Main content area
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title.toLowerCase()).toContain("suture");
  });

  test("should have correct meta tags for SEO", async ({ page }) => {
    await page.goto("/");

    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width/);

    const description = page.locator('meta[name="description"]');
    const content = await description.getAttribute("content");
    expect(content?.length).toBeGreaterThan(0);
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes("favicon") && !err.includes("404")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
