/**
 * Smoke test - onlyjobs-0fnt: sample report CTAs. Adversarial suite authored separately.
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import SampleMatchReportPage from "@/pages/sample-match-report";
import { trackEvent } from "@/utils/analytics";
import { trackPixelEvent } from "@/lib/metaPixel";

jest.mock("next/head", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), pathname: "/sample-match-report" }) }));
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/metaPixel", () => ({ trackPixelEvent: jest.fn() }));

const ORGANIC = (c: string) => `/?utm_source=site&utm_medium=sample-report&utm_content=${c}#signup`;

beforeEach(() => jest.clearAllMocks());

it("renders top, bottom and sticky CTAs with organic hrefs", () => {
  render(<SampleMatchReportPage />);
  expect(screen.getByTestId("sample-report-cta-top").getAttribute("href")).toBe(ORGANIC("top-cta"));
  expect(screen.getByTestId("sample-report-cta-bottom").getAttribute("href")).toBe(ORGANIC("bottom-cta"));
  expect(screen.getByTestId("sample-report-cta-sticky").getAttribute("href")).toBe(ORGANIC("sticky-mobile"));
});

it("fires no CTA events on render and exactly one pair per click, without preventDefault", () => {
  render(<SampleMatchReportPage />);
  expect(trackEvent).not.toHaveBeenCalled();
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  screen.getByTestId("sample-report-cta-top").dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(false);
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith("sample_match_report_cta_click", { placement: "top" });
  expect(trackPixelEvent).toHaveBeenCalledWith("Lead", { placement: "top" });
});

it("still does not prevent navigation when trackers throw", () => {
  (trackEvent as jest.Mock).mockImplementation(() => {
    throw new Error("boom");
  });
  render(<SampleMatchReportPage />);
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  screen.getByTestId("sample-report-cta-bottom").dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(false);
  expect(trackPixelEvent).toHaveBeenCalledWith("Lead", { placement: "bottom" });
});

it("forwards the landing query string unchanged for paid visitors", () => {
  window.history.pushState({}, "", "/sample-match-report?utm_source=fb&utm_content=creative1&fbclid=abc");
  render(<SampleMatchReportPage />);
  expect(screen.getByTestId("sample-report-cta-top").getAttribute("href")).toBe(
    "/?utm_source=fb&utm_content=creative1&fbclid=abc#signup"
  );
  window.history.pushState({}, "", "/");
});

it("keeps the bottom CTA label", () => {
  render(<SampleMatchReportPage />);
  fireEvent.click(screen.getByTestId("sample-report-cta-bottom"));
  expect(screen.getByTestId("sample-report-cta-bottom").textContent).toBe("Get my first matches, $2 free →");
});
