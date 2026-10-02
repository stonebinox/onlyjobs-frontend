/**
 * Smoke tests for first-touch attribution (onlyjobs-akb Phase 2a).
 * Minimal: prove compilation + happy path. Adversarial suite is a separate pass.
 */
export {};

const LS_KEY = "oj_first_touch";

function mockLocation(search: string, pathname = "/landing"): void {
  Object.defineProperty(window, "location", {
    value: {
      search,
      pathname,
      host: "localhost",
      href: `http://localhost${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

function mockDocumentReferrer(referrer: string): void {
  Object.defineProperty(document, "referrer", {
    value: referrer,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  // Reset localStorage and cookies between tests
  localStorage.clear();
  Object.defineProperty(document, "cookie", {
    value: "",
    writable: true,
    configurable: true,
  });
  // Reset module-level in-memory state by resetting modules
  jest.resetModules();
});

describe("captureFirstTouch / getFirstTouch", () => {
  it("captures utm_source from URL and stores it", async () => {
    mockLocation("?utm_source=reddit");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();
    const ft = getFirstTouch();

    expect(ft).not.toBeNull();
    expect(ft?.utmSource).toBe("reddit");
    expect(ft?.landingPath).toBe("/landing");
    expect(ft?.firstSeenAt).toBeDefined();
  });

  it("second captureFirstTouch with different utm does NOT overwrite", async () => {
    mockLocation("?utm_source=reddit");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch(); // first touch: reddit
    const firstCapture = getFirstTouch();
    expect(firstCapture?.utmSource).toBe("reddit");

    // Simulate navigating to a page with different utm
    mockLocation("?utm_source=google");
    captureFirstTouch(); // should be a no-op

    const afterSecond = getFirstTouch();
    expect(afterSecond?.utmSource).toBe("reddit"); // still reddit
  });

  it("returns null when nothing was captured", async () => {
    const { getFirstTouch } = await import("@/utils/attribution");
    expect(getFirstTouch()).toBeNull();
  });

  it("buildAttributionPayload returns undefined when nothing captured", async () => {
    const { buildAttributionPayload } = await import("@/utils/attribution");
    expect(buildAttributionPayload()).toBeUndefined();
  });

  it("buildAttributionPayload returns the first-touch object when captured", async () => {
    mockLocation("?utm_source=newsletter&utm_campaign=summer");
    mockDocumentReferrer("");

    const { captureFirstTouch, buildAttributionPayload } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();
    const payload = buildAttributionPayload();

    expect(payload).toBeDefined();
    expect(payload?.utmSource).toBe("newsletter");
    expect(payload?.utmCampaign).toBe("summer");
  });
});
