import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

test("landing page baseline screenshot", async ({ page }, testInfo) => {
  const projectName = testInfo.project.name; // "desktop" or "mobile"

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Guard: assert OnlyJobs hero is visible before screenshotting
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({
    timeout: 30000,
  });

  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `landing-${projectName}.png`
  );

  await page.screenshot({ path: screenshotPath, fullPage: true });
});
