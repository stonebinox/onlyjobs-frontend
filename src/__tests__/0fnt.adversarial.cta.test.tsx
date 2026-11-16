/**
 * 0fnt ADVERSARIAL: /sample-match-report CTAs + sticky bar (R1-R5, R8, R10, R11).
 * Real Chakra (ChakraProvider with the app theme), real CookieConsent, real cookieConsent util.
 * Only boundaries mocked: next/router, next/head, next/link, trackEvent, trackPixelEvent.
 * Oracle: bd task requirements only.
 */
import React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";

jest.mock("next/router", () => ({
  useRouter: () => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const query: Record<string, string> = {};
    new URLSearchParams(search).forEach((v, k) => { query[k] = v; });
    return {
      push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(),
      pathname: "/sample-match-report", query,
      asPath: "/sample-match-report" + search,
      events: { on: jest.fn(), off: jest.fn() }, isReady: true,
    };
  },
}));
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href: typeof href === "string" ? href : href?.pathname, ...rest }, children),
}));
jest.mock("@/utils/analytics", () => ({
  ...jest.requireActual("@/utils/analytics"),
  trackEvent: jest.fn(),
}));
jest.mock("@/lib/metaPixel", () => ({
  ...jest.requireActual("@/lib/metaPixel"),
  trackPixelEvent: jest.fn(),
  trackPixelCustomEvent: jest.fn(),
}));

import theme from "@/theme/theme";
import { trackEvent } from "@/utils/analytics";
import { trackPixelEvent } from "@/lib/metaPixel";
import { CONSENT_KEY } from "@/utils/cookieConsent";
import { CookieConsent } from "@/components/CookieConsent";
import SampleMatchReportPage from "@/pages/sample-match-report";

const LABEL = "Get my first matches, $2 free →";
const ORG = (c: string) => `/?utm_source=site&utm_medium=sample-report&utm_content=${c}#signup`;
const VH = 844;

// ---------- controllable IntersectionObserver ----------
type Obs = {
  cb: IntersectionObserverCallback; opts: any; targets: Set<Element>;
  last: Map<Element, string>;
};
let observers: Obs[] = [];
let rectOf: (el: Element) => { top: number; bottom: number; height: number } = () => ({ top: 0, bottom: 0, height: 0 });

function mkRect(r: { top: number; bottom: number; height: number }): DOMRect {
  return { top: r.top, bottom: r.bottom, left: 0, right: 100, width: 100, height: r.height, x: 0, y: r.top, toJSON() {} } as DOMRect;
}
function entryFor(el: Element): IntersectionObserverEntry {
  const r = rectOf(el);
  const vis = Math.max(0, Math.min(r.bottom, VH) - Math.max(r.top, 0));
  const ratio = r.height > 0 ? vis / r.height : 0;
  const isIntersecting = r.bottom > 0 && r.top < VH && vis > 0;
  return {
    target: el, isIntersecting, intersectionRatio: ratio, time: Date.now(),
    boundingClientRect: mkRect(r), intersectionRect: mkRect(r),
    rootBounds: { top: 0, bottom: VH, left: 0, right: 390, width: 390, height: VH, x: 0, y: 0, toJSON() {} } as DOMRect,
  } as IntersectionObserverEntry;
}
function fireIO() {
  act(() => {
    observers.forEach((o) => {
      const thresholds: number[] = ([] as number[]).concat(o.opts?.threshold ?? [0]);
      const entries: IntersectionObserverEntry[] = [];
      o.targets.forEach((el) => {
        const e = entryFor(el);
        const key = e.isIntersecting + ":" + thresholds.filter((t) => e.intersectionRatio >= t && (t > 0 || e.isIntersecting)).length;
        if (o.last.get(el) !== key) { o.last.set(el, key); entries.push(e); }
      });
      if (entries.length) o.cb(entries, {} as IntersectionObserver);
    });
    window.dispatchEvent(new Event("scroll"));
  });
}
// rAF queue: a real browser runs rAF callbacks before the next paint; jsdom tests must flush them explicitly.
let rafQueue: Array<{ id: number; cb: FrameRequestCallback }> = [];
let rafId = 0;
function flushFrames() {
  act(() => {
    for (let i = 0; i < 50 && rafQueue.length; i++) {
      const q = rafQueue; rafQueue = [];
      q.forEach((f) => f.cb(performance.now()));
    }
  });
}
class MockIO {
  o: Obs;
  constructor(cb: IntersectionObserverCallback, opts?: any) {
    this.o = { cb, opts, targets: new Set(), last: new Map() };
    observers.push(this.o);
  }
  observe(el: Element) { this.o.targets.add(el); }
  unobserve(el: Element) { this.o.targets.delete(el); }
  disconnect() { this.o.targets.clear(); }
  takeRecords() { return []; }
}

// Layout: top CTA at page y=300..360, bottom CTA at page y=3000..3060.
const TOP_Y = 300, BOT_Y = 3000, H = 60;
function setScroll(y: number) {
  const topA = screen.getByTestId("sample-report-cta-top");
  const botA = screen.getByTestId("sample-report-cta-bottom");
  rectOf = (el) => {
    const inTop = topA.contains(el) || el.contains(topA);
    const inBot = botA.contains(el) || el.contains(botA);
    if (inTop && inBot) return { top: TOP_Y - y, bottom: BOT_Y + H - y, height: BOT_Y + H - TOP_Y };
    if (inTop) return { top: TOP_Y - y, bottom: TOP_Y + H - y, height: H };
    if (inBot) return { top: BOT_Y - y, bottom: BOT_Y + H - y, height: H };
    return { top: 0, bottom: 0, height: 0 };
  };
  fireIO();
  flushFrames();
}
const Y_TOP_VISIBLE = 0;
const Y_MIDDLE = 1500;            // top far above, bottom far below
const Y_TOP_PARTIAL = TOP_Y + 30; // top half above the viewport top
const Y_TOP_JUST_GONE = TOP_Y + H + 5;
const Y_BOTTOM_PARTIAL = BOT_Y - VH + 30; // bottom CTA 30px into viewport bottom
const Y_PAST_BOTTOM = BOT_Y + H + 50;

// ---------- helpers ----------
function isHiddenByStyle(el: Element | null): boolean {
  for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
    const cs = window.getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return true;
    if ((n as HTMLElement).hidden) return true;
    if (cs.pointerEvents === "none" && n.getAttribute("data-testid") === "sample-report-cta-sticky") return true;
    if (/translateY\(\s*100%/.test(cs.transform || "") || /translate3d\([^,]*,\s*100%/.test(cs.transform || "")) return true;
  }
  return false;
}
function stickyShown(): boolean {
  flushFrames(); // assertions observe state after the frame (what the user sees painted)
  const el = screen.queryByTestId("sample-report-cta-sticky");
  return !!el && !isHiddenByStyle(el);
}
function renderPage(url = "/sample-match-report", withBanner = false) {
  window.history.replaceState({}, "", url);
  return render(
    <ChakraProvider theme={theme}>
      <SampleMatchReportPage />
      {withBanner ? <CookieConsent /> : null}
    </ChakraProvider>
  );
}
const href = (id: string) => screen.getByTestId(id).getAttribute("href");
const errors: any[] = [];
const onErr = (e: any) => { errors.push(e); e.preventDefault?.(); };

beforeEach(() => {
  observers = [];
  rectOf = () => ({ top: 0, bottom: 0, height: 0 });
  rafQueue = []; rafId = 0;
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => { rafQueue.push({ id: ++rafId, cb }); return rafId; };
  (window as any).cancelAnimationFrame = (id: number) => { rafQueue = rafQueue.filter((f) => f.id !== id); };
  (global as any).requestAnimationFrame = (window as any).requestAnimationFrame;
  (global as any).cancelAnimationFrame = (window as any).cancelAnimationFrame;
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const r = rectOf(this);
    return { ...mkRect(r), width: r.height > 0 ? 100 : 0, right: r.height > 0 ? 100 : 0 } as DOMRect;
  });
  (window as any).IntersectionObserver = MockIO;
  (global as any).IntersectionObserver = MockIO;
  Object.defineProperty(window, "innerHeight", { configurable: true, value: VH });
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  (window as any).scrollTo = jest.fn();
  localStorage.clear(); sessionStorage.clear();
  (trackEvent as jest.Mock).mockReset(); (trackPixelEvent as jest.Mock).mockReset();
  errors.length = 0;
  window.addEventListener("error", onErr);
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  window.removeEventListener("error", onErr);
  cleanup();
  jest.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

// =====================================================================================
describe("R1 three single-anchor CTAs", () => {
  it.each(["top", "bottom", "sticky"])("%s: exactly one element with testid, it is an <a>, label exact", (p) => {
    renderPage();
    const all = screen.getAllByTestId(`sample-report-cta-${p}`, { hidden: true } as any);
    expect(all).toHaveLength(1);
    const a = all[0];
    expect(a.tagName).toBe("A");
    expect(a.textContent!.replace(/\s+/g, " ").trim()).toBe(LABEL);
  });
  it.each(["top", "bottom", "sticky"])("%s: no nested anchors/buttons and not wrapped in a/button", (p) => {
    renderPage();
    const a = screen.getByTestId(`sample-report-cta-${p}`);
    expect(a.querySelector("a, button")).toBeNull();
    expect(a.parentElement!.closest("a, button")).toBeNull();
  });
  it("label uses U+2192 arrow, not ascii ->", () => {
    renderPage();
    for (const p of ["top", "bottom", "sticky"]) {
      const t = screen.getByTestId(`sample-report-cta-${p}`).textContent!;
      expect(t).toContain("→");
      expect(t).not.toContain("->");
    }
  });
});

describe("R2 organic hrefs", () => {
  it.each([["top", "top-cta"], ["bottom", "bottom-cta"], ["sticky", "sticky-mobile"]])("%s", (p, c) => {
    renderPage();
    expect(href(`sample-report-cta-${p}`)).toBe(ORG(c));
  });
  it("query before hash, never '/#signup?'", () => {
    renderPage();
    for (const p of ["top", "bottom", "sticky"]) {
      const h = href(`sample-report-cta-${p}`)!;
      expect(h).not.toContain("#signup?");
      expect(h.indexOf("?")).toBeLessThan(h.indexOf("#"));
    }
  });
  it("unrelated query params (?ref=newsletter) still organic", () => {
    renderPage("/sample-match-report?ref=newsletter");
    expect(href("sample-report-cta-top")).toBe(ORG("top-cta"));
    expect(href("sample-report-cta-bottom")).toBe(ORG("bottom-cta"));
    expect(href("sample-report-cta-sticky")).toBe(ORG("sticky-mobile"));
  });
});

describe("R3 paid: forward query unchanged", () => {
  const cases = [
    "?utm_source=facebook&utm_medium=paid_social&utm_campaign=spring%20sale&utm_content=ad_7&fbclid=IwAR0abc",
    "?fbclid=IwAR0only",
    "?utm_medium=cpc",
    "?utm_content=creativeA",
    "?foo=bar&utm_term=x%2Fy+z&fbclid=Q1&zzz=1",
    "?fbclid=A&utm_source=site&utm_content=top-cta",
  ];
  it.each(cases)("every CTA forwards %s verbatim", async (q) => {
    renderPage("/sample-match-report" + q);
    await act(async () => {});
    for (const p of ["top", "bottom", "sticky"]) {
      expect(href(`sample-report-cta-${p}`)).toBe("/" + q + "#signup");
    }
  });
  it("ad's utm_content is not overwritten and utm_source=site absent", async () => {
    renderPage("/sample-match-report?utm_source=facebook&utm_content=adX");
    await act(async () => {});
    for (const p of ["top", "bottom", "sticky"]) {
      const h = href(`sample-report-cta-${p}`)!;
      expect(h).toContain("utm_content=adX");
      expect(h).not.toContain("utm_source=site");
      expect(h).not.toMatch(/utm_content=(top|bottom)-cta|sticky-mobile/);
      expect(h.match(/utm_content/g)).toHaveLength(1);
    }
  });
});

describe("R4 click tracking", () => {
  it.each([["top", "top"], ["bottom", "bottom"], ["sticky", "sticky_mobile"]])("%s: one event each, exact payload, not prevented", (p, placement) => {
    renderPage();
    (trackEvent as jest.Mock).mockClear(); (trackPixelEvent as jest.Mock).mockClear();
    const proceeded = fireEvent.click(screen.getByTestId(`sample-report-cta-${p}`));
    expect(proceeded).toBe(true);
    const ev = (trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === "sample_match_report_cta_click");
    expect(ev).toHaveLength(1);
    expect(ev[0][1]).toStrictEqual({ placement });
    const lead = (trackPixelEvent as jest.Mock).mock.calls.filter((c) => c[0] === "Lead");
    expect(lead).toHaveLength(1);
    expect(lead[0][1]).toStrictEqual({ placement });
    expect(Object.keys(ev[0][1])).toEqual(["placement"]);
  });
  it("no click-type events on render, scroll or visibility changes", () => {
    renderPage();
    const noClick = () => {
      expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === "sample_match_report_cta_click")).toHaveLength(0);
      expect((trackPixelEvent as jest.Mock).mock.calls.filter((c) => c[0] === "Lead")).toHaveLength(0);
    };
    noClick();
    setScroll(Y_TOP_VISIBLE); setScroll(Y_MIDDLE); setScroll(Y_BOTTOM_PARTIAL); setScroll(Y_PAST_BOTTOM); setScroll(Y_MIDDLE);
    noClick();
  });
  it("two clicks yield exactly two events (no double-fire per click)", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === "sample_match_report_cta_click")).toHaveLength(2);
  });
  it("trackers that THROW never block the click or surface an error", () => {
    renderPage();
    (trackEvent as jest.Mock).mockImplementation(() => { throw new Error("ph down"); });
    (trackPixelEvent as jest.Mock).mockImplementation(() => { throw new Error("fb down"); });
    for (const p of ["top", "bottom", "sticky"]) {
      let proceeded = false;
      expect(() => { proceeded = fireEvent.click(screen.getByTestId(`sample-report-cta-${p}`)); }).not.toThrow();
      expect(proceeded).toBe(true);
    }
    expect(errors).toHaveLength(0);
  });
  it("throwing trackEvent does not prevent the Lead pixel (independent failure)", () => {
    renderPage();
    (trackEvent as jest.Mock).mockImplementation(() => { throw new Error("ph down"); });
    fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    expect((trackPixelEvent as jest.Mock).mock.calls.filter((c) => c[0] === "Lead")).toHaveLength(1);
  });
  it("paid visit: payload still exactly {placement}, no href/url/fbclid (R10)", async () => {
    renderPage("/sample-match-report?utm_source=fb&fbclid=SECRETCLICK");
    await act(async () => {});
    fireEvent.click(screen.getByTestId("sample-report-cta-bottom"));
    const all = JSON.stringify([...(trackEvent as jest.Mock).mock.calls, ...(trackPixelEvent as jest.Mock).mock.calls]);
    expect(all).not.toContain("SECRETCLICK");
    expect(all).not.toMatch(/href|url|email|fbclid/i);
    const ev = (trackEvent as jest.Mock).mock.calls.find((c) => c[0] === "sample_match_report_cta_click")!;
    expect(ev[1]).toStrictEqual({ placement: "bottom" });
  });
});

describe("R5 copy", () => {
  it("bottom heading, body, microcopy, and top helper text", () => {
    const { container } = renderPage();
    const txt = (container.textContent || "").replace(/\s+/g, " ");
    expect(txt).toContain("Want to see your own 3 jobs, and what you might not like about them?");
    expect(txt).toContain("No card needed. About 6 match days free.");
    expect(txt).toContain("No card needed.");
    // top helper must exist separately from the bottom microcopy:
    const occurrences = txt.split("No card needed.").length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});

describe("R8 sticky: hidden by default", () => {
  it("not visible on first render before any observer callback", () => {
    renderPage();
    expect(stickyShown()).toBe(false);
  });
  it("hidden in server-rendered markup", () => {
    const util = require("util");
    (global as any).TextEncoder = (global as any).TextEncoder || util.TextEncoder;
    (global as any).TextDecoder = (global as any).TextDecoder || util.TextDecoder;
    const { renderToString } = require("react-dom/server");
    window.history.replaceState({}, "", "/sample-match-report");
    const html = renderToString(
      <ChakraProvider theme={theme}><SampleMatchReportPage /></ChakraProvider>
    );
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const el = host.querySelector('[data-testid="sample-report-cta-sticky"]');
    expect(el === null || isHiddenByStyle(el)).toBe(true);
    host.remove();
  });
  it("sticky link is aria-hidden and tabIndex -1", () => {
    renderPage();
    const a = screen.getByTestId("sample-report-cta-sticky");
    expect(a.getAttribute("aria-hidden")).toBe("true");
    expect(a.getAttribute("tabindex")).toBe("-1");
  });
});

describe("R8 sticky visibility matrix (banner dismissed)", () => {
  beforeEach(() => { localStorage.setItem(CONSENT_KEY, "1"); });
  it("top visible -> hidden", () => {
    renderPage(); setScroll(Y_TOP_VISIBLE);
    expect(stickyShown()).toBe(false);
  });
  it("top PARTIALLY above viewport -> hidden (must be FULLY above)", () => {
    renderPage(); setScroll(Y_TOP_PARTIAL);
    expect(stickyShown()).toBe(false);
  });
  it("middle (top fully above, bottom fully below) -> visible", () => {
    renderPage(); setScroll(Y_MIDDLE);
    expect(stickyShown()).toBe(true);
  });
  it("top just fully gone -> visible", () => {
    renderPage(); setScroll(Y_TOP_JUST_GONE);
    expect(stickyShown()).toBe(true);
  });
  it("bottom CTA partially in view -> hidden", () => {
    renderPage(); setScroll(Y_BOTTOM_PARTIAL);
    expect(stickyShown()).toBe(false);
  });
  it("scrolled PAST bottom CTA -> hidden", () => {
    renderPage(); setScroll(Y_PAST_BOTTOM);
    expect(stickyShown()).toBe(false);
  });
  it("full path: hidden -> visible -> hidden -> visible -> hidden", () => {
    renderPage();
    setScroll(Y_TOP_VISIBLE); expect(stickyShown()).toBe(false);
    setScroll(Y_MIDDLE); expect(stickyShown()).toBe(true);
    setScroll(Y_BOTTOM_PARTIAL); expect(stickyShown()).toBe(false);
    setScroll(Y_MIDDLE); expect(stickyShown()).toBe(true);
    // realistic scroll: passes THROUGH the bottom CTA before going past it
    setScroll(Y_BOTTOM_PARTIAL); expect(stickyShown()).toBe(false);
    setScroll(Y_PAST_BOTTOM); expect(stickyShown()).toBe(false);
    setScroll(Y_TOP_VISIBLE); expect(stickyShown()).toBe(false);
  });
  // EDGE: jump (End key / scrollTo / fast fling) from "bottom CTA below" to "bottom CTA above" in one frame.
  // A real IntersectionObserver fires NO callback when isIntersecting stays false, so an impl that trusts
  // only the last callback keeps the sticky visible while scrolled PAST the bottom CTA (violates R8).
  it("EDGE jump: middle -> past bottom in one frame (no intermediate intersect) -> hidden", () => {
    renderPage(); setScroll(Y_MIDDLE); expect(stickyShown()).toBe(true);
    setScroll(Y_PAST_BOTTOM);
    expect(stickyShown()).toBe(false);
  });
});

describe("R8 sticky + real cookie banner", () => {
  it("banner showing -> hidden even when scroll qualifies; 'Got it' reveals without reload", async () => {
    renderPage("/sample-match-report", true);
    await act(async () => {});
    const btn = screen.queryByRole("button", { name: /got it/i });
    expect(btn).not.toBeNull(); // harness validity: banner is really showing
    setScroll(Y_MIDDLE);
    expect(stickyShown()).toBe(false);
    fireEvent.click(btn!);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: /got it/i })).toBeNull();
    expect(stickyShown()).toBe(true);
  });
  it("banner dismissed while scroll does NOT qualify -> stays hidden", async () => {
    renderPage("/sample-match-report", true);
    await act(async () => {});
    setScroll(Y_TOP_VISIBLE);
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    await act(async () => {});
    expect(stickyShown()).toBe(false);
  });
  it("after dismissal scrolling past the bottom hides it again", async () => {
    renderPage("/sample-match-report", true);
    await act(async () => {});
    setScroll(Y_MIDDLE);
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    await act(async () => {});
    expect(stickyShown()).toBe(true);
    setScroll(Y_BOTTOM_PARTIAL);
    setScroll(Y_PAST_BOTTOM);
    expect(stickyShown()).toBe(false);
  });
  it("banner already dismissed on load (persisted) -> sticky can show", async () => {
    localStorage.setItem(CONSENT_KEY, "1");
    renderPage("/sample-match-report", true);
    await act(async () => {});
    setScroll(Y_MIDDLE);
    expect(stickyShown()).toBe(true);
  });
});

describe("R8 IntersectionObserver unavailable", () => {
  it("sticky stays hidden under every scroll state", async () => {
    localStorage.setItem(CONSENT_KEY, "1");
    delete (window as any).IntersectionObserver;
    delete (global as any).IntersectionObserver;
    renderPage();
    await act(async () => {});
    expect(stickyShown()).toBe(false);
    const topA = screen.getByTestId("sample-report-cta-top");
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return topA.contains(this) ? mkRect({ top: -500, bottom: -440, height: 60 }) : mkRect({ top: 5000, bottom: 5060, height: 60 });
    });
    act(() => { window.dispatchEvent(new Event("scroll")); window.dispatchEvent(new Event("resize")); });
    expect(stickyShown()).toBe(false);
  });
  it("page still renders with working CTAs", () => {
    delete (window as any).IntersectionObserver;
    delete (global as any).IntersectionObserver;
    expect(() => renderPage()).not.toThrow();
    expect(href("sample-report-cta-top")).toBe(ORG("top-cta"));
  });
});

describe("R11 storage blocked", () => {
  function block() {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
  }
  it("page renders and CTAs click+track without crash", () => {
    block();
    expect(() => renderPage()).not.toThrow();
    for (const p of ["top", "bottom", "sticky"]) {
      expect(screen.getByTestId(`sample-report-cta-${p}`).tagName).toBe("A");
    }
    const proceeded = fireEvent.click(screen.getByTestId("sample-report-cta-top"));
    expect(proceeded).toBe(true);
    expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === "sample_match_report_cta_click")).toHaveLength(1);
  });
  it("isConsentBannerShowing() does not throw when storage is blocked", () => {
    block();
    const { isConsentBannerShowing } = require("@/utils/cookieConsent");
    expect(() => isConsentBannerShowing()).not.toThrow();
  });
  it("page alone with storage blocked: scrolling through all states does not throw", async () => {
    block();
    renderPage();
    await act(async () => {});
    expect(() => { setScroll(Y_MIDDLE); setScroll(Y_BOTTOM_PARTIAL); setScroll(Y_PAST_BOTTOM); }).not.toThrow();
    expect(errors).toHaveLength(0);
  });
  // The cookie banner is mounted app-wide in _app next to the page: if it crashes on blocked storage the
  // page crashes too (R11: "the sample report page must still render").
  it("page + CookieConsent (as in _app) both mount with storage blocked", async () => {
    block();
    expect(() => renderPage("/sample-match-report", true)).not.toThrow();
    await act(async () => {});
    expect(errors).toHaveLength(0);
  });
  it("paid page with storage blocked still forwards query and hrefs", async () => {
    block();
    renderPage("/sample-match-report?utm_source=fb&fbclid=Z");
    await act(async () => {});
    expect(href("sample-report-cta-top")).toBe("/?utm_source=fb&fbclid=Z#signup");
  });
});
