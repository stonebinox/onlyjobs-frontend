/**
 * ADVERSARIAL TEST — onlyjobs-24g.3: /how-it-works page + /pricing redirect
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * FORBIDDEN (body not opened):
 *   src/pages/how-it-works.tsx
 *   src/pages/pricing.tsx
 *
 * ALLOWED:
 *   src/components/SEO.tsx          — props / fullTitle rule / defaults
 *   src/components/Footer.tsx       — anchor hrefs / wordmark pattern
 *   src/__tests__/24g.2.sample-match-report.adversarial.test.tsx — harness patterns
 *   src/__tests__/24g.3.how-it-works.smoke.test.tsx — mockReplace hoist pattern
 *   public/sitemap.xml              — file read
 *   jest.config.ts                  — test environment
 *
 * Oracle: THE SPEC pasted in the task prompt — never "what the code outputs."
 * DISCLOSURE: see bottom of file.
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";

// ── Constants (spec-derived; never peek at implementation output) ──────────────

const SPEC_TITLE =
  "How OnlyJobs Matching Works (and What It Costs) | OnlyJobs";
const SPEC_META_DESCRIPTION =
  "How OnlyJobs matches you: open-ended Q&A, one daily run, and only jobs above your threshold - each with a score, why it fits, and what didn't. No subscription.";
const SPEC_CANONICAL = "https://onlyjobs.app/how-it-works";
const SPEC_OG_TYPE = "article";
const SPEC_OG_TITLE = "How OnlyJobs matching works, in plain terms";
const SPEC_OG_DESCRIPTION =
  "Open-ended Q&A, one daily run, and only the jobs above your bar - each with why it fits and what didn't. No subscription; pay only on match days.";
// ADVERSARIAL: must be the DEFAULT og-image, NOT a dedicated /og/how-it-works asset.
const SPEC_OG_IMAGE = "https://onlyjobs.app/og-image.png";

const SPEC_CTA_SAMPLE = "/sample-match-report";
const SPEC_CTA_SIGNUP =
  "/?utm_source=site&utm_medium=how-it-works&utm_content=cta#signup";
const SPEC_PRICING_REDIRECT = "/how-it-works#pricing";

const SITEMAP_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "public",
  "sitemap.xml"
);

// ── Spy variables (must start with "mock" — babel-jest hoists them with jest.mock) ─

const mockNavigationPush = jest.fn();
const mockNavigationReplace = jest.fn();
const mockNextRouterPush = jest.fn();
const mockNextRouterReplace = jest.fn();
const mockUseAuth = jest.fn();

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

const nullIcon = () => null;

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockNextRouterPush,
    replace: mockNextRouterReplace,
    prefetch: jest.fn(),
    pathname: "/how-it-works",
    query: {},
    asPath: "/how-it-works",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockNavigationPush,
    replace: mockNavigationReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => "/how-it-works",
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head must be a passthrough so SEO tags and ld+json are queryable.
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

// CRITICAL Chakra mock:
//   • Heading forwards `as` (default h2) — page must use as="h1" for hero; forgetting it renders h2
//   • Box/makeEl forwards `id` — so id="pricing" is discoverable via querySelector('#pricing')
//   • Button forwards `as` and `href` — CTA anchors rendered via Button as="a" must be queryable
//   • Collapse starts CLOSED — FAQ answers in Collapse in={false} will not render; adversarial
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
          id,
          "aria-label": al,
          href,
          role,
        }: any,
        ref: any
      ) =>
        React.createElement(
          tag,
          { ref, onClick, id, "aria-label": al, href, role },
          children
        )
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
    // CRITICAL: Button forwards `as` and `href` so CTA anchors are discoverable.
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
      React.createElement(
        Tag,
        { href, onClick, type, disabled, "aria-label": al, role },
        children
      ),
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
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertTitle: makeEl("span"),
    AlertDescription: makeEl("span"),
    // ADVERSARIAL: Collapse starts CLOSED. If FAQ answers live in Collapse in={false}
    // they will not appear on first render — test C5/C6 will catch this.
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement("div", null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    Input: makeEl("input"),
    Textarea: makeEl("textarea"),
    Select: ({ children, ...p }: any) =>
      React.createElement("select", p, children),
    // Accordion/AccordionPanel render children unconditionally.
    Tabs: ({ children }: any) => React.createElement("div", null, children),
    TabList: ({ children }: any) =>
      React.createElement("div", { role: "tablist" }, children),
    Tab: ({ children, onClick }: any) =>
      React.createElement("button", { role: "tab", onClick }, children),
    TabPanels: ({ children }: any) => React.createElement("div", null, children),
    TabPanel: ({ children }: any) =>
      React.createElement("div", { role: "tabpanel" }, children),
    Accordion: ({ children }: any) =>
      React.createElement("div", null, children),
    AccordionItem: ({ children }: any) =>
      React.createElement("div", null, children),
    AccordionButton: ({ children, onClick }: any) =>
      React.createElement("button", { onClick }, children),
    AccordionPanel: ({ children }: any) =>
      React.createElement("div", null, children),
    AccordionIcon: () => null,
    Checkbox: ({ onChange, isChecked }: any) =>
      React.createElement("input", {
        type: "checkbox",
        onChange,
        checked: isChecked,
      }),
    InputGroup: makeEl("div"),
    InputLeftElement: makeEl("span"),
    InputRightElement: makeEl("span"),
    InputLeftAddon: makeEl("span"),
    InputRightAddon: makeEl("span"),
    FormErrorMessage: makeEl("span"),
    FormHelperText: makeEl("span"),
    Image: ({ src, alt }: any) => React.createElement("img", { src, alt }),
    Avatar: ({ name }: any) =>
      React.createElement("div", { "aria-label": name }),
    Progress: ({ value }: any) =>
      React.createElement("div", { "aria-valuenow": value }),
    Switch: (props: any) =>
      React.createElement("input", { type: "checkbox", ...props }),
    Popover: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) =>
      React.createElement("div", null, children),
    PopoverBody: ({ children }: any) =>
      React.createElement("div", null, children),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    ModalBody: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "×"),
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    DrawerHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    DrawerBody: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "×"),
    Menu: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MenuButton: makeEl("button"),
    MenuList: ({ children }: any) =>
      React.createElement("ul", { role: "menu" }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement("li", { role: "menuitem", onClick }, children),
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
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    NumberInput: ({ children }: any) =>
      React.createElement("div", null, children),
    NumberInputField: makeEl("input"),
    Radio: ({ value }: any) =>
      React.createElement("input", { type: "radio", value }),
    RadioGroup: ({ children, onChange }: any) =>
      React.createElement("div", { onChange }, children),
    Stat: makeEl("div"),
    StatLabel: makeEl("span"),
    StatNumber: makeEl("span"),
    StatHelpText: makeEl("span"),
    StatArrow: () => null,
    AlertDialog: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    AlertDialogContent: ({ children }: any) =>
      React.createElement("div", { role: "alertdialog" }, children),
    AlertDialogHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    AlertDialogBody: ({ children }: any) =>
      React.createElement("div", null, children),
    AlertDialogFooter: ({ children }: any) =>
      React.createElement("div", null, children),
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
  useAuth: mockUseAuth,
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
  createApiClient: jest.fn(() => ({
    getPublicStats: jest.fn().mockResolvedValue(null),
    authenticateUser: jest.fn().mockResolvedValue({}),
    getMatches: jest.fn().mockResolvedValue([]),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getWalletBalance: jest.fn().mockResolvedValue(1.0),
    getTracker: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("react-icons/fi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/bs", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/si", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/md", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/ai", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/io", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/io5", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/hi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/ri", () => new Proxy({}, { get: () => nullIcon }));
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
// eslint-disable-next-line import/first
import * as HowItWorksModule from "@/pages/how-it-works";
// eslint-disable-next-line import/first
import { SEO } from "@/components/SEO";
// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";
// eslint-disable-next-line import/first
import Home from "@/pages/index";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMeta(
  container: HTMLElement,
  selector: string,
  attr = "content"
): string | null {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

function getAllJsonLdScripts(container: HTMLElement): any[] {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]')
  ).map((s) => {
    try {
      return JSON.parse(s.innerHTML);
    } catch {
      return null;
    }
  });
}

function collectJsonLdTypes(container: HTMLElement): Set<string> {
  const types = new Set<string>();
  for (const parsed of getAllJsonLdScripts(container)) {
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

function getBreadcrumbList(container: HTMLElement): any {
  for (const parsed of getAllJsonLdScripts(container)) {
    if (!parsed) continue;
    const graph: any[] = Array.isArray(parsed["@graph"])
      ? parsed["@graph"]
      : [parsed];
    const bl = graph.find((n: any) => n["@type"] === "BreadcrumbList");
    if (bl) return bl;
  }
  return null;
}

const DEFAULT_AUTH = {
  isReady: true,
  isLoggedIn: false,
  userId: null as string | null,
  token: null as string | null,
  authenticate: jest.fn(),
  logout: jest.fn(),
};

// ── Global beforeEach ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigationPush.mockClear();
  mockNavigationReplace.mockClear();
  mockNextRouterPush.mockClear();
  mockNextRouterReplace.mockClear();
  (global.fetch as jest.Mock).mockClear();
  mockUseAuth.mockReturnValue({ ...DEFAULT_AUTH });
});

// ── Group A: Metadata / SEO tags ──────────────────────────────────────────────

describe("Group A — Metadata / SEO tags", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it(`A1: <title> is EXACTLY "${SPEC_TITLE}"`, () => {
    const title = container.querySelector("title");
    expect(title).not.toBeNull();
    const text = title!.textContent ?? "";
    if (text !== SPEC_TITLE) {
      throw new Error(
        `A1 FAILURE — <title> mismatch.\n` +
          `  Expected: "${SPEC_TITLE}"\n` +
          `  Observed: "${text}"`
      );
    }
    expect(text).toBe(SPEC_TITLE);
  });

  it("A2: meta description is EXACTLY the spec string (hyphens, standard apostrophes)", () => {
    const content = getMeta(container, 'meta[name="description"]');
    if (content !== SPEC_META_DESCRIPTION) {
      throw new Error(
        `A2 FAILURE — meta description mismatch.\n` +
          `  Expected: "${SPEC_META_DESCRIPTION}"\n` +
          `  Observed: "${content}"`
      );
    }
    expect(content).toBe(SPEC_META_DESCRIPTION);
  });

  it(`A3: canonical is EXACTLY "${SPEC_CANONICAL}"`, () => {
    const href = container
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    if (href !== SPEC_CANONICAL) {
      throw new Error(
        `A3 FAILURE — canonical mismatch.\n` +
          `  Expected: "${SPEC_CANONICAL}"\n` +
          `  Observed: "${href}"`
      );
    }
    expect(href).toBe(SPEC_CANONICAL);
  });

  it('A4: og:type is exactly "article"', () => {
    const content = getMeta(container, 'meta[property="og:type"]');
    if (content !== SPEC_OG_TYPE) {
      throw new Error(
        `A4 FAILURE — og:type is "${content}", expected "article".`
      );
    }
    expect(content).toBe(SPEC_OG_TYPE);
  });

  it("A5: og:title is EXACTLY the spec string", () => {
    const content = getMeta(container, 'meta[property="og:title"]');
    if (content !== SPEC_OG_TITLE) {
      throw new Error(
        `A5 FAILURE — og:title mismatch.\n` +
          `  Expected: "${SPEC_OG_TITLE}"\n` +
          `  Observed: "${content}"`
      );
    }
    expect(content).toBe(SPEC_OG_TITLE);
  });

  it("A6: og:description is EXACTLY the spec string (hyphens, not dashes)", () => {
    const content = getMeta(container, 'meta[property="og:description"]');
    if (content !== SPEC_OG_DESCRIPTION) {
      throw new Error(
        `A6 FAILURE — og:description mismatch.\n` +
          `  Expected: "${SPEC_OG_DESCRIPTION}"\n` +
          `  Observed: "${content}"`
      );
    }
    expect(content).toBe(SPEC_OG_DESCRIPTION);
  });

  it(`A7: og:image is EXACTLY "${SPEC_OG_IMAGE}" (default, NOT a dedicated /og/ asset)`, () => {
    const content = getMeta(container, 'meta[property="og:image"]');
    // Primary: exact spec URL
    if (content !== SPEC_OG_IMAGE) {
      throw new Error(
        `A7 FAILURE — og:image mismatch.\n` +
          `  Expected: "${SPEC_OG_IMAGE}"\n` +
          `  Observed: "${content}"\n` +
          `  SPEC requires the DEFAULT og:image (no /og/how-it-works.png or similar).`
      );
    }
    expect(content).toBe(SPEC_OG_IMAGE);
    // Belt-and-suspenders: must NOT be a dedicated /og/ path
    expect(content).not.toMatch(/\/og\/how-it-works/);
    expect(content).not.toMatch(/\/og\//);
  });

  it("A8: twitter:title equals og:title (both equal the spec og:title string)", () => {
    const twitterTitle = getMeta(container, 'meta[name="twitter:title"]');
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (twitterTitle !== ogTitle) {
      throw new Error(
        `A8 FAILURE — twitter:title ("${twitterTitle}") != og:title ("${ogTitle}").`
      );
    }
    expect(twitterTitle).toBe(SPEC_OG_TITLE);
  });

  it("A9: twitter:description equals og:description (both equal the spec og:description string)", () => {
    const twitterDesc = getMeta(container, 'meta[name="twitter:description"]');
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    if (twitterDesc !== ogDesc) {
      throw new Error(
        `A9 FAILURE — twitter:description ("${twitterDesc}") != og:description ("${ogDesc}").`
      );
    }
    expect(twitterDesc).toBe(SPEC_OG_DESCRIPTION);
  });
});

// ── Group B: JSON-LD ──────────────────────────────────────────────────────────

describe("Group B — JSON-LD structured data", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it("B1: at least one <script type='application/ld+json'> is rendered", () => {
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBeGreaterThan(0);
  });

  it("B2: all ld+json scripts parse without throwing", () => {
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of scripts) {
      expect(() => JSON.parse(script.innerHTML)).not.toThrow();
    }
  });

  it("B3: @type set across the graph is EXACTLY {WebPage, BreadcrumbList} — no extra types", () => {
    const types = collectJsonLdTypes(container);
    const expected = new Set(["WebPage", "BreadcrumbList"]);
    const extra = Array.from(types).filter((t) => !expected.has(t));
    const missing = Array.from(expected).filter((t) => !types.has(t));
    if (extra.length > 0 || missing.length > 0) {
      throw new Error(
        `B3 FAILURE — @type set mismatch.\n` +
          `  Expected: {WebPage, BreadcrumbList}\n` +
          `  Observed: {${Array.from(types).join(", ")}}\n` +
          (extra.length ? `  Extra (must remove): ${extra.join(", ")}\n` : "") +
          (missing.length ? `  Missing: ${missing.join(", ")}\n` : "")
      );
    }
    expect(types).toEqual(expected);
  });

  const FORBIDDEN_LD_TYPES = [
    "FAQPage",
    "SoftwareApplication",
    "JobPosting",
    "ItemList",
    "Organization",
  ];

  for (const forbiddenType of FORBIDDEN_LD_TYPES) {
    it(`B4: NO node with @type "${forbiddenType}" in any ld+json`, () => {
      const types = collectJsonLdTypes(container);
      if (types.has(forbiddenType)) {
        throw new Error(
          `B4 FAILURE — forbidden @type "${forbiddenType}" found in JSON-LD. ` +
            `Spec requires ONLY WebPage and BreadcrumbList.`
        );
      }
      expect(types.has(forbiddenType)).toBe(false);
    });
  }

  it("B5: BreadcrumbList node exists in the graph", () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
  });

  it('B6: BreadcrumbList position 1 — name="Home", item="https://onlyjobs.app/"', () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
    const items: any[] = bl.itemListElement ?? [];
    const pos1 = items.find((i: any) => i.position === 1);
    if (!pos1) {
      throw new Error(
        `B6 FAILURE — no BreadcrumbList item with position=1. Items: ${JSON.stringify(items)}`
      );
    }
    expect(pos1.name).toBe("Home");
    expect(pos1.item).toBe("https://onlyjobs.app/");
  });

  it('B7: BreadcrumbList position 2 — name="How it works", item="https://onlyjobs.app/how-it-works"', () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
    const items: any[] = bl.itemListElement ?? [];
    const pos2 = items.find((i: any) => i.position === 2);
    if (!pos2) {
      throw new Error(
        `B7 FAILURE — no BreadcrumbList item with position=2. Items: ${JSON.stringify(items)}`
      );
    }
    if (pos2.name !== "How it works") {
      throw new Error(
        `B7 FAILURE — BreadcrumbList pos 2 name is "${pos2.name}", expected "How it works".`
      );
    }
    if (pos2.item !== "https://onlyjobs.app/how-it-works") {
      throw new Error(
        `B7 FAILURE — BreadcrumbList pos 2 item is "${pos2.item}", ` +
          `expected "https://onlyjobs.app/how-it-works".`
      );
    }
    expect(pos2.name).toBe("How it works");
    expect(pos2.item).toBe("https://onlyjobs.app/how-it-works");
  });
});

// ── Group C: Body / Structure ─────────────────────────────────────────────────

describe("Group C — Body / Structure", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it("C1: exactly ONE <h1> on the page", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `C1 FAILURE — expected 1 <h1>, found ${h1s.length}.\n` +
          Array.from(h1s)
            .map((el) => `  "${el.textContent?.trim()}"`)
            .join("\n")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("C2: no <h2> appears BEFORE the <h1> in DOM order", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    const h2sBefore = Array.from(container.querySelectorAll("h2")).filter(
      (h2) => {
        const pos = h2.compareDocumentPosition(h1!);
        return !!(pos & Node.DOCUMENT_POSITION_FOLLOWING);
      }
    );
    if (h2sBefore.length > 0) {
      throw new Error(
        `C2 FAILURE — ${h2sBefore.length} <h2>(s) appear before <h1>:\n` +
          h2sBefore.map((el) => `  "${el.textContent?.trim()}"`).join("\n")
      );
    }
    expect(h2sBefore).toHaveLength(0);
  });

  it('C3: element with id="pricing" exists (the /pricing redirect anchor target)', () => {
    const el = container.querySelector("#pricing");
    if (!el) {
      throw new Error(
        `C3 FAILURE — no element with id="pricing" found. ` +
          `This is the anchor target for /pricing redirect (router.replace("/how-it-works#pricing")).`
      );
    }
    expect(el).not.toBeNull();
  });

  it('C4: a heading with text "Questions" (or containing "Questions") exists for the FAQ section', () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const questionsHeading = headings.find((h) =>
      /questions/i.test(h.textContent ?? "")
    );
    if (!questionsHeading) {
      throw new Error(
        `C4 FAILURE — no heading containing "Questions" found. ` +
          `The FAQ section must have a "Questions" heading per spec.`
      );
    }
    expect(questionsHeading).not.toBeNull();
  });

  it("C5: FAQ answer containing /prepaid wallet/i is visible WITHOUT any interaction (not in Collapse)", () => {
    const text = container.textContent ?? "";
    if (!/prepaid wallet/i.test(text)) {
      throw new Error(
        `C5 FAILURE — /prepaid wallet/i not found in first-render DOM. ` +
          `If this FAQ answer is in a Collapse or Accordion that starts closed, ` +
          `it will not appear. The spec requires answers visible without expansion.`
      );
    }
    expect(text).toMatch(/prepaid wallet/i);
  });

  it("C6: FAQ answer about auto-apply (/no auto-apply|auto-apply/i) visible WITHOUT interaction", () => {
    const text = container.textContent ?? "";
    if (!/no auto-apply|auto-apply/i.test(text)) {
      throw new Error(
        `C6 FAILURE — /no auto-apply|auto-apply/i not found in first-render DOM. ` +
          `FAQ answers must be visible without expanding any Collapse or Accordion.`
      );
    }
    expect(text).toMatch(/no auto-apply|auto-apply/i);
  });

  it('C7: NOT both "Why it fits" AND "What didn\'t fit" card headings present (sample-page layout must not bleed in)', () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const whyFitsCount = headings.filter((h) =>
      /why it fits/i.test(h.textContent ?? "")
    ).length;
    const didntFitCount = headings.filter((h) =>
      /what didn.t fit/i.test(h.textContent ?? "")
    ).length;
    if (whyFitsCount > 0 && didntFitCount > 0) {
      throw new Error(
        `C7 FAILURE — both "Why it fits" (×${whyFitsCount}) and "What didn't fit" (×${didntFitCount}) ` +
          `headings present on /how-it-works. This is the match-card layout from /sample-match-report ` +
          `and must NOT appear here.`
      );
    }
    expect(whyFitsCount > 0 && didntFitCount > 0).toBe(false);
  });
});

// ── Group D: Copy oracles — required ─────────────────────────────────────────

describe("Group D — Required copy (case-insensitive unless noted)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it('D1: REQUIRED — "when application questions" (or "when the listing has application questions")', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const has =
      text.includes("when application questions") ||
      text.includes("when the listing has application questions");
    if (!has) {
      throw new Error(
        `D1 FAILURE — neither "when application questions" nor ` +
          `"when the listing has application questions" found in rendered text. ` +
          `This copy explains when questions are shown and is required by spec.`
      );
    }
    expect(has).toBe(true);
  });

  it('D2: REQUIRED — "not charged"', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("not charged")) {
      throw new Error(
        `D2 FAILURE — "not charged" not found in rendered text.`
      );
    }
    expect(text).toContain("not charged");
  });

  it('D3: REQUIRED — "In Settings" (threshold location)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("in settings")) {
      throw new Error(
        `D3 FAILURE — "In Settings" (case-insensitive) not found. ` +
          `The threshold location copy must reference Settings.`
      );
    }
    expect(text).toContain("in settings");
  });

  it('D4: REQUIRED — "prepaid wallet"', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("prepaid wallet")) {
      throw new Error(`D4 FAILURE — "prepaid wallet" not found in rendered text.`);
    }
    expect(text).toContain("prepaid wallet");
  });

  it('D5: REQUIRED — "Match day" (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("match day")) {
      throw new Error(
        `D5 FAILURE — "Match day" (case-insensitive) not found. ` +
          `The copy must explain what a match day is.`
      );
    }
    expect(text).toContain("match day");
  });

  it('D6: REQUIRED — pricing "$2"', () => {
    const text = container.textContent ?? "";
    if (!text.includes("$2")) {
      throw new Error(
        `D6 FAILURE — "$2" not found in rendered text. ` +
          `The pricing copy must include the $2 wallet top-up amount.`
      );
    }
    expect(text).toContain("$2");
  });

  it('D7: REQUIRED — pricing "$0.30"', () => {
    const text = container.textContent ?? "";
    if (!text.includes("$0.30")) {
      throw new Error(
        `D7 FAILURE — "$0.30" not found in rendered text. ` +
          `The pricing copy must include the $0.30 per-match-day charge.`
      );
    }
    expect(text).toContain("$0.30");
  });

  it('D8: REQUIRED — "no subscription" (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("no subscription")) {
      throw new Error(
        `D8 FAILURE — "no subscription" not found. ` +
          `The copy must make the no-subscription model clear.`
      );
    }
    expect(text).toContain("no subscription");
  });
});

// ── Group E: Copy oracles — forbidden ────────────────────────────────────────

describe("Group E — Forbidden copy / characters", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it('E1: FORBIDDEN — "not shown elsewhere" (corrected copy must NOT claim this)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const html = container.innerHTML.toLowerCase();
    if (text.includes("not shown elsewhere") || html.includes("not shown elsewhere")) {
      throw new Error(
        `E1 FAILURE — forbidden phrase "not shown elsewhere" found. ` +
          `The corrected copy must not make this claim.`
      );
    }
    expect(text).not.toContain("not shown elsewhere");
  });

  it('E2: FORBIDDEN — "30+" (exact substring)', () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    if (text.includes("30+") || html.includes("30+")) {
      throw new Error(`E2 FAILURE — forbidden substring "30+" found.`);
    }
    expect(text).not.toContain("30+");
  });

  it('E3: FORBIDDEN — "live jobs" (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (text.includes("live jobs")) {
      throw new Error(`E3 FAILURE — forbidden text "live jobs" found.`);
    }
    expect(text).not.toContain("live jobs");
  });

  it("E4: FORBIDDEN — numeric count claim: /\\d[\\d,]*\\+?\\s*(job seekers|live jobs|jobs in)/i", () => {
    const text = container.textContent ?? "";
    const numericClaim =
      /\d[\d,]*\+?\s*(job seekers|live jobs|jobs in)/i.test(text);
    if (numericClaim) {
      const match = text.match(/\d[\d,]*\+?\s*(job seekers|live jobs|jobs in)/i);
      throw new Error(
        `E4 FAILURE — numeric count claim found: "${match?.[0]}". ` +
          `The spec forbids numeric count claims like "5,000+ job seekers" or "1,000+ jobs in". ` +
          `NOTE: bare "job seekers" or "on-site" without a leading number are NOT banned and must pass.`
      );
    }
    expect(numericClaim).toBe(false);
  });

  it('E5: FORBIDDEN — em-dash "\\u2014" (—) in rendered text or HTML', () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    const emDash = "—";
    if (text.includes(emDash) || html.includes(emDash)) {
      const idx = text.indexOf(emDash);
      const excerpt =
        idx >= 0 ? text.substring(Math.max(0, idx - 20), idx + 20) : "(in HTML)";
      throw new Error(
        `E5 FAILURE — em-dash (—) found. Context: "…${excerpt}…"\n` +
          `All dashes in copy must be plain hyphens (-).`
      );
    }
    expect(text).not.toContain(emDash);
    expect(html).not.toContain(emDash);
  });

  it('E6: FORBIDDEN — en-dash "\\u2013" (–) in rendered text or HTML', () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    const enDash = "–";
    if (text.includes(enDash) || html.includes(enDash)) {
      const idx = text.indexOf(enDash);
      const excerpt =
        idx >= 0 ? text.substring(Math.max(0, idx - 20), idx + 20) : "(in HTML)";
      throw new Error(
        `E6 FAILURE — en-dash (–) found. Context: "…${excerpt}…"\n` +
          `All dashes in copy must be plain hyphens (-).`
      );
    }
    expect(text).not.toContain(enDash);
    expect(html).not.toContain(enDash);
  });

  it('E7: FORBIDDEN — "testimonial" (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (text.includes("testimonial")) {
      throw new Error(`E7 FAILURE — forbidden word "testimonial" found.`);
    }
    expect(text).not.toContain("testimonial");
  });
});

// ── Group F: CTAs ─────────────────────────────────────────────────────────────

describe("Group F — CTAs", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<HowItWorksPage />));
  });

  it(`F1: anchor with href EXACTLY "${SPEC_CTA_SAMPLE}" exists`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_SAMPLE
    );
    if (!cta) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `F1 FAILURE — no <a href="${SPEC_CTA_SAMPLE}"> found.\n` +
          `  All hrefs found: ${found}\n` +
          `  NOTE: if the CTA uses Chakra Button as="a", the Button mock must forward both "as" and "href".`
      );
    }
    expect(cta).not.toBeNull();
  });

  it(`F2: anchor with href EXACTLY "${SPEC_CTA_SIGNUP}" exists`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_SIGNUP
    );
    if (!cta) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `F2 FAILURE — no <a href="${SPEC_CTA_SIGNUP}"> found.\n` +
          `  All hrefs found: ${found}\n` +
          `  ADVERSARIAL: check that the utm_medium is "how-it-works" and the hash "#signup" is present.`
      );
    }
    expect(cta).not.toBeNull();
  });
});

// ── Group G: /pricing redirect ────────────────────────────────────────────────

describe("Group G — /pricing redirect", () => {
  beforeEach(() => {
    mockNavigationReplace.mockClear();
    mockNavigationPush.mockClear();
  });

  it("G1: mounting PricingPage calls router.replace exactly ONCE", async () => {
    render(<PricingPage />);
    await waitFor(() => {
      expect(mockNavigationReplace).toHaveBeenCalledTimes(1);
    });
    // Adversarial: not called a second time (double-effect, missing deps guard)
    expect(mockNavigationReplace).toHaveBeenCalledTimes(1);
  });

  it(`G2: replace called with EXACTLY "${SPEC_PRICING_REDIRECT}" (hash included)`, async () => {
    render(<PricingPage />);
    await waitFor(() => {
      expect(mockNavigationReplace).toHaveBeenCalledTimes(1);
    });
    const actual = mockNavigationReplace.mock.calls[0]?.[0];
    if (actual !== SPEC_PRICING_REDIRECT) {
      throw new Error(
        `G2 FAILURE — replace called with "${actual}", expected "${SPEC_PRICING_REDIRECT}".\n` +
          `  If the hash "#pricing" is missing, the browser will not scroll to the pricing section.`
      );
    }
    expect(actual).toBe(SPEC_PRICING_REDIRECT);
  });

  it('G3: replace NOT called with "/how-it-works" (hash-less — would miss the pricing section)', async () => {
    render(<PricingPage />);
    await waitFor(() => {
      expect(mockNavigationReplace).toHaveBeenCalled();
    });
    expect(mockNavigationReplace).not.toHaveBeenCalledWith("/how-it-works");
  });

  it("G4: router.push NOT called during /pricing mount (replace, not push)", async () => {
    render(<PricingPage />);
    // Give effects time to run
    await waitFor(() => {
      expect(mockNavigationReplace).toHaveBeenCalled();
    });
    expect(mockNavigationPush).not.toHaveBeenCalled();
  });
});

// ── Group H: Static / auth guarantees ────────────────────────────────────────

describe("Group H — Static / auth guarantees (/how-it-works)", () => {
  it("H1: rendering does NOT call fetch with any /api/ URL", () => {
    render(<HowItWorksPage />);
    const apiCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [any]) => /\/api\//i.test(String(url))
    );
    if (apiCalls.length > 0) {
      throw new Error(
        `H1 FAILURE — fetch called with /api/ URL: "${apiCalls[0][0]}". ` +
          `This page must be fully static.`
      );
    }
    expect(apiCalls).toHaveLength(0);
  });

  it("H2: rendering does NOT call fetch with any /jobs/stats URL", () => {
    render(<HowItWorksPage />);
    const statsCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [any]) => String(url).includes("/jobs/stats")
    );
    if (statsCalls.length > 0) {
      throw new Error(
        `H2 FAILURE — fetch called with /jobs/stats URL: "${statsCalls[0][0]}". ` +
          `This page must not fetch live job data.`
      );
    }
    expect(statsCalls).toHaveLength(0);
  });

  it("H3: module does NOT export 'getServerSideProps'", () => {
    const hasSSP = "getServerSideProps" in HowItWorksModule;
    if (hasSSP) {
      throw new Error(
        `H3 FAILURE — page exports getServerSideProps. ` +
          `This must be a fully static component with no server-side data fetching.`
      );
    }
    expect(hasSSP).toBe(false);
  });

  it("H4: module does NOT export 'getStaticProps'", () => {
    const hasGSP = "getStaticProps" in HowItWorksModule;
    if (hasGSP) {
      throw new Error(
        `H4 FAILURE — page exports getStaticProps. ` +
          `This should be a plain static component.`
      );
    }
    expect(hasGSP).toBe(false);
  });

  it("H5: logged-in auth state does NOT trigger router push or replace (no redirect-to-/today effect)", () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      isLoggedIn: true,
      userId: "user-abc",
      token: "tok-xyz",
      authenticate: jest.fn(),
      logout: jest.fn(),
    });
    render(<HowItWorksPage />);
    expect(mockNavigationPush).not.toHaveBeenCalled();
    expect(mockNavigationReplace).not.toHaveBeenCalled();
    expect(mockNextRouterPush).not.toHaveBeenCalled();
    expect(mockNextRouterReplace).not.toHaveBeenCalled();
  });
});

// ── Group I: Footer + sitemap ─────────────────────────────────────────────────

describe("Group I — Footer + sitemap", () => {
  let footerContainer: HTMLElement;

  beforeEach(() => {
    ({ container: footerContainer } = render(<Footer />));
  });

  it('I1: Footer has an anchor with href="/how-it-works"', () => {
    const anchors = Array.from(footerContainer.querySelectorAll("a"));
    const link = anchors.find(
      (a) => a.getAttribute("href") === "/how-it-works"
    );
    if (!link) {
      const found = anchors.map((a) => a.getAttribute("href")).join(", ");
      throw new Error(
        `I1 FAILURE — no anchor href="/how-it-works" in Footer.\n` +
          `  Found hrefs: ${found}`
      );
    }
    expect(link).not.toBeNull();
  });

  it('I2: Footer "OnlyJobs" wordmark is NOT a heading element (must use as="span")', () => {
    const headingEls = footerContainer.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );
    const wordmarkHeadings = Array.from(headingEls).filter(
      (el) => el.textContent?.trim() === "OnlyJobs"
    );
    if (wordmarkHeadings.length > 0) {
      throw new Error(
        `I2 FAILURE — Footer "OnlyJobs" rendered as <${wordmarkHeadings.map((e) => e.tagName).join(", ")}>. ` +
          `Must use as="span" to avoid heading-order violations.`
      );
    }
    expect(wordmarkHeadings).toHaveLength(0);
  });

  it("I3: public/sitemap.xml contains <loc>https://onlyjobs.app/how-it-works</loc>", () => {
    const sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
    const hasEntry = sitemapXml.includes(
      "<loc>https://onlyjobs.app/how-it-works</loc>"
    );
    if (!hasEntry) {
      throw new Error(
        `I3 FAILURE — <loc>https://onlyjobs.app/how-it-works</loc> not found in sitemap.xml.`
      );
    }
    expect(hasEntry).toBe(true);
  });

  it("I4: public/sitemap.xml does NOT contain /pricing", () => {
    const sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
    if (sitemapXml.includes("/pricing")) {
      throw new Error(
        `I4 FAILURE — /pricing found in sitemap.xml. ` +
          `The /pricing page is a client-side redirect and must NOT be in the sitemap.`
      );
    }
    expect(sitemapXml).not.toContain("/pricing");
  });
});

// ── Group J: SEO component regression ────────────────────────────────────────
// Verify that adding an `ogType="article"` prop to this page did not break
// the SEO component's defaults for pages that do NOT pass ogType.

describe("Group J — SEO component regression (real SEO component, unmocked)", () => {
  it("J1: SEO with {title, description} only still emits og:type='website' (default not overridden)", () => {
    const { container } = render(
      <SEO title="Plain Page" description="Plain description." />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "website") {
      throw new Error(
        `J1 FAILURE — SEO default og:type broken. Expected "website", got "${ogType}". ` +
          `The /how-it-works extension may have changed the default.`
      );
    }
    expect(ogType).toBe("website");
  });

  it("J2: SEO with {title, description} only emits DEFAULT og:image (not the /how-it-works og image)", () => {
    const { container } = render(
      <SEO title="Plain Page" description="Plain description." />
    );
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SPEC_OG_IMAGE) {
      throw new Error(
        `J2 FAILURE — SEO default og:image broken.\n` +
          `  Expected: "${SPEC_OG_IMAGE}"\n` +
          `  Observed: "${ogImage}"`
      );
    }
    expect(ogImage).toBe(SPEC_OG_IMAGE);
  });

  it("J3: SEO fullTitle rule — title without 'OnlyJobs' gets ' | OnlyJobs' suffix", () => {
    const { container } = render(
      <SEO title="Plain Page" description="desc." />
    );
    const titleEl = container.querySelector("title");
    expect(titleEl?.textContent).toBe("Plain Page | OnlyJobs");
  });

  it("J4: SEO with ogType='article' overrides og:type correctly", () => {
    const { container } = render(
      <SEO
        title="Article Page | OnlyJobs"
        description="Article description."
        ogType="article"
      />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    expect(ogType).toBe("article");
  });
});

// ── Group K: Homepage links to /how-it-works ─────────────────────────────────

describe("Group K — Homepage internal links to /how-it-works", () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ ...DEFAULT_AUTH });
    ({ container } = render(<Home />));
  });

  it('K1: homepage has AT LEAST TWO anchors with href EXACTLY "/how-it-works" (footer link + in-section link)', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const links = anchors.filter(
      (a) => a.getAttribute("href") === "/how-it-works"
    );
    if (links.length < 2) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `K1 FAILURE — expected AT LEAST 2 anchors with href="/how-it-works" on the homepage, ` +
          `found ${links.length}.\n` +
          `  The footer always provides one; the in-section link must provide a second.\n` +
          `  Removing the in-section link (leaving only the footer) MUST fail this test.\n` +
          `  All hrefs: ${found}`
      );
    }
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('K2: homepage has an anchor with href EXACTLY "/how-it-works#pricing"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const link = anchors.find(
      (a) => a.getAttribute("href") === "/how-it-works#pricing"
    );
    if (!link) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `K2 FAILURE — no <a href="/how-it-works#pricing"> found on the homepage.\n` +
          `  All hrefs: ${found}\n` +
          `  This test MUST fail if the link is removed from index.tsx.`
      );
    }
    expect(link).not.toBeNull();
  });
});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (all explicitly allowed):
//   - src/__tests__/24g.2.sample-match-report.adversarial.test.tsx
//     Used for: Chakra mock structure (Heading as-forwarding, Button as+href, Collapse
//     starts-closed, Proxy for unknown hooks), fetch mock pattern, getMeta/getBreadcrumbList
//     helpers, mock patterns for next/head passthrough, styled-components, AuthContext,
//     GuideContext, analytics, apiClient.
//   - src/__tests__/24g.3.how-it-works.smoke.test.tsx
//     Used for: mockReplace const-before-jest.mock hoist pattern; confirmed both
//     HowItWorksPage and PricingPage can be imported; pattern for waitFor on the
//     pricing redirect assertion; Box forwards `id` observation (critical for C3).
//   - src/components/SEO.tsx
//     Used for: understanding fullTitle rule (includes "OnlyJobs" → no suffix added),
//     DEFAULT_OG_IMAGE constant, SEO props interface, ogType/ogTitle/ogDescription
//     resolution. Oracles for Group A come from the SPEC, not from running SEO — SEO.tsx
//     was read only to understand which prop values produce the spec output.
//   - src/components/Footer.tsx
//     Used for: confirming href="/how-it-works" and Heading as="span" pattern exist.
//     Assertions in Group I are oracle-from-spec (spec requires both); the file read
//     confirmed the structure but did not change the assertions.
//   - public/sitemap.xml
//     Used for: Group I sitemap assertions. File read confirmed 6 entries and the
//     format, but assertions (has /how-it-works, NOT has /pricing) come from the spec.
//   - jest.config.ts
//     Used for: testEnvironment (jsdom), moduleNameMapper (@/ alias), transform config.
//
// Incidental knowledge kept OUT of oracles:
//   - Reading SEO.tsx confirmed the `canonical` prop is relative (gets BASE_URL prepended).
//     The A3 assertion uses the full spec URL "https://onlyjobs.app/how-it-works" which
//     is what SEO.tsx emits for canonical="/how-it-works". This is spec-derived.
//   - The smoke test reveals Box forwards `id`. My adversarial Chakra mock was updated
//     to also forward `id` in makeEl, which is required for C3 to be non-trivially correct
//     (without it, querySelector("#pricing") always returns null, giving a false positive).
//   - The smoke test uses `const mockReplace = jest.fn()` before jest.mock to hoist it.
//     I followed this pattern for all four spy variables. This is infrastructure, not oracle.
//
// Limitations (items untestable without reading implementation bodies):
//   - C5/C6 (FAQ answer visibility): if the page places answers in Collapse(in=false),
//     the test catches it. But if answers are conditionally shown via CSS class rather
//     than inline style, jsdom will not catch display:none from CSS — Playwright is needed.
//   - H5 (no auth redirect): the test exercises the "isLoggedIn: true" path via the
//     mock, but if the page checks isReady before redirecting, the test may not trigger
//     the redirect even in a buggy implementation. Marked as a known limitation.
//   - The exact question headings and answer text in the FAQ are not known without reading
//     the page body. C5/C6 use conservative patterns (/prepaid wallet/i, /auto-apply/i)
//     that the spec explicitly called out as known answer text.
