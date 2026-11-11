import React from "react";
import { render } from "@testing-library/react";

jest.mock("next/router", () => ({
  useRouter: () => ({ events: { on: jest.fn(), off: jest.fn() } }),
}));
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock("next/script", () => ({ __esModule: true, default: () => null }));
jest.mock("@chakra-ui/react", () => ({
  __esModule: true,
  ChakraProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/theme/theme", () => ({ __esModule: true, default: {} }));
jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/contexts/GuideContext", () => ({
  GuideProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/utils/analytics", () => ({ initAnalytics: jest.fn(), trackPageView: jest.fn() }));
jest.mock("@/components/CookieConsent", () => ({ CookieConsent: () => null }));

type Fbq = jest.Mock & { disablePushState?: boolean; queue: unknown[][] };
const w = window as unknown as { fbq?: Fbq; _fbq?: unknown };

// Fresh registry per mount so the pixel's init-once state does not leak between tests;
// React is pinned so the freshly required _app shares the renderer's copy.
const mountApp = () => {
  jest.resetModules();
  jest.doMock("react", () => React);
  const App = require("@/pages/_app").default;
  return render(<App Component={() => <div>stub</div>} pageProps={{}} router={{} as never} />);
};

const pixelScripts = () => document.querySelectorAll('script[src*="fbevents.js"]');

beforeEach(() => {
  delete w.fbq;
  delete w._fbq;
  document.head.innerHTML = "";
  sessionStorage.clear();
  localStorage.clear();
  window.history.pushState({}, "", "/");
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
});

describe("meta pixel in _app", () => {
  it("makes no pixel request and defines no fbq when the pixel id is unset", () => {
    mountApp();
    expect(w.fbq).toBeUndefined();
    expect(pixelScripts()).toHaveLength(0);
  });

  it("loads the pixel with push-state and autoConfig disabled before init, then fires PageView", () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
    mountApp();
    expect(pixelScripts()).toHaveLength(1);
    expect(w.fbq?.disablePushState).toBe(true);
    const calls = (w.fbq as Fbq).queue.map((a) => a.slice(0, 2).join(":"));
    expect(calls).toEqual(["set:autoConfig", "init:123456789012345", "track:PageView"]);
  });

  it("does not load the pixel on a denylisted route", () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
    window.history.pushState({}, "", "/reset-password?token=abc");
    mountApp();
    expect(w.fbq).toBeUndefined();
    expect(pixelScripts()).toHaveLength(0);
  });
});

describe("meta click store", () => {
  it("captures a valid fbclid once and exposes it with a constructed fbc", () => {
    window.history.pushState({}, "", "/?fbclid=abc123");
    mountApp();
    const stored = JSON.parse(localStorage.getItem("oj_meta_click") as string);
    expect(stored.fbclid).toBe("abc123");
    expect(stored.fbc).toMatch(/^fb\.1\.\d+\.abc123$/);
  });
});

describe("event dedup", () => {
  it("passes eventID as the fourth argument and fires a given id once", () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
    jest.resetModules();
    const mod: typeof import("@/lib/metaPixel") = require("@/lib/metaPixel");
    mod.trackPixelEvent("CompleteRegistration", {}, "reg_1");
    mod.trackPixelEvent("CompleteRegistration", {}, "reg_1");
    const fired = (w.fbq as Fbq).queue.filter((a) => a[1] === "CompleteRegistration");
    expect(fired).toHaveLength(1);
    expect(fired[0]).toEqual(["track", "CompleteRegistration", {}, { eventID: "reg_1" }]);
  });
});
