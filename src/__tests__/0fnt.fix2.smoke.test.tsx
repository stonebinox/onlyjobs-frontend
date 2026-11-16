/**
 * Smoke test - onlyjobs-0fnt fix pass 2 (G1b): storage-blocked organic href, click-time href sync.
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
});

it("B1: organic CTA href is /#signup when localStorage and cookies are both unusable", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(Document.prototype, "cookie", "get").mockReturnValue("");
  jest.spyOn(Document.prototype, "cookie", "set").mockImplementation(() => {});
  render(<SampleMatchReportPage />);
  expect(screen.getByTestId("sample-report-cta-top").getAttribute("href")).toBe("/#signup");
  expect(screen.getByTestId("sample-report-cta-bottom").getAttribute("href")).toBe("/#signup");
});

it("N1: click syncs a paid href before navigation even if the effect has not applied it", () => {
  window.history.pushState({}, "", "/sample-match-report?utm_source=fb&fbclid=abc");
  render(<SampleMatchReportPage />);
  const a = screen.getByTestId("sample-report-cta-top");
  a.setAttribute("href", "/?utm_source=site&utm_medium=sample-report&utm_content=top-cta#signup");
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  a.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(false);
  expect(a.getAttribute("href")).toBe("/?utm_source=fb&fbclid=abc#signup");
});
