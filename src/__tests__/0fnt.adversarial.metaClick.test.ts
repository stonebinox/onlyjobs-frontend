/**
 * 0fnt ADVERSARIAL: metaClick in-memory fallback (R9). Black-box via the contract only.
 * Oracle: bd task requirements R9, never the implementation.
 */
type Mod = typeof import("../utils/metaClick");
const T0 = Date.UTC(2026, 10, 1, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function load(): Mod {
  let m!: Mod;
  jest.isolateModules(() => {
    m = require("../utils/metaClick");
  });
  return m;
}
const setUrl = (u: string) => window.history.replaceState({}, "", u);
function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const n = c.split("=")[0].trim();
    if (n) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}
function breakStorage() {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get() { throw new Error("blocked"); },
    set() { throw new Error("blocked"); },
  });
}
function fixStorage() {
  jest.restoreAllMocks();
  delete (document as any).cookie;
}

beforeEach(() => {
  jest.useFakeTimers({ now: T0 });
  localStorage.clear();
  clearCookies();
  setUrl("/");
});
afterEach(() => {
  fixStorage();
  jest.useRealTimers();
  setUrl("/");
  clearCookies();
});

describe("R9 in-memory fallback when localStorage AND cookie both throw", () => {
  it("harness validity: breakStorage really makes localStorage and document.cookie throw", () => {
    breakStorage();
    expect(() => localStorage.getItem("a")).toThrow();
    expect(() => localStorage.setItem("a", "b")).toThrow();
    expect(() => document.cookie).toThrow();
    expect(() => { document.cookie = "a=b"; }).toThrow();
  });

  it("capture does not throw", () => {
    const m = load();
    setUrl("/sample-match-report?fbclid=ABC123");
    breakStorage();
    expect(() => m.captureMetaClick()).not.toThrow();
  });

  it("payload still has the fbclid after the URL lost it", () => {
    const m = load();
    setUrl("/sample-match-report?fbclid=ABC123");
    breakStorage();
    m.captureMetaClick();
    setUrl("/");
    const p = m.getMetaClickPayload();
    expect(p).toBeDefined();
    expect(p!.fbclid).toBe("ABC123");
  });

  it("fbc has the form fb.1.<ms>.<fbclid> with ms near now", () => {
    const m = load();
    setUrl("/x?fbclid=ZZtop9");
    breakStorage();
    m.captureMetaClick();
    setUrl("/");
    const p = m.getMetaClickPayload()!;
    const mm = /^fb\.1\.(\d+)\.ZZtop9$/.exec(p.fbc ?? "");
    expect(mm).not.toBeNull();
    expect(Math.abs(Number(mm![1]) - T0)).toBeLessThan(5000);
  });

  it("getMetaClickPayload itself does not throw when storage throws and nothing was captured", () => {
    const m = load();
    breakStorage();
    expect(() => m.getMetaClickPayload()).not.toThrow();
    expect(m.getMetaClickPayload()).toBeUndefined();
  });

  it("no fbclid in URL: nothing captured even with broken storage", () => {
    const m = load();
    setUrl("/x?utm_source=a");
    breakStorage();
    m.captureMetaClick();
    expect(m.getMetaClickPayload()).toBeUndefined();
  });
});

describe("R9 storage working: behaviour unchanged", () => {
  it("stores under localStorage oj_meta_click and sets a cookie", () => {
    const m = load();
    setUrl("/x?fbclid=ABC123");
    m.captureMetaClick();
    expect(localStorage.getItem("oj_meta_click")).toContain("ABC123");
    expect(document.cookie).toContain("ABC123");
    setUrl("/");
    expect(m.getMetaClickPayload()!.fbclid).toBe("ABC123");
  });

  it("set-once: a second, different fbclid does not overwrite", () => {
    const m = load();
    setUrl("/x?fbclid=FIRST");
    m.captureMetaClick();
    setUrl("/y?fbclid=SECOND");
    m.captureMetaClick();
    expect(m.getMetaClickPayload()!.fbclid).toBe("FIRST");
    expect(m.getMetaClickPayload()!.fbc!.endsWith(".FIRST")).toBe(true);
  });

  it("no leak: after storage is cleared (and working) the old click is NOT resurrected from memory", () => {
    const m = load();
    setUrl("/x?fbclid=OLDCLICK");
    m.captureMetaClick();
    setUrl("/");
    localStorage.clear();
    clearCookies();
    expect(m.getMetaClickPayload()).toBeUndefined();
  });

  it("no leak (cookie only cleared + localStorage cleared) via a fresh capture of a new click returns the NEW one", () => {
    const m = load();
    setUrl("/x?fbclid=OLDCLICK");
    m.captureMetaClick();
    localStorage.clear();
    clearCookies();
    setUrl("/x?fbclid=NEWCLICK");
    m.captureMetaClick();
    expect(m.getMetaClickPayload()!.fbclid).toBe("NEWCLICK");
  });

  it("7-day TTL: still valid at 6 days, gone at 8 days", () => {
    const m = load();
    setUrl("/x?fbclid=TTLCLICK");
    m.captureMetaClick();
    setUrl("/");
    jest.setSystemTime(T0 + 6 * DAY);
    expect(m.getMetaClickPayload()?.fbclid).toBe("TTLCLICK");
    jest.setSystemTime(T0 + 8 * DAY);
    expect(m.getMetaClickPayload()).toBeUndefined();
  });

  it("no fbclid: capture is a no-op", () => {
    const m = load();
    m.captureMetaClick();
    expect(m.getMetaClickPayload()).toBeUndefined();
    expect(localStorage.getItem("oj_meta_click")).toBeNull();
  });
});

describe("R16 in-memory fallback when writes fail or are silently dropped (reads work)", () => {
  function silentCookies() {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() { return ""; },
      set() { /* silently ignored */ },
    });
  }
  function quotaStorage() {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
  }
  function noopStorage() {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
  }

  it("setItem throws QuotaExceededError + cookie writes dropped: capture does not throw, fbclid survives URL change", () => {
    const m = load();
    setUrl("/sample-match-report?fbclid=QUOTA1");
    quotaStorage();
    silentCookies();
    expect(() => m.captureMetaClick()).not.toThrow();
    setUrl("/");
    const p = m.getMetaClickPayload();
    expect(p).toBeDefined();
    expect(p!.fbclid).toBe("QUOTA1");
    expect(/^fb\.1\.\d+\.QUOTA1$/.test(p!.fbc ?? "")).toBe(true);
  });

  it("setItem silent no-op + cookie writes dropped: fbclid survives URL change", () => {
    const m = load();
    setUrl("/sample-match-report?fbclid=NOOP1");
    noopStorage();
    silentCookies();
    m.captureMetaClick();
    setUrl("/");
    const p = m.getMetaClickPayload();
    expect(p).toBeDefined();
    expect(p!.fbclid).toBe("NOOP1");
    expect(/^fb\.1\.\d+\.NOOP1$/.test(p!.fbc ?? "")).toBe(true);
  });

  it("counter-test: working storage, capture, then clear storage + cookies -> undefined (no leaked memory)", () => {
    const m = load();
    setUrl("/x?fbclid=LEAK1");
    m.captureMetaClick();
    setUrl("/");
    expect(m.getMetaClickPayload()?.fbclid).toBe("LEAK1");
    localStorage.clear();
    clearCookies();
    expect(m.getMetaClickPayload()).toBeUndefined();
  });
});
