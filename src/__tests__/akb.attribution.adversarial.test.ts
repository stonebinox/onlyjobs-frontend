/**
 * ADVERSARIAL test suite — onlyjobs-akb attribution, frontend.
 * Oracle: the contract and requirement spec — NOT the implementation.
 * Do NOT weaken a failing test. Failures are FINDINGS.
 * Environment: jsdom (see jest.config.ts)
 *
 * Tests 8-11 from the adversarial brief.
 */
export {};

const LS_KEY = "oj_first_touch"; // from contract: localStorage key is 'oj_first_touch'

function mockLocation(
  search: string,
  pathname = "/landing",
  host = "onlyjobs.app"
): void {
  Object.defineProperty(window, "location", {
    value: {
      search,
      pathname,
      host,
      hostname: host.split(":")[0],
      href: `http://${host}${pathname}${search}`,
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
  // Clear localStorage between tests
  localStorage.clear();
  // Reset cookies
  // jsdom stores cookies per document; clear by expiring all
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }
  });
  // Reset module-level in-memory state by resetting modules
  jest.resetModules();
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 8: SET-ONCE — first call wins; later navigation must NOT overwrite
// Oracle: captureFirstTouch() is idempotent after first call
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 8: captureFirstTouch SET-ONCE semantics", () => {
  it("captures utm_source=reddit then utm_medium=social; second call with different source does NOT overwrite", async () => {
    mockLocation("?utm_source=reddit&utm_medium=social");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    // First capture
    captureFirstTouch();
    const afterFirst = getFirstTouch();

    // Oracle from spec: first call captures utm_source and utm_medium
    expect(afterFirst).not.toBeNull();
    expect(afterFirst?.utmSource).toBe("reddit");
    expect(afterFirst?.utmMedium).toBe("social");

    // Simulate navigation to a different page with different UTM
    mockLocation("?utm_source=google&utm_medium=cpc");

    // Second capture — spec says SET-ONCE, must be a no-op
    captureFirstTouch();

    const afterSecond = getFirstTouch();
    // Oracle: first-touch attribution MUST NOT be overwritten
    expect(afterSecond?.utmSource).toBe("reddit");
    expect(afterSecond?.utmMedium).toBe("social");
    expect(afterSecond?.utmSource).not.toBe("google");
  });

  it("SET-ONCE persists across getFirstTouch() calls — reading is non-destructive", async () => {
    mockLocation("?utm_source=newsletter");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();

    // Read multiple times — should always return the same value
    const read1 = getFirstTouch();
    const read2 = getFirstTouch();

    expect(read1?.utmSource).toBe("newsletter");
    expect(read2?.utmSource).toBe("newsletter");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 9: Own-host referrer NOT captured; landingPath still captured
// Oracle: "ignore if host is first-party/own host"
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 9: own-host referrer is not captured as referringDomain", () => {
  it("does not capture referringDomain when referrer host matches window.location.host", async () => {
    const ownHost = "onlyjobs.app";
    mockLocation("", "/jobs", ownHost);
    // Referrer is the same host — internal navigation
    mockDocumentReferrer(`http://${ownHost}/previous-page`);

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();
    const ft = getFirstTouch();

    // Oracle: own-host referrer must NOT appear as referringDomain
    expect(ft?.referringDomain).toBeUndefined();
    // But landingPath from window.location.pathname MUST still be captured
    expect(ft?.landingPath).toBe("/jobs");
  });

  it("captures referringDomain when referrer is a different host", async () => {
    mockLocation("", "/home", "onlyjobs.app");
    // External referrer — different host
    mockDocumentReferrer("https://twitter.com/some-post");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();
    const ft = getFirstTouch();

    // Oracle: external referrer -> referringDomain = hostname only
    expect(ft?.referringDomain).toBe("twitter.com");
    // landingPath still captured
    expect(ft?.landingPath).toBe("/home");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 10: buildAttributionPayload — JSON exceeding 2048 bytes → undefined
// Oracle: "if JSON byte size > 2048 return undefined"
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 10: buildAttributionPayload returns undefined when JSON > 2048 bytes", () => {
  it("returns undefined when stored first-touch JSON exceeds 2048 bytes", async () => {
    // Inject a large first-touch directly into localStorage, bypassing captureFirstTouch()
    // This ensures the oversized-payload path is exercised in buildAttributionPayload
    const oversizedFt = {
      utmSource: "x".repeat(500),
      utmMedium: "y".repeat(500),
      utmCampaign: "z".repeat(500),
      utmContent: "w".repeat(500),
      utmTerm: "v".repeat(500),
      landingPath: "/landing",
      firstSeenAt: new Date().toISOString(),
    };
    const json = JSON.stringify(oversizedFt);
    // Verify the test fixture itself exceeds 2048 bytes (oracle premise)
    expect(json.length).toBeGreaterThan(2048);

    localStorage.setItem(LS_KEY, json);

    const { buildAttributionPayload } = await import("@/utils/attribution");
    const result = buildAttributionPayload();

    // Oracle: JSON byte size > 2048 -> return undefined
    expect(result).toBeUndefined();
  });

  it("returns the first-touch object when JSON is within 2048 bytes", async () => {
    mockLocation("?utm_source=small");
    mockDocumentReferrer("");

    const { captureFirstTouch, buildAttributionPayload } = await import(
      "@/utils/attribution"
    );

    captureFirstTouch();
    const result = buildAttributionPayload();

    // Oracle: normal small payload -> defined
    expect(result).toBeDefined();
    expect(result?.utmSource).toBe("small");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 11: Fail-open — localStorage.setItem throws; captureFirstTouch must not throw
// Oracle: "Must never throw"; getFirstTouch returns data via cookie/in-memory OR null (never throw)
// ───────────────────────────────────────────────────────────────────────────
// Note: CASES 12-15 use dynamic mocking via jest.doMock + cleanup in afterEach.
// They are isolated from CASES 8-11 which use real module imports.
describe("CASE 11: fail-open when localStorage.setItem throws", () => {
  // Capture the REAL localStorage BEFORE any test replaces it.
  // Delegates in stubs reference realLocalStorage (not window.localStorage) to
  // avoid circular recursion when clear/getItem are called after the stub is set.
  let realLocalStorage: Storage;

  beforeEach(() => {
    realLocalStorage = window.localStorage;
  });

  afterEach(() => {
    // Restore the original to avoid leaking the stub into the outer beforeEach's
    // localStorage.clear() call, which would create infinite recursion.
    Object.defineProperty(window, "localStorage", {
      value: realLocalStorage,
      configurable: true,
      writable: true,
    });
  });

  it("captureFirstTouch does NOT throw when localStorage.setItem throws QuotaExceededError", async () => {
    // Delegate read/clear to realLocalStorage (captured above) — not window.localStorage,
    // which will point to THIS stub after Object.defineProperty below.
    const stubbedStorage = {
      getItem: (key: string) => realLocalStorage.getItem(key),
      setItem: (_key: string, _value: string): void => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      },
      removeItem: (key: string) => realLocalStorage.removeItem(key),
      clear: () => realLocalStorage.clear(),
      key: (index: number) => realLocalStorage.key(index),
      get length() { return realLocalStorage.length; },
    };

    Object.defineProperty(window, "localStorage", {
      value: stubbedStorage,
      configurable: true,
      writable: true,
    });

    mockLocation("?utm_source=failopen");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import(
      "@/utils/attribution"
    );

    // Oracle: captureFirstTouch must never throw
    expect(() => captureFirstTouch()).not.toThrow();

    // Oracle: getFirstTouch must never throw; should return data via in-memory/cookie OR null
    let result: ReturnType<typeof getFirstTouch> | undefined;
    expect(() => {
      result = getFirstTouch();
    }).not.toThrow();

    // (a) _inMemory is set BEFORE localStorage.setItem in captureFirstTouch —
    //     so even when setItem throws the in-memory fallback MUST return the data, NOT null.
    // A broken in-memory fallback (or one set AFTER setItem) would fail here.
    expect(result).not.toBeNull();
    expect(result?.utmSource).toBe("failopen");
  });

  it("getFirstTouch does NOT throw when localStorage is fully inaccessible", async () => {
    // Both getItem and setItem throw; clear is an intentional no-op (not a delegation,
    // to avoid any possibility of circular reference through window.localStorage).
    const brokenStorage = {
      getItem: (_key: string): string | null => {
        throw new DOMException("SecurityError", "SecurityError");
      },
      setItem: (_key: string, _value: string): void => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      },
      removeItem: (_key: string): void => { /* noop */ },
      clear: (): void => { /* noop — fully broken storage */ },
      key: (_index: number): string | null => null,
      length: 0,
    };

    Object.defineProperty(window, "localStorage", {
      value: brokenStorage,
      configurable: true,
      writable: true,
    });

    const { getFirstTouch } = await import("@/utils/attribution");

    // Oracle: getFirstTouch must never throw, even if all storage paths fail
    let result: ReturnType<typeof getFirstTouch> | undefined;
    expect(() => {
      result = getFirstTouch();
    }).not.toThrow();

    // Oracle: null on failure (acceptable per spec); NOT an exception
    expect(result === null || typeof result === "object").toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 12: apiClient.authenticateUser — attribution presence/absence in POST body
// Oracle: attribution key in body iff buildAttributionPayload returns non-undefined;
//         request always fires (never aborted by attribution errors).
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 12: apiClient.authenticateUser attribution in POST body", () => {
  afterEach(() => {
    jest.unmock("@/utils/attribution");
    jest.unmock("@/lib/apiClient");
  });

  it("includes attribution in POST body when buildAttributionPayload returns a value", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t", id: "u1", isNewUser: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    jest.doMock("@/utils/attribution", () => ({
      __esModule: true,
      buildAttributionPayload: jest.fn().mockReturnValue({
        utmSource: "google",
        landingPath: "/home",
        firstSeenAt: new Date().toISOString(),
      }),
      captureFirstTouch: jest.fn(),
      getFirstTouch: jest.fn(),
    }));

    const { createApiClient } = await import("@/lib/apiClient");
    const { authenticateUser } = createApiClient();
    await authenticateUser("test@example.com", "password");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Oracle: attribution key present when buildAttributionPayload returns a value
    expect(body.attribution).toBeDefined();
    expect(body.attribution.utmSource).toBe("google");
  });

  it("omits attribution key from POST body when buildAttributionPayload returns undefined", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t", id: "u2", isNewUser: false }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    jest.doMock("@/utils/attribution", () => ({
      __esModule: true,
      buildAttributionPayload: jest.fn().mockReturnValue(undefined),
      captureFirstTouch: jest.fn(),
      getFirstTouch: jest.fn(),
    }));

    const { createApiClient } = await import("@/lib/apiClient");
    const { authenticateUser } = createApiClient();
    await authenticateUser("test@example.com", "password");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Oracle: attribution key must be absent when buildAttributionPayload returns undefined
    expect(Object.prototype.hasOwnProperty.call(body, "attribution")).toBe(false);
  });

  it("request still fires with credentials only when buildAttributionPayload throws", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t", id: "u3", isNewUser: false }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    jest.doMock("@/utils/attribution", () => ({
      __esModule: true,
      buildAttributionPayload: jest.fn().mockImplementation(() => {
        throw new Error("attribution exploded");
      }),
      captureFirstTouch: jest.fn(),
      getFirstTouch: jest.fn(),
    }));

    const { createApiClient } = await import("@/lib/apiClient");
    const { authenticateUser } = createApiClient();
    const result = await authenticateUser("test@example.com", "password");

    // Oracle: request fires; error path returns token or error object (never throws)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Credentials present
    expect(body.email).toBe("test@example.com");
    expect(body.password).toBe("password");
    // No attribution key (attribution failed)
    expect(Object.prototype.hasOwnProperty.call(body, "attribution")).toBe(false);
    // Result is not an exception
    expect(result).toBeDefined();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 13: AuthContext.authenticate() — analytics failure must not reject signup
// Oracle (from spec): analytics failure must never fail signup.
// THIS is the blocking-1 regression test: must FAIL against unguarded analytics
// (AuthContext double-call fallback) and PASS after the fix (empty catch block).
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 13: AuthContext.authenticate() - analytics failure must not reject", () => {
  afterEach(() => {
    jest.unmock("@/lib/apiClient");
    jest.unmock("@/utils/analytics");
    jest.unmock("@/utils/attribution");
  });

  it("resolves to { isNewUser: true } even when identifyUser and trackEvent throw", async () => {
    // beforeEach has already called jest.resetModules(); all subsequent dynamic imports
    // share the same fresh React instance — no multiple-React-instance mismatch.
    // We use react-dom/client.createRoot directly (no @testing-library/react) because
    // testing-library registers afterEach/beforeAll hooks at module load time, which
    // Jest forbids inside a test body.

    jest.doMock("@/lib/apiClient", () => ({
      __esModule: true,
      createApiClient: jest.fn(() => ({
        authenticateUser: jest.fn().mockResolvedValue({
          token: "test-token",
          id: "user-id-1",
          isNewUser: true,
        }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      })),
    }));

    jest.doMock("@/utils/attribution", () => ({
      __esModule: true,
      buildAttributionPayload: jest.fn().mockReturnValue({
        utmSource: "google",
        landingPath: "/home",
      }),
      captureFirstTouch: jest.fn(),
      getFirstTouch: jest.fn(),
    }));

    // Critical: both identifyUser AND trackEvent throw — simulates unguarded analytics.
    // Oracle: authenticate() must still resolve even with these throwing.
    jest.doMock("@/utils/analytics", () => ({
      __esModule: true,
      identifyUser: jest.fn().mockImplementation(() => {
        throw new Error("PostHog unavailable");
      }),
      trackEvent: jest.fn().mockImplementation(() => {
        throw new Error("PostHog unavailable");
      }),
      setFirstTouchPersonPropertiesOnce: jest.fn(),
      resetAnalyticsUser: jest.fn(),
      setUserPersonProperties: jest.fn(),
      initAnalytics: jest.fn(),
    }));

    // Import React first to establish the shared instance in the fresh module cache.
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");

    let capturedAuthenticate:
      | ((e: string, p: string) => Promise<{ isNewUser?: boolean }>)
      | undefined;

    const Capture = () => {
      const { authenticate } = useAuth();
      // Store authenticate ref so we can call it after render
      capturedAuthenticate = authenticate;
      return React.createElement("span", null);
    };

    const container = document.createElement("div");
    document.body.appendChild(container);

    await React.act(async () => {
      createRoot(container).render(
        React.createElement(AuthProvider, null, React.createElement(Capture, null))
      );
    });

    expect(capturedAuthenticate).toBeDefined();

    let result: { isNewUser?: boolean } | undefined;
    let rejected = false;

    await React.act(async () => {
      try {
        result = await capturedAuthenticate!("test@example.com", "password");
      } catch {
        rejected = true;
      }
    });

    document.body.removeChild(container);

    // Oracle: analytics failure must never cause signup to reject
    expect(rejected).toBe(false);
    expect(result?.isNewUser).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 14: Cookie recovery — getFirstTouch falls back to cookie when
// localStorage is cleared (set-once cookie persists across storage eviction)
// Oracle: data captured in cookie is recoverable even after localStorage clear
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 14: cookie recovery after localStorage clear", () => {
  it("getFirstTouch() returns first-touch data from cookie after localStorage is cleared", async () => {
    mockLocation("?utm_source=newsletter&utm_medium=email");
    mockDocumentReferrer("");

    const { captureFirstTouch } = await import("@/utils/attribution");
    captureFirstTouch();

    // Confirm data is in localStorage
    const lsValue = localStorage.getItem("oj_first_touch");
    expect(lsValue).not.toBeNull();

    // Clear localStorage only (cookie persists)
    localStorage.clear();
    expect(localStorage.getItem("oj_first_touch")).toBeNull();

    // Reset modules to clear the in-memory _inMemory variable
    jest.resetModules();

    // Fresh import — _inMemory is null, localStorage is empty, cookie should be used
    const { getFirstTouch } = await import("@/utils/attribution");
    const result = getFirstTouch();

    // Oracle: data from cookie must be returned
    expect(result).not.toBeNull();
    expect(result?.utmSource).toBe("newsletter");
    expect(result?.utmMedium).toBe("email");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 15: 2KB boundary in authenticateUser POST body
// Oracle: POST body MUST omit attribution when stored first-touch JSON > 2048 bytes
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 15: 2KB boundary — authenticateUser POST body omits attribution when JSON > 2048 bytes", () => {
  afterEach(() => {
    jest.unmock("@/lib/apiClient");
    jest.unmock("@/utils/attribution");
  });

  it("omits attribution from POST body when stored first-touch JSON exceeds 2048 bytes", async () => {
    // Store an oversized first-touch directly in localStorage
    const oversized = {
      utmSource: "x".repeat(700),
      utmMedium: "y".repeat(700),
      utmCampaign: "z".repeat(700),
      landingPath: "/landing",
      firstSeenAt: new Date().toISOString(),
    };
    const json = JSON.stringify(oversized);
    expect(json.length).toBeGreaterThan(2048); // verify test fixture
    localStorage.setItem("oj_first_touch", json);

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t", id: "u4", isNewUser: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { createApiClient } = await import("@/lib/apiClient");
    const { authenticateUser } = createApiClient();
    await authenticateUser("test@example.com", "password");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Oracle: attribution key must be absent when first-touch JSON > 2048 bytes
    expect(Object.prototype.hasOwnProperty.call(body, "attribution")).toBe(false);
    // Credentials still present
    expect(body.email).toBe("test@example.com");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE 16: Real chain integration — captureFirstTouch -> buildAttributionPayload
//          -> createApiClient().authenticateUser POST body
// Oracle: the REAL pipeline must carry first-touch into the request body.
// No mocks on createApiClient or buildAttributionPayload — this test FAILS if
// the real attribution pipeline is broken or bypassed.
// ───────────────────────────────────────────────────────────────────────────
describe("CASE 16: real chain — captureFirstTouch feeds POST body via real createApiClient", () => {
  it("attribution.utmSource==='reddit' appears in the fetch body through the real chain", async () => {
    // Set up first-touch via real location (utm_source=reddit)
    mockLocation("?utm_source=reddit");
    mockDocumentReferrer("");

    // Import and invoke the REAL captureFirstTouch — no mocks on attribution module
    const { captureFirstTouch } = await import("@/utils/attribution");
    captureFirstTouch();

    // Mock ONLY global fetch — everything else is real
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t-case16", id: "u-case16", isNewUser: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    // Import the REAL createApiClient — no doMock; buildAttributionPayload runs for real
    const { createApiClient } = await import("@/lib/apiClient");
    const { authenticateUser } = createApiClient();
    await authenticateUser("case16@example.com", "password");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);

    // Oracle: the real pipeline must carry first-touch into the request
    // This FAILS if buildAttributionPayload is mocked, skipped, or broken
    expect(body.attribution).toBeDefined();
    expect(body.attribution.utmSource).toBe("reddit");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE A: Real chain through AuthContext — first-touch must reach fetch body
// Oracle (spec): when AuthContext.authenticate() is called, the fetch body
//   must contain attribution.utmSource === 'reddit', routed through the real
//   apiClient and real buildAttributionPayload.
// This FAILS if AuthContext mocks apiClient, or if apiClient skips attribution.
// ───────────────────────────────────────────────────────────────────────────
describe("CASE A: real AuthContext chain carries first-touch into fetch POST body", () => {
  afterEach(() => {
    jest.unmock("@/utils/analytics");
  });

  it("fetch body attribution.utmSource === 'reddit' via real AuthContext -> apiClient -> attribution chain", async () => {
    // Set a real first-touch via real location + real captureFirstTouch.
    // Must happen before module imports so _inMemory is set in the fresh module instance.
    mockLocation("?utm_source=reddit");
    mockDocumentReferrer("");

    // Import and invoke the REAL captureFirstTouch (no mocks on attribution module)
    const { captureFirstTouch } = await import("@/utils/attribution");
    captureFirstTouch();

    // Mock ONLY global fetch.
    // The mock handles ALL fetch calls (auth + any fire-and-forget profile calls).
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "t-caseA", id: "u-caseA", isNewUser: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    // Mock analytics so PostHog calls are quiet — NOT apiClient or attribution.
    jest.doMock("@/utils/analytics", () => ({
      __esModule: true,
      identifyUser: jest.fn(),
      trackEvent: jest.fn(),
      setFirstTouchPersonPropertiesOnce: jest.fn(),
      resetAnalyticsUser: jest.fn(),
      setUserPersonProperties: jest.fn(),
      initAnalytics: jest.fn(),
    }));

    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");

    let capturedAuthenticate:
      | ((e: string, p: string) => Promise<{ isNewUser?: boolean }>)
      | undefined;

    const Capture = () => {
      const { authenticate } = useAuth();
      capturedAuthenticate = authenticate;
      return React.createElement("span", null);
    };

    const container = document.createElement("div");
    document.body.appendChild(container);

    await React.act(async () => {
      createRoot(container).render(
        React.createElement(AuthProvider, null, React.createElement(Capture, null))
      );
    });

    expect(capturedAuthenticate).toBeDefined();

    await React.act(async () => {
      await capturedAuthenticate!("caseA@example.com", "password123");
    });

    document.body.removeChild(container);

    // Find the POST to /users/auth (first call — the auth call, not a profile fetch)
    const authCall = mockFetch.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === "string" && (call[0] as string).includes("/users/auth")
    );
    expect(authCall).toBeDefined();
    const body = JSON.parse((authCall![1] as { body: string }).body);

    // Oracle (spec): the real chain must carry first-touch into the request body.
    // FAILS if apiClient or buildAttributionPayload is mocked, skipped, or broken.
    expect(body.attribution).toBeDefined();
    expect(body.attribution.utmSource).toBe("reddit");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE B: token-write fail-open — localStorage.setItem throw must not reject authenticate
// Oracle (spec): a storage failure at token-persist time must not convert a
//   server-successful signup into a rejected promise. The user is signed up on
//   the server; losing the local token is a UX degradation, not a fatal error.
// ───────────────────────────────────────────────────────────────────────────
describe("CASE B: token-write fail-open — storage failure must not reject authenticate", () => {
  let realLocalStorage: Storage;

  beforeEach(() => {
    realLocalStorage = window.localStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: realLocalStorage,
      configurable: true,
      writable: true,
    });
    jest.unmock("@/lib/apiClient");
    jest.unmock("@/utils/analytics");
    jest.unmock("@/utils/attribution");
  });

  it("authenticate resolves to { isNewUser: true } even when localStorage.setItem throws for token key", async () => {
    // Stub localStorage: setItem throws when called with the token key;
    // all other operations delegate to the real storage.
    // setItemSpy is a jest.fn() so we can assert it was invoked with the token key.
    let setItemThrowPathHit = false;
    const setItemSpy = jest.fn((key: string, value: string): void => {
      if (key === "onlyjobs_token") {
        setItemThrowPathHit = true;
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      }
      realLocalStorage.setItem(key, value);
    });

    const stubbedStorage = {
      getItem: (key: string) => realLocalStorage.getItem(key),
      setItem: setItemSpy,
      removeItem: (key: string) => realLocalStorage.removeItem(key),
      clear: () => realLocalStorage.clear(),
      key: (index: number) => realLocalStorage.key(index),
      get length() { return realLocalStorage.length; },
    };

    Object.defineProperty(window, "localStorage", {
      value: stubbedStorage,
      configurable: true,
      writable: true,
    });

    // Shared mock for authenticateUser — hoisted outside the factory so all
    // createApiClient() calls (however many renders AuthProvider does) share
    // the same function reference. This way capturedAuthenticateUserMock tracks
    // the one function that the authenticate closure actually calls.
    const capturedAuthenticateUserMock = jest.fn().mockResolvedValue({
      token: "token-caseB",
      id: "user-caseB",
      isNewUser: true,
    });

    jest.doMock("@/lib/apiClient", () => ({
      __esModule: true,
      createApiClient: jest.fn(() => ({
        authenticateUser: capturedAuthenticateUserMock,
        getUserProfile: jest.fn().mockResolvedValue(null),
      })),
    }));

    jest.doMock("@/utils/attribution", () => ({
      __esModule: true,
      buildAttributionPayload: jest.fn().mockReturnValue(undefined),
      captureFirstTouch: jest.fn(),
      getFirstTouch: jest.fn(),
    }));

    jest.doMock("@/utils/analytics", () => ({
      __esModule: true,
      identifyUser: jest.fn(),
      trackEvent: jest.fn(),
      setFirstTouchPersonPropertiesOnce: jest.fn(),
      resetAnalyticsUser: jest.fn(),
      setUserPersonProperties: jest.fn(),
      initAnalytics: jest.fn(),
    }));

    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");

    let capturedAuthenticate:
      | ((e: string, p: string) => Promise<{ isNewUser?: boolean }>)
      | undefined;

    const Capture = () => {
      const { authenticate } = useAuth();
      capturedAuthenticate = authenticate;
      return React.createElement("span", null);
    };

    const container = document.createElement("div");
    document.body.appendChild(container);

    await React.act(async () => {
      createRoot(container).render(
        React.createElement(AuthProvider, null, React.createElement(Capture, null))
      );
    });

    expect(capturedAuthenticate).toBeDefined();

    let result: { isNewUser?: boolean } | undefined;
    let rejected = false;

    await React.act(async () => {
      try {
        result = await capturedAuthenticate!("caseB@example.com", "password123");
      } catch {
        rejected = true;
      }
    });

    document.body.removeChild(container);

    // Oracle (spec): storage failure must not convert a server-successful signup into a rejection.
    // FAILS if AuthContext does NOT have a try/catch around localStorage.setItem.
    expect(rejected).toBe(false);
    expect(result?.isNewUser).toBe(true);

    // Hardening: prove the auth request actually fired (not short-circuited before the API call).
    // FAILS if AuthContext skips authenticateUser and synthesises a result without calling the API.
    expect(capturedAuthenticateUserMock).toHaveBeenCalledTimes(1);

    // Hardening: prove the throwing token-write path was actually reached.
    // FAILS if the token is never written (the fail-open is vacuous — there's nothing to catch).
    expect(setItemSpy).toHaveBeenCalledWith("onlyjobs_token", expect.any(String));
    expect(setItemThrowPathHit).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CASE C: in-memory fallback — getFirstTouch returns in-memory data even when
//   both localStorage and cookie are unavailable for reading.
// Oracle (spec): captureFirstTouch sets _inMemory BEFORE the localStorage write;
//   getFirstTouch must return that in-memory value without touching storage.
// FAILS if _inMemory is not set, or if getFirstTouch ignores _inMemory and
//   falls through to the (now-broken) storage paths.
// ───────────────────────────────────────────────────────────────────────────
describe("CASE C: in-memory fallback — getFirstTouch returns _inMemory when storage is unreadable", () => {
  let realLocalStorage: Storage;

  beforeEach(() => {
    realLocalStorage = window.localStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: realLocalStorage,
      configurable: true,
      writable: true,
    });
  });

  it("getFirstTouch() returns utmSource==='hn' from in-memory even when localStorage.getItem throws and cookie is absent", async () => {
    // Step 1: call captureFirstTouch() with utm_source=hn using the REAL module.
    // This sets _inMemory inside the module AND writes to localStorage + cookie.
    // We use the same module instance for the follow-up getFirstTouch() call —
    // no jest.resetModules() between them, so _inMemory survives.
    mockLocation("?utm_source=hn");
    mockDocumentReferrer("");

    const { captureFirstTouch, getFirstTouch } = await import("@/utils/attribution");
    captureFirstTouch();

    // Step 2: make BOTH persistent stores unavailable for READ.
    // localStorage.getItem throws — simulates SecurityError / storage blocked.
    const unreadableStorage = {
      getItem: (_key: string): string | null => {
        throw new DOMException("SecurityError", "SecurityError");
      },
      setItem: (key: string, value: string): void => {
        realLocalStorage.setItem(key, value);
      },
      removeItem: (key: string) => realLocalStorage.removeItem(key),
      clear: () => realLocalStorage.clear(),
      key: (index: number) => realLocalStorage.key(index),
      get length() { return realLocalStorage.length; },
    };

    Object.defineProperty(window, "localStorage", {
      value: unreadableStorage,
      configurable: true,
      writable: true,
    });

    // Clear the cookie so document.cookie has no 'oj_ft' entry.
    // Expire any existing oj_ft cookie so parseCookieValue returns null.
    document.cookie = "oj_ft=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";

    // Hardening: assert the cookie is actually gone so the isolation does not
    // silently rely on jsdom expiration behaviour being synchronous.
    // FAILS if jsdom does not honour the Max-Age=0 expiry and the cookie lingers,
    // which would mean the test was not actually exercising the in-memory path.
    expect(document.cookie).not.toContain("oj_ft");

    // Step 3: call getFirstTouch() on the SAME module instance.
    // _inMemory is still set from the captureFirstTouch() call above.
    // getFirstTouch() must return the in-memory value without reaching localStorage or cookie.
    const result = getFirstTouch();

    // Oracle (spec): in-memory fallback must return the captured first-touch.
    // FAILS if _inMemory is not checked first, or if the module re-reads storage
    // before consulting _inMemory.
    expect(result).not.toBeNull();
    expect(result?.utmSource).toBe("hn");
  });
});
