/**
 * ADVERSARIAL TEST — onlyjobs-24g.10: hero sample match report link
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions, do NOT commit.
 *
 * FORBIDDEN: src/pages/index.tsx implementation body (not opened)
 * ALLOWED:
 *   - src/__tests__/24g10.hero-sample-link.smoke.test.tsx  (mock patterns)
 *   - src/__tests__/24g.2.sample-match-report.adversarial.test.tsx (Chakra mock, styled-components)
 *   - src/components/Footer.tsx (top-level imports only — confirmed: Chakra + next/link + styled)
 *   - e2e/landing.visual.spec.ts (Playwright harness shape)
 *   - jest.config.ts, jest.setup.ts
 *
 * ORACLE: the spec pasted into the prompt — never "what the code outputs."
 *
 * Footer is NOT mocked as null so the hero-vs-footer testid distinction is testable
 * in Groups A and E. Footer only imports Chakra + next/link + styled-components —
 * all of which are mocked in this file — so it renders safely.
 *
 * DISCLOSURE: see bottom of file.
 */

// ── Control fns (must be defined before jest.mock hoisting) ───────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();

// ── Mocks (hoisted before all imports) ────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// CRITICAL: next/head must be a passthrough so title / meta tags are rendered.
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// next/link → plain <a> so hrefs are queryable.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement("img", { src, alt }),
}));

// styled-components: styled(Tag) returns a component that renders <a> with all props.
// ContactLink = styled(Link) in Footer renders as <a href="...">text</a> through this mock.
jest.mock("styled-components", () => {
  const React = require("react");
  const styled = (_Tag: any) => (_strings: any, ..._interps: any[]) => {
    function StyledMock({ children, ...rest }: any) {
      return React.createElement("a", rest, children);
    }
    return StyledMock;
  };
  return { __esModule: true, default: styled };
});

// ADVERSARIAL Chakra mock: Heading forwards `as` (default h2).
// If the page uses <Heading as="h1"> the H1 assertion passes; if it forgets
// as="h1" and uses default <Heading>, it renders h2 and the assertion FAILS.
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children,
          onClick,
          type,
          disabled,
          "aria-label": al,
          href,
          role,
          id,
          "data-testid": dt,
        }: any,
        ref: any
      ) =>
        React.createElement(
          tag,
          { ref, onClick, type, disabled, "aria-label": al, href, role, id, "data-testid": dt },
          children
        )
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl("div"),
    Flex: makeEl("div"),
    Center: makeEl("div"),
    Container: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Stack: makeEl("div"),
    SimpleGrid: makeEl("div"),
    Grid: makeEl("div"),
    GridItem: makeEl("div"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    // ADVERSARIAL: Heading honours `as`. Missing as="h1" → h2, H1 assertion fails.
    Heading: ({
      as: T = "h2",
      children,
      "data-testid": dt,
      id,
      role,
      href,
      onClick,
    }: any) =>
      React.createElement(
        T,
        { "data-testid": dt, id, role, href, onClick },
        children
      ),
    Text: makeEl("span"),
    Button: makeEl("button"),
    Input: makeEl("input"),
    Badge: makeEl("span"),
    List: makeEl("ul"),
    ListItem: makeEl("li"),
    ListIcon: () => null,
    Link: ({ children, href, onClick, ...rest }: any) =>
      React.createElement("a", { href, onClick, ...rest }, children),
    Image: ({ src, alt }: any) => React.createElement("img", { src, alt }),
    Divider: () => React.createElement("hr"),
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    FormErrorMessage: makeEl("span"),
    FormHelperText: makeEl("span"),
    InputGroup: makeEl("div"),
    InputLeftElement: makeEl("span"),
    InputRightElement: makeEl("span"),
    InputLeftAddon: makeEl("span"),
    InputRightAddon: makeEl("span"),
    Select: ({ children, ...p }: any) =>
      React.createElement("select", p, children),
    Textarea: makeEl("textarea"),
    Checkbox: ({ onChange, isChecked }: any) =>
      React.createElement("input", { type: "checkbox", onChange, checked: isChecked }),
    Tag: makeEl("span"),
    TagLabel: ({ children }: any) => React.createElement("span", null, children),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [open, setOpen] = React.useState(false);
      return {
        isOpen: open,
        onOpen: () => setOpen(true),
        onClose: () => setOpen(false),
        onToggle: () => setOpen((v: boolean) => !v),
      };
    },
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object")
        return vals.base ?? vals.sm ?? Object.values(vals)[0];
      return vals;
    },
    useToast: () => jest.fn(),
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    Spinner: () =>
      React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement("div", null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
  };

  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      if (typeof prop === "string") {
        if (prop.startsWith("use")) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl("div");
      }
      return Reflect.get(target, prop);
    },
  });
});

jest.mock("@emotion/react", () => ({
  keyframes: () => "mock-keyframes",
  css: (...args: any[]) => args,
}));

jest.mock("@/theme/theme", () => ({ __esModule: true, default: {} }));
jest.mock("@/theme/palette", () => ({
  PENCIL: "#333",
  PAPER: "#ffffff",
}));

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: false }),
}));

jest.mock("@/contexts/GuideContext", () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

// Analytics: spy on trackEvent to test click-tracking assertion.
jest.mock("@/utils/analytics", () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock("@/utils/safe-return-to", () => ({
  isSafeReturnTo: () => false,
}));

jest.mock("@/components/JsonLd", () => ({ JsonLd: () => null }));
jest.mock("@/components/Logo", () => ({ Logo: () => null }));
jest.mock("@/components/SEO", () => ({ SEO: () => null }));
jest.mock("@/components/CookieConsent", () => ({ CookieConsent: () => null }));

// NOTE: Footer is intentionally NOT mocked as null. Footer only imports
// @chakra-ui/react + next/link + styled-components (all mocked above), so it
// renders safely. Groups A and E rely on the footer link being present in the
// full-page render to distinguish "hero link only" from "any /sample-match-report link".
// If Footer caused render errors here, that itself would be a FINDING.

const nullIcon = () => null;
jest.mock("react-icons/fi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/tb", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/bs", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/si", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/md", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/ai", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/io", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/io5", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/hi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/ri", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/lu", () => new Proxy({}, { get: () => nullIcon }));

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

import React from "react";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import Home from "@/pages/index";
import { Footer } from "@/components/Footer";
import * as analytics from "@/utils/analytics";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderHome() {
  return render(<Home />);
}

// ── Group A: Element identity and href precision ───────────────────────────────

describe("24g.10 adversarial — Group A: Element identity and href precision", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    (analytics.trackEvent as jest.Mock).mockClear();
  });

  it("A1: element with data-testid='hero-sample-match-report' exists", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    expect(el).toBeInTheDocument();
  });

  it("A1b: href is EXACTLY '/sample-match-report' — no query string, no utm, no hash", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    const href = el.getAttribute("href");

    // Primary assertion: exact value
    expect(href).toBe("/sample-match-report");

    // Belt-and-suspenders adversarial checks:
    // A UTM leak like '/sample-match-report?utm_source=hero' would pass a loose toContain check.
    if (href !== null && href.includes("?")) {
      throw new Error(
        `A1b FAILURE — href contains a query string. ` +
          `Expected exactly "/sample-match-report", got: "${href}"`
      );
    }
    expect(href).not.toContain("?");
    expect(href).not.toContain("#");
    expect(href).not.toContain("utm");
  });

  it("A2a: element is an <a> (role=link) — not a div/button/span with an onClick", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    expect(el.tagName.toLowerCase()).toBe("a");
  });

  it("A2b: accessible/visible name matches /see a sample match report/i", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    const text = el.textContent ?? "";
    if (!/see a sample match report/i.test(text)) {
      throw new Error(
        `A2b FAILURE — element text does not match /see a sample match report/i.\n` +
          `  Actual text: "${text}"\n` +
          `  The text must read "See a sample match report ->" (with arrow glyph).`
      );
    }
    expect(text).toMatch(/see a sample match report/i);
  });

  it("A2c: element is not disabled", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    expect(el).not.toHaveAttribute("disabled");
    expect(el).not.toHaveAttribute("aria-disabled", "true");
  });

  it("A3a: hero link is NOT a descendant of #signup (closest check)", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    if (el.closest("#signup") !== null) {
      throw new Error(
        `A3a FAILURE — hero link is inside #signup. ` +
          `The link must be outside the signup form.`
      );
    }
    expect(el.closest("#signup")).toBeNull();
  });

  it("A3b: no element matching '#signup [data-testid=\"hero-sample-match-report\"]' in DOM", () => {
    renderHome();
    // Even if A3a passes via closest(), a testid element deep inside #signup
    // that has a different ancestor chain would be caught here.
    const found = document.querySelector('#signup [data-testid="hero-sample-match-report"]');
    if (found !== null) {
      throw new Error(
        `A3b FAILURE — querySelector('#signup [data-testid="hero-sample-match-report"]') ` +
          `returned a non-null element. The hero link must be OUTSIDE the signup form.`
      );
    }
    expect(found).toBeNull();
  });

  it("A3c: no '#signup a[href=\"/sample-match-report\"]' in DOM (catches link inside form even without testid)", () => {
    renderHome();
    // Catches the case where the link is placed inside #signup but with the testid removed.
    const found = document.querySelector('#signup a[href="/sample-match-report"]');
    if (found !== null) {
      throw new Error(
        `A3c FAILURE — an anchor with href="/sample-match-report" is inside #signup.\n` +
          `  Found element: ${found.outerHTML}\n` +
          `  No /sample-match-report anchor may live inside the signup form.`
      );
    }
    expect(found).toBeNull();
  });

  it("A4: EXACTLY ONE element with data-testid='hero-sample-match-report' in DOM", () => {
    renderHome();
    const els = document.querySelectorAll('[data-testid="hero-sample-match-report"]');
    if (els.length !== 1) {
      throw new Error(
        `A4 FAILURE — expected exactly 1 element with testid="hero-sample-match-report", ` +
          `found ${els.length}.\n` +
          `  All matches: ${Array.from(els).map((e) => e.outerHTML).join("\n")}`
      );
    }
    expect(els).toHaveLength(1);
  });
});

// ── Group B: Signup form / H1 integrity ──────────────────────────────────────

describe("24g.10 adversarial — Group B: Signup form / H1 integrity (must be UNCHANGED)", () => {
  beforeEach(() => {
    (analytics.trackEvent as jest.Mock).mockClear();
  });

  it("B1: element with id='signup' is present in the DOM", () => {
    renderHome();
    const signupEl = document.querySelector("#signup");
    if (signupEl === null) {
      throw new Error(
        `B1 FAILURE — no element with id="signup" found. ` +
          `The signup form must be present and unchanged.`
      );
    }
    expect(signupEl).not.toBeNull();
  });

  it("B2: a submit control with accessible name /create account/i is present", () => {
    renderHome();
    // getByRole throws if missing — that IS the assertion.
    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).toBeInTheDocument();
  });

  it("B3: an H1 with text /start applying smarter/i is present", () => {
    renderHome();
    // querySelector("h1") relies on the Heading mock forwarding as="h1" correctly.
    // If the page uses <Heading as="h1"> this renders <h1>.
    // If it forgets as="h1" or uses a plain <span>, this assertion FAILS (finding).
    const h1s = document.querySelectorAll("h1");
    const matching = Array.from(h1s).filter((el) =>
      /start applying smarter/i.test(el.textContent ?? "")
    );
    if (matching.length === 0) {
      throw new Error(
        `B3 FAILURE — no <h1> with text /start applying smarter/i found.\n` +
          `  h1 elements in DOM: ${Array.from(h1s)
            .map((e) => `"${e.textContent?.trim()}"`)
            .join(", ") || "(none)"}\n` +
          `  If the page uses a Chakra <Heading> without as="h1", the Chakra mock ` +
          `renders it as <h2> and this assertion correctly fails.`
      );
    }
    expect(matching.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Group C: Click tracking and navigation ────────────────────────────────────

describe("24g.10 adversarial — Group C: Click tracking and navigation", () => {
  beforeEach(() => {
    (analytics.trackEvent as jest.Mock).mockClear();
  });

  it("C1: clicking the hero link fires trackEvent('hero_sample_report_click') exactly once (zero-before/one-after delta)", () => {
    renderHome();
    const link = screen.getByTestId("hero-sample-match-report");

    // BEFORE click: spy must be silent (not fired at render time)
    const callsBefore = (analytics.trackEvent as jest.Mock).mock.calls.length;
    if (callsBefore !== 0) {
      throw new Error(
        `C1 FAILURE — trackEvent was called ${callsBefore} time(s) BEFORE the click.\n` +
          `  The event must fire ON CLICK, not at render time.\n` +
          `  All calls at render: ${JSON.stringify((analytics.trackEvent as jest.Mock).mock.calls)}`
      );
    }
    expect(analytics.trackEvent).not.toHaveBeenCalled();

    fireEvent.click(link);

    // AFTER click: exactly one call with the correct event name
    const calls = (analytics.trackEvent as jest.Mock).mock.calls;
    const matchingCalls = calls.filter(([name]: [string]) => name === "hero_sample_report_click");
    if (matchingCalls.length !== 1) {
      throw new Error(
        `C1 FAILURE — expected trackEvent("hero_sample_report_click") to be called ` +
          `exactly once after clicking the hero link.\n` +
          `  Called ${matchingCalls.length} time(s).\n` +
          `  All trackEvent calls: ${JSON.stringify(calls)}`
      );
    }
    expect(analytics.trackEvent).toHaveBeenCalledWith("hero_sample_report_click");
    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
  });

  it("C2: clicking the hero link does NOT call preventDefault (navigation preserved)", () => {
    renderHome();
    const link = screen.getByTestId("hero-sample-match-report");
    // createEvent lets us inspect defaultPrevented after dispatch.
    // If the onClick handler calls e.preventDefault(), this assertion FAILS.
    const clickEvent = createEvent.click(link, { bubbles: true, cancelable: true });
    fireEvent(link, clickEvent);
    if (clickEvent.defaultPrevented) {
      throw new Error(
        `C2 FAILURE — click event had defaultPrevented=true after firing on the hero link.\n` +
          `  The onClick handler must not call e.preventDefault() — navigation must work.\n` +
          `  href at time of assertion: "${link.getAttribute("href")}"`
      );
    }
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("C3: hero link has a real href (confirms navigation is possible without JS)", () => {
    renderHome();
    const link = screen.getByTestId("hero-sample-match-report");
    const href = link.getAttribute("href");
    if (!href || href.trim() === "" || href === "#") {
      throw new Error(
        `C3 FAILURE — hero link has no real href: "${href}".\n` +
          `  The link must have href="/sample-match-report" so navigation ` +
          `works even if JS is blocked.`
      );
    }
    expect(href).toBe("/sample-match-report");
  });
});

// ── Group D: Copy quality ─────────────────────────────────────────────────────

describe("24g.10 adversarial — Group D: Copy quality (no dashes, arrow glyph)", () => {
  it("D1: link text contains NO em-dash (U+2014 —) or en-dash (U+2013 –)", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    const text = el.textContent ?? "";
    if (text.includes("—")) {
      throw new Error(
        `D1 FAILURE — hero link text contains an em-dash (—, U+2014).\n` +
          `  Text: "${text}"\n` +
          `  Replace with a plain hyphen or the right-arrow glyph (→).`
      );
    }
    if (text.includes("–")) {
      throw new Error(
        `D1 FAILURE — hero link text contains an en-dash (–, U+2013).\n` +
          `  Text: "${text}"\n` +
          `  Replace with a plain hyphen or the right-arrow glyph (→).`
      );
    }
    expect(text).not.toContain("—");
    expect(text).not.toContain("–");
  });

  it("D2: link text contains the right-arrow glyph → (U+2192, rendered from &rarr;)", () => {
    renderHome();
    const el = screen.getByTestId("hero-sample-match-report");
    const text = el.textContent ?? "";
    if (!text.includes("→")) {
      throw new Error(
        `D2 FAILURE — hero link text does not contain → (U+2192).\n` +
          `  Text: "${text}"\n` +
          `  The spec requires the text to end with the &rarr; glyph "→".`
      );
    }
    expect(text).toContain("→");
  });
});

// ── Group E: Footer link still present (not "moved") ─────────────────────────

describe("24g.10 adversarial — Group E: Footer link still present (not moved to hero)", () => {
  it("E1: Home page DOM has at least one a[href='/sample-match-report'] that is NOT the hero testid", () => {
    renderHome();
    const heroEl = screen.getByTestId("hero-sample-match-report");
    const allLinks = Array.from(
      document.querySelectorAll('a[href="/sample-match-report"]')
    );
    const nonHero = allLinks.filter((a) => a !== heroEl);
    if (nonHero.length === 0) {
      throw new Error(
        `E1 FAILURE — no /sample-match-report anchor found in the DOM EXCEPT the hero testid.\n` +
          `  Total /sample-match-report anchors found: ${allLinks.length}\n` +
          `  Hero anchor href: "${heroEl.getAttribute("href")}"\n` +
          `  This means the footer link was REMOVED or MOVED (hero link is the only one).\n` +
          `  The footer /sample-match-report link must remain.`
      );
    }
    expect(nonHero.length).toBeGreaterThanOrEqual(1);
  });

  it("E2: rendering Footer directly produces an anchor with href='/sample-match-report'", () => {
    // Belt-and-suspenders: render Footer in isolation to confirm the link is genuinely
    // present in the component, not just coincidentally in the Home render from another source.
    const { container } = render(<Footer />);
    const footerLinks = Array.from(
      container.querySelectorAll('a[href="/sample-match-report"]')
    );
    if (footerLinks.length === 0) {
      const allHrefs = Array.from(container.querySelectorAll("a"))
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `E2 FAILURE — Footer component has no anchor with href="/sample-match-report".\n` +
          `  All hrefs in Footer: ${allHrefs || "(none)"}\n` +
          `  The footer's sample-match-report link has been removed.`
      );
    }
    expect(footerLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("E3: the footer /sample-match-report link does NOT have data-testid='hero-sample-match-report'", () => {
    // The hero testid must belong ONLY to the hero link, not any footer link.
    // If the footer link was retrofitted with the hero testid, A4 would fail (count=2),
    // but this provides a complementary direct check.
    const { container } = render(<Footer />);
    const footerHeroTestid = container.querySelector(
      '[data-testid="hero-sample-match-report"]'
    );
    if (footerHeroTestid !== null) {
      throw new Error(
        `E3 FAILURE — a footer element has data-testid="hero-sample-match-report".\n` +
          `  That testid is reserved for the HERO link only. Footer must use its own link ` +
          `without this testid.`
      );
    }
    expect(footerHeroTestid).toBeNull();
  });
});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (allowed by spec):
//   - jest.config.ts — testEnvironment, transform, moduleNameMapper
//   - jest.setup.ts — global setup (@testing-library/jest-dom)
//   - src/__tests__/24g10.hero-sample-link.smoke.test.tsx — Chakra mock shape (makeEl
//     pattern, mock list, next/* mocks), reference for what mocks were sufficient
//     to render Home. Used as infrastructure pattern only.
//   - src/__tests__/24g.2.sample-match-report.adversarial.test.tsx — styled-components
//     mock, comprehensive Chakra mock with Heading `as` forwarding, createEvent click
//     pattern, Footer Group H pattern (render Footer directly for footer-link tests),
//     fetch mock pattern.
//   - src/components/Footer.tsx — TOP IMPORTS ONLY (first 20 lines). Confirmed: imports
//     @chakra-ui/react, next/link, styled-components — all mocked. No auth/context deps.
//     Confirmed href="/sample-match-report" exists via grep. Did NOT read Footer body
//     beyond the import block.
//   - e2e/landing.visual.spec.ts — Playwright harness (baseURL, webServer, project names).
//
// Incidental knowledge kept OUT of oracles:
//   - The smoke test shows Footer is mocked as null in the smoke suite. I intentionally
//     do NOT mock it as null here (reasoning documented in file header). This is NOT a
//     derived oracle — it is an infrastructure decision.
//   - The grep result showed `<ContactLink href="/sample-match-report">` in Footer.tsx.
//     This confirms the footer link exists. Assertions E1/E2 are derived from the spec
//     ("footer link must REMAIN"), not from Footer.tsx's internal implementation.
//   - Reading the smoke test's Chakra mock revealed it uses makeEl('h2') for Heading
//     (does not forward `as`). I chose a more adversarial mock that DOES forward `as`,
//     so a missing as="h1" on the hero heading causes B3 to FAIL rather than silently
//     pass. This is purely an infrastructure choice derived from the spec requirement
//     "H1 /start applying smarter/ present".
//
// Untestable without reading index.tsx body (FINDINGS if relevant):
//   - Responsive layout (mobile fold position): not testable in jsdom, covered by
//     Playwright spec below.
//   - Whether the hero link is visually "subordinate" to the form (z-order, CSS class):
//     jsdom does not compute layout or CSS — Playwright is authoritative.
//   - Whether trackEvent receives additional args beyond the event name (the spec only
//     specifies the name "hero_sample_report_click", so C1 asserts the name only).
