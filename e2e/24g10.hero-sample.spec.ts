/**
 * ADVERSARIAL E2E — onlyjobs-24g.10: hero sample match report link
 *
 * Projects: "desktop" (1280x800) and "mobile" (390x844) — from playwright.config.ts.
 * webServer: npm run build && PORT=3100 npm run start  (baseURL: http://localhost:3100)
 *
 * Tests real rendered layout including:
 *   - Visibility (not just DOM presence)
 *   - Exact href (no query string)
 *   - Mobile fold: submit button above the fold, hero link ABOVE the submit button (link before form in DOM)
 *   - Desktop: hero link in left portion, not inside right-column form
 *
 * ORACLE: spec pasted into the prompt — never "what the code outputs."
 * Do NOT commit.
 */

import { test, expect } from "@playwright/test";

const HERO_TESTID = "hero-sample-match-report";
const EXPECTED_HREF = "/sample-match-report";
const MOBILE_VIEWPORT_HEIGHT = 844;
const DESKTOP_VIEWPORT_WIDTH = 1280;

// ── Helper: assert measured y-value with a diagnostic message ─────────────────

async function assertAboveFold(
  page: import("@playwright/test").Page,
  locator: import("@playwright/test").Locator,
  label: string,
  foldPx: number
) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(
      `FOLD ASSERTION FAILED — "${label}" has no bounding box (not rendered or not visible).`
    );
  }
  const bottom = box.y + box.height;
  if (bottom > foldPx) {
    throw new Error(
      `FOLD ASSERTION FAILED — "${label}" bottom edge is BELOW the fold.\n` +
        `  Element top: ${box.y.toFixed(1)}px\n` +
        `  Element height: ${box.height.toFixed(1)}px\n` +
        `  Element bottom: ${bottom.toFixed(1)}px\n` +
        `  Fold (viewport height): ${foldPx}px\n` +
        `  Overflow: ${(bottom - foldPx).toFixed(1)}px below fold\n` +
        `  This is a FINDING: the submit button is not visible without scrolling on mobile.`
    );
  }
  expect(bottom).toBeLessThanOrEqual(foldPx);
}

// ── Group 1: Both viewports — visibility and href ─────────────────────────────

test("1a [both] hero-sample-match-report is visible and has exact href", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Wait for the hero to render
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({
    timeout: 30000,
  });

  const heroLink = page.getByTestId(HERO_TESTID);

  // Real visibility (not just DOM presence)
  await expect(heroLink).toBeVisible({ timeout: 10000 });

  // Exact href — no query string, no utm
  const href = await heroLink.getAttribute("href");
  if (href !== EXPECTED_HREF) {
    throw new Error(
      `[${testInfo.project.name}] HREF MISMATCH — hero link href is not exactly "${EXPECTED_HREF}".\n` +
        `  Actual: "${href}"\n` +
        `  Expected: exactly "/sample-match-report" (no query string, no utm, no hash).`
    );
  }
  expect(href).toBe(EXPECTED_HREF);
  expect(href).not.toContain("?");
  expect(href).not.toContain("utm");
});

test("1b [both] hero-sample-match-report text matches /see a sample match report/i", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  await expect(heroLink).toBeVisible();

  const text = await heroLink.textContent();
  if (!text || !/see a sample match report/i.test(text)) {
    throw new Error(
      `[${testInfo.project.name}] TEXT MISMATCH — hero link text does not match /see a sample match report/i.\n` +
        `  Actual: "${text}"\n` +
        `  The spec requires: "See a sample match report →"`
    );
  }
  expect(text).toMatch(/see a sample match report/i);
});

test("1c [both] EXACTLY ONE element with testid='hero-sample-match-report' in DOM", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const count = await page.locator(`[data-testid="${HERO_TESTID}"]`).count();
  if (count !== 1) {
    throw new Error(
      `[${testInfo.project.name}] TESTID COUNT FAILURE — ` +
        `expected exactly 1 element with testid="${HERO_TESTID}", found ${count}.`
    );
  }
  expect(count).toBe(1);
});

test("1d [both] footer ALSO has a /sample-match-report link (footer link was not moved)", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  const allSampleLinks = page.locator(`a[href="${EXPECTED_HREF}"]`);
  const totalCount = await allSampleLinks.count();

  if (totalCount < 2) {
    throw new Error(
      `[${testInfo.project.name}] FOOTER LINK MISSING — ` +
        `only ${totalCount} anchor(s) with href="${EXPECTED_HREF}" found in total. ` +
        `Expected at least 2 (hero + footer). The footer link may have been removed or moved.`
    );
  }

  // Confirm the hero link is one of them
  await expect(heroLink).toBeVisible();
  expect(totalCount).toBeGreaterThanOrEqual(2);
});

// ── Group 2: Mobile fold assertions (390x844) ─────────────────────────────────

test("2a [mobile] 'Create account' submit button is ABOVE THE FOLD (within first 844px)", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "mobile") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  // Find the submit button by accessible name
  const submitBtn = page.getByRole("button", { name: /create account/i });
  await expect(submitBtn).toBeVisible({ timeout: 10000 });

  await assertAboveFold(page, submitBtn, "Create account button", MOBILE_VIEWPORT_HEIGHT);
});

test("2b [mobile] hero-sample link is ABOVE the 'Create account' button (link before form on mobile)", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "mobile") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  const submitBtn = page.getByRole("button", { name: /create account/i });

  await expect(heroLink).toBeVisible({ timeout: 10000 });
  await expect(submitBtn).toBeVisible({ timeout: 10000 });

  const linkBox = await heroLink.boundingBox();
  const btnBox = await submitBtn.boundingBox();

  if (!linkBox) {
    throw new Error(
      `[mobile] FOLD TEST FAILED — hero-sample link has no bounding box (not rendered?).`
    );
  }
  if (!btnBox) {
    throw new Error(
      `[mobile] FOLD TEST FAILED — Create account button has no bounding box (not rendered?).`
    );
  }

  // On mobile the link must be ABOVE the submit button (link.y < button.y).
  // DOM order = visual order: copy -> link -> form is the accessible layout.
  if (linkBox.y >= btnBox.y) {
    throw new Error(
      `2b FINDING — on mobile (390x844) the hero-sample link is NOT above the Create account button.\n` +
        `  Hero-sample link top: ${linkBox.y.toFixed(1)}px\n` +
        `  Create account button top: ${btnBox.y.toFixed(1)}px\n` +
        `  Expected: link.y (${linkBox.y.toFixed(1)}) < button.y (${btnBox.y.toFixed(1)})\n` +
        `  This means the hero link is BELOW the form on mobile, violating the ` +
        `accessible DOM-order = visual-order requirement.`
    );
  }
  expect(linkBox.y).toBeLessThan(btnBox.y);
});

test("2c [mobile] hero-sample link is visible on mobile (not hidden below viewport)", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "mobile") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  // Scroll to find the link (it is above the form on mobile but may still need scrolling to be visible)
  const heroLink = page.getByTestId(HERO_TESTID);
  await heroLink.scrollIntoViewIfNeeded();
  await expect(heroLink).toBeVisible({ timeout: 10000 });

  const href = await heroLink.getAttribute("href");
  expect(href).toBe(EXPECTED_HREF);
});

// ── Group 3: Desktop layout ───────────────────────────────────────────────────

test("3a [desktop] hero-sample link is visible on desktop", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  await expect(heroLink).toBeVisible({ timeout: 10000 });

  const href = await heroLink.getAttribute("href");
  expect(href).toBe(EXPECTED_HREF);
});

test("3b [desktop] hero-sample link is in the LEFT portion of the viewport (hero copy column)", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "desktop") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  await expect(heroLink).toBeVisible({ timeout: 10000 });

  const linkBox = await heroLink.boundingBox();
  if (!linkBox) {
    throw new Error(
      `[desktop] hero-sample link has no bounding box.`
    );
  }

  // On desktop (1280px wide), the hero copy is in the left half.
  // The link should start in the left 55% of the viewport.
  // This is intentionally generous — the exact split depends on layout,
  // but a link at x=700+ on a 1280px viewport would be in the right column (the form).
  const LEFT_HALF = DESKTOP_VIEWPORT_WIDTH * 0.55; // 704px
  if (linkBox.x >= LEFT_HALF) {
    throw new Error(
      `3b FINDING — on desktop the hero-sample link x=${linkBox.x.toFixed(1)}px ` +
        `is NOT in the left portion (left < ${LEFT_HALF.toFixed(0)}px).\n` +
        `  Viewport width: ${DESKTOP_VIEWPORT_WIDTH}px\n` +
        `  Link bounding box: x=${linkBox.x.toFixed(1)}, y=${linkBox.y.toFixed(1)}, ` +
        `w=${linkBox.width.toFixed(1)}, h=${linkBox.height.toFixed(1)}\n` +
        `  The spec requires the link to sit under the left hero copy on desktop.`
    );
  }
  expect(linkBox.x).toBeLessThan(LEFT_HALF);
});

test("3c [desktop] signup form submit button is visible on desktop", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "desktop") {
    test.skip();
    return;
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const submitBtn = page.getByRole("button", { name: /create account/i });
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
});

// ── Group 4: Real navigation ───────────────────────────────────────────────────

test("4a [both] clicking hero-sample link navigates to /sample-match-report", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Start applying smarter/i)).toBeVisible({ timeout: 30000 });

  const heroLink = page.getByTestId(HERO_TESTID);
  await expect(heroLink).toBeVisible({ timeout: 10000 });

  // Click and wait for navigation — catches a covered/offscreen link or broken preventDefault.
  await heroLink.click();
  await expect(page).toHaveURL(/\/sample-match-report$/, { timeout: 15000 });
});
