/**
 * SMOKE TEST — onlyjobs-24g.4: /about founder page
 *
 * Just-enough tests to verify the page renders correctly.
 * Does NOT mock JsonLd to null; next/head is a passthrough; Heading forwards `as`.
 */

import React from "react";
import { render } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/about",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/about",
    query: {},
    asPath: "/about",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

// CRITICAL: next/head must be a passthrough so SEO meta tags and ld+json are queryable.
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
// A page that omits as="h1" on the hero renders h2 and fails the "exactly one h1" test.
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
    // CRITICAL: default tag is 'h2'; the page must use as="h1" for the hero heading.
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
import AboutPage from "@/pages/about";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMeta(container: HTMLElement, selector: string, attr = "content") {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

function getAllJsonLd(container: HTMLElement): any[] {
  const scripts = Array.from(
    container.querySelectorAll('script[type="application/ld+json"]')
  );
  return scripts.map((s) => {
    try {
      return JSON.parse(s.innerHTML);
    } catch {
      return null;
    }
  });
}

function collectJsonLdTopLevelTypes(container: HTMLElement): Set<string> {
  const types = new Set<string>();
  for (const parsed of getAllJsonLd(container)) {
    if (!parsed) continue;
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

function getPersonNode(container: HTMLElement): any {
  for (const parsed of getAllJsonLd(container)) {
    if (!parsed) continue;
    const graph: any[] = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    const person = graph.find((n: any) => n["@type"] === "Person");
    if (person) return person;
  }
  return null;
}

// ── Smoke tests ───────────────────────────────────────────────────────────────

describe("/about page smoke tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AboutPage />));
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

  it("S2: JSON-LD parses without throwing", () => {
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) {
      expect(() => JSON.parse(s.innerHTML)).not.toThrow();
    }
  });

  it("S3: JSON-LD CONTAINS @type AboutPage", () => {
    const types = collectJsonLdTopLevelTypes(container);
    if (!types.has("AboutPage")) {
      throw new Error(
        `S3 FAILURE — @type "AboutPage" not found in JSON-LD. ` +
          `Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("AboutPage")).toBe(true);
  });

  it("S4: JSON-LD CONTAINS @type Person", () => {
    const types = collectJsonLdTopLevelTypes(container);
    if (!types.has("Person")) {
      throw new Error(
        `S4 FAILURE — @type "Person" not found in JSON-LD. ` +
          `Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("Person")).toBe(true);
  });

  it("S5: JSON-LD CONTAINS @type BreadcrumbList", () => {
    const types = collectJsonLdTopLevelTypes(container);
    if (!types.has("BreadcrumbList")) {
      throw new Error(
        `S5 FAILURE — @type "BreadcrumbList" not found in JSON-LD. ` +
          `Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("BreadcrumbList")).toBe(true);
  });

  const FORBIDDEN_TYPES = ["SoftwareApplication", "FAQPage", "JobPosting", "ItemList"];

  for (const forbiddenType of FORBIDDEN_TYPES) {
    it(`S6: JSON-LD does NOT contain top-level @type "${forbiddenType}"`, () => {
      const types = collectJsonLdTopLevelTypes(container);
      if (types.has(forbiddenType)) {
        throw new Error(
          `S6 FAILURE — forbidden @type "${forbiddenType}" found in JSON-LD. ` +
            `Types found: {${Array.from(types).join(", ")}}`
        );
      }
      expect(types.has(forbiddenType)).toBe(false);
    });
  }

  it('S7: Person.worksFor has @id "https://onlyjobs.app/#organization"', () => {
    const person = getPersonNode(container);
    if (!person) {
      throw new Error(
        `S7 FAILURE — no Person node found in JSON-LD.`
      );
    }
    const worksForId = person.worksFor?.["@id"];
    if (worksForId !== "https://onlyjobs.app/#organization") {
      throw new Error(
        `S7 FAILURE — Person.worksFor["@id"] is "${worksForId}", ` +
          `expected "https://onlyjobs.app/#organization".`
      );
    }
    expect(worksForId).toBe("https://onlyjobs.app/#organization");
  });

  it('S8: og:type is exactly "article"', () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "article") {
      throw new Error(
        `S8 FAILURE — og:type is "${ogType}", expected "article".`
      );
    }
    expect(ogType).toBe("article");
  });
});
