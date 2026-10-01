/**
 * ADVERSARIAL TEST — onlyjobs-24g.4: /about founder page
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * FORBIDDEN (body not opened):
 *   src/pages/about.tsx — imported/rendered only
 *
 * ALLOWED:
 *   src/components/SEO.tsx (real, unmocked)
 *   src/components/Footer.tsx (real, unmocked)
 *   src/__tests__/24g.2.sample-match-report.adversarial.test.tsx (harness patterns)
 *   src/__tests__/24g.seo-foundation.adversarial.test.tsx (Chakra mock patterns)
 *   src/__tests__/24g.4.about.smoke.test.tsx (smoke harness)
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

const SPEC_TITLE = "About OnlyJobs: Why I Built It | OnlyJobs";
const SPEC_OG_TYPE = "article";
const SPEC_OG_TITLE = "The laid-off engineer who built OnlyJobs";
const SPEC_OG_DESCRIPTION =
  "I built OnlyJobs after my own job hunt went badly - a matcher that explains every match, with no subscription. Here's the story, and why I don't sell one.";
const SPEC_CANONICAL = "https://onlyjobs.app/about";
// ADVERSARIAL: the /about page must NOT set a custom ogImage — it must use the site default.
const SPEC_OG_IMAGE = "https://onlyjobs.app/og-image.png";
const SPEC_LINKEDIN_HREF = "https://www.linkedin.com/in/anoop-1507";
const SPEC_CONTACT_HREF = "mailto:contact@auroradesignshq.com";
const SPEC_CTA_SAMPLE_REPORT = "/sample-match-report";
const SPEC_CTA_SIGNUP =
  "/?utm_source=site&utm_medium=about&utm_content=cta#signup";

const SITEMAP_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "public",
  "sitemap.xml"
);

// ── Mocks ─────────────────────────────────────────────────────────────────────

const nullIcon = () => null;

// Captured at module level so E6 can inspect them across renders.
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: jest.fn(),
    pathname: "/about",
    query: {},
    asPath: "/about",
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
  usePathname: () => "/about",
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
    function StyledMock({ children, ...rest }: any) {
      return React.createElement("a", rest, children);
    }
    return StyledMock;
  };
  return { __esModule: true, default: styled };
});

// CRITICAL: Heading forwards `as` (default h2). A page using <Heading> without
// as="h1" on the hero renders h2 and fails the "exactly one h1" assertion.
// CRITICAL: Button forwards `as`, `href`, `target`, `rel` — CTA buttons that render
// as anchors via as="a" would silently swallow the href without this forwarding,
// causing D4/D5 to false-negative.
// CRITICAL: Chakra Link forwards `target`/`rel` — LinkedIn link uses these.
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
      React.createElement(
        "button",
        { "aria-label": al, onClick },
        children ?? null
      ),
    // CRITICAL: Link forwards target and rel so <Link target="_blank" rel="noopener"> works.
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
    ModalOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    ModalBody: ({ children }: any) => React.createElement("div", null, children),
    ModalFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "×"),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement("div", null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    Input: makeEl("input"),
    Textarea: makeEl("textarea"),
    Select: ({ children, ...p }: any) =>
      React.createElement("select", p, children),
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
// Real SEO — NOT mocked to null. Tests the real contract.
// eslint-disable-next-line import/first
import { SEO } from "@/components/SEO";
// Real Footer — NOT mocked to null.
// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";
// Module namespace for static-export checks without reading body.
// eslint-disable-next-line import/first
import * as AboutModule from "@/pages/about";

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

// Walk the ENTIRE JSON structure recursively, collecting every @type value found.
// This catches nested nodes (e.g., a SoftwareApplication inside a WebPage node)
// that top-level-only graph scans miss.
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

function findNodeByType(container: HTMLElement, type: string): any {
  for (const parsed of getAllJsonLdParsed(container)) {
    if (!parsed) continue;
    const graph: any[] = Array.isArray(parsed["@graph"])
      ? parsed["@graph"]
      : [parsed];
    const found = graph.find((n: any) => n["@type"] === type);
    if (found) return found;
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
    ({ container } = render(<AboutPage />));
  });

  it(`A1: <title> is EXACTLY "${SPEC_TITLE}"`, () => {
    const title = container.querySelector("title");
    expect(title).not.toBeNull();
    const text = title!.textContent ?? "";
    if (text !== SPEC_TITLE) {
      throw new Error(
        `A1 FAILURE — <title> mismatch.\n` +
          `  Expected: "${SPEC_TITLE}"\n` +
          `  Observed: "${text}"\n` +
          `  SEO fullTitle rule: if title contains "OnlyJobs", use as-is; else append " | OnlyJobs".\n` +
          `  Both "About OnlyJobs: Why I Built It | OnlyJobs" (contains OnlyJobs) and\n` +
          `  "About OnlyJobs: Why I Built It" + suffix produce the same spec value.`
      );
    }
    expect(text).toBe(SPEC_TITLE);
  });

  it(`A2: og:type is EXACTLY "${SPEC_OG_TYPE}"`, () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== SPEC_OG_TYPE) {
      throw new Error(
        `A2 FAILURE — og:type is "${ogType}", expected "${SPEC_OG_TYPE}". ` +
          `The about page must pass ogType="article" to <SEO>.`
      );
    }
    expect(ogType).toBe(SPEC_OG_TYPE);
  });

  it(`A3: og:title is EXACTLY "${SPEC_OG_TITLE}"`, () => {
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (ogTitle !== SPEC_OG_TITLE) {
      throw new Error(
        `A3 FAILURE — og:title mismatch.\n` +
          `  Expected: "${SPEC_OG_TITLE}"\n` +
          `  Observed: "${ogTitle}"\n` +
          `  This is distinct from <title>. The page must pass ogTitle="${SPEC_OG_TITLE}"\n` +
          `  as a separate prop; omitting ogTitle causes it to fall back to fullTitle.`
      );
    }
    expect(ogTitle).toBe(SPEC_OG_TITLE);
  });

  it("A4: og:description is EXACTLY the spec string", () => {
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    if (ogDesc !== SPEC_OG_DESCRIPTION) {
      throw new Error(
        `A4 FAILURE — og:description mismatch.\n` +
          `  Expected: "${SPEC_OG_DESCRIPTION}"\n` +
          `  Observed: "${ogDesc}"\n` +
          `  The page must pass ogDescription="..." separately (resolvedOgDescription = ogDescription ?? description).`
      );
    }
    expect(ogDesc).toBe(SPEC_OG_DESCRIPTION);
  });

  it(`A5: canonical is EXACTLY "${SPEC_CANONICAL}"`, () => {
    const canonical = container
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    if (canonical !== SPEC_CANONICAL) {
      throw new Error(
        `A5 FAILURE — canonical mismatch.\n` +
          `  Expected: "${SPEC_CANONICAL}"\n` +
          `  Observed: "${canonical}"\n` +
          `  SEO.tsx prepends BASE_URL ("https://onlyjobs.app") to the canonical prop.\n` +
          `  The page must pass canonical="/about".`
      );
    }
    expect(canonical).toBe(SPEC_CANONICAL);
  });

  it(`A6: og:image is the site-default "${SPEC_OG_IMAGE}" (no custom page image)`, () => {
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SPEC_OG_IMAGE) {
      throw new Error(
        `A6 FAILURE — og:image mismatch.\n` +
          `  Expected: "${SPEC_OG_IMAGE}" (site-wide default)\n` +
          `  Observed: "${ogImage}"\n` +
          `  The /about page must NOT override ogImage with a custom URL.`
      );
    }
    expect(ogImage).toBe(SPEC_OG_IMAGE);
  });

  it("A7: twitter:title equals og:title (both equal spec og:title)", () => {
    const twitterTitle = getMeta(container, 'meta[name="twitter:title"]');
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (twitterTitle !== ogTitle) {
      throw new Error(
        `A7 FAILURE — twitter:title !== og:title.\n` +
          `  twitter:title: "${twitterTitle}"\n` +
          `  og:title:      "${ogTitle}"`
      );
    }
    expect(twitterTitle).toBe(SPEC_OG_TITLE);
  });

  it("A8: twitter:description equals og:description (both equal spec og:description)", () => {
    const twitterDesc = getMeta(container, 'meta[name="twitter:description"]');
    const ogDesc = getMeta(container, 'meta[property="og:description"]');
    if (twitterDesc !== ogDesc) {
      throw new Error(
        `A8 FAILURE — twitter:description !== og:description.\n` +
          `  twitter:description: "${twitterDesc}"\n` +
          `  og:description:      "${ogDesc}"`
      );
    }
    expect(twitterDesc).toBe(SPEC_OG_DESCRIPTION);
  });

  it("A9: og:title is DIFFERENT from <title> (distinct spec values — omitting ogTitle is wrong)", () => {
    // ADVERSARIAL: if the page omits ogTitle, resolvedOgTitle falls back to fullTitle,
    // making og:title === <title>. The spec intentionally defines them as two different strings.
    const titleText = container.querySelector("title")?.textContent ?? "";
    const ogTitle = getMeta(container, 'meta[property="og:title"]');
    if (titleText === ogTitle) {
      throw new Error(
        `A9 FAILURE — og:title === <title>: "${ogTitle}".\n` +
          `  <title> spec:    "${SPEC_TITLE}"\n` +
          `  og:title spec:   "${SPEC_OG_TITLE}"\n` +
          `  These are intentionally different. If og:title equals <title>, ogTitle prop was omitted.`
      );
    }
    expect(titleText).not.toBe(ogTitle);
  });
});

// ── Group B: Shared-SEO regression ───────────────────────────────────────────

describe("Group B — Shared-SEO regression (real SEO component, unmocked)", () => {
  // Verify that adding article-specific SEO to /about did not break the SEO component
  // defaults consumed by other pages.

  it("B1: SEO with only {title, description} still emits og:type='website' (default not overridden)", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "website") {
      throw new Error(
        `B1 FAILURE — SEO default og:type is now "${ogType}", expected "website". ` +
          `Adding ogType="article" to /about should not change the component default.`
      );
    }
    expect(ogType).toBe("website");
  });

  it("B2: SEO with only {title, description} emits default og:image (not a custom /about image)", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== SPEC_OG_IMAGE) {
      throw new Error(
        `B2 FAILURE — SEO default og:image is "${ogImage}", expected "${SPEC_OG_IMAGE}". ` +
          `The component default was changed or the /about page left a side-effect.`
      );
    }
    expect(ogImage).toBe(SPEC_OG_IMAGE);
  });

  it("B3: SEO fullTitle rule — title without 'OnlyJobs' gets ' | OnlyJobs' suffix", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const text = container.querySelector("title")?.textContent ?? "";
    expect(text).toBe("Test Page | OnlyJobs");
    expect(text).not.toContain("| OnlyJobs | OnlyJobs");
  });
});

// ── Group C: JSON-LD structured data ─────────────────────────────────────────

describe("Group C — JSON-LD structured data", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AboutPage />));
  });

  it("C1: at least one <script type='application/ld+json'> is rendered", () => {
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
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

  it("C3: @type AboutPage present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("AboutPage")) {
      throw new Error(
        `C3 FAILURE — @type "AboutPage" not found.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("AboutPage")).toBe(true);
  });

  it("C4: @type Person present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("Person")) {
      throw new Error(
        `C4 FAILURE — @type "Person" not found.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("Person")).toBe(true);
  });

  it("C5: @type BreadcrumbList present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("BreadcrumbList")) {
      throw new Error(
        `C5 FAILURE — @type "BreadcrumbList" not found.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("BreadcrumbList")).toBe(true);
  });

  // ADVERSARIAL: recursive scan catches forbidden types nested inside other nodes,
  // not just top-level @graph entries.
  const FORBIDDEN_TYPES = [
    "SoftwareApplication",
    "FAQPage",
    "JobPosting",
    "ItemList",
  ];

  for (const forbiddenType of FORBIDDEN_TYPES) {
    it(`C6: NO node @type "${forbiddenType}" anywhere in ld+json (recursive scan)`, () => {
      const types = collectAllTypesFromPage(container);
      if (types.has(forbiddenType)) {
        throw new Error(
          `C6 FAILURE — forbidden @type "${forbiddenType}" found in JSON-LD (deep scan). ` +
            `Must not appear, including inside nested objects.`
        );
      }
      expect(types.has(forbiddenType)).toBe(false);
    });
  }

  // ── Person node ──

  it('C7: Person.name is exactly "Anoop Santhanam"', () => {
    const person = findNodeByType(container, "Person");
    if (!person) throw new Error(`C7 FAILURE — no Person node in ld+json.`);
    if (person.name !== "Anoop Santhanam") {
      throw new Error(
        `C7 FAILURE — Person.name is "${person.name}", expected "Anoop Santhanam".`
      );
    }
    expect(person.name).toBe("Anoop Santhanam");
  });

  it('C8: Person.jobTitle is exactly "Founder"', () => {
    const person = findNodeByType(container, "Person");
    expect(person).not.toBeNull();
    if (person.jobTitle !== "Founder") {
      throw new Error(
        `C8 FAILURE — Person.jobTitle is "${person.jobTitle}", expected "Founder".`
      );
    }
    expect(person.jobTitle).toBe("Founder");
  });

  it("C9: Person has a non-empty @id string", () => {
    const person = findNodeByType(container, "Person");
    expect(person).not.toBeNull();
    if (!person["@id"] || typeof person["@id"] !== "string") {
      throw new Error(
        `C9 FAILURE — Person node missing @id. ` +
          `Required so AboutPage.mainEntity can reference it.`
      );
    }
    expect(person["@id"].length).toBeGreaterThan(0);
  });

  it('C10: Person.worksFor is an object with @id "https://onlyjobs.app/#organization"', () => {
    const person = findNodeByType(container, "Person");
    expect(person).not.toBeNull();
    const wf = person.worksFor;
    if (!wf || typeof wf !== "object" || Array.isArray(wf)) {
      throw new Error(
        `C10 FAILURE — Person.worksFor is not an object: ${JSON.stringify(wf)}.`
      );
    }
    if (wf["@id"] !== "https://onlyjobs.app/#organization") {
      throw new Error(
        `C10 FAILURE — Person.worksFor["@id"] is "${wf["@id"]}", ` +
          `expected "https://onlyjobs.app/#organization".`
      );
    }
    expect(wf["@id"]).toBe("https://onlyjobs.app/#organization");
    if (wf["@type"] !== "Organization") {
      throw new Error(
        `C10 FAILURE — Person.worksFor["@type"] is "${wf["@type"]}", ` +
          `expected "Organization". Nested stub must carry @type.`
      );
    }
    expect(wf["@type"]).toBe("Organization");
    if (wf["name"] !== "OnlyJobs") {
      throw new Error(
        `C10 FAILURE — Person.worksFor["name"] is "${wf["name"]}", ` +
          `expected "OnlyJobs". Nested stub must carry name.`
      );
    }
    expect(wf["name"]).toBe("OnlyJobs");
  });

  it('C11: Person.sameAs is an array containing "https://www.linkedin.com/in/anoop-1507"', () => {
    const person = findNodeByType(container, "Person");
    expect(person).not.toBeNull();
    const sameAs = person.sameAs;
    if (!Array.isArray(sameAs)) {
      throw new Error(
        `C11 FAILURE — Person.sameAs is not an array: ${JSON.stringify(sameAs)}. ` +
          `Must be an array to accommodate multiple social profiles.`
      );
    }
    if (!sameAs.includes("https://www.linkedin.com/in/anoop-1507")) {
      throw new Error(
        `C11 FAILURE — Person.sameAs does not contain "${SPEC_LINKEDIN_HREF}".\n` +
          `  Found: ${JSON.stringify(sameAs)}`
      );
    }
    expect(sameAs).toContain("https://www.linkedin.com/in/anoop-1507");
  });

  // ── AboutPage node ──

  it("C12: AboutPage.mainEntity references the Person @id (value ends with '#person')", () => {
    const aboutPage = findNodeByType(container, "AboutPage");
    if (!aboutPage)
      throw new Error(`C12 FAILURE — no AboutPage node in ld+json.`);
    const person = findNodeByType(container, "Person");
    expect(person).not.toBeNull();
    const personId: string = person["@id"] ?? "";
    if (!personId) {
      throw new Error(`C12 FAILURE — Person node has no @id to match against.`);
    }
    // mainEntity may be a string ref or an object with @id
    const ref: string =
      typeof aboutPage.mainEntity === "string"
        ? aboutPage.mainEntity
        : (aboutPage.mainEntity?.["@id"] ?? "");
    if (!ref) {
      throw new Error(
        `C12 FAILURE — AboutPage.mainEntity is missing or has no @id: ` +
          `${JSON.stringify(aboutPage.mainEntity)}.`
      );
    }
    if (!ref.endsWith("#person")) {
      throw new Error(
        `C12 FAILURE — AboutPage.mainEntity ref "${ref}" does not end with "#person". ` +
          `Person @id is "${personId}".`
      );
    }
    if (ref !== personId) {
      throw new Error(
        `C12 FAILURE — AboutPage.mainEntity ref "${ref}" does not exactly match ` +
          `Person @id "${personId}". The linkage points at a different id.`
      );
    }
    expect(ref).toBe(personId);
  });

  it('C13: AboutPage.about references "https://onlyjobs.app/#organization"', () => {
    const aboutPage = findNodeByType(container, "AboutPage");
    expect(aboutPage).not.toBeNull();
    const ref: string =
      typeof aboutPage.about === "string"
        ? aboutPage.about
        : (aboutPage.about?.["@id"] ?? "");
    if (ref !== "https://onlyjobs.app/#organization") {
      throw new Error(
        `C13 FAILURE — AboutPage.about ref is "${ref}", ` +
          `expected "https://onlyjobs.app/#organization".`
      );
    }
    expect(ref).toBe("https://onlyjobs.app/#organization");
  });

  // ── BreadcrumbList ──

  it('C14: BreadcrumbList position 1 — name "Home", item "https://onlyjobs.app/"', () => {
    const bl = findNodeByType(container, "BreadcrumbList");
    if (!bl) throw new Error(`C14 FAILURE — no BreadcrumbList in ld+json.`);
    const items: any[] = bl.itemListElement ?? [];
    const pos1 = items.find((i: any) => i.position === 1);
    if (!pos1) {
      throw new Error(
        `C14 FAILURE — no breadcrumb with position=1.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    if (pos1.name !== "Home") {
      throw new Error(
        `C14 FAILURE — position 1 name is "${pos1.name}", expected "Home".`
      );
    }
    if (pos1.item !== "https://onlyjobs.app/") {
      throw new Error(
        `C14 FAILURE — position 1 item is "${pos1.item}", ` +
          `expected "https://onlyjobs.app/" (with trailing slash).`
      );
    }
    expect(pos1.name).toBe("Home");
    expect(pos1.item).toBe("https://onlyjobs.app/");
  });

  it('C15: BreadcrumbList position 2 — name "About", item "https://onlyjobs.app/about"', () => {
    const bl = findNodeByType(container, "BreadcrumbList");
    expect(bl).not.toBeNull();
    const items: any[] = bl.itemListElement ?? [];
    const pos2 = items.find((i: any) => i.position === 2);
    if (!pos2) {
      throw new Error(
        `C15 FAILURE — no breadcrumb with position=2.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    if (pos2.name !== "About") {
      throw new Error(
        `C15 FAILURE — position 2 name is "${pos2.name}", expected "About".`
      );
    }
    if (pos2.item !== "https://onlyjobs.app/about") {
      throw new Error(
        `C15 FAILURE — position 2 item is "${pos2.item}", ` +
          `expected "https://onlyjobs.app/about".`
      );
    }
    expect(pos2.name).toBe("About");
    expect(pos2.item).toBe("https://onlyjobs.app/about");
  });
});

// ── Group D: Body / Copy ──────────────────────────────────────────────────────

describe("Group D — Body / Copy", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AboutPage />));
  });

  it("D1: exactly ONE <h1> on the page", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `D1 FAILURE — expected 1 <h1>, found ${h1s.length}: ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("D2: no <h2> appears before the <h1> in DOM order", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    const h2sBefore = Array.from(container.querySelectorAll("h2")).filter(
      (h2) => !!(h2.compareDocumentPosition(h1!) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
    if (h2sBefore.length > 0) {
      throw new Error(
        `D2 FAILURE — ${h2sBefore.length} <h2>(s) appear before <h1>:\n` +
          h2sBefore.map((el) => `  "${el.textContent?.trim()}"`).join("\n")
      );
    }
    expect(h2sBefore).toHaveLength(0);
  });

  it('D3: REQUIRED "Aurora Designs LLP" present', () => {
    const text = container.textContent ?? "";
    if (!text.includes("Aurora Designs LLP")) {
      throw new Error(
        `D3 FAILURE — "Aurora Designs LLP" not found in rendered text.`
      );
    }
    expect(text).toContain("Aurora Designs LLP");
  });

  it('D4: REQUIRED "Anoop Santhanam" present', () => {
    const text = container.textContent ?? "";
    if (!text.includes("Anoop Santhanam")) {
      throw new Error(
        `D4 FAILURE — "Anoop Santhanam" not found in rendered text.`
      );
    }
    expect(text).toContain("Anoop Santhanam");
  });

  it('D5: REQUIRED subscription framing ("no subscription" / "isn\'t a subscription" / "not a subscription")', () => {
    const text = (container.textContent ?? "").toLowerCase();
    const ok =
      text.includes("no subscription") ||
      text.includes("isn't a subscription") ||
      text.includes("isn’t a subscription") ||
      text.includes("not a subscription");
    if (!ok) {
      throw new Error(
        `D5 FAILURE — none of "no subscription", "isn't a subscription", ` +
          `or "not a subscription" found in rendered text.`
      );
    }
    expect(ok).toBe(true);
  });

  it('D6: REQUIRED emotional no-subscription beat — "felt wrong when I was the one out of work" AND "It still feels wrong"', () => {
    // Voice-approved copy: "It felt wrong when I was the one out of work. It still feels wrong."
    // jsdom decodes HTML entities in textContent, so apostrophe/entity variants are handled.
    // Case-insensitive to tolerate minor casing drift without obscuring a real removal.
    const text = container.textContent ?? "";
    const textLower = text.toLowerCase();
    const hasFeltWrong = textLower.includes(
      "felt wrong when i was the one out of work"
    );
    const hasStillFeels = textLower.includes("it still feels wrong");
    if (!hasFeltWrong) {
      throw new Error(
        `D6 FAILURE — "felt wrong when I was the one out of work" not found.\n` +
          `  textContent excerpt (first 600 chars):\n  "${text.substring(0, 600)}"`
      );
    }
    if (!hasStillFeels) {
      throw new Error(
        `D6 FAILURE — "It still feels wrong" not found.\n` +
          `  textContent excerpt (first 600 chars):\n  "${text.substring(0, 600)}"`
      );
    }
    expect(hasFeltWrong).toBe(true);
    expect(hasStillFeels).toBe(true);
  });

  it('D7: REQUIRED "$2" present', () => {
    expect(container.textContent).toContain("$2");
  });

  it('D8: REQUIRED "$0.30" present', () => {
    expect(container.textContent).toContain("$0.30");
  });

  it('D9: REQUIRED "beta" present (any case)', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (!text.includes("beta")) {
      throw new Error(`D9 FAILURE — "beta" not found in rendered text.`);
    }
    expect(text).toContain("beta");
  });

  // ── Forbidden text ──

  it("D10: FORBIDDEN profanity — /f\\*ck/i and /\\bfuck\\b/i absent", () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    if (/f\*ck/i.test(text) || /f\*ck/i.test(html)) {
      throw new Error(
        `D10 FAILURE — "f*ck" (censored profanity) found. Must be removed.`
      );
    }
    if (/\bfuck\b/i.test(text) || /\bfuck\b/i.test(html)) {
      throw new Error(
        `D10 FAILURE — "fuck" found. Must be removed.`
      );
    }
    expect(/f\*ck/i.test(text)).toBe(false);
    expect(/\bfuck\b/i.test(text)).toBe(false);
  });

  it("D11: FORBIDDEN em-dash — and en-dash – absent", () => {
    const text = container.textContent ?? "";
    const html = container.innerHTML;
    // jsdom decodes entities into Unicode in textContent; also check innerHTML for
    // entity forms that could appear via dangerouslySetInnerHTML.
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
      throw new Error(
        `D11 FAILURE — em-dash (—) found. Use a plain hyphen "-" instead.`
      );
    }
    if (hasEnDash) {
      throw new Error(
        `D11 FAILURE — en-dash (–) found. Use a plain hyphen "-" instead.`
      );
    }
    expect(hasEmDash).toBe(false);
    expect(hasEnDash).toBe(false);
  });

  it('D12: FORBIDDEN phrase "not shown elsewhere" absent', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (text.includes("not shown elsewhere")) {
      throw new Error(
        `D12 FAILURE — "not shown elsewhere" found. This phrase is banned.`
      );
    }
    expect(text).not.toContain("not shown elsewhere");
  });

  it('D13: FORBIDDEN "30+" absent', () => {
    const text = container.textContent ?? "";
    if (text.includes("30+")) {
      throw new Error(
        `D13 FAILURE — "30+" found. Numeric count claims are banned.`
      );
    }
    expect(text).not.toContain("30+");
  });

  it("D14: FORBIDDEN numeric count claims /\\d[\\d,]*\\+?\\s*(job seekers|live jobs|jobs in)/i absent", () => {
    const text = container.textContent ?? "";
    const pattern = /\d[\d,]*\+?\s*(job seekers|live jobs|jobs in)/i;
    const m = text.match(pattern);
    if (m) {
      throw new Error(
        `D14 FAILURE — numeric count claim found: "${m[0]}". ` +
          `Patterns matching /\\d[\\d,]*\\+?\\s*(job seekers|live jobs|jobs in)/i are banned.`
      );
    }
    expect(text).not.toMatch(pattern);
  });

  it('D15: FORBIDDEN word "testimonial" absent', () => {
    const text = (container.textContent ?? "").toLowerCase();
    if (text.includes("testimonial")) {
      throw new Error(
        `D15 FAILURE — "testimonial" found. This word is banned.`
      );
    }
    expect(text).not.toContain("testimonial");
  });
});

// ── Group E: Links and CTAs ───────────────────────────────────────────────────

describe("Group E — Links and CTAs", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<AboutPage />));
  });

  it(`E1: LinkedIn anchor href="${SPEC_LINKEDIN_HREF}" exists`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const li = anchors.find((a) => a.getAttribute("href") === SPEC_LINKEDIN_HREF);
    if (!li) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `E1 FAILURE — no anchor with href="${SPEC_LINKEDIN_HREF}".\n` +
          `  All hrefs: ${found}`
      );
    }
    expect(li).not.toBeNull();
  });

  it('E2: LinkedIn anchor has target="_blank"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const li = anchors.find((a) => a.getAttribute("href") === SPEC_LINKEDIN_HREF);
    if (!li) {
      throw new Error(
        `E2 FAILURE — no LinkedIn anchor found (E1 must pass first).`
      );
    }
    const target = li.getAttribute("target");
    if (target !== "_blank") {
      throw new Error(
        `E2 FAILURE — LinkedIn anchor target="${target}", expected "_blank". ` +
          `If using Chakra Link, ensure the mock forwards target.`
      );
    }
    expect(target).toBe("_blank");
  });

  it('E3: LinkedIn anchor rel contains "noopener"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const li = anchors.find((a) => a.getAttribute("href") === SPEC_LINKEDIN_HREF);
    if (!li) {
      throw new Error(
        `E3 FAILURE — no LinkedIn anchor found (E1 must pass first).`
      );
    }
    const rel = li.getAttribute("rel") ?? "";
    if (!rel.includes("noopener")) {
      throw new Error(
        `E3 FAILURE — LinkedIn anchor rel="${rel}" does not contain "noopener". ` +
          `rel must be "noopener noreferrer" (or at minimum contain "noopener").`
      );
    }
    expect(rel).toContain("noopener");
  });

  it(`E4: contact mailto anchor href="${SPEC_CONTACT_HREF}" exists`, () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const contact = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CONTACT_HREF
    );
    if (!contact) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `E4 FAILURE — no anchor with href="${SPEC_CONTACT_HREF}".\n` +
          `  All hrefs: ${found}`
      );
    }
    expect(contact).not.toBeNull();
  });

  it(`E5: CTA anchor href EXACTLY "${SPEC_CTA_SAMPLE_REPORT}"`, () => {
    // ADVERSARIAL: if this CTA uses <Button as="a" href="...">, the Button mock must
    // forward both `as` and `href` — otherwise a false negative hides the missing link.
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
        `E5 FAILURE — no anchor with href="${SPEC_CTA_SAMPLE_REPORT}".\n` +
          `  All hrefs: ${found}\n` +
          `  If using <Button as="a" href="...">, ensure the Chakra mock forwards as+href.`
      );
    }
    expect(cta).not.toBeNull();
  });

  it(`E6: CTA anchor href EXACTLY "${SPEC_CTA_SIGNUP}"`, () => {
    // The UTM params must be EXACT: utm_source=site, utm_medium=about, utm_content=cta.
    const anchors = Array.from(container.querySelectorAll("a"));
    const cta = anchors.find(
      (a) => a.getAttribute("href") === SPEC_CTA_SIGNUP
    );
    if (!cta) {
      const signupAnchors = anchors
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h.includes("signup") || h.includes("utm"));
      throw new Error(
        `E6 FAILURE — no anchor with href="${SPEC_CTA_SIGNUP}".\n` +
          `  Signup/UTM-like hrefs found: ${signupAnchors.join(", ")}\n` +
          `  Check utm_medium: must be "about" (not "landing" or "sample-report").`
      );
    }
    expect(cta).not.toBeNull();
  });
});

// ── Group F: Static / Auth guarantees ────────────────────────────────────────

describe("Group F — Static / Auth guarantees", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
  });

  it("F1: rendering does NOT call fetch with any /api/ path", () => {
    render(<AboutPage />);
    const apiCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [any]) => /\/api\//i.test(String(url))
    );
    if (apiCall) {
      throw new Error(
        `F1 FAILURE — fetch called with /api/ URL: "${apiCall[0]}". ` +
          `The /about page must be fully static.`
      );
    }
    expect(apiCall).toBeUndefined();
  });

  it("F2: rendering does NOT call fetch with /jobs/stats", () => {
    render(<AboutPage />);
    const statsCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [any]) => String(url).includes("/jobs/stats")
    );
    if (statsCall) {
      throw new Error(
        `F2 FAILURE — fetch called with /jobs/stats: "${statsCall[0]}".`
      );
    }
    expect(statsCall).toBeUndefined();
  });

  it("F3: module does NOT export getServerSideProps", () => {
    if ("getServerSideProps" in AboutModule) {
      throw new Error(
        `F3 FAILURE — page exports getServerSideProps. ` +
          `The /about page must be a static component.`
      );
    }
    expect("getServerSideProps" in AboutModule).toBe(false);
  });

  it("F4: module does NOT export getStaticProps", () => {
    if ("getStaticProps" in AboutModule) {
      throw new Error(
        `F4 FAILURE — page exports getStaticProps. ` +
          `The /about page must be a static component with no build-time data fetching.`
      );
    }
    expect("getStaticProps" in AboutModule).toBe(false);
  });

  it("F5: module default export is a React function component", () => {
    expect(typeof AboutModule.default).toBe("function");
  });

  it("F6: rendering (logged-out state) does NOT call router.push or router.replace", () => {
    render(<AboutPage />);
    if (mockRouterPush.mock.calls.length > 0) {
      throw new Error(
        `F6 FAILURE — router.push called during render: ` +
          `${JSON.stringify(mockRouterPush.mock.calls)}. ` +
          `The /about page must not redirect.`
      );
    }
    if (mockRouterReplace.mock.calls.length > 0) {
      throw new Error(
        `F6 FAILURE — router.replace called during render: ` +
          `${JSON.stringify(mockRouterReplace.mock.calls)}.`
      );
    }
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

// ── Group G: Footer (real component, unmocked) ────────────────────────────────

describe("Group G — Footer (real component, unmocked)", () => {
  let footerContainer: HTMLElement;

  beforeEach(() => {
    ({ container: footerContainer } = render(<Footer />));
  });

  it('G1: Footer has an anchor with href="/about"', () => {
    const anchors = Array.from(footerContainer.querySelectorAll("a"));
    const aboutLink = anchors.find((a) => a.getAttribute("href") === "/about");
    if (!aboutLink) {
      const found = anchors
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `G1 FAILURE — no anchor with href="/about" in Footer.\n` +
          `  Found hrefs: ${found}`
      );
    }
    expect(aboutLink).not.toBeNull();
  });

  it('G2: Footer "OnlyJobs" wordmark is NOT a heading element (must be a non-heading)', () => {
    const headingEls = footerContainer.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );
    const wordmarkHeadings = Array.from(headingEls).filter(
      (el) => el.textContent?.trim() === "OnlyJobs"
    );
    if (wordmarkHeadings.length > 0) {
      throw new Error(
        `G2 FAILURE — Footer "OnlyJobs" wordmark is a heading element ` +
          `(${wordmarkHeadings.map((el) => el.tagName).join(", ")}). ` +
          `It must use as="span" (or equivalent) to avoid heading-order violations ` +
          `on pages that have their own h1.`
      );
    }
    expect(wordmarkHeadings).toHaveLength(0);
  });
});

// ── Group H: Sitemap ──────────────────────────────────────────────────────────

describe("Group H — Sitemap", () => {
  let sitemapXml: string;

  beforeAll(() => {
    sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  });

  it("H1: public/sitemap.xml exists", () => {
    expect(fs.existsSync(SITEMAP_PATH)).toBe(true);
  });

  it("H2: sitemap contains <loc>https://onlyjobs.app/about</loc>", () => {
    const hasAbout = sitemapXml.includes(
      "<loc>https://onlyjobs.app/about</loc>"
    );
    if (!hasAbout) {
      throw new Error(
        `H2 FAILURE — <loc>https://onlyjobs.app/about</loc> not found in sitemap.xml.`
      );
    }
    expect(hasAbout).toBe(true);
  });

  it("H3: sitemap does NOT contain /pricing", () => {
    const hasPricing = sitemapXml.includes("/pricing");
    if (hasPricing) {
      throw new Error(
        `H3 FAILURE — /pricing found in sitemap.xml. ` +
          `The /pricing route is a redirect and must not be indexed.`
      );
    }
    expect(hasPricing).toBe(false);
  });

  it("H4: /about entry has a <lastmod> in YYYY-MM-DD format", () => {
    const urlBlock = sitemapXml.match(
      /<url>[\s\S]*?<loc>https:\/\/onlyjobs\.app\/about<\/loc>[\s\S]*?<\/url>/
    );
    if (!urlBlock) {
      throw new Error(
        `H4 FAILURE — could not find <url> block for /about in sitemap.xml.`
      );
    }
    const lastmodMatch = urlBlock[0].match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(
        `H4 FAILURE — <lastmod> missing from /about sitemap entry.`
      );
    }
    const lastmod = lastmodMatch[1].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
      throw new Error(
        `H4 FAILURE — /about <lastmod> "${lastmod}" is not YYYY-MM-DD.`
      );
    }
    expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (allowed per spec):
//
//   src/__tests__/24g.2.sample-match-report.adversarial.test.tsx —
//     Comprehensive Chakra Proxy mock with Button forwarding as/href; fetch mock via
//     global.fetch = jest.fn(); JSON-LD helper pattern; real SEO+Footer imports;
//     module-namespace import for export checks.
//
//   src/__tests__/24g.seo-foundation.adversarial.test.tsx —
//     Chakra Proxy makeEl factory; AuthContext/GuideContext mock shapes;
//     react-icons Proxy mocking; next/link forwarding via ...rest.
//
//   src/__tests__/24g.4.about.smoke.test.tsx —
//     Confirmed import path for AboutPage ("@/pages/about"); saw S7 (worksFor @id)
//     and S8 (og:type=article). Both are also in the spec; not tainted oracles.
//     Also saw collectJsonLdTopLevelTypes helper — I wrote a deeper recursive variant
//     (collectAllTypes) to catch nested forbidden @types.
//
//   src/components/SEO.tsx — ALLOWED. Read to understand:
//     (1) fullTitle rule (L28): title contains SITE_NAME → use as-is, else append " | SITE_NAME"
//     (2) canonicalUrl (L29): BASE_URL + canonical prop (so canonical="/about" → spec URL)
//     (3) resolvedOgTitle (L30): ogTitle ?? fullTitle — omitting ogTitle collapses og:title = <title>
//     (4) resolvedOgDescription (L31): ogDescription ?? description
//     (5) DEFAULT_OG_IMAGE = "https://onlyjobs.app/og-image.png"
//     These informed adversarial A3/A4/A6/A9 (og:title distinct from <title>).
//
//   src/components/Footer.tsx — ALLOWED. Confirmed:
//     (a) href="/about" ContactLink exists (line 124)
//     (b) "OnlyJobs" wordmark uses Heading as="span" (line 83)
//     Assertions derive from spec; file read confirmed the assertions are testable.
//
//   public/sitemap.xml — ALLOWED. Verified /about present at lastmod 2026-10-01,
//     7 total entries, /pricing absent.
//
// Incidental knowledge kept OUT of oracles:
//   - smoke test imports confirmed render works; no implementation details read.
//   - SEO.tsx read confirmed DEFAULT_OG_IMAGE string — oracle comes from spec ("default image"),
//     not from reading what the page passes.
//   - Footer.tsx line 124 confirms href="/about" — oracle from spec, not from implementation.
//
// Limitations (FINDINGS — not weakened, noted per spec instruction):
//
//   F6 (logged-in redirect): properly testing the redirect guard requires re-mocking
//   AuthContext with isLoggedIn=true inside the test, which conflicts with module-level
//   jest.mock hoisting. F6 verifies the logged-out render does not redirect; a Playwright
//   test is the authoritative check for the isLoggedIn=true path.
//
//   D6 ("It felt wrong. It still feels wrong."): if the two sentences are in separate
//   React elements with no whitespace in adjacent textContent nodes, the \s* regex
//   may produce a false negative. Playwright snapshot is authoritative.
//
//   D11 (em/en-dash): CSS-injected dashes (::before/::after pseudo-elements) are not
//   caught by jsdom — requires Playwright visual diff.
