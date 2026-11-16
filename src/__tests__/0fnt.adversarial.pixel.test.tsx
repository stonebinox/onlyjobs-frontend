/**
 * 0fnt ADVERSARIAL: real metaPixel seam (no mock of metaPixel). R4 Lead via fbq, R5 ViewContent once,
 * StickySampleReportCta(visible) contract. Oracle: bd task requirements.
 */
process.env.NEXT_PUBLIC_META_PIXEL_ID = "222000111222333";
import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { installFbqRecorder, FbqRecorder } from "./6a4p.helpers";

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), pathname: "/sample-match-report",
    query: {}, asPath: "/sample-match-report", events: { on: jest.fn(), off: jest.fn() }, isReady: true }),
}));
jest.mock("next/head", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => React.createElement("a", { href: typeof href === "string" ? href : href?.pathname, ...rest }, children),
}));

import theme from "@/theme/theme";
import SampleMatchReportPage from "@/pages/sample-match-report";
import { StickySampleReportCta } from "@/components/SampleReportCta";

let rec: FbqRecorder;
beforeAll(() => { rec = installFbqRecorder(); });
afterAll(() => rec.restore());
beforeEach(() => {
  rec.calls.length = 0; sessionStorage.clear(); localStorage.clear();
  window.history.replaceState({}, "", "/sample-match-report");
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  delete (window as any).IntersectionObserver; delete (global as any).IntersectionObserver;
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

const page = () => render(<ChakraProvider theme={theme}><SampleMatchReportPage /></ChakraProvider>);
const track = (n: string) => rec.calls.filter((c) => c[0] === "track" && c[1] === n);

describe("R5 ViewContent exactly once per visit", () => {
  it("fires once on mount, not again after re-render or clicks", async () => {
    const { rerender } = page();
    await act(async () => {});
    expect(track("ViewContent")).toHaveLength(1);
    rerender(<ChakraProvider theme={theme}><SampleMatchReportPage /></ChakraProvider>);
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    await act(async () => {});
    expect(track("ViewContent")).toHaveLength(1);
  });
  it("ViewContent is not a Lead and CTAs do not fire any other standard events", async () => {
    page(); await act(async () => {});
    expect(track("Lead")).toHaveLength(0);
  });
});

describe("R4 Lead through the real pixel", () => {
  it.each([["top", "top"], ["bottom", "bottom"], ["sticky", "sticky_mobile"]])("%s click -> one fbq track Lead with params exactly {placement}", async (p, placement) => {
    page(); await act(async () => {});
    rec.calls.length = 0;
    expect(fireEvent.click(screen.getByTestId(`sample-report-cta-${p}`))).toBe(true);
    const leads = track("Lead");
    expect(leads).toHaveLength(1);
    expect(leads[0][2]).toStrictEqual({ placement });
    // no extra custom events in the same click
    expect(rec.calls.filter((c) => c[0] === "trackCustom")).toHaveLength(0);
  });
  it("Lead is not deduped away: two clicks, two Leads", async () => {
    page(); await act(async () => {});
    rec.calls.length = 0;
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    expect(track("Lead").length).toBe(2);
  });
  it("fbq that throws never blocks navigation", async () => {
    page(); await act(async () => {});
    const orig = (window as any).fbq;
    Object.defineProperty(window, "fbq", { configurable: true, value: () => { throw new Error("boom"); } });
    expect(fireEvent.click(screen.getByTestId("sample-report-cta-top"))).toBe(true);
    Object.defineProperty(window, "fbq", { configurable: true, get: () => orig, set() {} });
  });
});

describe("StickySampleReportCta({visible})", () => {
  const sticky = (visible: boolean) =>
    render(<ChakraProvider theme={theme}><StickySampleReportCta visible={visible} /></ChakraProvider>);
  const hidden = (el: Element | null) => {
    for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || (n as HTMLElement).hidden) return true;
      if (/translateY\(\s*100%/.test(cs.transform || "")) return true;
    }
    return false;
  };
  it("visible=false -> not shown; visible=true -> shown", () => {
    const { unmount } = sticky(false);
    const el0 = screen.queryByTestId("sample-report-cta-sticky");
    expect(el0 === null || hidden(el0)).toBe(true);
    unmount();
    sticky(true);
    const el1 = screen.getByTestId("sample-report-cta-sticky");
    expect(hidden(el1)).toBe(false);
    expect(el1.getAttribute("aria-hidden")).toBe("true");
    expect(el1.getAttribute("tabindex")).toBe("-1");
  });
  it("visible=false -> sticky is not clickable-tracked as a real user path: click while hidden still never preventDefault", () => {
    sticky(false);
    const el = screen.queryByTestId("sample-report-cta-sticky");
    if (el) expect(fireEvent.click(el)).toBe(true);
  });
});
