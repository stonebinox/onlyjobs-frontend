import { test, expect } from "@playwright/test";

test("top CTA is above the fold", async ({ page }) => {
  await page.goto("/sample-match-report");
  const cta = page.getByTestId("sample-report-cta-top");
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(vh);
});

test("clicking the top CTA lands on the signup form in the viewport", async ({ page }) => {
  await page.goto("/sample-match-report");
  await page.getByTestId("sample-report-cta-top").click();
  await page.waitForURL(/\/\?.*#signup$/);
  await expect(page.locator("#signup")).toBeInViewport();
});
