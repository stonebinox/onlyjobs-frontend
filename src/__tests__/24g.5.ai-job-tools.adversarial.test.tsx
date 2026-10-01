/**
 * ADVERSARIAL TEST — onlyjobs-24g.5: /ai-job-tools static page
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs,
 * especially competitor leakage.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * FORBIDDEN (body not opened):
 *   src/pages/ai-job-tools.tsx — imported/rendered only
 *
 * ALLOWED:
 *   src/components/SEO.tsx (real, unmocked)
 *   src/components/Footer.tsx (real, unmocked)
 *   src/__tests__/24g.4.about.adversarial.test.tsx (harness patterns)
 *   src/__tests__/24g.seo-foundation.adversarial.test.tsx (Chakra mock patterns)
 *   src/__tests__/24g.5.ai-job-tools.smoke.test.tsx (smoke harness)
 *   public/sitemap.xml
 *
 * Oracle: THE SPEC — never "what the code outputs."
 * DISCLOSURE: see bottom of file.
 */

import React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";

// ── Spec constants (derived from spec, never from implementation) ──────────────

const SPEC_TITLE =
  "How OnlyJobs Is Different From Other AI Job Tools | OnlyJobs";
const SPEC_DESCRIPTION =
  "Many AI job tools are monthly subscriptions built around applying to more. OnlyJobs sends a few explained matches and charges only on days a match clears your bar.";
const SPEC_CANONICAL = "https://onlyjobs.app/ai-job-tools";
const SPEC_OG_TYPE = "article";
const SPEC_OG_TITLE =
  "A different kind of AI job tool: no subscription, explained matches";
const SPEC_OG_DESCRIPTION =
  "Fewer, explained matches - with what didn't fit - and you pay only on days a match clears your bar. No subscription, no auto-apply.";
const SPEC_OG_IMAGE = "https://onlyjobs.app/og-image.png";
const SPEC_CTA_SAMPLE_REPORT = "/sample-match-report";
const SPEC_CTA_SIGNUP =
  "/?utm_source=site&utm_medium=ai-job-tools&utm_content=cta#signup";
const SPEC_CONTACT_MAILTO = "mailto:contact@auroradesignshq.com";

const SITEMAP_PATH = path.resolve(__dirname, "..", "..", "public", "sitemap.xml");
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ── Mocks ─────────────────────────────────────────────────────────────────────

const nullIcon = () => null;

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: jest.fn(),
    pathname: "/ai-job-tools",
    query: {},
    asPath: "/ai-job-tools",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => "/ai-job-tools",
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head must passthrough so meta tags and ld+json are queryable.
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// CRITICAL: next/link forwards ALL props (including target/rel) via ...rest.
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
    function StyledMock({ children, href, ...rest }: any) {
      return React.createElement("a", { href, ...rest }, children);
    }
    return StyledMock;
  };
  return { __esModule: true, default: styled };
});

// CRITICAL: Heading forwards `as` (default h2) so pages that forget as="h1" on
// the hero render h2 — failing the "exactly one h1" test.
// CRITICAL: makeEl forwards `as` so Box as="nav" renders as <nav aria-label=...>.
// CRITICAL: Button forwards as, href, target, rel — CTA buttons using
// <Button as="a" href="..."> would silently swallow href without this.
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  // `as` forwarding lets Box as="nav" render as <nav>, preserving aria-label.
  const makeEl = (defaultTag: string) => {
    if (cache[defaultTag]) return cache[defaultTag];
    const C = React.forwardRef(
      (
        {
          as: Tag = defaultTag,
          children,
          onClick,
          type,
          disabled,
          "aria-label": al,
          "aria-labelledby": alb,
          "aria-current": ac,
          href,
          role,
          id,
        }: any,
        ref: any
      ) =>
        React.createElement(
          Tag,
          {
            ref,
            onClick,
            type,
            disabled,
            "aria-label": al,
            "aria-labelledby": alb,
            "aria-current": ac,
            href,
            role,
            id,
          },
          children
        )
    );
    C.displayName = defaultTag;
    cache[defaultTag] = C;
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
    Button: ({
      as: Tag = "button",
      href,
      children,
      onClick,
      type,
      disabled,
      "aria-label": al,
      role,
      target,
      rel,
    }: any) =>
      React.createElement(
        Tag,
        { href, onClick, type, disabled, "aria-label": al, role, target, rel },
        children
      ),
    IconButton: ({ "aria-label": al, onClick, children }: any) =>
      React.createElement("button", { "aria-label": al, onClick }, children ?? null),
    Link: ({ children, href, onClick, target, rel }: any) =>
      React.createElement("a", { href, onClick, target, rel }, children),
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
    // Collapse: isIn=false hides children — a closed Collapse around an answer
    // means the answer text is absent from the DOM on first render.
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement("div", null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    Input: makeEl("input"),
    Textarea: makeEl("textarea"),
    Select: ({ children, ...p }: any) => React.createElement("select", p, children),
    Tabs: ({ children }: any) => React.createElement("div", null, children),
    TabList: ({ children }: any) =>
      React.createElement("div", { role: "tablist" }, children),
    Tab: ({ children, onClick }: any) =>
      React.createElement("button", { role: "tab", onClick }, children),
    TabPanels: ({ children }: any) => React.createElement("div", null, children),
    TabPanel: ({ children }: any) =>
      React.createElement("div", { role: "tabpanel" }, children),
    Accordion: ({ children }: any) => React.createElement("div", null, children),
    AccordionItem: ({ children }: any) => React.createElement("div", null, children),
    AccordionButton: ({ children, onClick }: any) =>
      React.createElement("button", { onClick }, children),
    AccordionPanel: ({ children }: any) => React.createElement("div", null, children),
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
    Avatar: ({ name }: any) => React.createElement("div", { "aria-label": name }),
    Progress: ({ value }: any) =>
      React.createElement("div", { "aria-valuenow": value }),
    Switch: (props: any) =>
      React.createElement("input", { type: "checkbox", ...props }),
    Popover: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) =>
      React.createElement("div", null, children),
    PopoverBody: ({ children }: any) => React.createElement("div", null, children),
    Menu: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MenuButton: makeEl("button"),
    MenuList: ({ children }: any) =>
      React.createElement("ul", { role: "menu" }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement("li", { role: "menuitem", onClick }, children),
    NumberInput: ({ children }: any) => React.createElement("div", null, children),
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

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as Response)
) as any;

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

// eslint-disable-next-line import/first
import AiJobToolsPage from "@/pages/ai-job-tools";
// Real SEO — NOT mocked to null. Tests the real contract.
// eslint-disable-next-line import/first
import { SEO } from "@/components/SEO";
// Real Footer — NOT mocked to null.
// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";
// Module namespace for static-export checks without reading body.
// eslint-disable-next-line import/first
import * as AiJobToolsModule from "@/pages/ai-job-tools";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMeta(
  container: HTMLElement,
  selector: string,
  attr = "content"
): string | null {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

function getAllJsonLdParsed(container: HTMLElement): any[] {
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

// Walk entire JSON tree recursively, collecting every @type value found.
// Catches forbidden types nested inside other nodes, not just top-level @graph entries.
function collectAllTypes(obj: any, acc: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== "object") return acc;
  if (Array.isArray(obj)) {
    for (const item of obj) collectAllTypes(item, acc);
    return acc;
  }
  if (typeof obj["@type"] === "string") acc.add(obj["@type"]);
  for (const val of Object.values(obj)) collectAllTypes(val, acc);
  return acc;
}

function collectAllTypesFromPage(container: HTMLElement): Set<string> {
  const acc = new Set<string>();
  for (const parsed of getAllJsonLdParsed(container)) {
    if (parsed) collectAllTypes(parsed, acc);
  }
  return acc;
}

function getBreadcrumbList(container: HTMLElement): any {
  for (const parsed of getAllJsonLdParsed(container)) {
    if (!parsed) continue;
    const graph: any[] = Array.isArray(parsed["@graph"])
      ? parsed["@graph"]
      : [parsed];
    const bl = graph.find((n: any) => n["@type"] === "BreadcrumbList");
    if (bl) return bl;
  }
  return null;
}

// ── Group A: Metadata / SEO tags ─────────────────────────────────────────────

describe("Group A — Metadata / SEO tags (real SEO component, unmocked)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    ({ container } = render(<AiJobToolsPage />));
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

  it("A2: meta description is EXACTLY the spec string", () => {
    const desc = getMeta(container, 'meta[name="description"]');
    if (desc !== SPEC_DESCRIPTION) {
      throw new Error(
        `A2 FAILURE — meta description mismatch.\n` +
          `  Expected: "${SPEC_DESCRIPTION}"\n` +
          `  Observed: "${desc}"`
      );
    }
    expect(desc).toBe(SPEC_DESCRIPTION);
  });

  it(`A3: canonical is EXACTLY "${SPEC_CANONICAL}"`, () => {
    const canonical = container
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    if (canonical !== SPEC_CANONICAL) {
      throw new Error(
        `A3 FAILURE — canonical mismatch.\n` +
          `  Expected: "${SPEC_CANONICAL}"\n` +
          `  Observed: "${canonical}"\n` +
          `  SEO.tsx prepends BASE_URL; page must pass canonical="/ai-job-tools".`
      );
    }
    expect(canonical).toBe(SPEC_CANONICAL);
  });

  it(`A4: og:type is EXACTLY "${SPEC_OG_TYPE}"`, () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== SPEC_OG_TYPE) {
      throw new Error(
        `A4 FAILURE — og:type is "${ogType}", expected "${SPEC_OG_TYPE}". ` +
          `Page must pass ogType="article" to <SEO>.`
      );
    }
    expect(ogType).toBe(SPEC_OG_TYPE);
  });

  it(`A5: og:title is EXACTLY "${SPEC_OG_TITLE}"`, () => {
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (ogTitle !== SPEC_OG_TITLE) {
      throw new Error(
        `A5 FAILURE — og:title mismatch.\n` +
          `  Expected: "${SPEC_OG_TITLE}"\n` +
          `  Observed: "${ogTitle}"\n` +
          `  Omitting ogTitle prop collapses og:title to fullTitle (different string).`
      );
    }
    expect(ogTitle).toBe(SPEC_OG_TITLE);
  });

  it("A6: og:description is EXACTLY the spec string (hyphens must be plain hyphens)", () => {
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    if (ogDesc !== SPEC_OG_DESCRIPTION) {
      throw new Error(
        `A6 FAILURE — og:description mismatch.\n` +
          `  Expected: "${SPEC_OG_DESCRIPTION}"\n` +
          `  Observed: "${ogDesc}"\n` +
          `  Note: hyphens must be plain ASCII "-", not em/en-dashes.`
      );
    }
    expect(ogDesc).toBe(SPEC_OG_DESCRIPTION);
  });

  it(`A7: og:image is the site-default "${SPEC_OG_IMAGE}" (no custom override)`, () => {
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SPEC_OG_IMAGE) {
      throw new Error(
        `A7 FAILURE — og:image mismatch.\n` +
          `  Expected: "${SPEC_OG_IMAGE}" (site-wide default)\n` +
          `  Observed: "${ogImage}"\n` +
          `  The /ai-job-tools page must NOT override ogImage with a custom URL.`
      );
    }
    expect(ogImage).toBe(SPEC_OG_IMAGE);
  });

  it("A8: twitter:title equals og:title (both equal spec og:title)", () => {
    const twitterTitle = getMeta(container, 'meta[name="twitter:title"]');
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (twitterTitle !== ogTitle) {
      throw new Error(
        `A8 FAILURE — twitter:title !== og:title.\n` +
          `  twitter:title: "${twitterTitle}"\n` +
          `  og:title:      "${ogTitle}"`
      );
    }
    expect(twitterTitle).toBe(SPEC_OG_TITLE);
  });

  it("A9: twitter:description equals og:description (both equal spec og:description)", () => {
    const twitterDesc = getMeta(container, 'meta[name="twitter:description"]');
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    if (twitterDesc !== ogDesc) {
      throw new Error(
        `A9 FAILURE — twitter:description !== og:description.\n` +
          `  twitter:description: "${twitterDesc}"\n` +
          `  og:description:      "${ogDesc}"`
      );
    }
    expect(twitterDesc).toBe(SPEC_OG_DESCRIPTION);
  });

  it("A10: og:title is DIFFERENT from <title> (omitting ogTitle prop collapses them — adversarial)", () => {
    // If the page omits ogTitle, resolvedOgTitle = fullTitle, making og:title === <title>.
    // The spec defines them as two intentionally distinct strings.
    const titleText = container.querySelector("title")?.textContent ?? "";
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (titleText === ogTitle) {
      throw new Error(
        `A10 FAILURE — og:title === <title>: "${ogTitle}".\n` +
          `  <title> spec:    "${SPEC_TITLE}"\n` +
          `  og:title spec:   "${SPEC_OG_TITLE}"\n` +
          `  These are intentionally different. Equal values means ogTitle prop was omitted.`
      );
    }
    expect(titleText).not.toBe(ogTitle);
  });
});

// ── Group B: Shared-SEO regression ───────────────────────────────────────────

describe("Group B — Shared-SEO regression (real SEO component, unmocked)", () => {
  it("B1: SEO with only {title, description} still emits og:type='website' (default not overridden globally)", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "website") {
      throw new Error(
        `B1 FAILURE — SEO default og:type is now "${ogType}", expected "website". ` +
          `Adding ogType="article" to this page must not change the component default.`
      );
    }
    expect(ogType).toBe("website");
  });

  it("B2: SEO default og:image is still the site default (not changed by this page)", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SPEC_OG_IMAGE) {
      throw new Error(
        `B2 FAILURE — SEO default og:image is "${ogImage}", expected "${SPEC_OG_IMAGE}".`
      );
    }
    expect(ogImage).toBe(SPEC_OG_IMAGE);
  });
});

// ── Group C: JSON-LD structured data ─────────────────────────────────────────

describe("Group C — JSON-LD structured data", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AiJobToolsPage />));
  });

  it("C1: at least one <script type='application/ld+json'> is rendered", () => {
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);
  });

  it("C2: every ld+json script parses without throwing", () => {
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const s of scripts) {
      expect(() => JSON.parse(s.innerHTML)).not.toThrow();
    }
  });

  it("C3: @type WebPage present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("WebPage")) {
      throw new Error(
        `C3 FAILURE — @type "WebPage" not found.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("WebPage")).toBe(true);
  });

  it("C4: @type BreadcrumbList present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("BreadcrumbList")) {
      throw new Error(
        `C4 FAILURE — @type "BreadcrumbList" not found.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("BreadcrumbList")).toBe(true);
  });

  // Recursive scan catches forbidden types nested anywhere in the JSON tree.
  const FORBIDDEN_TYPES = [
    "Review",
    "Rating",
    "AggregateRating",
    "Article",
    "FAQPage",
    "SoftwareApplication",
    "JobPosting",
    "ItemList",
    "Product",
    "Offer",
    "Organization",
  ];

  for (const forbiddenType of FORBIDDEN_TYPES) {
    it(`C5: NO @type "${forbiddenType}" anywhere in ld+json (recursive deep scan)`, () => {
      const types = collectAllTypesFromPage(container);
      if (types.has(forbiddenType)) {
        throw new Error(
          `C5 FAILURE — forbidden @type "${forbiddenType}" found in JSON-LD (deep scan).\n` +
            `  Types found: {${Array.from(types).join(", ")}}`
        );
      }
      expect(types.has(forbiddenType)).toBe(false);
    });
  }

  it("C6: BreadcrumbList.itemListElement.length === 2", () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C6 FAILURE — no BreadcrumbList found in JSON-LD.`);
    const items: any[] = bl.itemListElement ?? [];
    if (items.length !== 2) {
      throw new Error(
        `C6 FAILURE — BreadcrumbList has ${items.length} item(s), expected 2.\n` +
          `  Items: ${JSON.stringify(items)}`
      );
    }
    expect(items).toHaveLength(2);
  });

  it('C7: BreadcrumbList position 1 — name "Home", item "https://onlyjobs.app/"', () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C7 FAILURE — no BreadcrumbList found.`);
    const items: any[] = bl.itemListElement ?? [];
    const pos1 = items.find((i: any) => i.position === 1);
    if (!pos1) {
      throw new Error(
        `C7 FAILURE — no breadcrumb item with position=1.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    if (pos1.name !== "Home") {
      throw new Error(
        `C7 FAILURE — position 1 name is "${pos1.name}", expected "Home".`
      );
    }
    if (pos1.item !== "https://onlyjobs.app/") {
      throw new Error(
        `C7 FAILURE — position 1 item is "${pos1.item}", expected "https://onlyjobs.app/" (trailing slash required).`
      );
    }
    expect(pos1.name).toBe("Home");
    expect(pos1.item).toBe("https://onlyjobs.app/");
  });

  it('C8: BreadcrumbList position 2 — name "AI job tools", item "https://onlyjobs.app/ai-job-tools"', () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C8 FAILURE — no BreadcrumbList found.`);
    const items: any[] = bl.itemListElement ?? [];
    const pos2 = items.find((i: any) => i.position === 2);
    if (!pos2) {
      throw new Error(
        `C8 FAILURE — no breadcrumb item with position=2.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    if (pos2.name !== "AI job tools") {
      throw new Error(
        `C8 FAILURE — position 2 name is "${pos2.name}", expected "AI job tools".`
      );
    }
    if (pos2.item !== "https://onlyjobs.app/ai-job-tools") {
      throw new Error(
        `C8 FAILURE — position 2 item is "${pos2.item}", expected "https://onlyjobs.app/ai-job-tools".`
      );
    }
    expect(pos2.name).toBe("AI job tools");
    expect(pos2.item).toBe("https://onlyjobs.app/ai-job-tools");
  });
});

// ── Group D: Competitor leakage (the core of this page) ───────────────────────

describe("Group D — Competitor leakage (layered scan)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AiJobToolsPage />));
  });

  // D1: Outbound URL allowlist — every anchor href and every img src
  //
  // NEGATIVE INTENT: the old oracle used `!href.startsWith("http")` which
  // silently passed protocol-relative ("//competitor.com"), javascript:, and
  // data: URIs; and `href.startsWith("https://onlyjobs.app")` which passed
  // lookalike domains ("https://onlyjobs.app.evil"). This oracle tightens to
  // an explicit allowlist so any future regression surfaces as a test failure.
  it("D1: every anchor href is root-relative OR '#' OR exactly https://onlyjobs.app or https://onlyjobs.app/* OR is the allowed mailto", () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const violations: string[] = [];
    for (const a of anchors) {
      const href = a.getAttribute("href") ?? "";
      if (!href) continue;
      // Root-relative: "/" as first char, but NOT "//" (protocol-relative)
      const isRootRelative = href.startsWith("/") && !href.startsWith("//");
      // Hash-only fragment
      const isFragment = href.startsWith("#");
      // Exactly "https://onlyjobs.app" OR starts with "https://onlyjobs.app/"
      // The trailing "/" is required — "https://onlyjobs.app.evil" MUST fail.
      const isOnlyJobsApp =
        href === "https://onlyjobs.app" ||
        href.startsWith("https://onlyjobs.app/");
      const isAllowedMailto = href === SPEC_CONTACT_MAILTO;
      if (!isRootRelative && !isFragment && !isOnlyJobsApp && !isAllowedMailto) {
        violations.push(href);
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `D1 FAILURE — outbound URL(s) not on the allowlist:\n` +
          violations.map((h) => `  "${h}"`).join("\n") +
          `\n  Allowed: root-relative (/foo, not //), "#", "${SPEC_CONTACT_MAILTO}", https://onlyjobs.app, https://onlyjobs.app/*`
      );
    }
    expect(violations).toHaveLength(0);
  });

  it("D1b: every <img> src is root-relative OR starts with https://onlyjobs.app/ (no external image hosts)", () => {
    const imgs = Array.from(container.querySelectorAll("img"));
    const violations: string[] = [];
    for (const img of imgs) {
      const src = img.getAttribute("src") ?? "";
      if (!src) continue;
      // Root-relative: "/" as first char, but NOT "//" (protocol-relative)
      const isRootRelative = src.startsWith("/") && !src.startsWith("//");
      // Exactly "https://onlyjobs.app" OR starts with "https://onlyjobs.app/"
      const isOnlyJobsApp =
        src === "https://onlyjobs.app" ||
        src.startsWith("https://onlyjobs.app/");
      if (!isRootRelative && !isOnlyJobsApp) {
        violations.push(src);
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `D1b FAILURE — external image src(s) found:\n` +
          violations.map((s) => `  "${s}"`).join("\n")
      );
    }
    expect(violations).toHaveLength(0);
  });

  // D2: Forbidden fingerprint phrases
  const FORBIDDEN_PHRASES: Array<{ phrase: string; desc: string }> = [
    { phrase: "apply to 100", desc: "mass-apply competitor copy" },
    { phrase: "in a click", desc: "one-click-apply competitor copy" },
    { phrase: "warm intro", desc: "competitor feature phrase" },
    { phrase: "15 million", desc: "competitor user-count claim" },
    { phrase: "companies pay", desc: "reverse-job-board competitor model" },
    { phrase: "10%", desc: "commission-model competitor copy" },
    { phrase: "jack and jill", desc: "retired compare-page brand name" },
    { phrase: "jack-and-jill", desc: "retired compare-page URL slug" },
    { phrase: "tinker tailor", desc: "retired compare-page brand name" },
  ];

  for (const { phrase, desc } of FORBIDDEN_PHRASES) {
    it(`D2: FORBIDDEN phrase "${phrase}" absent from rendered text/HTML (${desc})`, () => {
      const textLower = (container.textContent ?? "").toLowerCase();
      const htmlLower = container.innerHTML.toLowerCase();
      if (
        textLower.includes(phrase.toLowerCase()) ||
        htmlLower.includes(phrase.toLowerCase())
      ) {
        throw new Error(
          `D2 FAILURE — forbidden phrase "${phrase}" (${desc}) found in rendered text/HTML.`
        );
      }
      expect(textLower).not.toContain(phrase.toLowerCase());
    });
  }

  // D3: Dollar amounts — only $2 and $0.30 allowed
  //
  // Scans both rendered textContent AND meta tag content attributes
  // (og:description, twitter:description, name=description, etc.) so a
  // competitor price slipped into a meta field is caught even if invisible
  // to the user.
  it("D3: only $2 and $0.30 appear as dollar amounts; no other $<number> matches", () => {
    const text = container.textContent ?? "";
    // Collect every meta[content] value — next/head renders meta inline so
    // container.querySelectorAll covers them all.
    const metaContents = Array.from(
      container.querySelectorAll("meta[content]")
    )
      .map((m) => m.getAttribute("content") ?? "")
      .join(" ");
    const allText = text + " " + metaContents;
    const matches = Array.from(allText.matchAll(/\$[\d.,]+/g)).map((m) => m[0]);
    const forbidden = matches.filter((m) => m !== "$2" && m !== "$0.30");
    if (forbidden.length > 0) {
      throw new Error(
        `D3 FAILURE — dollar amounts other than "$2" and "$0.30" found:\n` +
          forbidden.map((m) => `  "${m}"`).join("\n") +
          `\n  All dollar matches: ${matches.join(", ")}`
      );
    }
    expect(forbidden).toHaveLength(0);
  });

  // D4: Word-boundary brand names
  it("D4: /\\bjobright\\b/i absent from rendered text and HTML", () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    if (/\bjobright\b/i.test(text) || /\bjobright\b/i.test(html)) {
      throw new Error(
        `D4 FAILURE — "jobright" (competitor brand name) found in rendered text/HTML.`
      );
    }
    expect(/\bjobright\b/i.test(text)).toBe(false);
  });

  it("D4b: /himalayas\\.app/i absent from rendered text and HTML", () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    if (/himalayas\.app/i.test(text) || /himalayas\.app/i.test(html)) {
      throw new Error(
        `D4b FAILURE — "himalayas.app" (competitor domain) found in rendered text/HTML.`
      );
    }
    expect(/himalayas\.app/i.test(text)).toBe(false);
  });

  // D5: No <img> in body
  it("D5: no <img> element in the rendered page body", () => {
    const imgs = container.querySelectorAll("img");
    if (imgs.length > 0) {
      const details = Array.from(imgs)
        .map(
          (img) =>
            `src="${img.getAttribute("src") ?? ""}" alt="${img.getAttribute("alt") ?? ""}"`
        )
        .join("; ");
      throw new Error(
        `D5 FAILURE — ${imgs.length} <img> element(s) found. ` +
          `The spec forbids <img> in the body. Elements: ${details}`
      );
    }
    expect(imgs).toHaveLength(0);
  });

  // D6: Scrapped route is gone
  it("D6a: src/pages/compare/jack-and-jill.tsx does NOT exist on disk", () => {
    const filePath = path.join(
      REPO_ROOT,
      "src",
      "pages",
      "compare",
      "jack-and-jill.tsx"
    );
    if (fs.existsSync(filePath)) {
      throw new Error(
        `D6a FAILURE — src/pages/compare/jack-and-jill.tsx EXISTS on disk. ` +
          `This retired compare-page file must be deleted.`
      );
    }
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('D6b: rendered HTML contains no "jack-and-jill"', () => {
    const html = container.innerHTML;
    if (html.includes("jack-and-jill")) {
      throw new Error(
        `D6b FAILURE — "jack-and-jill" found in rendered HTML.`
      );
    }
    expect(html).not.toContain("jack-and-jill");
  });

  it('D6c: no anchor href equal to "/compare" or starting with "/compare/"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const compareLinks = anchors.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      return href === "/compare" || href.startsWith("/compare/");
    });
    if (compareLinks.length > 0) {
      throw new Error(
        `D6c FAILURE — link(s) to /compare found:\n` +
          compareLinks
            .map((a) => `  href="${a.getAttribute("href")}"`)
            .join("\n")
      );
    }
    expect(compareLinks).toHaveLength(0);
  });
});

// ── Group E: Body / Copy ──────────────────────────────────────────────────────

describe("Group E — Body / Copy", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AiJobToolsPage />));
  });

  it("E1: exactly ONE <h1> on the page", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `E1 FAILURE — expected 1 <h1>, found ${h1s.length}: ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("E2: no <h2> appears before <h1> in DOM order", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    const h2sBefore = Array.from(container.querySelectorAll("h2")).filter(
      (h2) =>
        !!(h2.compareDocumentPosition(h1!) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
    if (h2sBefore.length > 0) {
      throw new Error(
        `E2 FAILURE — ${h2sBefore.length} <h2>(s) appear before <h1>:\n` +
          h2sBefore.map((el) => `  "${el.textContent?.trim()}"`).join("\n")
      );
    }
    expect(h2sBefore).toHaveLength(0);
  });

  it('E3: breadcrumb — <nav aria-label="Breadcrumb"> is present', () => {
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    if (!nav) {
      throw new Error(
        `E3 FAILURE — no <nav aria-label="Breadcrumb"> found.\n` +
          `  The breadcrumb must use a <nav> with aria-label="Breadcrumb".\n` +
          `  If using <Box as="nav">, the mock's makeEl forwards the "as" prop.`
      );
    }
    expect(nav).not.toBeNull();
  });

  it('E4: breadcrumb nav — exactly ONE link inside it (href "/")', () => {
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    if (!nav) throw new Error(`E4 FAILURE — no breadcrumb nav (E3 must pass first).`);
    const links = Array.from(nav.querySelectorAll("a"));
    if (links.length !== 1) {
      throw new Error(
        `E4 FAILURE — breadcrumb nav has ${links.length} link(s), expected exactly 1.\n` +
          `  hrefs: ${links.map((a) => `"${a.getAttribute("href")}"`).join(", ")}`
      );
    }
    const homeHref = links[0].getAttribute("href");
    if (homeHref !== "/") {
      throw new Error(
        `E4 FAILURE — breadcrumb Home link href is "${homeHref}", expected "/".`
      );
    }
    expect(links).toHaveLength(1);
    expect(homeHref).toBe("/");
  });

  it('E5: breadcrumb — "AI job tools" current crumb is text (not a link)', () => {
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    if (!nav) throw new Error(`E5 FAILURE — no breadcrumb nav (E3 must pass first).`);
    const navText = nav.textContent ?? "";
    if (!navText.includes("AI job tools")) {
      throw new Error(
        `E5 FAILURE — "AI job tools" not found in breadcrumb nav text.\n` +
          `  nav text: "${navText}"`
      );
    }
    const aiLinks = Array.from(nav.querySelectorAll("a")).filter((a) =>
      (a.textContent ?? "").includes("AI job tools")
    );
    if (aiLinks.length > 0) {
      throw new Error(
        `E5 FAILURE — "AI job tools" crumb is a link (href="${aiLinks[0].getAttribute("href")}"). ` +
          `The current page crumb must be text (span/Text), NOT an anchor.`
      );
    }
    expect(navText).toContain("AI job tools");
    expect(aiLinks).toHaveLength(0);
  });

  it('E6: breadcrumb — no href equal to "/compare" or "/compare/"', () => {
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    if (!nav) throw new Error(`E6 FAILURE — no breadcrumb nav (E3 must pass first).`);
    const compareLinks = Array.from(nav.querySelectorAll("a")).filter((a) => {
      const href = a.getAttribute("href") ?? "";
      return href === "/compare" || href.startsWith("/compare/");
    });
    if (compareLinks.length > 0) {
      throw new Error(
        `E6 FAILURE — /compare link(s) in breadcrumb:\n` +
          compareLinks
            .map((a) => `  href="${a.getAttribute("href")}"`)
            .join("\n")
      );
    }
    expect(compareLinks).toHaveLength(0);
  });

  // Required copy (case-insensitive, apostrophe-tolerant)
  it('E7: REQUIRED "prepaid wallet" present (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("prepaid wallet")) {
      throw new Error(
        `E7 FAILURE — "prepaid wallet" not found in rendered text.\n` +
          `  Excerpt (first 400 chars): "${(container.textContent ?? "").substring(0, 400)}"`
      );
    }
    expect(text).toContain("prepaid wallet");
  });

  it('E8: REQUIRED "no subscription" or "isn\'t a subscription" present (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const ok =
      text.includes("no subscription") ||
      text.includes("isn't a subscription") ||
      text.includes("isn’t a subscription");
    if (!ok) {
      throw new Error(
        `E8 FAILURE — neither "no subscription" nor "isn't a subscription" found.`
      );
    }
    expect(ok).toBe(true);
  });

  it('E9: REQUIRED "$2" present', () => {
    expect(container.textContent).toContain("$2");
  });

  it('E10: REQUIRED "$0.30" present', () => {
    expect(container.textContent).toContain("$0.30");
  });

  it('E11: REQUIRED "at least one match clears your threshold" present (accurate charge phrasing)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("at least one match clears your threshold")) {
      throw new Error(
        `E11 FAILURE — "at least one match clears your threshold" not found.\n` +
          `  This is the spec's accurate charge phrasing. Looser variants ("when we find a match") do not satisfy it.`
      );
    }
    expect(text).toContain("at least one match clears your threshold");
  });

  it('E12: REQUIRED "no auto-apply" or "there\'s no auto-apply" present (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const ok =
      text.includes("no auto-apply") ||
      text.includes("there's no auto-apply") ||
      text.includes("there’s no auto-apply");
    if (!ok) {
      throw new Error(
        `E12 FAILURE — neither "no auto-apply" nor "there's no auto-apply" found.`
      );
    }
    expect(ok).toBe(true);
  });

  it("E13: REQUIRED differentiator — rendered body contains BOTH \"why it fits\" AND \"what didn’t\" near each other (apostrophe/entity tolerant)", () => {
    const text = container.textContent ?? "";
    // &apos; in JSX renders to straight apostrophe (U+0027) in textContent.
    // Also tolerate curly apostrophe (U+2019).
    const whyFitsPattern = /why it fits/i;
    const whatDidntPattern = /what didn[\u0027\u2019]t/i;

    const whyIdx = text.search(whyFitsPattern);
    const whatIdx = text.search(whatDidntPattern);

    if (whyIdx < 0) {
      throw new Error(
        `E13 FAILURE — "why it fits" not found in rendered text.\n` +
          `  Excerpt (first 400 chars): "${text.substring(0, 400)}"`
      );
    }
    if (whatIdx < 0) {
      throw new Error(
        `E13 FAILURE — "what didn’t" not found in rendered text.\n` +
          `  Apostrophe-tolerant pattern: /what didn[\u0027\u2019]t/i\n` +
          `  Excerpt (first 400 chars): "${text.substring(0, 400)}"`
      );
    }
    if (Math.abs(whyIdx - whatIdx) > 200) {
      throw new Error(
        `E13 FAILURE — "why it fits" and "what didn’t" are more than 200 chars apart.\n` +
          `  "why it fits" at index: ${whyIdx}\n` +
          `  "what didn’t" at index: ${whatIdx}\n` +
          `  They must appear near each other in the same reasoning sentence.`
      );
    }
    expect(whyIdx).toBeGreaterThanOrEqual(0);
    expect(whatIdx).toBeGreaterThanOrEqual(0);
    expect(Math.abs(whyIdx - whatIdx)).toBeLessThanOrEqual(200);
  });

  it('E14: REQUIRED "voice or text" present (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("voice or text")) {
      throw new Error(`E14 FAILURE — "voice or text" not found.`);
    }
    expect(text).toContain("voice or text");
  });

  it('E15: REQUIRED "mainly remote" present (case-insensitive)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("mainly remote")) {
      throw new Error(`E15 FAILURE — "mainly remote" not found.`);
    }
    expect(text).toContain("mainly remote");
  });

  it("E16: REQUIRED geographic scope phrase present (\"for job seekers in the US\" OR \"for US\" OR \"in the US\")", () => {
    const text = (container.textContent ?? "").toLowerCase();
    const ok =
      text.includes("for job seekers in the us") ||
      text.includes("for us") ||
      text.includes("in the us");
    if (!ok) {
      throw new Error(
        `E16 FAILURE — no geographic scope phrase found.\n` +
          `  Checked (case-insensitive): "for job seekers in the us", "for us", "in the us"`
      );
    }
    expect(ok).toBe(true);
  });

  // Forbidden content
  it("E17: FORBIDDEN em-dash — and en-dash – absent", () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    const hasEmDash =
      text.includes("—") ||
      html.includes("&mdash;") ||
      html.includes("&#8212;") ||
      html.includes("&#x2014;");
    const hasEnDash =
      text.includes("–") ||
      html.includes("&ndash;") ||
      html.includes("&#8211;") ||
      html.includes("&#x2013;");
    if (hasEmDash) {
      throw new Error(`E17 FAILURE — em-dash (—) found. Use plain hyphen "-".`);
    }
    if (hasEnDash) {
      throw new Error(`E17 FAILURE — en-dash (–) found. Use plain hyphen "-".`);
    }
    expect(hasEmDash).toBe(false);
    expect(hasEnDash).toBe(false);
  });

  it('E18: FORBIDDEN phrase "jobs that actually fit you" absent', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (text.includes("jobs that actually fit you")) {
      throw new Error(
        `E18 FAILURE — "jobs that actually fit you" found. This phrase is banned on this page.`
      );
    }
    expect(text).not.toContain("jobs that actually fit you");
  });

  it('E19: FORBIDDEN — "Why it fits" AND "What didn\'t fit" headings must NOT both appear (that\'s the sample-report page structure)', () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const headingTexts = headings.map((h) =>
      (h.textContent ?? "").toLowerCase().trim()
    );
    const hasWhyItFits = headingTexts.some((t) => t.includes("why it fits"));
    const hasWhatDidntFit = headingTexts.some((t) =>
      /what didn[’']t fit/.test(t)
    );
    if (hasWhyItFits && hasWhatDidntFit) {
      throw new Error(
        `E19 FAILURE — both "Why it fits" AND "What didn't fit" appear as headings. ` +
          `This is the /sample-match-report page structure and must NOT be present here.`
      );
    }
    expect(hasWhyItFits && hasWhatDidntFit).toBe(false);
  });

  it("E20: FORBIDDEN shaped count claim /\\d[\\d,]*\\s+(jobs|users|seekers|listings|sources)/i absent", () => {
    const text = container.textContent ?? "";
    const pattern = /\d[\d,]*\s+(jobs|users|seekers|listings|sources)/i;
    const m = text.match(pattern);
    if (m) {
      throw new Error(
        `E20 FAILURE — numeric count claim found: "${m[0]}". ` +
          `Pattern /\\d[\\d,]*\\s+(jobs|users|seekers|listings|sources)/i is banned.`
      );
    }
    expect(text).not.toMatch(pattern);
  });

  // Questions section
  it('E21: heading with text "Questions" (any level) is present', () => {
    const headings = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const found = headings.find(
      (h) => (h.textContent ?? "").trim().toLowerCase() === "questions"
    );
    if (!found) {
      throw new Error(
        `E21 FAILURE — no heading with text "Questions" found.\n` +
          `  Heading texts: ${headings
            .map((h) => `"${h.textContent?.trim()}"`)
            .join(", ")}`
      );
    }
    expect(found).not.toBeNull();
  });

  it('E22: no role="tablist" — Q&A answers must not be gated behind a Tabs component', () => {
    const tablist = container.querySelector('[role="tablist"]');
    if (tablist) {
      throw new Error(
        `E22 FAILURE — role="tablist" found. ` +
          `Q&A answers must be visible on first render, not in a Tabs widget.`
      );
    }
    expect(tablist).toBeNull();
  });

  it('E23: no role="tab" — Q&A answers must not require tab interaction', () => {
    const tabs = container.querySelectorAll('[role="tab"]');
    if (tabs.length > 0) {
      throw new Error(
        `E23 FAILURE — ${tabs.length} role="tab" element(s) found. ` +
          `Q&A answers must not require tab interaction.`
      );
    }
    expect(tabs).toHaveLength(0);
  });
});

// ── Group F: CTAs ─────────────────────────────────────────────────────────────

describe("Group F — CTAs", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AiJobToolsPage />));
  });

  it(`F1: anchor href EXACTLY "${SPEC_CTA_SAMPLE_REPORT}" (no utm parameters)`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_SAMPLE_REPORT
    );
    if (!cta) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `F1 FAILURE — no anchor with href="${SPEC_CTA_SAMPLE_REPORT}".\n` +
          `  All hrefs: ${found}\n` +
          `  ADVERSARIAL: if <Button as="a" href="...">, the Chakra mock must forward both as and href.`
      );
    }
    expect(cta).not.toBeNull();
  });

  it(`F2: anchor href EXACTLY "${SPEC_CTA_SIGNUP}"`, () => {
    // utm_medium must be "ai-job-tools" — copy-paste from /about would give "about".
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_SIGNUP
    );
    if (!cta) {
      const signupLike = anchors
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h.includes("signup") || h.includes("utm"));
      throw new Error(
        `F2 FAILURE — no anchor with href="${SPEC_CTA_SIGNUP}".\n` +
          `  Signup/UTM-like hrefs: ${signupLike.join(", ")}\n` +
          `  utm_medium must be "ai-job-tools" (not "about" or "landing").`
      );
    }
    expect(cta).not.toBeNull();
  });

  it('F3: no anchor href contains "utm_medium=about" (copy-paste guard)', () => {
    // ADVERSARIAL: copy-pasted CTA from /about would retain utm_medium=about.
    const anchors = Array.from(container.querySelectorAll("a"));
    const wrong = anchors.find((a) =>
      (a.getAttribute("href") ?? "").includes("utm_medium=about")
    );
    if (wrong) {
      throw new Error(
        `F3 FAILURE — anchor with utm_medium=about found: ` +
          `href="${wrong.getAttribute("href")}". ` +
          `This page must use utm_medium=ai-job-tools.`
      );
    }
    expect(wrong).toBeUndefined();
  });
});

// ── Group G: Static / Auth guarantees ────────────────────────────────────────

describe("Group G — Static / Auth guarantees", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
  });

  it("G1: rendering does NOT call fetch with any /api/ path", () => {
    render(<AiJobToolsPage />);
    const apiCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [any]) => /\/api\//i.test(String(url))
    );
    if (apiCall) {
      throw new Error(
        `G1 FAILURE — fetch called with /api/ URL: "${apiCall[0]}". ` +
          `The /ai-job-tools page must be fully static.`
      );
    }
    expect(apiCall).toBeUndefined();
  });

  it("G2: rendering does NOT call fetch with /jobs/stats", () => {
    render(<AiJobToolsPage />);
    const statsCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [any]) => String(url).includes("/jobs/stats")
    );
    if (statsCall) {
      throw new Error(
        `G2 FAILURE — fetch called with /jobs/stats: "${statsCall[0]}".`
      );
    }
    expect(statsCall).toBeUndefined();
  });

  it("G3: module does NOT export getServerSideProps", () => {
    if ("getServerSideProps" in AiJobToolsModule) {
      throw new Error(
        `G3 FAILURE — page exports getServerSideProps. The page must be fully static.`
      );
    }
    expect("getServerSideProps" in AiJobToolsModule).toBe(false);
  });

  it("G4: module does NOT export getStaticProps", () => {
    if ("getStaticProps" in AiJobToolsModule) {
      throw new Error(
        `G4 FAILURE — page exports getStaticProps. The page must be fully static with no build-time data fetching.`
      );
    }
    expect("getStaticProps" in AiJobToolsModule).toBe(false);
  });

  it("G5: module default export is a React function component", () => {
    expect(typeof AiJobToolsModule.default).toBe("function");
  });

  it("G6: rendering (logged-out) does NOT call router.push or router.replace", () => {
    render(<AiJobToolsPage />);
    if (mockRouterPush.mock.calls.length > 0) {
      throw new Error(
        `G6 FAILURE — router.push called during render: ` +
          `${JSON.stringify(mockRouterPush.mock.calls)}. ` +
          `The /ai-job-tools page must not redirect.`
      );
    }
    if (mockRouterReplace.mock.calls.length > 0) {
      throw new Error(
        `G6 FAILURE — router.replace called during render: ` +
          `${JSON.stringify(mockRouterReplace.mock.calls)}.`
      );
    }
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

// ── Group H: Footer (real component, unmocked) ────────────────────────────────

describe("Group H — Footer (real component, unmocked)", () => {
  it('H1: full Footer has anchor href="/ai-job-tools"', () => {
    const { container: footerContainer } = render(<Footer />);
    const anchors = Array.from(footerContainer.querySelectorAll("a"));
    const link = anchors.find((a) => a.getAttribute("href") === "/ai-job-tools");
    if (!link) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `H1 FAILURE — no anchor with href="/ai-job-tools" in Footer.\n` +
          `  Found hrefs: ${found}`
      );
    }
    expect(link).not.toBeNull();
  });

  it('H2: Footer "OnlyJobs" wordmark is NOT a heading element (must use as="span")', () => {
    const { container: footerContainer } = render(<Footer />);
    const headingEls = footerContainer.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const wordmarkHeadings = Array.from(headingEls).filter(
      (el) => el.textContent?.trim() === "OnlyJobs"
    );
    if (wordmarkHeadings.length > 0) {
      throw new Error(
        `H2 FAILURE — Footer "OnlyJobs" wordmark is a heading element ` +
          `(${wordmarkHeadings.map((el) => el.tagName).join(", ")}). ` +
          `It must use as="span" to avoid heading-order violations on pages with their own h1.`
      );
    }
    expect(wordmarkHeadings).toHaveLength(0);
  });

  it('H3: minimal Footer does NOT contain href="/ai-job-tools"', () => {
    const { container: footerContainer } = render(<Footer minimal={true} />);
    const anchors = Array.from(footerContainer.querySelectorAll("a"));
    const link = anchors.find((a) => a.getAttribute("href") === "/ai-job-tools");
    if (link) {
      throw new Error(
        `H3 FAILURE — minimal Footer contains href="/ai-job-tools". ` +
          `The minimal footer is for app pages and must not include marketing page links.`
      );
    }
    expect(link).toBeUndefined();
  });
});

// ── Group I: Sitemap ──────────────────────────────────────────────────────────

describe("Group I — Sitemap", () => {
  let sitemapXml: string;

  beforeAll(() => {
    sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  });

  it("I1: public/sitemap.xml exists", () => {
    expect(fs.existsSync(SITEMAP_PATH)).toBe(true);
  });

  it("I2: sitemap contains <loc>https://onlyjobs.app/ai-job-tools</loc>", () => {
    if (!sitemapXml.includes("<loc>https://onlyjobs.app/ai-job-tools</loc>")) {
      throw new Error(
        `I2 FAILURE — <loc>https://onlyjobs.app/ai-job-tools</loc> not found in sitemap.xml.`
      );
    }
    expect(sitemapXml).toContain("<loc>https://onlyjobs.app/ai-job-tools</loc>");
  });

  it("I3: sitemap does NOT contain /pricing", () => {
    if (sitemapXml.includes("/pricing")) {
      throw new Error(
        `I3 FAILURE — /pricing found in sitemap.xml. The /pricing route is a redirect and must not be indexed.`
      );
    }
    expect(sitemapXml).not.toContain("/pricing");
  });

  it('I4: sitemap does NOT contain "jack-and-jill"', () => {
    if (sitemapXml.includes("jack-and-jill")) {
      throw new Error(
        `I4 FAILURE — "jack-and-jill" found in sitemap.xml. The retired compare page must be removed.`
      );
    }
    expect(sitemapXml).not.toContain("jack-and-jill");
  });

  it('I5: sitemap does NOT contain bare "https://onlyjobs.app/compare" URL', () => {
    const hasCompare =
      sitemapXml.includes("<loc>https://onlyjobs.app/compare</loc>") ||
      sitemapXml.includes("<loc>https://onlyjobs.app/compare/");
    if (hasCompare) {
      throw new Error(
        `I5 FAILURE — sitemap contains a /compare or /compare/* <loc>. All compare pages are retired.`
      );
    }
    expect(hasCompare).toBe(false);
  });

  it("I6: /ai-job-tools entry has a <lastmod> in YYYY-MM-DD format", () => {
    const urlBlock = sitemapXml.match(
      /<url>[\s\S]*?<loc>https:\/\/onlyjobs\.app\/ai-job-tools<\/loc>[\s\S]*?<\/url>/
    );
    if (!urlBlock) {
      throw new Error(
        `I6 FAILURE — could not find <url> block for /ai-job-tools in sitemap.xml.`
      );
    }
    const lastmodMatch = urlBlock[0].match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(`I6 FAILURE — <lastmod> missing from /ai-job-tools sitemap entry.`);
    }
    const lastmod = lastmodMatch[1].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
      throw new Error(
        `I6 FAILURE — /ai-job-tools <lastmod> "${lastmod}" is not YYYY-MM-DD.`
      );
    }
    expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (allowed per spec):
//
//   src/__tests__/24g.4.about.adversarial.test.tsx —
//     Harness patterns: Chakra Proxy mock (Button forwarding as/href/target/rel, Link
//     forwarding target/rel, Heading forwarding as), fetch mock via global.fetch = jest.fn(),
//     JSON-LD helpers (getAllJsonLdParsed, collectAllTypes, collectAllTypesFromPage,
//     findNodeByType), module namespace import for static-export checks,
//     mockRouterPush/mockRouterReplace module-level pattern, Sitemap group structure.
//     Saw SPEC constant values and group structures — no oracle VALUES adopted from 24g.4;
//     all expected values here trace to the spec for this task (24g.5).
//     Incidentally saw H5 "exactly 8 <url> entries" check; did NOT copy it since the
//     sitemap count oracle belongs to whichever file owns that assertion (24g.seo-foundation).
//
//   src/__tests__/24g.seo-foundation.adversarial.test.tsx —
//     Proxy makeEl factory pattern; AuthContext/GuideContext mock shapes; react-icons Proxy;
//     next/link ...rest forwarding pattern. AVOIDED the SEO-mocked-to-null pattern
//     (jest.mock('@/components/SEO', () => ({ SEO: () => null, ... }))) per spec instruction.
//
//   src/__tests__/24g.5.ai-job-tools.smoke.test.tsx —
//     Confirmed import path "@/pages/ai-job-tools" resolves. Saw S1-S7 smoke assertions;
//     none used as oracles — all adversarial assertions trace to the spec.
//     Noted smoke Button mock does NOT forward target/rel — adversarial file uses the
//     fuller 24g.4 Button mock.
//
//   src/components/SEO.tsx — ALLOWED. Read to confirm:
//     (1) fullTitle rule: title.includes(SITE_NAME) → use as-is, else append " | SITE_NAME"
//     (2) canonicalUrl = canonical ? BASE_URL + canonical : undefined
//     (3) resolvedOgTitle = ogTitle ?? fullTitle — omitting ogTitle collapses og:title to fullTitle
//     (4) resolvedOgDescription = ogDescription ?? description
//     (5) DEFAULT_OG_IMAGE = "https://onlyjobs.app/og-image.png"
//     (6) ogType defaults to "website"; page must pass ogType="article" explicitly.
//     These informed A10 (og:title != <title> means ogTitle was properly set) and A7/B1/B2.
//     The DEFAULT_OG_IMAGE value here ("https://onlyjobs.app/og-image.png") matches the
//     spec's stated default; SPEC_OG_IMAGE oracle traces to the spec, not to the file read.
//
//   src/components/Footer.tsx — ALLOWED. Confirmed:
//     (a) href="/ai-job-tools" ContactLink on line ~127 (full footer only) → H1 testable.
//     (b) Heading as="span" line ~83 → H2 testable; wordmark is NOT a heading.
//     (c) minimal footer (lines ~39-71) does NOT include /ai-job-tools → H3 testable.
//     All assertions derive from spec; file confirmed testability only.
//
//   public/sitemap.xml — ALLOWED. Confirmed:
//     8 total <url> entries; /ai-job-tools present (lastmod 2026-10-01); /pricing absent;
//     jack-and-jill absent; /compare absent.
//
// Incidental knowledge kept OUT of oracles:
//   - Smoke test S3 shows the @type set was passing — confirms types are correct in the
//     passing implementation but SPEC is the oracle, not smoke output.
//   - SEO.tsx DEFAULT_OG_IMAGE string was read — SPEC_OG_IMAGE oracle is "the spec says
//     og:image default 'https://onlyjobs.app/og-image.png'"; the read confirmed consistency.
//   - Footer.tsx line 127 — G1 oracle from spec, file read confirmed the link exists and
//     is testable via the styled-components mock.
//
// Novel adversarial choices vs. smoke test:
//   - A10: og:title != <title> (catches omitted ogTitle prop)
//   - B1/B2: Shared-SEO regression (adding article ogType must not change component defaults)
//   - C5 (B5 in the forbidden-types loop): 11 individually-named forbidden @type values
//   - D3: Dollar amount regex scan — only $2 and $0.30 permitted
//   - D4/D4b: Word-boundary brand name scan (jobright, himalayas.app)
//   - D6a: fs.existsSync check for the retired compare file
//   - E19: "Why it fits" + "What didn't fit" heading pair = copy-paste from sample-report
//   - F2/F3: UTM medium correctness + copy-paste guard (utm_medium=about forbidden)
//   - G3: minimal Footer must NOT include the new marketing page link
//   - makeEl forwards `as` prop so Box as="nav" renders as <nav> (breadcrumb testable)
//
// Limitations (FINDINGS — not weakened):
//
//   G6 (logged-in redirect): tested only the logged-out path. Re-mocking AuthContext
//   with isLoggedIn=true inside a single test conflicts with module-level mock hoisting.
//   Playwright with authenticated session is the authoritative check.
//
//   E22/E23 (Accordion check): the Chakra Accordion mock ALWAYS renders AccordionPanel
//   children. So D22/E23 correctly gate TABS (role=tablist/tab) but cannot detect a
//   visually-collapsed Accordion in the real browser. E7 (prepaid wallet required) and
//   E11 (charge phrasing required) provide implicit coverage — if those texts are absent,
//   the answer content is not on first render regardless of the cause.
//
//   E17 (em/en-dash): CSS-injected dashes (::before/::after pseudo-elements) are not
//   caught by jsdom textContent. Playwright visual diff is the authoritative check.
//
//   D3 (dollar amounts): matches only numeric forms ($2, $0.30). An amount written in
//   words ("thirty cents") would not be caught.
