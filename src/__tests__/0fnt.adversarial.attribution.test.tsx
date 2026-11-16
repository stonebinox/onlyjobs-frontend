/**
 * 0fnt ADVERSARIAL: attribution under blocked storage (R12), click-time href correctness (R13),
 * storage-probe residue (R14). Real Chakra, real page. Mocked boundaries only:
 * next/router, next/head, next/link, trackEvent, trackPixelEvent, IntersectionObserver (inert).
 * Oracle: bd task requirements R12-R14 only.
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
jest.mock("next/head", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
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
import SampleMatchReportPage from "@/pages/sample-match-report";

const IDS = ["sample-report-cta-top", "sample-report-cta-bottom", "sample-report-cta-sticky"] as const;
const CONTENT: Record<string, string> = {
  "sample-report-cta-top": "top-cta",
  "sample-report-cta-bottom": "bottom-cta",
  "sample-report-cta-sticky": "sticky-mobile",
};
const ORG = (id: string) => `/?utm_source=site&utm_medium=sample-report&utm_content=${CONTENT[id]}#signup`;
const PAID_Q = "?utm_source=facebook&utm_medium=paid_social&utm_campaign=spring%20sale&fbclid=IwAR0abc";

// ---------- storage blocking helpers ----------
const lsDesc = Object.getOwnPropertyDescriptor(window, "localStorage");
function blockLocalStorageAccess() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() { throw new DOMException("The operation is insecure.", "SecurityError"); },
  });
}
function restoreLocalStorage() {
  if (lsDesc) Object.defineProperty(window, "localStorage", lsDesc);
  else delete (window as any).localStorage;
}
function blockCookiesSilently() {
  Object.defineProperty(document, "cookie", { configurable: true, get: () => "", set: () => {} });
}
function blockCookiesThrowing() {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get() { throw new DOMException("denied", "SecurityError"); },
    set() { throw new DOMException("denied", "SecurityError"); },
  });
}
function restoreCookies() { delete (document as any).cookie; }
function clearRealCookies() {
  document.cookie.split(";").forEach((c) => {
    const n = c.split("=")[0].trim();
    if (n) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

// ---------- page helpers ----------
class InertIO {
  constructor(_cb: any, _o?: any) {}
  observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
}
async function mount(query = "") {
  window.history.replaceState({}, "", "/sample-match-report" + query);
  const r = render(
    <ChakraProvider theme={theme}>
      <SampleMatchReportPage />
    </ChakraProvider>
  );
  await act(async () => { await Promise.resolve(); await new Promise((res) => setTimeout(res, 0)); });
  return r;
}
const href = (id: string) => screen.getByTestId(id).getAttribute("href");

beforeEach(() => {
  (window as any).IntersectionObserver = InertIO;
  (global as any).IntersectionObserver = InertIO;
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  (window as any).scrollTo = jest.fn();
  localStorage.clear(); sessionStorage.clear(); clearRealCookies();
  (trackEvent as jest.Mock).mockReset(); (trackPixelEvent as jest.Mock).mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  restoreLocalStorage(); restoreCookies();
  localStorage.clear(); clearRealCookies();
  window.history.replaceState({}, "", "/");
});

// =====================================================================================
describe("R12 organic + storage matrix", () => {
  describe.each([
    ["localStorage access throws + cookies silently blocked", () => { blockLocalStorageAccess(); blockCookiesSilently(); }],
    ["localStorage access throws + cookie access throws", () => { blockLocalStorageAccess(); blockCookiesThrowing(); }],
    ["Storage.prototype methods throw + cookies silently blocked", () => {
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
      jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
      blockCookiesSilently();
    }],
    ["localStorage setItem throws (quota) + cookies silently blocked", () => {
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
      blockCookiesSilently();
    }],
    ["localStorage silently drops writes + cookies silently blocked", () => {
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
      blockCookiesSilently();
    }],
  ])("both blocked: %s", (_n, block) => {
    it.each(IDS)("organic: %s href is exactly /#signup", async (id) => {
      block();
      await mount();
      expect(href(id)).toBe("/#signup");
    });
    it("organic: no CTA anywhere contains utm_", async () => {
      block();
      await mount();
      IDS.forEach((id) => {
        expect(href(id)).not.toMatch(/utm_/);
        expect(href(id)).not.toContain("utm_source=site");
      });
    });
    it("organic with only unrelated params (?ref=nl): still /#signup, ref not forwarded", async () => {
      block();
      await mount("?ref=nl");
      IDS.forEach((id) => expect(href(id)).toBe("/#signup"));
    });
    it("paid (full ad query): forwards unchanged", async () => {
      block();
      await mount(PAID_Q);
      IDS.forEach((id) => expect(href(id)).toBe(`/${PAID_Q}#signup`));
    });
    it("paid (fbclid only): forwards unchanged", async () => {
      block();
      await mount("?fbclid=IwAR0only");
      IDS.forEach((id) => expect(href(id)).toBe("/?fbclid=IwAR0only#signup"));
    });
    it("paid (single utm_campaign only, no fbclid): forwards unchanged", async () => {
      block();
      await mount("?utm_campaign=solo");
      IDS.forEach((id) => expect(href(id)).toBe("/?utm_campaign=solo#signup"));
    });
  });

  it("localStorage throws, cookies WORK: organic UTM form stays, per-placement utm_content", async () => {
    blockLocalStorageAccess();
    await mount();
    IDS.forEach((id) => expect(href(id)).toBe(ORG(id)));
  });
  it("localStorage throws (Storage.prototype), cookies WORK: organic UTM form stays", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await mount();
    IDS.forEach((id) => expect(href(id)).toBe(ORG(id)));
  });
  it("cookies silently blocked, localStorage WORKS: organic UTM form stays", async () => {
    blockCookiesSilently();
    await mount();
    IDS.forEach((id) => expect(href(id)).toBe(ORG(id)));
  });
  it("cookie access throws, localStorage WORKS: organic UTM form stays", async () => {
    blockCookiesThrowing();
    await mount();
    IDS.forEach((id) => expect(href(id)).toBe(ORG(id)));
  });
  it("both WORK: organic UTM form (baseline)", async () => {
    await mount();
    IDS.forEach((id) => expect(href(id)).toBe(ORG(id)));
  });
  it("paid with only localStorage blocked: forwards unchanged", async () => {
    blockLocalStorageAccess();
    await mount(PAID_Q);
    IDS.forEach((id) => expect(href(id)).toBe(`/${PAID_Q}#signup`));
  });
  it("paid with only cookies blocked: forwards unchanged", async () => {
    blockCookiesSilently();
    await mount(PAID_Q);
    IDS.forEach((id) => expect(href(id)).toBe(`/${PAID_Q}#signup`));
  });
  it("both blocked organic: page does not crash and still renders all three CTAs", async () => {
    blockLocalStorageAccess(); blockCookiesThrowing();
    await mount();
    IDS.forEach((id) => expect(screen.getByTestId(id)).toBeTruthy());
  });
});

// =====================================================================================
describe("R13 click-time correctness", () => {
  function recordClick(id: string) {
    const a = screen.getByTestId(id) as HTMLAnchorElement;
    let hrefAtDefault: string | null = null;
    let prevented: boolean | null = null;
    const l = (e: Event) => {
      if (a.contains(e.target as Node)) { hrefAtDefault = a.getAttribute("href"); prevented = e.defaultPrevented; }
    };
    // bubble phase on window: runs after React's root listener and any anchor handler.
    window.addEventListener("click", l, false);
    const notPrevented = fireEvent.click(a);
    window.removeEventListener("click", l, false);
    return { hrefAtDefault, prevented, notPrevented };
  }

  describe.each([
    ["storage working", () => {}],
    ["both storage blocked", () => { blockLocalStorageAccess(); blockCookiesSilently(); }],
    ["only cookies blocked", () => { blockCookiesSilently(); }],
    ["only localStorage blocked", () => { blockLocalStorageAccess(); }],
  ])("paid visitor, %s", (_n, block) => {
    it.each(IDS)("%s: href forced back to organic is the forwarded paid form at click default-action time", async (id) => {
      block();
      await mount(PAID_Q);
      const a = screen.getByTestId(id);
      a.setAttribute("href", ORG(id)); // simulate click before post-mount update
      const r = recordClick(id);
      expect(r.hrefAtDefault).toBe(`/${PAID_Q}#signup`);
      expect(r.prevented).toBe(false);
      expect(r.notPrevented).toBe(true);
    });
    it("paid fbclid-only: forced-organic href corrected at click", async () => {
      block();
      await mount("?fbclid=IwAR0only");
      screen.getByTestId(IDS[0]).setAttribute("href", ORG(IDS[0]));
      const r = recordClick(IDS[0]);
      expect(r.hrefAtDefault).toBe("/?fbclid=IwAR0only#signup");
      expect(r.notPrevented).toBe(true);
    });
  });

  it("paid: forced to a garbage href is still corrected (not only organic->paid special-case)", async () => {
    await mount(PAID_Q);
    screen.getByTestId(IDS[1]).setAttribute("href", "/#wrong");
    const r = recordClick(IDS[1]);
    expect(r.hrefAtDefault).toBe(`/${PAID_Q}#signup`);
  });

  it("paid: second click after correction still correct and still not prevented", async () => {
    await mount(PAID_Q);
    const id = IDS[0];
    screen.getByTestId(id).setAttribute("href", ORG(id));
    recordClick(id);
    screen.getByTestId(id).setAttribute("href", ORG(id));
    const r = recordClick(id);
    expect(r.hrefAtDefault).toBe(`/${PAID_Q}#signup`);
    expect(r.notPrevented).toBe(true);
  });

  it("organic visitor click does NOT get a forwarded query; href stays the placement's organic form", async () => {
    await mount();
    IDS.forEach((id) => {
      const r = recordClick(id);
      expect(r.hrefAtDefault).toBe(ORG(id));
      expect(r.notPrevented).toBe(true);
    });
  });

  it("organic visitor, both storage blocked: click leaves /#signup", async () => {
    blockLocalStorageAccess(); blockCookiesSilently();
    await mount();
    IDS.forEach((id) => {
      const r = recordClick(id);
      expect(r.hrefAtDefault).toBe("/#signup");
      expect(r.notPrevented).toBe(true);
    });
  });

  it.each(IDS)("%s tracking payloads unchanged on paid forced-organic click: exactly one of each", async (id) => {
    await mount(PAID_Q);
    screen.getByTestId(id).setAttribute("href", ORG(id));
    recordClick(id);
    const te = (trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === "sample_match_report_cta_click");
    expect(te).toHaveLength(1);
    expect(te[0][1]).toEqual({ placement: expect.any(String) });
    expect(Object.keys(te[0][1])).toEqual(["placement"]);
    const lead = (trackPixelEvent as jest.Mock).mock.calls.filter((c) => c[0] === "Lead");
    expect(lead).toHaveLength(1);
    expect(Object.keys(lead[0][1])).toEqual(["placement"]);
    expect(lead[0][1].placement).toBe(te[0][1].placement);
    expect(JSON.stringify([te, lead])).not.toMatch(/fbclid|utm_|href|http/i);
  });

  it("placements are distinct across top/bottom/sticky in tracking payloads", async () => {
    await mount(PAID_Q);
    IDS.forEach((id) => recordClick(id));
    const placements = (trackEvent as jest.Mock).mock.calls
      .filter((c) => c[0] === "sample_match_report_cta_click").map((c) => c[1].placement);
    expect(new Set(placements).size).toBe(3);
  });

  it("a throwing tracker (made to throw AFTER mount) does not stop the click-time href correction or preventDefault", async () => {
    await mount(PAID_Q);
    (trackEvent as jest.Mock).mockImplementation(() => { throw new Error("boom"); });
    (trackPixelEvent as jest.Mock).mockImplementation(() => { throw new Error("boom"); });
    const id = IDS[0];
    screen.getByTestId(id).setAttribute("href", ORG(id));
    const onErr = (e: any) => { e.preventDefault?.(); };
    window.addEventListener("error", onErr);
    const r = recordClick(id);
    window.removeEventListener("error", onErr);
    expect(r.hrefAtDefault).toBe(`/${PAID_Q}#signup`);
    expect(r.notPrevented).toBe(true);
  });
});

// =====================================================================================
describe("R14 storage probing leaves no residue", () => {
  const ALLOWED = [/^chakra-ui-color-mode$/ /* harness ChakraProvider, not the app */, /^oj_meta_click$/, /^oj_cookie_consent$/, /first.?touch/i, /attrib/i];
  const allowed = (k: string) => k === CONSENT_KEY || ALLOWED.some((re) => re.test(k));
  const lsKeys = () => Object.keys(localStorage).sort();
  const cookieNames = () => document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean).sort();

  function expectNoExtras(before: { ls: string[]; ck: string[] }, label: string) {
    const newLs = lsKeys().filter((k) => !before.ls.includes(k));
    const newCk = cookieNames().filter((k) => !before.ck.includes(k));
    const extras = [...newLs.filter((k) => !allowed(k)).map((k) => "localStorage:" + k),
                    ...newCk.filter((k) => !allowed(k)).map((k) => "cookie:" + k)];
    // Reported for the findings log:
    // eslint-disable-next-line no-console
    process.stdout.write(`[R14 ${label}] new ls=${JSON.stringify(newLs)} new cookies=${JSON.stringify(newCk)}\n`);
    expect(extras).toEqual([]);
  }

  it.each([["organic", ""], ["paid", PAID_Q]])("%s mount, empty storage: only documented keys appear", async (_n, q) => {
    const before = { ls: lsKeys(), ck: cookieNames() };
    await mount(q);
    expectNoExtras(before, "mount-" + _n);
  });

  it("organic mount then click on every CTA: still only documented keys", async () => {
    const before = { ls: lsKeys(), ck: cookieNames() };
    await mount();
    IDS.forEach((id) => fireEvent.click(screen.getByTestId(id)));
    expectNoExtras(before, "organic-click");
  });

  it("paid mount then click: still only documented keys", async () => {
    const before = { ls: lsKeys(), ck: cookieNames() };
    await mount(PAID_Q);
    IDS.forEach((id) => fireEvent.click(screen.getByTestId(id)));
    expectNoExtras(before, "paid-click");
  });

  it("pre-existing unrelated keys/cookies are untouched (not removed, not modified)", async () => {
    localStorage.setItem("pre_existing_ls", "keepme");
    document.cookie = "pre_existing_ck=keepme; path=/";
    await mount();
    expect(localStorage.getItem("pre_existing_ls")).toBe("keepme");
    expect(document.cookie).toContain("pre_existing_ck=keepme");
  });

  it("cookies blocked / localStorage works: no extra localStorage keys", async () => {
    blockCookiesSilently();
    const before = lsKeys();
    await mount();
    const extras = lsKeys().filter((k) => !before.includes(k) && !allowed(k));
    expect(extras).toEqual([]);
  });

  it("localStorage blocked / cookies work: no extra cookies", async () => {
    blockLocalStorageAccess();
    const before = cookieNames();
    await mount();
    const extras = cookieNames().filter((k) => !before.includes(k) && !allowed(k));
    expect(extras).toEqual([]);
  });

  it("probing leaves no value-less or empty-named leftovers (e.g. 'test=1' / '__probe__')", async () => {
    await mount();
    [...lsKeys(), ...cookieNames()].forEach((k) => {
      expect(k).not.toMatch(/^(__)?(probe|test|tmp|temp|check)/i);
    });
  });
});
