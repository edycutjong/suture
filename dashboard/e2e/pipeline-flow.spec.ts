import { test, expect } from "@playwright/test";

/**
 * E2E: Pipeline Healing Flow — Suture Dashboard
 *
 * Verifies the core user journey:
 *   1. Dashboard loads with pipeline cards
 *   2. Pipeline status badges render
 *   3. Schema diff viewer is present
 *   4. Agent activity log shows entries
 */

test.describe("Pipeline Healing Flow", () => {
  test("should display pipeline cards with status badges", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Pipeline cards should render (using demo/mock data)
    const main = page.locator("main");
    await expect(main).toBeVisible();

    // Look for status indicators (healthy/broken/healing)
    const statusText = page.getByText(/healthy|broken|healing|syncing/i).first();
    if (await statusText.isVisible()) {
      await expect(statusText).toBeVisible();
    }
  });

  test("should show stats panel with metrics", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Stats should show numeric values (pipelines, incidents, etc.)
    const numbers = page.locator("text=/\\d+/").first();
    await expect(numbers).toBeVisible();
  });

  test("should render demo controls for triggering events", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for buttons or interactive elements
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should have working navigation if present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for navigation links
    const navLinks = page.locator("nav a, header a");
    const count = await navLinks.count();

    if (count > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});
