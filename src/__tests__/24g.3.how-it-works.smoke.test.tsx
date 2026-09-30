/**
 * SMOKE TEST — onlyjobs-24g.3: /how-it-works page + /pricing redirect
 *
 * Just-enough tests. Adversarial suite comes separately.
 * Does NOT mock JsonLd to null; next/head is a passthrough; Heading forwards `as`.
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";

// ── Variables starting with "mock" are hoisted by babel-jest alongside jest.mock ─

const mockReplace = jest.fn();

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

// CRITICAL: next/head must be a passthrough so SEO meta tags are queryable.
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement("img", { src, alt }),
}));

jest.mock("next/script", () => ({
  __esModule: true,
  default: () => null,
}));

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

// CRITICAL: Heading forwards `as` (default h2).
// Box forwards `id` so querySelector('#pricing') works.
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, id, "aria-label": al, href, role }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, id, "aria-label": al, href, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    Box: makeEl("div"),
    Flex: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Stack: makeEl("div"),
    SimpleGrid: makeEl("div"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Container: makeEl("div"),
    Center: makeEl("div"),
    Grid: makeEl("div"),
    GridItem: makeEl("div"),
    // CRITICAL: default tag is 'h2'; pages must use as="h1" for the hero heading.
    Heading: ({
      as: T = "h2",
      children,
      lineHeight,
      fontSize,
      fontWeight,
      fontFamily,
      letterSpacing,
      textAlign,
      color,
      mb,
      mt,
      mx,
      my,
      px,
      py,
      pt,
      pb,
      pl,
      pr,
      w,
      h,
      width,
      height,
      maxW,
      minW,
      flex,
      display,
      align,
      justify,
      noOfLines,
      isTruncated,
      bgGradient,
      bgClip,
      size,
      ...rest
    }: any) => React.createElement(T, rest, children),
    Text: makeEl("span"),
    Button: ({
      as: Tag = "button",
      href,
      children,
      onClick,
      type,
      disabled,
      "aria-label": al,
      role,
    }: any) =>
      React.createElement(Tag, { href, onClick, type, disabled, "aria-label": al, role }, children),
    IconButton: ({ "aria-label": al, onClick, children }: any) =>
      React.createElement("button", { "aria-label": al, onClick }, children ?? null),
    Link: ({ children, href, onClick }: any) =>
      React.createElement("a", { href, onClick }, children),
    Badge: makeEl("span"),
    Tag: makeEl("span"),
    TagLabel: ({ children }: any) => React.createElement("span", null, children),
    Divider: () => React.createElement("hr"),
    Spinner: () =>
      React.createElement("div", { role: "status", "aria-label": "Loading" }),
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
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object")
        return vals.base ?? vals.sm ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
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

jest.mock("@/theme/theme", () => ({
  __esModule: true,
  default: { colors: { semantic: { primary: "#000" } } },
}));

jest.mock("@/theme/palette", () => ({
  PAPER: "#ffffff",
  PENCIL: { 300: "#aaaaaa", 500: "#555555" },
}));

jest.mock("@/components/CookieConsent", () => ({
  CookieConsent: () => null,
}));

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isReady: true,
    isLoggedIn: false,
    userId: null,
    token: null,
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("@/contexts/GuideContext", () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock("@/utils/analytics", () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({})),
}));

const nullIcon = () => null;
jest.mock("react-icons/fi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/bs", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/tb", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/lu", () => new Proxy({}, { get: () => nullIcon }));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as Response)
) as any;

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

// eslint-disable-next-line import/first
import HowItWorksPage from "@/pages/how-it-works";
// eslint-disable-next-line import/first
import PricingPage from "@/pages/pricing";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMeta(container: HTMLElement, selector: string, attr = "content") {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

function collectJsonLdTypes(container: HTMLElement): Set<string> {
  const types = new Set<string>();
  const scripts = Array.from(
    container.querySelectorAll('script[type="application/ld+json"]')
  );
  for (const s of scripts) {
    let parsed: any;
    try {
      parsed = JSON.parse(s.innerHTML);
    } catch {
      continue;
    }
    if (Array.isArray(parsed["@graph"])) {
      for (const node of parsed["@graph"]) {
        if (node["@type"]) types.add(node["@type"]);
      }
    } else if (parsed["@type"]) {
      types.add(parsed["@type"]);
    }
  }
  return types;
}

// ── /how-it-works page smoke tests ───────────────────────────────────────────

describe("/how-it-works smoke tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it("S1: renders exactly ONE <h1>", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `S1 FAILURE — expected 1 <h1>, found ${h1s.length}. ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("S2: JSON-LD @type set is EXACTLY {WebPage, BreadcrumbList}", () => {
    const types = collectJsonLdTypes(container);
    const expected = new Set(["WebPage", "BreadcrumbList"]);
    const extra = Array.from(types).filter((t) => !expected.has(t));
    const missing = Array.from(expected).filter((t) => !types.has(t));
    if (extra.length > 0 || missing.length > 0) {
      throw new Error(
        `S2 FAILURE — @type set mismatch.\n` +
          `  Expected: {WebPage, BreadcrumbList}\n` +
          `  Observed: {${Array.from(types).join(", ")}}\n` +
          (extra.length ? `  Extra: ${extra.join(", ")}\n` : "") +
          (missing.length ? `  Missing: ${missing.join(", ")}\n` : "")
      );
    }
    expect(types).toEqual(expected);
  });

  it('S3: og:type is exactly "article"', () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "article") {
      throw new Error(
        `S3 FAILURE — og:type is "${ogType}", expected "article".`
      );
    }
    expect(ogType).toBe("article");
  });

  it('S4: element with id="pricing" exists in the DOM', () => {
    const pricingEl = container.querySelector("#pricing");
    if (!pricingEl) {
      throw new Error(
        `S4 FAILURE — no element with id="pricing" found. ` +
          `The "What it costs" section container must have id="pricing" ` +
          `as the target of the /pricing redirect.`
      );
    }
    expect(pricingEl).not.toBeNull();
  });
});

// ── /pricing redirect smoke test ─────────────────────────────────────────────

describe("/pricing redirect smoke test", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('S5: mounting PricingPage calls router.replace("/how-it-works#pricing") exactly once', async () => {
    render(<PricingPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/how-it-works#pricing");
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
