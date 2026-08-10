import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Cannot parse color: ${rgb}`);
  return (
    "#" +
    [match[1], match[2], match[3]]
      .map((v) => parseInt(v).toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

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

test("logo two-tone wordmark colors are correct", async ({ page }, testInfo) => {
  const projectName = testInfo.project.name;

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const logoOnly = page.locator('[data-testid="logo-only"]');
  const logoJobs = page.locator('[data-testid="logo-jobs"]');

  await expect(logoOnly).toBeVisible({ timeout: 30000 });
  await expect(logoJobs).toBeVisible({ timeout: 30000 });

  const onlyRgb = await logoOnly.evaluate(
    (el) => getComputedStyle(el).color
  );
  const jobsRgb = await logoJobs.evaluate(
    (el) => getComputedStyle(el).color
  );

  const onlyHex = rgbToHex(onlyRgb);
  const jobsHex = rgbToHex(jobsRgb);

  expect(onlyHex).toBe("#F4F5F3");
  expect(jobsHex).toBe("#6CA0E0");

  expect(onlyHex).not.toBe("#16202A");
  expect(onlyHex).not.toBe("#071322");
  expect(jobsHex).not.toBe("#16202A");
  expect(jobsHex).not.toBe("#071322");

  // BETA badge must still be visible
  await expect(page.getByText("BETA").first()).toBeVisible();

  // Screenshot the header for eyeballing
  const header = page.locator("header").first();
  const headerExists = await header.count();
  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `logo-header-${projectName}.png`
  );

  if (headerExists > 0) {
    await header.screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({
      path: screenshotPath,
      clip: { x: 0, y: 0, width: 1280, height: 72 },
    });
  }
});
