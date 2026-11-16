/**
 * 0fnt ADVERSARIAL E2E: /sample-match-report CTAs, sticky bar, cookie banner (R6, R7, R8).
 * Oracle: bd task requirements only.
 */
import { test, expect, Page } from "@playwright/test";

const PAGE = "/sample-match-report";
const isMobile = (vw: number) => vw < 768;

async function rects(page: Page) {
  return page.evaluate(() => {
    const r = (id: string) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, height: b.height, width: b.width };
    };
    return { top: r("sample-report-cta-top"), bottom: r("sample-report-cta-bottom"), vh: window.innerHeight };
  });
}
async function stickyShown(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="sample-report-cta-sticky"]') as HTMLElement | null;
    if (!el) return false;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return false;
    for (let n: HTMLElement | null = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    }
    // must be on screen
    return b.bottom > 0 && b.top < window.innerHeight && b.right > 0 && b.left < window.innerWidth;
  });
}
async function dismissCookies(page: Page) {
  await page.evaluate(() => localStorage.setItem("oj_cookie_consent", "1"));
}

test("R6 top CTA fully inside first viewport, no scroll", async ({ page }) => {
  await page.goto(PAGE);
  const cta = page.getByTestId("sample-report-cta-top");
  await expect(cta).toBeVisible();
  const r = await rects(page);
  expect(r.top!.top).toBeGreaterThanOrEqual(0);
  expect(r.top!.bottom).toBeLessThanOrEqual(r.vh);
});

test("R6 top CTA inside first viewport even with cookie banner showing (fresh visitor)", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  const r = await rects(page);
  expect(r.top!.bottom).toBeLessThanOrEqual(r.vh);
});

test("R6 top CTA inside first viewport when arriving as a paid visit (long query)", async ({ page }) => {
  await page.goto(PAGE + "?utm_source=facebook&utm_medium=paid&utm_campaign=x&fbclid=abc");
  const r = await rects(page);
  expect(r.top!.bottom).toBeLessThanOrEqual(r.vh);
});

for (const placement of ["top", "bottom", "sticky"] as const) {
  test(`R7 ${placement} CTA click lands on / with #signup in viewport`, async ({ page }, testInfo) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    const vw = page.viewportSize()!.width;
    if (placement === "sticky") {
      test.skip(!isMobile(vw), "sticky is mobile only");
      // scroll to a qualifying position
      const pos = await findQualifyingScroll(page);
      expect(pos, "a scroll offset where top CTA is above and bottom CTA below must exist on mobile").not.toBeNull();
      await page.evaluate((y) => window.scrollTo(0, y), pos!);
      await expect.poll(() => stickyShown(page)).toBe(true);
      const box = (await page.getByTestId("sample-report-cta-sticky").boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      const loc = page.getByTestId(`sample-report-cta-${placement}`);
      await loc.scrollIntoViewIfNeeded();
      await loc.click();
    }
    await page.waitForURL(/\/\?.*#signup$/);
    const u = new URL(page.url());
    expect(u.pathname).toBe("/");
    expect(u.hash).toBe("#signup");
    expect(u.searchParams.get("utm_source")).toBe("site");
    expect(u.searchParams.get("utm_medium")).toBe("sample-report");
    expect(u.searchParams.get("utm_content")).toBe(
      placement === "sticky" ? "sticky-mobile" : `${placement}-cta`
    );
    const signup = page.locator("#signup");
    await expect(signup).toHaveCount(1);
    await expect.poll(async () => {
      const b = await signup.boundingBox();
      const vh = page.viewportSize()!.height;
      if (!b) return false;
      return b.y < vh && b.y + b.height > 0;
    }, { timeout: 8000 }).toBe(true);
  });
}

test("R7 paid visit click forwards query and still lands on #signup", async ({ page }) => {
  await page.goto(PAGE + "?utm_source=facebook&utm_content=adZ&fbclid=ABC");
  await dismissCookies(page);
  await page.reload();
  await page.waitForLoadState("networkidle");
  const cta = page.getByTestId("sample-report-cta-top");
  await expect(cta).toHaveAttribute("href", "/?utm_source=facebook&utm_content=adZ&fbclid=ABC#signup");
  await cta.click();
  await page.waitForURL(/#signup$/);
  const u = new URL(page.url());
  expect(u.searchParams.get("utm_content")).toBe("adZ");
  expect(u.searchParams.get("utm_source")).toBe("facebook");
  await expect(page.locator("#signup")).toHaveCount(1);
});

async function findQualifyingScroll(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const t = document.querySelector('[data-testid="sample-report-cta-top"]') as HTMLElement;
    const b = document.querySelector('[data-testid="sample-report-cta-bottom"]') as HTMLElement;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    // COMFORTABLE position: top CTA >=150px above the viewport, bottom CTA >=600px below it.
    for (let y = 0; y <= max; y += 20) {
      window.scrollTo(0, y);
      const tr = t.getBoundingClientRect(), br = b.getBoundingClientRect();
      if (tr.bottom <= -150 && br.top >= vh + 600) { window.scrollTo(0, 0); return y; }
    }
    window.scrollTo(0, 0);
    return null;
  });
}

test("R8 desktop: sticky never visible at any scroll offset", async ({ page }) => {
  const vw = page.viewportSize()!.width;
  test.skip(isMobile(vw), "desktop only");
  await page.goto(PAGE);
  await dismissCookies(page);
  await page.reload();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 250) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(60);
    expect(await stickyShown(page), `sticky visible on desktop at y=${y}`).toBe(false);
  }
});

test.describe("R8 mobile sticky behaviour", () => {
  test.beforeEach(({ page }) => {
    test.skip(!isMobile(page.viewportSize()!.width), "mobile only");
  });

  test("hidden on first paint (even before hydration idle) and at top", async ({ page }) => {
    await dismissCookies(page).catch(() => {});
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload({ waitUntil: "commit" });
    expect(await stickyShown(page)).toBe(false);
    await page.waitForLoadState("networkidle");
    expect(await stickyShown(page)).toBe(false);
  });

  test("a qualifying scroll position exists on mobile (top above, bottom below)", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    expect(await findQualifyingScroll(page)).not.toBeNull();
  });

  test("scroll sweep: sticky visible ONLY when top fully above AND bottom fully below; visible in the comfortable middle", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const bad: string[] = [];
    const missing: string[] = [];
    const early: string[] = [];
    let hideMargin: number | null = null;
    for (let y = 0; y <= max; y += 40) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(80);
      const r = await rects(page);
      const qualifies = r.top!.bottom <= 0 && r.bottom!.top >= r.vh;
      const actual = await stickyShown(page);
      if (actual && !qualifies) bad.push(`y=${y} VISIBLE but topBottom=${r.top!.bottom} bottomTop=${r.bottom!.top} vh=${r.vh}`);
      const comfortable = r.top!.bottom <= -150 && r.bottom!.top >= r.vh + 600;
      if (comfortable && !actual) missing.push(`y=${y} HIDDEN in comfortable zone`);
      if (!actual && r.top!.bottom <= 0 && r.bottom!.top > r.vh + 2) early.push(`y=${y} HIDDEN but bottomCtaTop=${r.bottom!.top} (${Math.round(r.bottom!.top - r.vh)}px below viewport) topBottom=${r.top!.bottom}`);
      if (!actual && qualifies && r.top!.bottom < -150) hideMargin = Math.max(hideMargin ?? 0, r.bottom!.top - r.vh < 0 ? 0 : r.vh && (r.bottom!.top - r.vh));
    }
    console.log("OBSERVATION: sticky hides early when bottom CTA is within " + hideMargin + "px below viewport");
    expect(early, "R15 sticky hid while bottom CTA still fully below viewport:\n" + early.join("\n")).toEqual([]);
    expect(bad, bad.join("\n")).toEqual([]);
    expect(missing, missing.join("\n")).toEqual([]);
  });

  test("jump straight to page end (past bottom CTA) -> hidden", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const pos = await findQualifyingScroll(page);
    await page.evaluate((y) => window.scrollTo(0, y), pos!);
    await expect.poll(() => stickyShown(page)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const r = await rects(page);
    if (r.bottom!.bottom <= 0) {
      expect(await stickyShown(page), "scrolled past bottom CTA, sticky must hide").toBe(false);
    }
  });

  test("cookie banner showing: sticky hidden at qualifying position, banner button never covered; Got it reveals sticky", async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    const gotIt = page.getByRole("button", { name: /got it/i });
    await expect(gotIt).toBeVisible();
    const pos = await findQualifyingScroll(page);
    expect(pos).not.toBeNull();
    await page.evaluate((y) => window.scrollTo(0, y), pos!);
    await page.waitForTimeout(500);
    expect(await stickyShown(page), "sticky must be hidden while banner showing").toBe(false);
    // banner button must be the hit-test target at its center at several scroll offsets
    for (const y of [0, pos!, pos! + 200]) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(150);
      const covered = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) => /got it/i.test(b.textContent || ""))!;
        const r = btn.getBoundingClientRect();
        const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + r.width * 0.25, r.top + r.height / 2], [r.left + r.width * 0.75, r.top + r.height / 2]];
        return pts.map(([x, yy]) => {
          const hit = document.elementFromPoint(x, yy);
          return !(hit && (btn === hit || btn.contains(hit)));
        }).some(Boolean);
      });
      expect(covered, `banner button covered at scrollY=${y}`).toBe(false);
    }
    await page.evaluate((y) => window.scrollTo(0, y), pos!);
    await page.waitForTimeout(200);
    await gotIt.click();
    await expect(gotIt).toBeHidden();
    await expect.poll(() => stickyShown(page), { timeout: 3000 }).toBe(true);
  });

  test("banner dismissal while at top: sticky stays hidden until scroll qualifies", async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /got it/i }).click();
    await page.waitForTimeout(300);
    expect(await stickyShown(page)).toBe(false);
    const pos = await findQualifyingScroll(page);
    await page.evaluate((y) => window.scrollTo(0, y), pos!);
    await expect.poll(() => stickyShown(page)).toBe(true);
  });

  test("sticky does not cover the bottom CTA or the footer content when visible (no overlap with bottom CTA)", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const pos = await findQualifyingScroll(page);
    await page.evaluate((y) => window.scrollTo(0, y), pos!);
    await expect.poll(() => stickyShown(page)).toBe(true);
    // scroll so bottom CTA is entering from below: sticky must have gone before bottom CTA could be covered
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    for (let y = pos!; y <= max; y += 25) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(50);
      const covered = await page.evaluate(() => {
        const b = document.querySelector('[data-testid="sample-report-cta-bottom"]')!.getBoundingClientRect();
        if (b.bottom <= 0 || b.top >= window.innerHeight) return false;
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !!hit && !!hit.closest('[data-testid="sample-report-cta-sticky"]');
      });
      expect(covered, `bottom CTA covered by sticky at y=${y}`).toBe(false);
    }
  });
});

test.describe("R15 sticky near bottom CTA / page end", () => {
  test.beforeEach(({ page }) => {
    test.skip(!isMobile(page.viewportSize()!.width), "mobile only");
  });

  test("sticky visible when bottom CTA top edge is 1..190px below viewport", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const bad: string[] = [];
    let probed = 0;
    for (const gap of [1, 20, 60, 100, 150, 190]) {
      const ok = await page.evaluate((g) => {
        const b = document.querySelector('[data-testid="sample-report-cta-bottom"]') as HTMLElement;
        const y = window.scrollY + b.getBoundingClientRect().top - window.innerHeight - g;
        window.scrollTo(0, y);
        const br = b.getBoundingClientRect();
        const t = document.querySelector('[data-testid="sample-report-cta-top"]')!.getBoundingClientRect();
        return t.bottom <= 0 && Math.abs(br.top - window.innerHeight - g) <= 1.5;
      }, gap);
      if (!ok) continue; // position unreachable (page too short / clamped)
      probed++;
      await page.waitForTimeout(250);
      if (!(await stickyShown(page))) bad.push(`gap=${gap}px: sticky hidden`);
    }
    expect(probed, "at least one gap position must be reachable").toBeGreaterThan(0);
    expect(bad, bad.join("\n")).toEqual([]);
  });

  test("at very bottom of page the sticky does not cover the last footer text", async ({ page }) => {
    await page.goto(PAGE);
    await dismissCookies(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    const res = await page.evaluate(() => {
      // last element with own visible text, in document order
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let last: Element | null = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || !(n.textContent || "").trim()) continue;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        if (cs.display === "none" || cs.visibility === "hidden" || b.width === 0 || b.height === 0) continue;
        if (el.closest('[data-testid="sample-report-cta-sticky"]')) continue;
        last = el;
      }
      if (!last) return { found: false } as any;
      const lb = last.getBoundingClientRect();
      const st = document.querySelector('[data-testid="sample-report-cta-sticky"]') as HTMLElement | null;
      let stTop: number | null = null;
      if (st) {
        const sb = st.getBoundingClientRect();
        let shown = sb.width > 0 && sb.height > 0;
        for (let n: HTMLElement | null = st; n && shown; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) shown = false;
        }
        if (shown) stTop = sb.top;
      }
      return { found: true, text: (last.textContent || "").trim().slice(0, 60), lastBottom: lb.bottom, vh: window.innerHeight, stTop };
    });
    expect(res.found).toBe(true);
    if (res.stTop !== null) {
      expect(res.lastBottom, `last text "${res.text}" bottom=${res.lastBottom} is under sticky top=${res.stTop}`).toBeLessThanOrEqual(res.stTop + 1);
    }
  });
});
