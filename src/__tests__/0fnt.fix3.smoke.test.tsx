/**
 * Smoke test - onlyjobs-0fnt fix pass 3: K1 (sticky geometry refs are the buttons),
 * K2 (metaClick in-memory fallback when writes silently fail).
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SampleMatchReportPage from "@/pages/sample-match-report";

jest.mock("next/head", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), pathname: "/sample-match-report" }) }));
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/metaPixel", () => ({ trackPixelEvent: jest.fn() }));

afterEach(() => {
  jest.restoreAllMocks();
  window.history.pushState({}, "", "/");
  localStorage.clear();
});

it("K1: IntersectionObserver observes the top and bottom CTA buttons, not their sections", () => {
  const observed: Element[] = [];
  const original = (window as any).IntersectionObserver;
  (window as any).IntersectionObserver = class {
    observe(el: Element) {
      observed.push(el);
    }
    disconnect() {}
    unobserve() {}
  };
  try {
    render(<SampleMatchReportPage />);
  } finally {
    (window as any).IntersectionObserver = original;
  }
  expect(observed).toContain(screen.getByTestId("sample-report-cta-top"));
  expect(observed).toContain(screen.getByTestId("sample-report-cta-bottom"));
  expect(observed).toHaveLength(2);
});

function freshMetaClick(): typeof import("../utils/metaClick") {
  let m!: typeof import("../utils/metaClick");
  jest.isolateModules(() => {
    m = require("../utils/metaClick");
  });
  return m;
}

it("K2: returns the in-memory click when setItem and cookie writes silently do nothing", () => {
  const m = freshMetaClick();
  window.history.pushState({}, "", "/?fbclid=SilentFail1");
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
  jest.spyOn(Document.prototype, "cookie", "get").mockReturnValue("");
  jest.spyOn(Document.prototype, "cookie", "set").mockImplementation(() => {});
  m.captureMetaClick();
  window.history.pushState({}, "", "/");
  expect(m.getMetaClickPayload()?.fbclid).toBe("SilentFail1");
});

it("K2: returns the in-memory click when setItem throws (quota) and cookie is blocked", () => {
  const m = freshMetaClick();
  window.history.pushState({}, "", "/?fbclid=Quota1");
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  jest.spyOn(Document.prototype, "cookie", "get").mockReturnValue("");
  jest.spyOn(Document.prototype, "cookie", "set").mockImplementation(() => {});
  m.captureMetaClick();
  window.history.pushState({}, "", "/");
  expect(m.getMetaClickPayload()?.fbclid).toBe("Quota1");
});

it("K2: does NOT leak the in-memory click after a persisted capture was cleared", () => {
  const m = freshMetaClick();
  window.history.pushState({}, "", "/?fbclid=Persisted1");
  m.captureMetaClick();
  expect(m.getMetaClickPayload()?.fbclid).toBe("Persisted1");
  window.history.pushState({}, "", "/");
  localStorage.clear();
  document.cookie = "oj_meta_click=; max-age=0; path=/";
  expect(m.getMetaClickPayload()?.fbclid).toBeUndefined();
});
