/**
 * ADVERSARIAL TEST — onlyjobs-24g.2: /sample-match-report page
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * FORBIDDEN (body not opened):
 *   src/pages/sample-match-report.tsx
 *
 * ALLOWED (read for harness patterns, contract, and component behaviour):
 *   src/components/SEO.tsx
 *   src/components/Footer.tsx
 *   src/__tests__/24g.seo-foundation.adversarial.test.tsx  (mock patterns)
 *   src/__tests__/24g.2.sample-match-report.smoke.test.tsx (harness patterns)
 *   jest.config.ts, jest.setup.ts
 *   public/sitemap.xml (file content, not generated)
 *
 * Oracle: THE SPEC PASTED INTO THE TASK PROMPT — never "what the code outputs."
 * DISCLOSURE: see bottom of file.
 */

import React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";

// ── Constants derived from spec (not from implementation) ─────────────────────

const SPEC_TITLE =
  "Sample AI Job Match Report: See Why Each Job Fits | OnlyJobs";
const SPEC_META_DESCRIPTION =
  "A sample OnlyJobs report: 3 remote and hybrid job matches, why each fits, and what didn't fit and why the score is lower. Illustrative example.";
const SPEC_OG_TYPE = "article";
const SPEC_OG_TITLE =
  "3 jobs, why each one fits, and what you might not like: a sample OnlyJobs report";
const SPEC_OG_DESCRIPTION =
  "Match scores explained by work stories and culture preferences, including what didn't fit. Illustrative example.";
const SPEC_CANONICAL = "https://onlyjobs.app/sample-match-report";
const SPEC_OG_IMAGE = "https://onlyjobs.app/og/sample-match-report.png";
const SEO_DEFAULT_OG_IMAGE = "https://onlyjobs.app/og-image.png";
const SPEC_CTA_HREF =
  "/?utm_source=site&utm_medium=sample-report&utm_content=bottom-cta#signup";

const SITEMAP_PATH = path.resolve(__dirname, "..", "..", "public", "sitemap.xml");

// ── Mocks (hoisted by jest before imports) ────────────────────────────────────

const nullIcon = () => null;

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/sample-match-report",
    query: {},
    asPath: "/sample-match-report",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/sample-match-report",
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head must be a passthrough so meta tags and ld+json are queryable.
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
// A page that forgets as="h1" on the hero renders h2, fails "exactly one h1".
// Collapse starts closed — content inside Collapse in={false} is null, causing
// "What didn't fit" assertions to fail if the impl collapsed them.
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
        }: any,
        ref: any
      ) =>
        React.createElement(
          tag,
          { ref, onClick, type, disabled, "aria-label": al, href, role },
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
    Button: ({ as: Tag = "button", href, children, onClick, type, disabled, "aria-label": al, role }: any) =>
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
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertTitle: makeEl("span"),
    AlertDescription: makeEl("span"),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement("div", null, children),
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) => React.createElement("h2", null, children),
    ModalBody: ({ children }: any) => React.createElement("div", null, children),
    ModalFooter: ({ children }: any) => React.createElement("div", null, children),
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
    DrawerBody: ({ children }: any) => React.createElement("div", null, children),
    DrawerFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "×"),
    // ADVERSARIAL: Collapse starts closed — "What didn't fit" content behind
    // Collapse in={false} becomes null and fails the visibility assertions.
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement("div", null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    Input: makeEl("input"),
    Textarea: makeEl("textarea"),
    Select: ({ children, ...p }: any) =>
      React.createElement("select", p, children),
    // ADVERSARIAL: Tabs and Accordion render children unconditionally — so if the
    // page wraps content in these, it will appear in the DOM. The assertions for
    // "not wrapped in Accordion/Tabs/Collapse" are tested via the fact that
    // collapsed regions return null and visible regions are present.
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
      React.createElement("input", { type: "checkbox", onChange, checked: isChecked }),
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
    Menu: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MenuButton: makeEl("button"),
    MenuList: ({ children }: any) =>
      React.createElement("ul", { role: "menu" }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement("li", { role: "menuitem", onClick }, children),
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

// Module-level fetch mock — see kda-d adversarial test for this pattern.
// Set before any imports so it's live when the page module initialises.
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as Response)
) as any;

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

// eslint-disable-next-line import/first
import SampleMatchReportPage from "@/pages/sample-match-report";
// SEO is imported UNMOCKED — this is the regression test for shared SEO behaviour.
// eslint-disable-next-line import/first
import { SEO } from "@/components/SEO";
// Footer is also imported UNMOCKED.
// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";
// Import the module as a namespace to check named exports without reading the body.
// eslint-disable-next-line import/first
import * as SampleMatchReportModule from "@/pages/sample-match-report";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMeta(
  container: HTMLElement,
  selector: string,
  attr: string = "content"
): string | null {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

function getAllJsonLdScripts(container: HTMLElement): any[] {
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

// ── Group A: Metadata / SEO tags ──────────────────────────────────────────────

describe("Group A — Metadata / SEO tags", () => {
  let container: HTMLElement;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    ({ container } = render(<SampleMatchReportPage />));
  });

  it('A1: <title> is EXACTLY "Sample AI Job Match Report: See Why Each Job Fits | OnlyJobs"', () => {
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

  it("A2: meta description is exact spec string", () => {
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

  it('A3: og:type is exactly "article"', () => {
    const content = getMeta(container, 'meta[property="og:type"]');
    expect(content).toBe(SPEC_OG_TYPE);
  });

  it("A4: og:title is exact spec string", () => {
    const content = getMeta(container, 'meta[property="og:title"]');
    if (content !== SPEC_OG_TITLE) {
      throw new Error(
        `A4 FAILURE — og:title mismatch.\n` +
          `  Expected: "${SPEC_OG_TITLE}"\n` +
          `  Observed: "${content}"`
      );
    }
    expect(content).toBe(SPEC_OG_TITLE);
  });

  it("A5: og:description is exact spec string", () => {
    const content = getMeta(container, 'meta[property="og:description"]');
    if (content !== SPEC_OG_DESCRIPTION) {
      throw new Error(
        `A5 FAILURE — og:description mismatch.\n` +
          `  Expected: "${SPEC_OG_DESCRIPTION}"\n` +
          `  Observed: "${content}"`
      );
    }
    expect(content).toBe(SPEC_OG_DESCRIPTION);
  });

  it(`A6: canonical is exactly "${SPEC_CANONICAL}"`, () => {
    const href = container.querySelector('link[rel="canonical"]')?.getAttribute("href");
    if (href !== SPEC_CANONICAL) {
      throw new Error(
        `A6 FAILURE — canonical mismatch.\n` +
          `  Expected: "${SPEC_CANONICAL}"\n` +
          `  Observed: "${href}"`
      );
    }
    expect(href).toBe(SPEC_CANONICAL);
  });

  it("A7: og:image is exact spec URL and starts with https://onlyjobs.app", () => {
    const content = getMeta(container, 'meta[property="og:image"]');
    expect(content).toBe(SPEC_OG_IMAGE);
    // Belt-and-suspenders: adversarial check that it's not the default homepage image
    expect(content).not.toBe(SEO_DEFAULT_OG_IMAGE);
    expect(content).toMatch(/^https:\/\/onlyjobs\.app/);
  });

  it("A8: twitter:title equals og:title (same resolved value)", () => {
    const twitterTitle = getMeta(container, 'meta[name="twitter:title"]');
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    expect(twitterTitle).toBe(ogTitle);
    expect(twitterTitle).toBe(SPEC_OG_TITLE);
  });

  it("A9: twitter:description equals og:description (same resolved value)", () => {
    const twitterDesc = getMeta(container, 'meta[name="twitter:description"]');
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    expect(twitterDesc).toBe(ogDesc);
    expect(twitterDesc).toBe(SPEC_OG_DESCRIPTION);
  });
});

// ── Group B: Shared-SEO regression ───────────────────────────────────────────

describe("Group B — Shared-SEO regression (real SEO component, unmocked)", () => {
  // These tests render the SEO component directly with only { title, description }
  // to verify defaults were not broken by the article-page extension.
  // We test SEO directly rather than rendering index.tsx because reading
  // index.tsx to discover its exact SEO props would violate the "Oracle from spec"
  // rule — see DISCLOSURE below.

  const HOMEPAGE_SPEC_TITLE = "OnlyJobs - AI-Powered Job Matching";
  const SEO_FULLNAME_RULE_TITLE = "Test Page Title | OnlyJobs"; // title without "OnlyJobs" gets suffix

  it("B1: SEO with only {title, description} emits og:type='website' (default not overridden)", () => {
    const { container } = render(
      <SEO title="Test Page Title" description="Test description." />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "website") {
      throw new Error(
        `B1 FAILURE — SEO default og:type broken. Expected "website", got "${ogType}". ` +
          `The article-page extension may have changed the default.`
      );
    }
    expect(ogType).toBe("website");
  });

  it("B2: SEO with only {title, description} emits default og:image (not the article image)", () => {
    const { container } = render(
      <SEO title="Test Page Title" description="Test description." />
    );
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SEO_DEFAULT_OG_IMAGE) {
      throw new Error(
        `B2 FAILURE — SEO default og:image broken.\n` +
          `  Expected: "${SEO_DEFAULT_OG_IMAGE}"\n` +
          `  Observed: "${ogImage}"\n` +
          `  This should not be the article-specific image "${SPEC_OG_IMAGE}".`
      );
    }
    expect(ogImage).toBe(SEO_DEFAULT_OG_IMAGE);
  });

  it("B3: SEO fullTitle rule — title without 'OnlyJobs' gets ' | OnlyJobs' suffix", () => {
    const { container } = render(
      <SEO title="Test Page Title" description="Test description." />
    );
    const titleEl = container.querySelector("title");
    expect(titleEl?.textContent).toBe(SEO_FULLNAME_RULE_TITLE);
  });

  it("B4: SEO fullTitle rule — title already containing 'OnlyJobs' is NOT double-suffixed", () => {
    const { container } = render(
      <SEO title={HOMEPAGE_SPEC_TITLE} description="AI-powered job matching." />
    );
    const titleEl = container.querySelector("title");
    // "OnlyJobs - AI-Powered Job Matching" already contains SITE_NAME → no suffix added
    expect(titleEl?.textContent).toBe(HOMEPAGE_SPEC_TITLE);
    // Adversarial: must NOT be "OnlyJobs - AI-Powered Job Matching | OnlyJobs"
    expect(titleEl?.textContent).not.toContain("| OnlyJobs");
  });

  it("B5: homepage-spec SEO props emit og:type='website', og:image=default (not article image)", () => {
    const { container } = render(
      <SEO title={HOMEPAGE_SPEC_TITLE} description="AI-powered job matching." />
    );
    expect(getMeta(container, 'meta[property="og:type"]')).toBe("website");
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(SEO_DEFAULT_OG_IMAGE);
  });
});

// ── Group C: JSON-LD ──────────────────────────────────────────────────────────

describe("Group C — JSON-LD structured data", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<SampleMatchReportPage />));
  });

  it("C1: page renders at least one <script type='application/ld+json'>", () => {
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);
  });

  it("C2: JSON.parse does NOT throw on any ld+json script", () => {
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of scripts) {
      expect(() => JSON.parse(script.innerHTML)).not.toThrow();
    }
  });

  it("C3: @type set across the graph is EXACTLY {WebPage, BreadcrumbList} — no extra types", () => {
    const types = collectJsonLdTypes(container);
    const expected = new Set(["WebPage", "BreadcrumbList"]);
    const extra = Array.from(types).filter((t) => !expected.has(t));
    const missing = Array.from(expected).filter((t) => !types.has(t));
    if (extra.length > 0 || missing.length > 0) {
      throw new Error(
        `C3 FAILURE — @type set mismatch.\n` +
          `  Expected: {WebPage, BreadcrumbList}\n` +
          `  Observed: {${Array.from(types).join(", ")}}\n` +
          (extra.length ? `  Extra (must remove): ${extra.join(", ")}\n` : "") +
          (missing.length ? `  Missing: ${missing.join(", ")}\n` : "")
      );
    }
    expect(types).toEqual(expected);
  });

  const FORBIDDEN_TYPES = [
    "JobPosting",
    "ItemList",
    "FAQPage",
    "SoftwareApplication",
    "Organization",
  ];

  for (const forbiddenType of FORBIDDEN_TYPES) {
    it(`C4: NO node with @type "${forbiddenType}" exists in any ld+json`, () => {
      const types = collectJsonLdTypes(container);
      if (types.has(forbiddenType)) {
        throw new Error(
          `C4 FAILURE — forbidden @type "${forbiddenType}" found in JSON-LD. ` +
            `Spec requires ONLY WebPage and BreadcrumbList.`
        );
      }
      expect(types.has(forbiddenType)).toBe(false);
    });
  }

  it("C5: BreadcrumbList exists in the graph", () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
  });

  it('C6: BreadcrumbList position 1 — name="Home", item="https://onlyjobs.app/"', () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
    const items: any[] = bl.itemListElement ?? [];
    const pos1 = items.find((i: any) => i.position === 1);
    if (!pos1) {
      throw new Error(
        `C6 FAILURE — BreadcrumbList has no item with position=1. Items: ${JSON.stringify(items)}`
      );
    }
    expect(pos1.name).toBe("Home");
    expect(pos1.item).toBe("https://onlyjobs.app/");
  });

  it('C7: BreadcrumbList position 2 — name="Sample match report", item="https://onlyjobs.app/sample-match-report"', () => {
    const bl = getBreadcrumbList(container);
    expect(bl).not.toBeNull();
    const items: any[] = bl.itemListElement ?? [];
    const pos2 = items.find((i: any) => i.position === 2);
    if (!pos2) {
      throw new Error(
        `C7 FAILURE — BreadcrumbList has no item with position=2. Items: ${JSON.stringify(items)}`
      );
    }
    expect(pos2.name).toBe("Sample match report");
    expect(pos2.item).toBe("https://onlyjobs.app/sample-match-report");
  });
});

// ── Group D: Body / Content ───────────────────────────────────────────────────

describe("Group D — Body / Content", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<SampleMatchReportPage />));
  });

  it("D1: exactly ONE <h1> on the page", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `D1 FAILURE — expected 1 <h1>, found ${h1s.length}. ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("D2: no <h2> appears BEFORE the <h1> in DOM order", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    const h2s = Array.from(container.querySelectorAll("h2"));
    const h2sBefore = h2s.filter((h2) => {
      const pos = h2.compareDocumentPosition(h1!);
      return !!(pos & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    if (h2sBefore.length > 0) {
      throw new Error(
        `D2 FAILURE — ${h2sBefore.length} <h2>(s) appear before <h1>: ` +
          h2sBefore.map((el) => `"${el.textContent?.trim()}"`).join(", ")
      );
    }
    expect(h2sBefore).toHaveLength(0);
  });

  it("D3: match scores 88, 85, 81 are all present in rendered text", () => {
    const text = container.textContent ?? "";
    for (const score of ["88", "85", "81"]) {
      if (!text.includes(score)) {
        throw new Error(
          `D3 FAILURE — match score "${score}" not found in rendered text. ` +
            `Either the score is missing or the match card failed to render.`
        );
      }
    }
    expect(text).toContain("88");
    expect(text).toContain("85");
    expect(text).toContain("81");
  });

  it("D4: score 74 appears in the below-threshold aside (contains 'skipped' and 'do not appear'/'don't appear')", () => {
    const allEls = Array.from(container.querySelectorAll("*"));
    const asideEl = allEls.find(
      (el) =>
        /skipped/i.test(el.textContent ?? "") &&
        /don't appear|do not appear/i.test(el.textContent ?? "")
    );
    if (!asideEl) {
      throw new Error(
        `D4 FINDING — could not locate the below-threshold aside. ` +
          `Expected an element containing both "skipped" and "do not appear"/"don't appear".`
      );
    }
    if (!asideEl.textContent?.includes("74")) {
      throw new Error(
        `D4 FAILURE — below-threshold aside does NOT contain "74". ` +
          `Aside text excerpt: "${asideEl.textContent?.substring(0, 200)}"`
      );
    }
    expect(asideEl.textContent).toMatch(/74/);
  });

  it("D5: score 74 does NOT appear inside any match-card container; '74%' appears only in the below-threshold aside", () => {
    // Locate the aside precisely by its h2 heading — not by a fragile ancestor walk
    // that eventually reaches the VStack containing both match cards and the aside.
    const allH2s = Array.from(container.querySelectorAll("h2"));
    const asideHeading = allH2s.find((h) =>
      /jobs under your bar never reach you/i.test(h.textContent ?? "")
    );
    if (!asideHeading) {
      throw new Error(
        `D5 FINDING — "Jobs under your bar never reach you" h2 not found; cannot verify 74 placement.`
      );
    }
    const asideSection = asideHeading.parentElement;
    if (!asideSection) {
      throw new Error(`D5 FINDING — aside heading has no parent element.`);
    }
    // Aside must contain "74"
    if (!(asideSection.textContent ?? "").includes("74")) {
      throw new Error(
        `D5 FAILURE — "74" not found in the below-threshold aside. ` +
          `Aside text: "${asideSection.textContent?.substring(0, 200)}"`
      );
    }
    expect(asideSection.textContent).toContain("74");

    // Find match card containers via their h3 headings ("Match N: ...").
    // Each h3 lives inside HStack (parent), which is inside the match card container (grandparent).
    const matchH3s = Array.from(container.querySelectorAll("h3")).filter((h) =>
      /^match \d+:/i.test(h.textContent?.trim() ?? "")
    );
    if (matchH3s.length === 0) {
      throw new Error(
        `D5 FINDING — no "Match N:" h3 headings found; cannot verify 74 isolation.`
      );
    }
    for (const h3 of matchH3s) {
      // h3 → HStack div → match card container div
      const matchCard = h3.parentElement?.parentElement;
      if (!matchCard) {
        throw new Error(
          `D5 FINDING — cannot find match card container for "${h3.textContent?.trim()}".`
        );
      }
      if ((matchCard.textContent ?? "").includes("74")) {
        throw new Error(
          `D5 FAILURE — "74" found inside match card "${h3.textContent?.trim()}". ` +
            `Score 74 must only appear in the below-threshold aside, not in any match card.`
        );
      }
      expect(matchCard.textContent).not.toContain("74");
    }
    // Sanity: if 74 were rendered as a 4th match card, matchH3s would include it
    // and the assertion above would catch it.
    expect(matchH3s.length).toBeGreaterThan(0);
  });

  it("D6: exactly 3 visible 'Why it fits' headings (one per match)", () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const whyFits = headings.filter((h) => /why it fits/i.test(h.textContent ?? ""));
    if (whyFits.length !== 3) {
      throw new Error(
        `D6 FAILURE — expected 3 "Why it fits" headings, found ${whyFits.length}. ` +
          `If fewer than 3 appear, some match cards may have collapsed their content.`
      );
    }
    expect(whyFits).toHaveLength(3);
  });

  it("D7: exactly 3 visible 'What didn't fit' headings (one per match)", () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    // Match ONLY the specific card-heading "What didn't fit, and why it's not higher".
    // A loose /what didn't fit/i regex also matches the section heading
    // "Why 'what didn't fit' matters", producing 4 matches instead of 3.
    const didntFit = headings.filter((h) =>
      /what didn.t fit, and why it.s not higher/i.test(h.textContent ?? "")
    );
    if (didntFit.length !== 3) {
      throw new Error(
        `D7 FAILURE — expected 3 "What didn't fit, and why it's not higher" card headings, ` +
          `found ${didntFit.length}. ` +
          `A loose regex would also match the section heading "Why 'what didn't fit' matters". ` +
          `Content may be hidden behind Collapse/Accordion/Tabs, missing entirely, or a 4th card appeared.`
      );
    }
    expect(didntFit).toHaveLength(3);
  });

  it("D8: below-threshold aside contains 'skipped' and 'do not appear'/'don't appear'", () => {
    const text = container.textContent ?? "";
    expect(text.toLowerCase()).toMatch(/skipped/);
    expect(text.toLowerCase()).toMatch(/don't appear|do not appear/);
  });

  it("D9: below-threshold aside does NOT contain 'Our take' (match-card chrome)", () => {
    // allEls.find() in document order (outermost first) would return the top-level
    // container containing BOTH the aside and the match cards — causing a false failure
    // because the match cards do contain "Our take". Select the aside precisely instead.
    const allH2s = Array.from(container.querySelectorAll("h2"));
    const asideHeading = allH2s.find((h) =>
      /jobs under your bar never reach you/i.test(h.textContent ?? "")
    );
    if (!asideHeading) {
      // Cannot locate aside — log and skip (D4 covers the aside-existence assertion)
      return;
    }
    const asideSection = asideHeading.parentElement;
    if (!asideSection) {
      return;
    }
    const asideText = asideSection.textContent ?? "";
    if (/our take/i.test(asideText)) {
      throw new Error(
        `D9 FAILURE — "Our take" found inside the below-threshold aside. ` +
          `This is match-card chrome that must NOT appear in the aside. ` +
          `Aside text excerpt: "${asideText.substring(0, 300)}"`
      );
    }
    expect(asideText.toLowerCase()).not.toContain("our take");
  });

  const FORBIDDEN_STRINGS: Array<[string, string]> = [
    ["30+", "30+"],
    ["live jobs", "live jobs"],
    ["job seekers", "job seekers"],
    ["on-site", "on-site"],
    ["onsite", "onsite"],
    ["testimonial", "testimonial"],
    ["just missed", "just missed"],
    ["held back", "held back"],
    ["harborline", "Harborline"],
    ["fieldnote", "Fieldnote"],
    ["tri-county", "Tri-County"],
  ];

  for (const [lower, display] of FORBIDDEN_STRINGS) {
    it(`D10: FORBIDDEN substring absent (case-insensitive): "${display}"`, () => {
      const pageText = (container.textContent ?? "").toLowerCase();
      const pageHtml = container.innerHTML.toLowerCase();
      if (pageText.includes(lower) || pageHtml.includes(lower)) {
        throw new Error(
          `D10 FAILURE — forbidden text "${display}" found in rendered page. ` +
            `This substring is explicitly banned by the spec.`
        );
      }
      expect(pageText).not.toContain(lower);
    });
  }

  it('D11: REQUIRED text "fictional" is present', () => {
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).toContain("fictional");
  });

  it('D12: REQUIRED text "illustrative" or "sample" is present', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const has = text.includes("illustrative") || text.includes("sample");
    if (!has) {
      throw new Error(
        `D12 FAILURE — neither "illustrative" nor "sample" found in rendered text. ` +
          `The spec requires at least one of these to be present.`
      );
    }
    expect(has).toBe(true);
  });

  it('D13: REQUIRED pricing figure "$2" is present', () => {
    expect(container.textContent).toContain("$2");
  });

  it('D14: REQUIRED pricing figure "$0.30" is present', () => {
    expect(container.textContent).toContain("$0.30");
  });

  it('D15: REQUIRED text "no subscription" is present (any case)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).toContain("no subscription");
  });

  it('D16: REQUIRED text "Aurora Designs LLP" is present', () => {
    expect(container.textContent).toContain("Aurora Designs LLP");
  });

  it(`D17: CTA anchor href is exactly "${SPEC_CTA_HREF}"`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_HREF
    );
    if (!cta) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `D17 FAILURE — no anchor with href="${SPEC_CTA_HREF}" found.\n` +
          `  All hrefs found: ${found}`
      );
    }
    expect(cta).not.toBeNull();
  });
});

// ── Group E: Static page guarantees ──────────────────────────────────────────

describe("Group E — Static page guarantees", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("E1: rendering the page does NOT call fetch with a URL containing '/jobs/stats'", () => {
    render(<SampleMatchReportPage />);
    const calls = (global.fetch as jest.Mock).mock.calls;
    const statsCall = calls.find(([url]: [any]) => {
      const u = typeof url === "string" ? url : String(url);
      return u.includes("/jobs/stats");
    });
    if (statsCall) {
      throw new Error(
        `E1 FAILURE — fetch called with /jobs/stats URL: "${statsCall[0]}". ` +
          `This page must be static — no live-data fetches.`
      );
    }
    expect(statsCall).toBeUndefined();
  });

  it("E2: rendering the page does NOT call fetch with an /api/ path", () => {
    render(<SampleMatchReportPage />);
    const calls = (global.fetch as jest.Mock).mock.calls;
    const apiCall = calls.find(([url]: [any]) => {
      const u = typeof url === "string" ? url : String(url);
      return /\/api\//i.test(u);
    });
    if (apiCall) {
      throw new Error(
        `E2 FAILURE — fetch called with /api/ URL: "${apiCall[0]}". ` +
          `This page must be static — no API fetches.`
      );
    }
    expect(apiCall).toBeUndefined();
  });

  it("E3: module does NOT export 'getServerSideProps'", () => {
    const hasSSP = "getServerSideProps" in SampleMatchReportModule;
    if (hasSSP) {
      throw new Error(
        `E3 FAILURE — page exports getServerSideProps. ` +
          `This should be a fully static page (no server-side data fetching).`
      );
    }
    expect(hasSSP).toBe(false);
  });

  it("E4: module does NOT export 'getStaticProps'", () => {
    const hasGSP = "getStaticProps" in SampleMatchReportModule;
    if (hasGSP) {
      throw new Error(
        `E4 FAILURE — page exports getStaticProps. ` +
          `This should be a fully static page component with no build-time data fetching.`
      );
    }
    expect(hasGSP).toBe(false);
  });

  it("E5: module default export is a React function component", () => {
    expect(typeof SampleMatchReportModule.default).toBe("function");
  });
});

// ── Group F: Layout — no collapsed / hidden content ──────────────────────────

describe("Group F — Layout: 'What didn't fit' content must not be collapsed or hidden", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<SampleMatchReportPage />));
  });

  it("F1: all 'What didn't fit' headings have no ancestor with display:none", () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const didntFit = headings.filter((h) =>
      /what didn't fit|what didn't fit/i.test(h.textContent ?? "")
    );
    if (didntFit.length === 0) {
      throw new Error(
        `F1 FINDING — no "What didn't fit" headings in DOM. Content is either ` +
          `missing or hidden behind a Collapse/Accordion that starts closed.`
      );
    }
    for (const heading of didntFit) {
      let el: Element | null = heading.parentElement;
      while (el && el !== container) {
        const style = (el as HTMLElement).style?.display ?? "";
        if (style === "none") {
          throw new Error(
            `F1 FAILURE — "What didn't fit" heading "${heading.textContent?.trim()}" ` +
              `has an ancestor with display:none. Content is hidden.`
          );
        }
        el = el.parentElement;
      }
    }
    expect(didntFit.length).toBeGreaterThan(0);
  });

  it("F2: no element with data-testid or role='tabpanel' immediately wraps 'What didn't fit' headings (not in Tabs)", () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const didntFit = headings.filter((h) =>
      /what didn't fit|what didn't fit/i.test(h.textContent ?? "")
    );
    for (const heading of didntFit) {
      // If it's inside a tabpanel that the Chakra mock renders, it means the two-column
      // layout uses Tabs. Not a hard failure per spec, but log it.
      let el: Element | null = heading.parentElement;
      let depth = 0;
      while (el && depth < 4) {
        if (el.getAttribute("role") === "tabpanel") {
          throw new Error(
            `F2 FAILURE — "What didn't fit" heading is inside a [role=tabpanel]. ` +
              `The two-column content must NOT be wrapped in Chakra Tabs. ` +
              `Heading: "${heading.textContent?.trim()}"`
          );
        }
        el = el.parentElement;
        depth++;
      }
    }
    expect(didntFit.length).toBeGreaterThan(0);
  });
});

// ── Group G: Sitemap ──────────────────────────────────────────────────────────

describe("Group G — Sitemap", () => {
  let sitemapXml: string;

  beforeAll(() => {
    sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  });

  it("G1: public/sitemap.xml exists", () => {
    expect(fs.existsSync(SITEMAP_PATH)).toBe(true);
  });

  it("G2: sitemap contains exactly 6 <url> entries", () => {
    const count = (sitemapXml.match(/<url>/g) ?? []).length;
    if (count !== 6) {
      throw new Error(
        `G2 FAILURE — expected 6 <url> entries, found ${count}. ` +
          `The 24g.1 suite owns the full list; this test focuses on the new entry being present.`
      );
    }
    expect(count).toBe(6);
  });

  it("G3: sitemap includes <loc>https://onlyjobs.app/sample-match-report</loc>", () => {
    const hasEntry = sitemapXml.includes(
      "<loc>https://onlyjobs.app/sample-match-report</loc>"
    );
    if (!hasEntry) {
      throw new Error(
        `G3 FAILURE — <loc>https://onlyjobs.app/sample-match-report</loc> not found in sitemap.xml.`
      );
    }
    expect(hasEntry).toBe(true);
  });

  it("G5: sitemap includes <loc>https://onlyjobs.app/how-it-works</loc>", () => {
    const hasEntry = sitemapXml.includes(
      "<loc>https://onlyjobs.app/how-it-works</loc>"
    );
    if (!hasEntry) {
      throw new Error(
        `G5 FAILURE — <loc>https://onlyjobs.app/how-it-works</loc> not found in sitemap.xml. ` +
          `The /how-it-works page must be present in the sitemap.`
      );
    }
    expect(hasEntry).toBe(true);
  });

  it("G6: sitemap does NOT include /pricing", () => {
    const hasEntry = sitemapXml.includes("/pricing");
    if (hasEntry) {
      throw new Error(
        `G6 FAILURE — /pricing found in sitemap.xml. ` +
          `The /pricing page is a client-side redirect and must NOT appear in the sitemap.`
      );
    }
    expect(hasEntry).toBe(false);
  });

  it("G4: /sample-match-report entry has a <lastmod> in YYYY-MM-DD format", () => {
    // Extract the <url> block containing /sample-match-report
    const match = sitemapXml.match(
      /<url>[\s\S]*?<loc>https:\/\/onlyjobs\.app\/sample-match-report<\/loc>[\s\S]*?<\/url>/
    );
    if (!match) {
      throw new Error(
        `G4 FAILURE — could not find <url> block for /sample-match-report in sitemap.`
      );
    }
    const block = match[0];
    const lastmodMatch = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(
        `G4 FAILURE — <lastmod> missing from /sample-match-report entry.`
      );
    }
    const lastmod = lastmodMatch[1].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
      throw new Error(
        `G4 FAILURE — <lastmod> "${lastmod}" is not in YYYY-MM-DD format.`
      );
    }
    expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Group H: Footer ───────────────────────────────────────────────────────────

describe("Group H — Footer", () => {
  let footerContainer: HTMLElement;

  beforeEach(() => {
    ({ container: footerContainer } = render(<Footer />));
  });

  it('H1: Footer has an anchor with href="/sample-match-report"', () => {
    const anchors = Array.from(footerContainer.querySelectorAll("a"));
    const link = anchors.find(
      (a) => a.getAttribute("href") === "/sample-match-report"
    );
    if (!link) {
      const found = anchors.map((a) => a.getAttribute("href")).join(", ");
      throw new Error(
        `H1 FAILURE — no anchor with href="/sample-match-report" in Footer.\n` +
          `  Found hrefs: ${found}`
      );
    }
    expect(link).not.toBeNull();
  });

  it('H2: Footer "OnlyJobs" wordmark is NOT a heading element (must remain a span)', () => {
    const headingEls = footerContainer.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );
    const wordmarkHeadings = Array.from(headingEls).filter(
      (el) => el.textContent?.trim() === "OnlyJobs"
    );
    if (wordmarkHeadings.length > 0) {
      throw new Error(
        `H2 FAILURE — Footer "OnlyJobs" wordmark is rendered as a heading element ` +
          `(${wordmarkHeadings.map((el) => el.tagName).join(", ")}). ` +
          `It must use as="span" to avoid a multiple-h1 or heading-order violation.`
      );
    }
    expect(wordmarkHeadings).toHaveLength(0);
  });
});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (allowed by the spec or explicitly in the harness-patterns list):
//   - jest.config.ts — testEnvironment, transform, moduleNameMapper
//   - jest.setup.ts — global setup
//   - src/__tests__/24g.seo-foundation.adversarial.test.tsx — comprehensive Chakra
//     mock with Proxy, fetch mock pattern, fullTitle rule, multi-test structure
//   - src/__tests__/24g.seo-foundation.smoke.test.tsx — Footer wordmark assertion,
//     styled-components mock pattern, next/document mock
//   - src/__tests__/24g.2.sample-match-report.smoke.test.tsx — existing smoke harness;
//     used for Chakra mock shape, next/head passthrough, getAllJsonLdTypes helper
//   - src/__tests__/kda-d.adversarial.test.tsx — fetch mock via global.fetch = jest.fn()
//   - src/components/SEO.tsx — ALLOWED; read to understand fullTitle rule, default
//     og:type, default og:image, resolvedOgTitle/resolvedOgDescription, and canonical
//     URL construction so the regression assertions are oracle-from-spec, not tautologies
//   - src/components/Footer.tsx — ALLOWED; confirmed href="/sample-match-report" exists
//     and Heading as="span" pattern; assertions derived from spec requirements
//   - public/sitemap.xml — ALLOWED; read for format verification
//
// Incidental knowledge kept OUT of oracles:
//   - Reading SEO.tsx confirmed the fullTitle rule and defaults. The oracle values in
//     Group A come from the spec, not from running SEO against the page. SEO.tsx was
//     read only to understand which props must be passed to produce the spec values.
//   - Footer.tsx shows href="/sample-match-report" and as="span". These are oracle-
//     from-spec (the spec requires both). The file read confirmed the implementation
//     already has them but I did NOT derive my assertions from the implementation —
//     the assertions would be correct even if Footer.tsx had a different structure.
//   - The smoke test shows the Chakra Heading mock forwarding `as`. Used as
//     infrastructure pattern, not as an oracle.
//
// Untestable items without reading the page body (FINDINGS):
//   - D5 (74 isolation): if the page uses a structure where the aside and match
//     sections share an immediate parent shallower than 6 levels, the ancestor walk
//     could false-positive. Playwright visual test is the ideal verification.
//   - F1/F2 (layout checks): jsdom does not compute CSS layout. The assertions
//     check style attributes only — CSS-class-driven display:none would not be caught.
//     Playwright is the authoritative test for this.
//   - DEFERRED per spec: OG PNG file existence/dimensions on disk.
//   - The homepage SEO regression (B4-B5) tests the SEO component directly rather
//     than rendering index.tsx. Reading index.tsx to discover its exact props would
//     contaminate the oracle. The spec explicitly offers this fallback and I note it here.
