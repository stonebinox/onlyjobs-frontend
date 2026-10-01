/**
 * ADVERSARIAL TEST — onlyjobs-24g.7: Blog infrastructure + 2 first-person posts
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * BOUNDARY:
 *   FORBIDDEN (body NOT opened): src/pages/blog/*.tsx, src/components/BlogPostLayout.tsx
 *   ALLOWED: src/content/blog.ts (metadata contract), src/components/SEO.tsx,
 *             src/components/Footer.tsx, existing adversarial suites for harness patterns,
 *             public/sitemap.xml.
 *
 * CRITICAL MOCK NOTE: makeEl forwards BOTH `as` AND `dateTime`:
 *   - <Box as="nav" aria-label="Breadcrumb"> renders as <nav aria-label="Breadcrumb">
 *   - <Box as="time" dateTime="2026-10-01"> renders with the datetime attribute
 *   24g.5's makeEl forwards `as` but drops dateTime. This file fixes that.
 *
 * Oracle: THE SPEC + blog.ts contract — never "what the code currently outputs."
 * DISCLOSURE: see bottom of file.
 */

import React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";

// ── Spec constants (all traceable to the spec or to blog.ts which is the contract) ──

// Post 0
const P0_SLUG = "applied-to-hundreds-of-jobs";
const P0_TITLE =
  "I Applied to Hundreds of Jobs and Heard Almost Nothing - Here's What I Changed | OnlyJobs";
const P0_H1 =
  "I applied to hundreds of jobs and heard almost nothing. Here's what I changed.";
const P0_EXCERPT =
  "Spraying applications stopped working for me. Applying to fewer, better-fit jobs did. Here's the 60-second filter I started running on every listing.";
const P0_DESCRIPTION =
  "Spraying applications stopped working for me. Here's the 60-second filter I ran on every listing - including the one question that cut the most jobs.";
const P0_OG_TITLE =
  "The 60-second filter I used after hundreds of job applications flopped";
const P0_OG_DESC =
  "Fewer, better-fit applications beat spray-and-pray. The filter that turned it around - and the 'what would I hate about this job?' question that did the most.";

// Post 1
const P1_SLUG = "job-search-burnout";
const P1_TITLE =
  "Job Search Burnout Is Real - I Apply to Fewer Jobs on Purpose Now | OnlyJobs";
const P1_H1 = "Job search burnout is real. I apply to fewer jobs on purpose now.";
const P1_EXCERPT =
  "The endless-application grind burned me out. Applying to fewer jobs - on purpose, behind a quality bar - was what pulled me out of it.";
const P1_DESCRIPTION =
  "The endless-application grind burned me out. Applying to fewer jobs - on purpose, behind a quality bar - is what pulled me out of it.";
const P1_OG_TITLE =
  "I beat job-search burnout by applying to fewer jobs on purpose";
const P1_OG_DESC =
  "Cap the applications, hold a quality bar, protect your off-hours. What actually helped when the job-hunt grind burned me out.";

// Shared
const DATE_PUBLISHED = "2026-10-01";
const OG_IMAGE_DEFAULT = "https://onlyjobs.app/og-image.png";
const BASE_URL = "https://onlyjobs.app";
const AUTHOR_ID = "https://onlyjobs.app/about#person";
const ORG_ID = "https://onlyjobs.app/#organization";
const CTA_SAMPLE_REPORT = "/sample-match-report";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SITEMAP_PATH = path.resolve(REPO_ROOT, "public", "sitemap.xml");

// ── Mocks ─────────────────────────────────────────────────────────────────────

const nullIcon = () => null;
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: jest.fn(),
    pathname: "/blog",
    query: {},
    asPath: "/blog",
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
  usePathname: () => "/blog",
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head must passthrough so meta tags and ld+json are queryable.
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// CRITICAL: next/link forwards ALL props via ...rest.
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

// CRITICAL: Chakra mock forwards BOTH `as` AND `dateTime`.
//   - `as` forwarding: Box as="nav" renders as <nav>, enabling breadcrumb tests.
//   - `dateTime` forwarding: Box as="time" dateTime="..." renders with the attribute,
//     enabling time[dateTime="2026-10-01"] queries.
//   - Heading defaults to h2 so a missing as="h1" fails the "exactly one h1" test.
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  // Forwards as, dateTime, aria-label, aria-labelledby, aria-current, href, role, id, onClick,
  // type, disabled. Strips all Chakra layout/style props so they don't appear in DOM attrs.
  const makeEl = (defaultTag: string) => {
    if (cache[defaultTag]) return cache[defaultTag];
    const C = React.forwardRef(
      (
        {
          as: Tag = defaultTag,
          children,
          dateTime,
          onClick,
          type,
          disabled,
          "aria-label": al,
          "aria-labelledby": alb,
          "aria-current": ac,
          href,
          role,
          id,
          // Swallow all Chakra style/layout props — do NOT pass to DOM:
          py, px, pt, pb, pl, pr, mt, mb, mx, my, m, p,
          w, h, width, height, maxW, minW, maxH, minH,
          flex, flexDir, flexWrap, flexGrow, flexShrink,
          display, align, justify, spacing, wrap,
          fontSize, fontWeight, fontFamily, letterSpacing, lineHeight,
          textAlign, color, bg, bgColor, bgGradient, bgClip,
          borderTopWidth, borderColor, borderWidth, borderRadius,
          position, top, left, bottom, right, zIndex, overflow,
          size, colorScheme, variant, noOfLines, isTruncated,
          ...rest
        }: any,
        ref: any
      ) =>
        React.createElement(
          Tag,
          {
            ref,
            dateTime,
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
    C.displayName = `Chakra(${defaultTag})`;
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
    // ADVERSARIAL: Heading defaults to h2 — missing as="h1" fails the h1-count test.
    Heading: ({
      as: T = "h2",
      children,
      lineHeight, fontSize, fontWeight, fontFamily, letterSpacing,
      textAlign, color, mb, mt, mx, my, px, py, pt, pb, pl, pr,
      w, h, width, height, maxW, minW, flex, display, align, justify,
      noOfLines, isTruncated, bgGradient, bgClip, size, colorScheme,
      ...rest
    }: any) => React.createElement(T, rest, children),
    Text: makeEl("span"),
    // Button forwards as + href so <Button as="a" href="..."> CTAs are testable.
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
    // Link forwards target + rel so external links are inspectable.
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

// NOTE: Footer is NOT mocked — the real component is imported for Group K tests.

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
import { POSTS } from "@/content/blog";
// eslint-disable-next-line import/first
import BlogIndexPage from "@/pages/blog/index";
// eslint-disable-next-line import/first
import AppliedToHundredsPage from "@/pages/blog/applied-to-hundreds-of-jobs";
// eslint-disable-next-line import/first
import JobSearchBurnoutPage from "@/pages/blog/job-search-burnout";
// eslint-disable-next-line import/first
import * as BlogIndexModule from "@/pages/blog/index";
// eslint-disable-next-line import/first
import * as AppliedModule from "@/pages/blog/applied-to-hundreds-of-jobs";
// eslint-disable-next-line import/first
import * as BurnoutModule from "@/pages/blog/job-search-burnout";
// Real Footer and SEO — NOT mocked to null.
// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";
// eslint-disable-next-line import/first
import { SEO } from "@/components/SEO";

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
    const graph: any[] = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    const node = graph.find((n: any) => n["@type"] === type);
    if (node) return node;
  }
  return null;
}

function getBreadcrumbList(container: HTMLElement): any {
  return findNodeByType(container, "BreadcrumbList");
}

function getArticleNode(container: HTMLElement): any {
  return findNodeByType(container, "Article");
}

// ── Group A: blog.ts data contract (strict) ───────────────────────────────────

describe("Group A — blog.ts data contract (strict)", () => {
  it("A1: POSTS has exactly 2 entries", () => {
    if (POSTS.length !== 2) {
      throw new Error(
        `A1 FAILURE — POSTS.length is ${POSTS.length}, expected 2.`
      );
    }
    expect(POSTS).toHaveLength(2);
  });

  it(`A2: POSTS[0].slug is exactly "${P0_SLUG}"`, () => {
    expect(POSTS[0].slug).toBe(P0_SLUG);
  });

  it(`A3: POSTS[1].slug is exactly "${P1_SLUG}"`, () => {
    expect(POSTS[1].slug).toBe(P1_SLUG);
  });

  it("A4: src/pages/blog/[slug].tsx does NOT exist (no dynamic route)", () => {
    const dynamicRoute = path.join(REPO_ROOT, "src", "pages", "blog", "[slug].tsx");
    if (fs.existsSync(dynamicRoute)) {
      throw new Error(
        `A4 FAILURE — src/pages/blog/[slug].tsx EXISTS. ` +
          `The spec requires static per-slug files, not a dynamic route.`
      );
    }
    expect(fs.existsSync(dynamicRoute)).toBe(false);
  });

  it(`A5: src/pages/blog/${P0_SLUG}.tsx EXISTS on disk`, () => {
    const p = path.join(REPO_ROOT, "src", "pages", "blog", `${P0_SLUG}.tsx`);
    if (!fs.existsSync(p)) {
      throw new Error(
        `A5 FAILURE — src/pages/blog/${P0_SLUG}.tsx not found on disk.`
      );
    }
    expect(fs.existsSync(p)).toBe(true);
  });

  it(`A6: src/pages/blog/${P1_SLUG}.tsx EXISTS on disk`, () => {
    const p = path.join(REPO_ROOT, "src", "pages", "blog", `${P1_SLUG}.tsx`);
    if (!fs.existsSync(p)) {
      throw new Error(
        `A6 FAILURE — src/pages/blog/${P1_SLUG}.tsx not found on disk.`
      );
    }
    expect(fs.existsSync(p)).toBe(true);
  });

  it(`A7: every post has datePublished exactly "${DATE_PUBLISHED}"`, () => {
    for (const post of POSTS) {
      if (post.datePublished !== DATE_PUBLISHED) {
        throw new Error(
          `A7 FAILURE — ${post.slug}.datePublished is "${post.datePublished}", expected "${DATE_PUBLISHED}".`
        );
      }
    }
    expect(POSTS.every((p) => p.datePublished === DATE_PUBLISHED)).toBe(true);
  });

  it("A8: ogTitle !== title for every post (distinct fields)", () => {
    for (const post of POSTS) {
      if (post.ogTitle === post.title) {
        throw new Error(
          `A8 FAILURE — ${post.slug}: ogTitle === title ("${post.title}"). ` +
            `These are specified as intentionally different strings.`
        );
      }
    }
    expect(POSTS.every((p) => p.ogTitle !== p.title)).toBe(true);
  });

  it("A9: ogDescription !== description for each post (distinct fields)", () => {
    for (const post of POSTS) {
      if (post.ogDescription === post.description) {
        throw new Error(
          `A9 FAILURE — ${post.slug}: ogDescription === description. ` +
            `These are specified as different strings.`
        );
      }
    }
  });
});

// ── Group B: /blog Index — HTML structure ─────────────────────────────────────

describe("Group B — /blog Index HTML structure", () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    ({ container } = render(<BlogIndexPage />));
  });

  it('B1: exactly one <h1> with EXACT text "Blog"', () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `B1 FAILURE — expected 1 <h1>, found ${h1s.length}: ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    const text = h1s[0].textContent?.trim() ?? "";
    if (text !== "Blog") {
      throw new Error(
        `B1 FAILURE — <h1> text is "${text}", expected exactly "Blog".`
      );
    }
    expect(h1s).toHaveLength(1);
    expect(text).toBe("Blog");
  });

  it("B2: renders exactly 2 post links (one per slug)", () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const postLinks = anchors.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      return href === `/blog/${P0_SLUG}` || href === `/blog/${P1_SLUG}`;
    });
    if (postLinks.length !== 2) {
      throw new Error(
        `B2 FAILURE — expected 2 post links, found ${postLinks.length}.\n` +
          `  Hrefs: ${anchors.map((a) => a.getAttribute("href")).filter(Boolean).join(", ")}`
      );
    }
    expect(postLinks).toHaveLength(2);
  });

  it("B3: post links appear in POSTS array order (POSTS[0] link appears before POSTS[1] link in DOM)", () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const hrefs = anchors.map((a) => a.getAttribute("href") ?? "");
    const idx0 = hrefs.indexOf(`/blog/${P0_SLUG}`);
    const idx1 = hrefs.indexOf(`/blog/${P1_SLUG}`);
    if (idx0 < 0 || idx1 < 0) {
      throw new Error(
        `B3 FAILURE — one or both post links missing.\n` +
          `  ${P0_SLUG} at index: ${idx0}\n` +
          `  ${P1_SLUG} at index: ${idx1}`
      );
    }
    if (idx0 >= idx1) {
      throw new Error(
        `B3 FAILURE — POSTS[0] link (index ${idx0}) appears AFTER POSTS[1] link (index ${idx1}). ` +
          `Links must appear in POSTS array order.`
      );
    }
    expect(idx0).toBeLessThan(idx1);
  });

  it("B4: POSTS[0] link area contains its excerpt text", () => {
    // The link OR its nearest container should contain the excerpt.
    const text = container.textContent ?? "";
    if (!text.includes(P0_EXCERPT)) {
      throw new Error(
        `B4 FAILURE — POSTS[0] excerpt not found in rendered text.\n` +
          `  Expected: "${P0_EXCERPT}"`
      );
    }
    expect(text).toContain(P0_EXCERPT);
  });

  it("B5: POSTS[1] link area contains its excerpt text", () => {
    const text = container.textContent ?? "";
    if (!text.includes(P1_EXCERPT)) {
      throw new Error(
        `B5 FAILURE — POSTS[1] excerpt not found in rendered text.\n` +
          `  Expected: "${P1_EXCERPT}"`
      );
    }
    expect(text).toContain(P1_EXCERPT);
  });

  it("B6: a <time> element exists in the index page (post dates rendered)", () => {
    const times = container.querySelectorAll("time");
    if (times.length === 0) {
      throw new Error(
        `B6 FAILURE — no <time> element found in blog index. ` +
          `Each post listing should include a <time> element with dateTime attribute.\n` +
          `  MOCK NOTE: the Chakra mock must forward dateTime for this to render.`
      );
    }
    expect(times.length).toBeGreaterThan(0);
  });

  it('B7: breadcrumb <nav aria-label="Breadcrumb"> is present', () => {
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    if (!nav) {
      throw new Error(
        `B7 FAILURE — no <nav aria-label="Breadcrumb"> found.\n` +
          `  The mock forwards the "as" prop; if absent, the page uses Box as="nav" or <nav> directly.`
      );
    }
    expect(nav).not.toBeNull();
  });

  it("B8: index page does not call router.push or router.replace on logged-out render", () => {
    if (mockRouterPush.mock.calls.length > 0) {
      throw new Error(
        `B8 FAILURE — router.push called: ${JSON.stringify(mockRouterPush.mock.calls)}. ` +
          `The /blog index must not redirect.`
      );
    }
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

// ── Group C: /blog Index — JSON-LD ────────────────────────────────────────────

describe("Group C — /blog Index JSON-LD", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<BlogIndexPage />));
  });

  it("C1: every ld+json script parses without throwing", () => {
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    );
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) {
      expect(() => JSON.parse(s.innerHTML)).not.toThrow();
    }
  });

  it("C2: @type CollectionPage is present somewhere in ld+json", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("CollectionPage")) {
      throw new Error(
        `C2 FAILURE — @type "CollectionPage" not found in index JSON-LD.\n` +
          `  Types found: {${Array.from(types).join(", ")}}\n` +
          `  The blog index is a collection of posts, not a single WebPage.`
      );
    }
    expect(types.has("CollectionPage")).toBe(true);
  });

  it(`C3: CollectionPage @id is EXACTLY "${BASE_URL}/blog#webpage"`, () => {
    const node = findNodeByType(container, "CollectionPage");
    if (!node) {
      throw new Error(`C3 FAILURE — no CollectionPage node found.`);
    }
    const id = node["@id"];
    if (id !== `${BASE_URL}/blog#webpage`) {
      throw new Error(
        `C3 FAILURE — CollectionPage @id is "${id}", expected "${BASE_URL}/blog#webpage".`
      );
    }
    expect(id).toBe(`${BASE_URL}/blog#webpage`);
  });

  it("C4: @type BreadcrumbList is present in index JSON-LD", () => {
    const types = collectAllTypesFromPage(container);
    if (!types.has("BreadcrumbList")) {
      throw new Error(
        `C4 FAILURE — @type "BreadcrumbList" not found in index JSON-LD.\n` +
          `  Types found: {${Array.from(types).join(", ")}}`
      );
    }
    expect(types.has("BreadcrumbList")).toBe(true);
  });

  it("C5: index BreadcrumbList has EXACTLY 2 items (Home > Blog)", () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C5 FAILURE — no BreadcrumbList in index JSON-LD.`);
    const items: any[] = bl.itemListElement ?? [];
    if (items.length !== 2) {
      throw new Error(
        `C5 FAILURE — index BreadcrumbList has ${items.length} item(s), expected 2 (Home > Blog).\n` +
          `  Items: ${JSON.stringify(items)}`
      );
    }
    expect(items).toHaveLength(2);
  });

  it('C6: index BreadcrumbList position 1 — name "Home", item "https://onlyjobs.app/"', () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C6 FAILURE — no BreadcrumbList.`);
    const items: any[] = bl.itemListElement ?? [];
    const pos1 = items.find((i: any) => i.position === 1);
    if (!pos1) {
      throw new Error(
        `C6 FAILURE — no breadcrumb item with position=1.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    expect(pos1.name).toBe("Home");
    expect(pos1.item).toBe(`${BASE_URL}/`);
  });

  it('C7: index BreadcrumbList position 2 — name "Blog", item "https://onlyjobs.app/blog"', () => {
    const bl = getBreadcrumbList(container);
    if (!bl) throw new Error(`C7 FAILURE — no BreadcrumbList.`);
    const items: any[] = bl.itemListElement ?? [];
    const pos2 = items.find((i: any) => i.position === 2);
    if (!pos2) {
      throw new Error(
        `C7 FAILURE — no breadcrumb item with position=2.\n` +
          `  itemListElement: ${JSON.stringify(items)}`
      );
    }
    if (pos2.name !== "Blog") {
      throw new Error(
        `C7 FAILURE — position 2 name is "${pos2.name}", expected "Blog".`
      );
    }
    if (pos2.item !== `${BASE_URL}/blog`) {
      throw new Error(
        `C7 FAILURE — position 2 item is "${pos2.item}", expected "${BASE_URL}/blog".`
      );
    }
    expect(pos2.name).toBe("Blog");
    expect(pos2.item).toBe(`${BASE_URL}/blog`);
  });

  it("C8: index JSON-LD does NOT contain @type Article anywhere (deep recursive scan)", () => {
    const types = collectAllTypesFromPage(container);
    if (types.has("Article")) {
      throw new Error(
        `C8 FAILURE — @type "Article" found in /blog index JSON-LD. ` +
          `The index is a CollectionPage, NOT an Article.`
      );
    }
    expect(types.has("Article")).toBe(false);
  });

  it("C9: index JSON-LD does NOT contain @type BlogPosting, NewsArticle, or SocialMediaPosting (Article subtypes)", () => {
    const types = collectAllTypesFromPage(container);
    const forbidden = ["BlogPosting", "NewsArticle", "SocialMediaPosting"];
    for (const t of forbidden) {
      if (types.has(t)) {
        throw new Error(
          `C9 FAILURE — @type "${t}" (Article subtype) found in index JSON-LD.`
        );
      }
    }
    expect(forbidden.some((t) => types.has(t))).toBe(false);
  });

  it(`C10: CollectionPage.url is EXACTLY "${BASE_URL}/blog"`, () => {
    const node = findNodeByType(container, "CollectionPage");
    if (!node) {
      throw new Error(`C10 FAILURE — no CollectionPage node found.`);
    }
    const url = node["url"];
    if (url !== `${BASE_URL}/blog`) {
      throw new Error(
        `C10 FAILURE — CollectionPage.url is "${url}", expected "${BASE_URL}/blog".`
      );
    }
    expect(url).toBe(`${BASE_URL}/blog`);
  });
});

// ── Group D: /blog Index — Module / Static guarantees ──────────────────────────

describe("Group D — /blog Index static guarantees", () => {
  it("D1: BlogIndex module does NOT export getServerSideProps", () => {
    if ("getServerSideProps" in BlogIndexModule) {
      throw new Error(
        `D1 FAILURE — /blog/index exports getServerSideProps. The blog index must be fully static.`
      );
    }
    expect("getServerSideProps" in BlogIndexModule).toBe(false);
  });

  it("D2: BlogIndex module does NOT export getStaticProps", () => {
    if ("getStaticProps" in BlogIndexModule) {
      throw new Error(
        `D2 FAILURE — /blog/index exports getStaticProps. The blog index must be fully static.`
      );
    }
    expect("getStaticProps" in BlogIndexModule).toBe(false);
  });

  it("D3: BlogIndex default export is a React function component", () => {
    expect(typeof BlogIndexModule.default).toBe("function");
  });

  it("D4: rendering blog index does NOT call fetch with any /api/ path", () => {
    (global.fetch as jest.Mock).mockClear();
    render(<BlogIndexPage />);
    const apiCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [any]) => /\/api\//i.test(String(url))
    );
    if (apiCall) {
      throw new Error(
        `D4 FAILURE — fetch called with /api/ URL: "${apiCall[0]}". Blog index must be fully static.`
      );
    }
    expect(apiCall).toBeUndefined();
  });
});

// ── Per-post adversarial test runner ─────────────────────────────────────────

type PostRecord = (typeof POSTS)[number];

function runPostTests(
  slug: string,
  record: PostRecord,
  Page: React.ComponentType,
  PageModule: Record<string, unknown>
) {
  const canonical = `${BASE_URL}/blog/${slug}`;
  const signupCta = `/?utm_source=site&utm_medium=blog&utm_content=${slug}#signup`;

  // ── Group E: HTML structure ────────────────────────────────────────────────
  describe(`Group E (/blog/${slug}) — HTML structure`, () => {
    let container: HTMLElement;

    beforeEach(() => {
      mockRouterPush.mockClear();
      mockRouterReplace.mockClear();
      (global.fetch as jest.Mock).mockClear();
      ({ container } = render(<Page />));
    });

    it("E1: exactly one <h1>", () => {
      const h1s = container.querySelectorAll("h1");
      if (h1s.length !== 1) {
        throw new Error(
          `E1 FAILURE [${slug}] — expected 1 <h1>, found ${h1s.length}: ` +
            Array.from(h1s)
              .map((el) => `"${el.textContent?.trim()}"`)
              .join(", ")
        );
      }
      expect(h1s).toHaveLength(1);
    });

    it("E2: h1 text EXACTLY equals record.h1", () => {
      const h1 = container.querySelector("h1");
      expect(h1).not.toBeNull();
      const text = h1!.textContent ?? "";
      if (text !== record.h1) {
        throw new Error(
          `E2 FAILURE [${slug}] — h1 text mismatch.\n` +
            `  Expected: "${record.h1}"\n` +
            `  Observed: "${text}"`
        );
      }
      expect(text).toBe(record.h1);
    });

    it("E3: no <h2> appears before <h1> in DOM order", () => {
      const h1 = container.querySelector("h1");
      expect(h1).not.toBeNull();
      const h2sBefore = Array.from(container.querySelectorAll("h2")).filter(
        (h2) => !!(h2.compareDocumentPosition(h1!) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
      if (h2sBefore.length > 0) {
        throw new Error(
          `E3 FAILURE [${slug}] — ${h2sBefore.length} <h2>(s) appear before <h1>:\n` +
            h2sBefore.map((el) => `  "${el.textContent?.trim()}"`).join("\n")
        );
      }
      expect(h2sBefore).toHaveLength(0);
    });

    it(`E4: <time dateTime="${DATE_PUBLISHED}"> element exists (requires dateTime forwarding)`, () => {
      // Uses attribute selector case-insensitively (HTML). The mock must forward
      // the dateTime prop through the `as` mechanism for this to work.
      const timeEl =
        container.querySelector(`time[dateTime="${DATE_PUBLISHED}"]`) ??
        container.querySelector(`time[datetime="${DATE_PUBLISHED}"]`);
      if (!timeEl) {
        throw new Error(
          `E4 FAILURE [${slug}] — no <time dateTime="${DATE_PUBLISHED}"> element found.\n` +
            `  Cause 1: post does not render a <time> element.\n` +
            `  Cause 2: Chakra mock drops dateTime prop (24g.5 makeEl does; this file must not).\n` +
            `  Time elements found: ${Array.from(container.querySelectorAll("time"))
              .map((t) => `dateTime="${t.getAttribute("dateTime") ?? t.getAttribute("datetime")}"`)
              .join(", ") || "none"}`
        );
      }
      expect(timeEl).not.toBeNull();
    });

    it('E5: breadcrumb <nav aria-label="Breadcrumb"> present', () => {
      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      if (!nav) {
        throw new Error(
          `E5 FAILURE [${slug}] — no <nav aria-label="Breadcrumb"> found.\n` +
            `  The mock forwards the "as" prop; Box as="nav" renders <nav>.`
        );
      }
      expect(nav).not.toBeNull();
    });

    it("E6: breadcrumb nav has exactly 2 links (/ and /blog) — current crumb is text", () => {
      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      if (!nav) throw new Error(`E6 FAILURE [${slug}] — no breadcrumb nav (E5 must pass first).`);
      const links = Array.from(nav.querySelectorAll("a"));
      if (links.length !== 2) {
        throw new Error(
          `E6 FAILURE [${slug}] — breadcrumb nav has ${links.length} link(s), expected 2 (/ and /blog).\n` +
            `  Hrefs: ${links.map((a) => `"${a.getAttribute("href")}"`).join(", ")}\n` +
            `  The current-page crumb must be text/span, NOT a third <a>.`
        );
      }
      const hrefs = links.map((a) => a.getAttribute("href") ?? "");
      expect(hrefs).toContain("/");
      expect(hrefs).toContain("/blog");
    });

    it("E7: current-page crumb (/blog/<slug>) is text, not a link", () => {
      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      if (!nav) throw new Error(`E7 FAILURE [${slug}] — no breadcrumb nav.`);
      const slugLinks = Array.from(nav.querySelectorAll("a")).filter((a) =>
        (a.getAttribute("href") ?? "").includes(slug)
      );
      if (slugLinks.length > 0) {
        throw new Error(
          `E7 FAILURE [${slug}] — current-page crumb is an <a> link (href="${slugLinks[0].getAttribute("href")}"). ` +
            `The current page must be rendered as text (aria-current="page"), not a link.`
        );
      }
      expect(slugLinks).toHaveLength(0);
    });
  });

  // ── Group F: Metadata / SEO ────────────────────────────────────────────────
  describe(`Group F (/blog/${slug}) — Metadata / SEO`, () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(<Page />));
    });

    it("F1: <title> is EXACTLY record.title", () => {
      const title = container.querySelector("title");
      expect(title).not.toBeNull();
      const text = title!.textContent ?? "";
      if (text !== record.title) {
        throw new Error(
          `F1 FAILURE [${slug}] — <title> mismatch.\n` +
            `  Expected: "${record.title}"\n` +
            `  Observed: "${text}"`
        );
      }
      expect(text).toBe(record.title);
    });

    it("F2: meta description is EXACTLY record.description", () => {
      const desc = getMeta(container, 'meta[name="description"]');
      if (desc !== record.description) {
        throw new Error(
          `F2 FAILURE [${slug}] — meta description mismatch.\n` +
            `  Expected: "${record.description}"\n` +
            `  Observed: "${desc}"`
        );
      }
      expect(desc).toBe(record.description);
    });

    it(`F3: canonical is EXACTLY "${canonical}"`, () => {
      const canonicalVal = container
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href");
      if (canonicalVal !== canonical) {
        throw new Error(
          `F3 FAILURE [${slug}] — canonical mismatch.\n` +
            `  Expected: "${canonical}"\n` +
            `  Observed: "${canonicalVal}"`
        );
      }
      expect(canonicalVal).toBe(canonical);
    });

    it('F4: og:type is EXACTLY "article"', () => {
      const ogType = getMeta(container, 'meta[property="og:type"]');
      if (ogType !== "article") {
        throw new Error(
          `F4 FAILURE [${slug}] — og:type is "${ogType}", expected "article". ` +
            `Post pages must pass ogType="article" to <SEO>.`
        );
      }
      expect(ogType).toBe("article");
    });

    it("F5: og:title is EXACTLY record.ogTitle", () => {
      const ogTitle = getMeta(container, 'meta[property="og:title"]');
      if (ogTitle !== record.ogTitle) {
        throw new Error(
          `F5 FAILURE [${slug}] — og:title mismatch.\n` +
            `  Expected: "${record.ogTitle}"\n` +
            `  Observed: "${ogTitle}"`
        );
      }
      expect(ogTitle).toBe(record.ogTitle);
    });

    it("F6: og:description is EXACTLY record.ogDescription", () => {
      const ogDesc = getMeta(container, 'meta[property="og:description"]');
      if (ogDesc !== record.ogDescription) {
        throw new Error(
          `F6 FAILURE [${slug}] — og:description mismatch.\n` +
            `  Expected: "${record.ogDescription}"\n` +
            `  Observed: "${ogDesc}"`
        );
      }
      expect(ogDesc).toBe(record.ogDescription);
    });

    it(`F7: og:image is the site-default "${OG_IMAGE_DEFAULT}" (no custom override on post pages)`, () => {
      const ogImage = getMeta(container, 'meta[property="og:image"]');
      if (ogImage !== OG_IMAGE_DEFAULT) {
        throw new Error(
          `F7 FAILURE [${slug}] — og:image is "${ogImage}", expected "${OG_IMAGE_DEFAULT}".`
        );
      }
      expect(ogImage).toBe(OG_IMAGE_DEFAULT);
    });

    it("F8: og:title is DIFFERENT from <title> (omitting ogTitle prop collapses them — adversarial)", () => {
      const titleText = container.querySelector("title")?.textContent ?? "";
      const ogTitle = getMeta(container, 'meta[property="og:title"]');
      if (titleText === ogTitle) {
        throw new Error(
          `F8 FAILURE [${slug}] — og:title === <title>: "${ogTitle}".\n` +
            `  These are intentionally different. Equal values means ogTitle prop was omitted.`
        );
      }
      expect(titleText).not.toBe(ogTitle);
    });

    it("F9: twitter:title equals og:title (both = record.ogTitle)", () => {
      const twitterTitle = getMeta(container, 'meta[name="twitter:title"]');
      expect(twitterTitle).toBe(record.ogTitle);
    });

    it("F10: og:title does NOT contain \" | OnlyJobs\" (the <title> suffix must not leak into og:title)", () => {
      const ogTitle = getMeta(container, 'meta[property="og:title"]');
      // If ogTitle is the full page title, it includes " | OnlyJobs"
      if ((ogTitle ?? "").includes("| OnlyJobs")) {
        throw new Error(
          `F10 FAILURE [${slug}] — og:title contains "| OnlyJobs": "${ogTitle}".\n` +
            `  og:title should be record.ogTitle which is a shorter, social-specific title — not the full <title>.`
        );
      }
      expect(ogTitle).not.toMatch(/\| OnlyJobs/);
    });
  });

  // ── Group G: Article JSON-LD ───────────────────────────────────────────────
  describe(`Group G (/blog/${slug}) — Article JSON-LD`, () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(<Page />));
    });

    it("G1: @type Article is present in JSON-LD", () => {
      const types = collectAllTypesFromPage(container);
      if (!types.has("Article")) {
        throw new Error(
          `G1 FAILURE [${slug}] — @type "Article" not found in JSON-LD.\n` +
            `  Types found: {${Array.from(types).join(", ")}}`
        );
      }
      expect(types.has("Article")).toBe(true);
    });

    it("G2: Article.headline === record.h1 (NOT record.title)", () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G2 FAILURE [${slug}] — no Article node.`);
      if (article.headline !== record.h1) {
        throw new Error(
          `G2 FAILURE [${slug}] — Article.headline mismatch.\n` +
            `  Expected (record.h1): "${record.h1}"\n` +
            `  Observed:             "${article.headline}"\n` +
            `  Note: headline must be record.h1, NOT record.title.`
        );
      }
      expect(article.headline).toBe(record.h1);
    });

    it(`G3: Article.datePublished is EXACTLY "${DATE_PUBLISHED}"`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G3 FAILURE [${slug}] — no Article node.`);
      if (article.datePublished !== DATE_PUBLISHED) {
        throw new Error(
          `G3 FAILURE [${slug}] — Article.datePublished is "${article.datePublished}", expected "${DATE_PUBLISHED}".`
        );
      }
      expect(article.datePublished).toBe(DATE_PUBLISHED);
    });

    it(`G4: Article.dateModified is EXACTLY "${DATE_PUBLISHED}" (often forgotten)`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G4 FAILURE [${slug}] — no Article node.`);
      if (article.dateModified !== DATE_PUBLISHED) {
        throw new Error(
          `G4 FAILURE [${slug}] — Article.dateModified is "${article.dateModified}", expected "${DATE_PUBLISHED}".\n` +
            `  ADVERSARIAL: dateModified is separate from datePublished and is easily forgotten.`
        );
      }
      expect(article.dateModified).toBe(DATE_PUBLISHED);
    });

    it('G5: Article.inLanguage is "en-US" (often forgotten)', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G5 FAILURE [${slug}] — no Article node.`);
      if (article.inLanguage !== "en-US") {
        throw new Error(
          `G5 FAILURE [${slug}] — Article.inLanguage is "${article.inLanguage}", expected "en-US".`
        );
      }
      expect(article.inLanguage).toBe("en-US");
    });

    it("G6: Article.image is non-empty and on the onlyjobs.app domain", () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G6 FAILURE [${slug}] — no Article node.`);
      const images = Array.isArray(article.image)
        ? article.image
        : [article.image];
      if (images.length === 0 || !images[0]) {
        throw new Error(
          `G6 FAILURE [${slug}] — Article.image is empty or absent.`
        );
      }
      for (const img of images) {
        const imgUrl = typeof img === "string" ? img : img?.url ?? img?.["@id"] ?? "";
        if (!imgUrl.startsWith(`${BASE_URL}/`)) {
          throw new Error(
            `G6 FAILURE [${slug}] — Article.image contains URL not on onlyjobs.app: "${imgUrl}".`
          );
        }
      }
      expect(images.length).toBeGreaterThan(0);
    });

    it('G7: Article.mainEntityOfPage has @type "WebPage" (not a bare @id)', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G7 FAILURE [${slug}] — no Article node.`);
      const mep = article.mainEntityOfPage;
      if (!mep) {
        throw new Error(
          `G7 FAILURE [${slug}] — Article.mainEntityOfPage is absent.`
        );
      }
      if (typeof mep === "string") {
        throw new Error(
          `G7 FAILURE [${slug}] — Article.mainEntityOfPage is a bare string: "${mep}". ` +
            `It must be an object with @type "WebPage".`
        );
      }
      if (mep["@type"] !== "WebPage") {
        throw new Error(
          `G7 FAILURE [${slug}] — Article.mainEntityOfPage["@type"] is "${mep["@type"]}", expected "WebPage".\n` +
            `  mainEntityOfPage: ${JSON.stringify(mep)}`
        );
      }
      expect(mep["@type"]).toBe("WebPage");
    });

    it("G8: Article.mainEntityOfPage @id is the canonical URL for this post", () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G8 FAILURE [${slug}] — no Article node.`);
      const mep = article.mainEntityOfPage;
      if (!mep || typeof mep !== "object") {
        throw new Error(`G8 FAILURE [${slug}] — mainEntityOfPage is absent or not an object.`);
      }
      const id = mep["@id"];
      if (!id || !id.includes(`/blog/${slug}`)) {
        throw new Error(
          `G8 FAILURE [${slug}] — mainEntityOfPage @id "${id}" doesn't match canonical path "/blog/${slug}".`
        );
      }
      expect(id).toContain(`/blog/${slug}`);
    });

    it('G9: Article.author is an object with @type "Person" (reject string, reject @id-only)', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G9 FAILURE [${slug}] — no Article node.`);
      const author = article.author;
      if (typeof author === "string") {
        throw new Error(
          `G9 FAILURE [${slug}] — Article.author is a string: "${author}". Must be an object with @type "Person".`
        );
      }
      if (!author || typeof author !== "object") {
        throw new Error(
          `G9 FAILURE [${slug}] — Article.author is missing or not an object: ${JSON.stringify(author)}`
        );
      }
      if (author["@type"] !== "Person") {
        throw new Error(
          `G9 FAILURE [${slug}] — Article.author["@type"] is "${author["@type"]}", expected "Person".`
        );
      }
      expect(author["@type"]).toBe("Person");
    });

    it(`G10: Article.author["@id"] is EXACTLY "${AUTHOR_ID}"`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G10 FAILURE [${slug}] — no Article node.`);
      const authorId = article.author?.["@id"];
      if (authorId !== AUTHOR_ID) {
        throw new Error(
          `G10 FAILURE [${slug}] — Article.author["@id"] is "${authorId}", expected "${AUTHOR_ID}".`
        );
      }
      expect(authorId).toBe(AUTHOR_ID);
    });

    it('G11: Article.author.name is "Anoop Santhanam"', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G11 FAILURE [${slug}] — no Article node.`);
      const name = article.author?.name;
      if (name !== "Anoop Santhanam") {
        throw new Error(
          `G11 FAILURE [${slug}] — Article.author.name is "${name}", expected "Anoop Santhanam".`
        );
      }
      expect(name).toBe("Anoop Santhanam");
    });

    it('G12: Article.publisher is an object with @type "Organization" (reject string, reject @id-only)', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G12 FAILURE [${slug}] — no Article node.`);
      const publisher = article.publisher;
      if (typeof publisher === "string") {
        throw new Error(
          `G12 FAILURE [${slug}] — Article.publisher is a string. Must be an object with @type "Organization".`
        );
      }
      if (!publisher || typeof publisher !== "object") {
        throw new Error(
          `G12 FAILURE [${slug}] — Article.publisher is missing or not an object.`
        );
      }
      if (publisher["@type"] !== "Organization") {
        throw new Error(
          `G12 FAILURE [${slug}] — Article.publisher["@type"] is "${publisher["@type"]}", expected "Organization".`
        );
      }
      expect(publisher["@type"]).toBe("Organization");
    });

    it(`G13: Article.publisher["@id"] is EXACTLY "${ORG_ID}"`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G13 FAILURE [${slug}] — no Article node.`);
      const pubId = article.publisher?.["@id"];
      if (pubId !== ORG_ID) {
        throw new Error(
          `G13 FAILURE [${slug}] — Article.publisher["@id"] is "${pubId}", expected "${ORG_ID}".`
        );
      }
      expect(pubId).toBe(ORG_ID);
    });

    it('G14: Article.publisher.name is "OnlyJobs"', () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G14 FAILURE [${slug}] — no Article node.`);
      const name = article.publisher?.name;
      if (name !== "OnlyJobs") {
        throw new Error(
          `G14 FAILURE [${slug}] — Article.publisher.name is "${name}", expected "OnlyJobs".`
        );
      }
      expect(name).toBe("OnlyJobs");
    });

    it("G15: post BreadcrumbList has EXACTLY 3 items (Home > Blog > Post)", () => {
      const bl = getBreadcrumbList(container);
      if (!bl) throw new Error(`G15 FAILURE [${slug}] — no BreadcrumbList in post JSON-LD.`);
      const items: any[] = bl.itemListElement ?? [];
      if (items.length !== 3) {
        throw new Error(
          `G15 FAILURE [${slug}] — post BreadcrumbList has ${items.length} item(s), expected 3.\n` +
            `  Items: ${JSON.stringify(items)}\n` +
            `  Expected: position 1=Home, 2=Blog, 3=this post`
        );
      }
      expect(items).toHaveLength(3);
    });

    it("G16: post BreadcrumbList position 3 item URL is canonical for this post", () => {
      const bl = getBreadcrumbList(container);
      if (!bl) throw new Error(`G16 FAILURE [${slug}] — no BreadcrumbList.`);
      const items: any[] = bl.itemListElement ?? [];
      const pos3 = items.find((i: any) => i.position === 3);
      if (!pos3) {
        throw new Error(
          `G16 FAILURE [${slug}] — no breadcrumb item with position=3.\n` +
            `  itemListElement: ${JSON.stringify(items)}`
        );
      }
      if (pos3.item !== canonical) {
        throw new Error(
          `G16 FAILURE [${slug}] — BreadcrumbList position 3 item is "${pos3.item}", expected "${canonical}".`
        );
      }
      expect(pos3.item).toBe(canonical);
    });

    // Forbidden @types (deep recursive scan of entire post JSON-LD graph).
    const POST_FORBIDDEN_TYPES = [
      "FAQPage",
      "JobPosting",
      "SoftwareApplication",
      "Review",
      "ItemList",
      "CollectionPage",
    ];

    for (const forbiddenType of POST_FORBIDDEN_TYPES) {
      it(`G17: NO @type "${forbiddenType}" in post JSON-LD (deep scan)`, () => {
        const types = collectAllTypesFromPage(container);
        if (types.has(forbiddenType)) {
          throw new Error(
            `G17 FAILURE [${slug}] — forbidden @type "${forbiddenType}" found in post JSON-LD.\n` +
              `  Types found: {${Array.from(types).join(", ")}}`
          );
        }
        expect(types.has(forbiddenType)).toBe(false);
      });
    }

    it("G18: Article.description === record.description", () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G18 FAILURE [${slug}] — no Article node.`);
      if (article.description !== record.description) {
        throw new Error(
          `G18 FAILURE [${slug}] — Article.description mismatch.\n` +
            `  Expected: "${record.description}"\n` +
            `  Observed: "${article.description}"`
        );
      }
      expect(article.description).toBe(record.description);
    });

    it(`G19: Article.image array includes EXACTLY "${OG_IMAGE_DEFAULT}"`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G19 FAILURE [${slug}] — no Article node.`);
      const images = Array.isArray(article.image) ? article.image : [article.image];
      if (!images.includes(OG_IMAGE_DEFAULT)) {
        throw new Error(
          `G19 FAILURE [${slug}] — Article.image does not include "${OG_IMAGE_DEFAULT}".\n` +
            `  Actual image array: ${JSON.stringify(images)}`
        );
      }
      expect(images).toContain(OG_IMAGE_DEFAULT);
    });

    it(`G20: Article.mainEntityOfPage @id is EXACTLY "${BASE_URL}/blog/${slug}"`, () => {
      const article = getArticleNode(container);
      if (!article) throw new Error(`G20 FAILURE [${slug}] — no Article node.`);
      const mep = article.mainEntityOfPage;
      if (!mep || typeof mep !== "object") {
        throw new Error(`G20 FAILURE [${slug}] — mainEntityOfPage is absent or not an object.`);
      }
      const id = mep["@id"];
      if (id !== `${BASE_URL}/blog/${slug}`) {
        throw new Error(
          `G20 FAILURE [${slug}] — mainEntityOfPage @id is "${id}", ` +
            `expected exactly "${BASE_URL}/blog/${slug}".`
        );
      }
      expect(id).toBe(`${BASE_URL}/blog/${slug}`);
    });
  });

  // ── Group H: Copy REQUIRED ─────────────────────────────────────────────────
  describe(`Group H (/blog/${slug}) — Copy REQUIRED`, () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(<Page />));
    });

    it('H1: REQUIRED "never applies" OR "no auto-apply" present (case-insensitive)', () => {
      const text = (container.textContent ?? "").toLowerCase();
      const ok = text.includes("never applies") || text.includes("no auto-apply");
      if (!ok) {
        throw new Error(
          `H1 FAILURE [${slug}] — neither "never applies" nor "no auto-apply" found.\n` +
            `  The post must make clear the product does not auto-apply.`
        );
      }
      expect(ok).toBe(true);
    });

    it('H2: REQUIRED "what didn\'t" present (case-insensitive, apostrophe-tolerant)', () => {
      const text = container.textContent ?? "";
      const pattern = /what didn['’]t/i;
      if (!pattern.test(text)) {
        throw new Error(
          `H2 FAILURE [${slug}] — "what didn't" not found in rendered text.\n` +
            `  Pattern: /what didn[\\u0027\\u2019]t/i`
        );
      }
      expect(pattern.test(text)).toBe(true);
    });

    it('H3: REQUIRED "$2" present', () => {
      if (!container.textContent?.includes("$2")) {
        throw new Error(
          `H3 FAILURE [${slug}] — "$2" not found in rendered text.`
        );
      }
      expect(container.textContent).toContain("$2");
    });

    it('H4: REQUIRED "$0.30" present', () => {
      if (!container.textContent?.includes("$0.30")) {
        throw new Error(
          `H4 FAILURE [${slug}] — "$0.30" not found in rendered text.`
        );
      }
      expect(container.textContent).toContain("$0.30");
    });

    it('H5: REQUIRED "no subscription" present (case-insensitive)', () => {
      const text = (container.textContent ?? "").toLowerCase();
      if (!text.includes("no subscription")) {
        throw new Error(
          `H5 FAILURE [${slug}] — "no subscription" not found in rendered text.`
        );
      }
      expect(text).toContain("no subscription");
    });

    it('H6: REQUIRED "clears your bar" present (case-insensitive)', () => {
      const text = (container.textContent ?? "").toLowerCase();
      if (!text.includes("clears your bar")) {
        throw new Error(
          `H6 FAILURE [${slug}] — "clears your bar" not found in rendered text.\n` +
            `  This is the spec's exact product-charge phrasing.`
        );
      }
      expect(text).toContain("clears your bar");
    });

    it('H7: REQUIRED "what didn\'t" appears near product-closing language ($2 or "clears your bar")', () => {
      // Spec: "what didn't" must appear in the PRODUCT closer paragraph, not only in a filter section.
      // Proxy: assert "what didn't" appears within 600 chars of "$2" or "clears your bar".
      const text = container.textContent ?? "";
      const whatPattern = /what didn['’]t/gi;
      const productMarkers = ["$2", "$0.30", "clears your bar", "no subscription"];
      let closestDistance = Infinity;

      let match;
      while ((match = whatPattern.exec(text)) !== null) {
        for (const marker of productMarkers) {
          const markerIdx = text.indexOf(marker);
          if (markerIdx >= 0) {
            closestDistance = Math.min(closestDistance, Math.abs(match.index - markerIdx));
          }
        }
      }

      if (closestDistance > 600) {
        throw new Error(
          `H7 FAILURE [${slug}] — "what didn't" and product language ($2, clears your bar, etc.) ` +
            `are more than 600 chars apart (closest: ${closestDistance} chars).\n` +
            `  Spec: "what didn't" must appear in the PRODUCT closer paragraph, not only in the manual-filter section.`
        );
      }
      expect(closestDistance).toBeLessThanOrEqual(600);
    });
  });

  // ── Group I: Copy FORBIDDEN ────────────────────────────────────────────────
  describe(`Group I (/blog/${slug}) — Copy FORBIDDEN`, () => {
    let container: HTMLElement;
    let rawHtml: string;
    let rawText: string;
    let allJsonLd: string;

    beforeEach(() => {
      ({ container } = render(<Page />));
      rawHtml = container.innerHTML;
      rawText = container.textContent ?? "";
      allJsonLd = Array.from(
        container.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((s) => s.innerHTML)
        .join("\n");
    });

    it("I1: FORBIDDEN em-dash (—) absent from text, HTML, and JSON-LD", () => {
      const hasEmDash =
        rawText.includes("—") ||
        rawHtml.includes("&mdash;") ||
        rawHtml.includes("&#8212;") ||
        rawHtml.includes("&#x2014;") ||
        rawHtml.includes("—") ||
        allJsonLd.includes("—");
      if (hasEmDash) {
        throw new Error(
          `I1 FAILURE [${slug}] — em-dash (—) found. Use plain hyphen "-".`
        );
      }
      expect(hasEmDash).toBe(false);
    });

    it("I2: FORBIDDEN en-dash (–) absent from text, HTML, and JSON-LD", () => {
      const hasEnDash =
        rawText.includes("–") ||
        rawHtml.includes("&ndash;") ||
        rawHtml.includes("&#8211;") ||
        rawHtml.includes("&#x2013;") ||
        rawHtml.includes("–") ||
        allJsonLd.includes("–");
      if (hasEnDash) {
        throw new Error(
          `I2 FAILURE [${slug}] — en-dash (–) found. Use plain hyphen "-".`
        );
      }
      expect(hasEnDash).toBe(false);
    });

    it("I3: FORBIDDEN /\\bjobright\\b/i absent from text, HTML, and JSON-LD", () => {
      const found =
        /\bjobright\b/i.test(rawText) ||
        /\bjobright\b/i.test(rawHtml) ||
        /\bjobright\b/i.test(allJsonLd);
      if (found) {
        throw new Error(
          `I3 FAILURE [${slug}] — "jobright" (competitor name) found.`
        );
      }
      expect(found).toBe(false);
    });

    it("I4: FORBIDDEN \"jack and jill\" absent (case-insensitive)", () => {
      const found =
        rawText.toLowerCase().includes("jack and jill") ||
        rawHtml.toLowerCase().includes("jack and jill");
      if (found) {
        throw new Error(
          `I4 FAILURE [${slug}] — "jack and jill" (retired compare-page brand name) found.`
        );
      }
      expect(found).toBe(false);
    });

    it("I5: FORBIDDEN \"tinker tailor\" absent (case-insensitive)", () => {
      const found =
        rawText.toLowerCase().includes("tinker tailor") ||
        rawHtml.toLowerCase().includes("tinker tailor");
      if (found) {
        throw new Error(
          `I5 FAILURE [${slug}] — "tinker tailor" (retired compare-page brand name) found.`
        );
      }
      expect(found).toBe(false);
    });

    it("I6: FORBIDDEN \"on-site\" or \"onsite\" as a workplace claim", () => {
      // The spec forbids these as location claims.
      const found = /\bon-?site\b/i.test(rawText) || /\bon-?site\b/i.test(rawHtml);
      if (found) {
        throw new Error(
          `I6 FAILURE [${slug}] — "on-site" or "onsite" found as a workplace claim.`
        );
      }
      expect(found).toBe(false);
    });

    it("I7: FORBIDDEN shaped count /\\d[\\d,]*\\s+(jobs|users|seekers|listings|sources)/i absent", () => {
      const pattern = /\d[\d,]*\s+(jobs|users|seekers|listings|sources)/i;
      const m = rawText.match(pattern);
      if (m) {
        throw new Error(
          `I7 FAILURE [${slug}] — numeric count claim found: "${m[0]}". ` +
            `Pattern /\\d[\\d,]*\\s+(jobs|users|seekers|listings|sources)/i is banned.`
        );
      }
      expect(rawText).not.toMatch(pattern);
    });

    it("I8: FORBIDDEN \"real matches\" absent (case-insensitive)", () => {
      if (/real matches/i.test(rawText)) {
        throw new Error(
          `I8 FAILURE [${slug}] — "real matches" found in rendered text. This phrase is banned.`
        );
      }
      expect(/real matches/i.test(rawText)).toBe(false);
    });

    it("I9: FORBIDDEN \"I found a job through it\" absent (belongs on /about only)", () => {
      if (/I found a job through it/i.test(rawText)) {
        throw new Error(
          `I9 FAILURE [${slug}] — "I found a job through it" found. This phrase belongs on /about only.`
        );
      }
      expect(/I found a job through it/i.test(rawText)).toBe(false);
    });
  });

  // ── Group J: CTAs ──────────────────────────────────────────────────────────
  describe(`Group J (/blog/${slug}) — CTAs`, () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(<Page />));
    });

    it(`J1: anchor href EXACTLY "${CTA_SAMPLE_REPORT}" exists`, () => {
      const anchors = Array.from(container.querySelectorAll("a"));
      const cta = anchors.find(
        (a) => a.getAttribute("href") === CTA_SAMPLE_REPORT
      );
      if (!cta) {
        const found = anchors
          .map((a) => a.getAttribute("href"))
          .filter(Boolean)
          .join(", ");
        throw new Error(
          `J1 FAILURE [${slug}] — no anchor with href="${CTA_SAMPLE_REPORT}".\n` +
            `  All hrefs: ${found}\n` +
            `  ADVERSARIAL: <Button as="a" href="..."> requires the mock to forward both as and href.`
        );
      }
      expect(cta).not.toBeNull();
    });

    it(`J2: signup anchor href EXACTLY "${signupCta}" (slug-specific utm_content)`, () => {
      const anchors = Array.from(container.querySelectorAll("a"));
      const cta = anchors.find((a) => a.getAttribute("href") === signupCta);
      if (!cta) {
        const utmLike = anchors
          .map((a) => a.getAttribute("href") ?? "")
          .filter((h) => h.includes("signup") || h.includes("utm"));
        throw new Error(
          `J2 FAILURE [${slug}] — no anchor with href="${signupCta}".\n` +
            `  Signup/UTM-like hrefs: ${utmLike.join(", ")}\n` +
            `  utm_content must be "${slug}" (slug-specific).`
        );
      }
      expect(cta).not.toBeNull();
    });

    it("J3: no signup anchor contains a DIFFERENT slug's utm_content (copy-paste guard)", () => {
      // The other post's slug should NOT appear in the signup URL of this post.
      const otherSlug = slug === P0_SLUG ? P1_SLUG : P0_SLUG;
      const anchors = Array.from(container.querySelectorAll("a"));
      const wrong = anchors.find((a) => {
        const href = a.getAttribute("href") ?? "";
        return href.includes("utm_content=") && href.includes(otherSlug);
      });
      if (wrong) {
        throw new Error(
          `J3 FAILURE [${slug}] — anchor has utm_content for a DIFFERENT slug: ` +
            `href="${wrong.getAttribute("href")}". ` +
            `utm_content must be "${slug}", not "${otherSlug}".`
        );
      }
      expect(wrong).toBeUndefined();
    });

    it("J4: no anchor href contains utm_medium other than \"blog\" in utm links for this post", () => {
      const anchors = Array.from(container.querySelectorAll("a"));
      const wrongMedium = anchors.find((a) => {
        const href = a.getAttribute("href") ?? "";
        return href.includes("utm_medium=") && !href.includes("utm_medium=blog");
      });
      if (wrongMedium) {
        throw new Error(
          `J4 FAILURE [${slug}] — utm_medium is not "blog": href="${wrongMedium.getAttribute("href")}". ` +
            `Blog posts must use utm_medium=blog.`
        );
      }
      expect(wrongMedium).toBeUndefined();
    });
  });

  // ── Group K: Static / Auth guarantees ─────────────────────────────────────
  describe(`Group K (/blog/${slug}) — Static / Auth guarantees`, () => {
    it("K1: module does NOT export getServerSideProps", () => {
      if ("getServerSideProps" in PageModule) {
        throw new Error(
          `K1 FAILURE [${slug}] — page exports getServerSideProps. Must be fully static.`
        );
      }
      expect("getServerSideProps" in PageModule).toBe(false);
    });

    it("K2: module does NOT export getStaticProps", () => {
      if ("getStaticProps" in PageModule) {
        throw new Error(
          `K2 FAILURE [${slug}] — page exports getStaticProps. Must be fully static.`
        );
      }
      expect("getStaticProps" in PageModule).toBe(false);
    });

    it("K3: rendering does NOT call fetch with any /api/ path", () => {
      (global.fetch as jest.Mock).mockClear();
      render(<Page />);
      const apiCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url]: [any]) => /\/api\//i.test(String(url))
      );
      if (apiCall) {
        throw new Error(
          `K3 FAILURE [${slug}] — fetch called with /api/ URL: "${apiCall[0]}". Must be fully static.`
        );
      }
      expect(apiCall).toBeUndefined();
    });

    it("K4: logged-out render does NOT call router.push or router.replace", () => {
      mockRouterPush.mockClear();
      mockRouterReplace.mockClear();
      render(<Page />);
      if (mockRouterPush.mock.calls.length > 0) {
        throw new Error(
          `K4 FAILURE [${slug}] — router.push called: ${JSON.stringify(mockRouterPush.mock.calls)}.`
        );
      }
      expect(mockRouterPush).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });
}

// Run per-post tests for both posts.
runPostTests(P0_SLUG, POSTS[0], AppliedToHundredsPage, AppliedModule as Record<string, unknown>);
runPostTests(P1_SLUG, POSTS[1], JobSearchBurnoutPage, BurnoutModule as Record<string, unknown>);

// ── Group L: Footer (real component, unmocked) ────────────────────────────────

describe("Group L — Footer (real component, unmocked)", () => {
  it('L1: full Footer has EXACTLY one anchor href="/blog"', () => {
    const { container } = render(<Footer />);
    const blogLinks = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.getAttribute("href") === "/blog"
    );
    if (blogLinks.length !== 1) {
      throw new Error(
        `L1 FAILURE — full Footer has ${blogLinks.length} anchor(s) with href="/blog", expected exactly 1.\n` +
          `  All hrefs: ${Array.from(container.querySelectorAll("a"))
            .map((a) => a.getAttribute("href"))
            .filter(Boolean)
            .join(", ")}`
      );
    }
    expect(blogLinks).toHaveLength(1);
  });

  it('L2: minimal Footer has NO anchor href="/blog"', () => {
    const { container } = render(<Footer minimal={true} />);
    const blogLinks = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.getAttribute("href") === "/blog"
    );
    if (blogLinks.length > 0) {
      throw new Error(
        `L2 FAILURE — minimal Footer contains href="/blog". ` +
          `The minimal footer is for app pages and must not include marketing/blog links.`
      );
    }
    expect(blogLinks).toHaveLength(0);
  });

  it('L3: Footer "OnlyJobs" wordmark is NOT a heading element (must use as="span")', () => {
    const { container } = render(<Footer />);
    const headingEls = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const wordmarkHeadings = Array.from(headingEls).filter(
      (el) => el.textContent?.trim() === "OnlyJobs"
    );
    if (wordmarkHeadings.length > 0) {
      throw new Error(
        `L3 FAILURE — Footer "OnlyJobs" wordmark is a heading ` +
          `(${wordmarkHeadings.map((el) => el.tagName).join(", ")}). ` +
          `Must use as="span" to avoid heading-order violations.`
      );
    }
    expect(wordmarkHeadings).toHaveLength(0);
  });
});

// ── Group M: Shared-SEO regression (real SEO component) ──────────────────────

describe("Group M — Shared-SEO regression (real SEO component)", () => {
  it("M1: SEO default og:type is still 'website' (adding article ogType on post pages must not change the default)", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogType = getMeta(container, 'meta[property="og:type"]');
    if (ogType !== "website") {
      throw new Error(
        `M1 FAILURE — SEO default og:type is now "${ogType}", expected "website". ` +
          `Adding ogType="article" to blog post pages must not change the component default.`
      );
    }
    expect(ogType).toBe("website");
  });

  it("M2: SEO default og:image is still the site default", () => {
    const { container } = render(
      <SEO title="Test Page" description="Test description." />
    );
    const ogImage = getMeta(container, 'meta[property="og:image"]');
    if (ogImage !== OG_IMAGE_DEFAULT) {
      throw new Error(
        `M2 FAILURE — SEO default og:image is "${ogImage}", expected "${OG_IMAGE_DEFAULT}".`
      );
    }
    expect(ogImage).toBe(OG_IMAGE_DEFAULT);
  });
});

// ── Group N: Sitemap ──────────────────────────────────────────────────────────

describe("Group N — Sitemap", () => {
  let sitemapXml: string;

  beforeAll(() => {
    sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  });

  it("N1: sitemap contains <loc>https://onlyjobs.app/blog</loc>", () => {
    if (!sitemapXml.includes("<loc>https://onlyjobs.app/blog</loc>")) {
      throw new Error(
        `N1 FAILURE — <loc>https://onlyjobs.app/blog</loc> not found in sitemap.xml.`
      );
    }
    expect(sitemapXml).toContain("<loc>https://onlyjobs.app/blog</loc>");
  });

  it(`N2: sitemap contains <loc>https://onlyjobs.app/blog/${P0_SLUG}</loc>`, () => {
    const expected = `<loc>https://onlyjobs.app/blog/${P0_SLUG}</loc>`;
    if (!sitemapXml.includes(expected)) {
      throw new Error(`N2 FAILURE — ${expected} not found in sitemap.xml.`);
    }
    expect(sitemapXml).toContain(expected);
  });

  it(`N3: sitemap contains <loc>https://onlyjobs.app/blog/${P1_SLUG}</loc>`, () => {
    const expected = `<loc>https://onlyjobs.app/blog/${P1_SLUG}</loc>`;
    if (!sitemapXml.includes(expected)) {
      throw new Error(`N3 FAILURE — ${expected} not found in sitemap.xml.`);
    }
    expect(sitemapXml).toContain(expected);
  });

  it(`N4: /blog entry has <lastmod>${DATE_PUBLISHED}</lastmod>`, () => {
    const blocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    const targetLoc = "https://onlyjobs.app/blog";
    const urlBlock = blocks.find((b) => b.includes(`<loc>${targetLoc}</loc>`));
    if (!urlBlock) {
      throw new Error(`N4 FAILURE — could not find <url> block for /blog in sitemap.xml.`);
    }
    const lastmodMatch = urlBlock.match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(`N4 FAILURE — <lastmod> missing from /blog sitemap entry.`);
    }
    const lastmod = lastmodMatch[1].trim();
    if (lastmod !== DATE_PUBLISHED) {
      throw new Error(
        `N4 FAILURE — /blog <lastmod> is "${lastmod}", expected "${DATE_PUBLISHED}".`
      );
    }
    expect(lastmod).toBe(DATE_PUBLISHED);
  });

  it(`N5: /blog/${P0_SLUG} entry has <lastmod>${DATE_PUBLISHED}</lastmod>`, () => {
    const blocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    const targetLoc = `https://onlyjobs.app/blog/${P0_SLUG}`;
    const urlBlock = blocks.find((b) => b.includes(`<loc>${targetLoc}</loc>`));
    if (!urlBlock) {
      throw new Error(`N5 FAILURE — could not find <url> block for /blog/${P0_SLUG}.`);
    }
    const lastmodMatch = urlBlock.match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(`N5 FAILURE — <lastmod> missing from /blog/${P0_SLUG} sitemap entry.`);
    }
    const lastmod = lastmodMatch[1].trim();
    if (lastmod !== DATE_PUBLISHED) {
      throw new Error(
        `N5 FAILURE — /blog/${P0_SLUG} <lastmod> is "${lastmod}", expected "${DATE_PUBLISHED}".`
      );
    }
    expect(lastmod).toBe(DATE_PUBLISHED);
  });

  it(`N6: /blog/${P1_SLUG} entry has <lastmod>${DATE_PUBLISHED}</lastmod>`, () => {
    const blocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    const targetLoc = `https://onlyjobs.app/blog/${P1_SLUG}`;
    const urlBlock = blocks.find((b) => b.includes(`<loc>${targetLoc}</loc>`));
    if (!urlBlock) {
      throw new Error(`N6 FAILURE — could not find <url> block for /blog/${P1_SLUG}.`);
    }
    const lastmodMatch = urlBlock.match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (!lastmodMatch) {
      throw new Error(`N6 FAILURE — <lastmod> missing from /blog/${P1_SLUG} sitemap entry.`);
    }
    const lastmod = lastmodMatch[1].trim();
    if (lastmod !== DATE_PUBLISHED) {
      throw new Error(
        `N6 FAILURE — /blog/${P1_SLUG} <lastmod> is "${lastmod}", expected "${DATE_PUBLISHED}".`
      );
    }
    expect(lastmod).toBe(DATE_PUBLISHED);
  });

  it("N7: sitemap does NOT contain /pricing (redirect, must not be indexed)", () => {
    if (sitemapXml.includes("/pricing")) {
      throw new Error(
        `N7 FAILURE — /pricing found in sitemap.xml. The /pricing route is a redirect and must not be indexed.`
      );
    }
    expect(sitemapXml).not.toContain("/pricing");
  });
});

// ── DISCLOSURE ────────────────────────────────────────────────────────────────
//
// Files read (allowed per spec):
//
//   src/content/blog.ts — ALLOWED. The metadata contract. Read in full to derive
//     spec constants P0_*/P1_* (all string values for title, h1, excerpt, description,
//     ogTitle, ogDescription, slugs, datePublished). These are oracle values that trace
//     to the contract, not to implementation bodies.
//     Also read BlogPost interface and getPost() signature to confirm the exported shapes.
//     Saw: POSTS array has exactly 2 items; datePublished = "2026-10-01"; ogTitle differs
//     from title for both posts.
//
//   src/components/SEO.tsx — ALLOWED. Confirmed:
//     (1) fullTitle rule: if title contains SITE_NAME, use as-is; else append " | OnlyJobs"
//     (2) canonicalUrl = canonical ? BASE_URL + canonical : undefined
//     (3) resolvedOgTitle = ogTitle ?? fullTitle — omitting ogTitle collapses og:title to fullTitle
//     (4) resolvedOgDescription = ogDescription ?? description
//     (5) DEFAULT_OG_IMAGE = "https://onlyjobs.app/og-image.png"
//     (6) ogType defaults to "website"; page must pass ogType="article" explicitly.
//     These informed F8 (og:title != <title> means ogTitle was properly set), F10 (og:title
//     must not contain "| OnlyJobs"), and M1/M2 (shared-SEO regression).
//
//   src/components/Footer.tsx — ALLOWED. Confirmed:
//     (a) href="/blog" ContactLink on line ~129 (full footer only) → L1 testable.
//     (b) Heading as="span" line ~83 → L3 testable; wordmark is NOT a heading.
//     (c) minimal footer (lines ~39-71) does NOT include /blog → L2 testable.
//     All assertions derive from spec; file confirmed testability only.
//
//   src/__tests__/24g.5.ai-job-tools.adversarial.test.tsx — ALLOWED (harness patterns).
//     Read: Chakra mock factory (makeEl, Proxy), AuthContext mock shape, react-icons Proxy,
//     JSON-LD helpers (getAllJsonLdParsed, collectAllTypes), styled-components mock,
//     module namespace import pattern, mockRouterPush/Replace pattern, sitemap group.
//     DID NOT read any oracle values for 24g.5 tests — harness patterns only.
//     Noted: 24g.5's makeEl does NOT forward `dateTime`. This file fixes that.
//
//   src/__tests__/24g.7.blog.smoke.test.tsx — ALLOWED (harness patterns).
//     Read: Chakra mock with makeForwardingEl that forwards dateTime (adopted here),
//     smoke test assertions (suite 1-4), import paths for blog page modules.
//     DID NOT use smoke test assertion VALUES as oracles — all adversarial assertions
//     trace to the spec and blog.ts contract.
//
//   public/sitemap.xml — ALLOWED. Confirmed:
//     /blog, /blog/applied-to-hundreds-of-jobs, /blog/job-search-burnout all present,
//     each with <lastmod>2026-10-01</lastmod>. /pricing absent. Saw total URL count but
//     did NOT assert a specific total count (that belongs to 24g.1 Spec5 / 24g.seo-foundation).
//
// Incidental knowledge kept OUT of oracles:
//   - Smoke test assertions show various things passing — all adversarial oracle values
//     trace to spec/blog.ts, not to smoke test output.
//   - SEO.tsx DEFAULT_OG_IMAGE string confirms OG_IMAGE_DEFAULT oracle is consistent
//     with the spec-stated "https://onlyjobs.app/og-image.png".
//   - Footer.tsx line ~129 confirms the href="/blog" is there; oracle traces to spec.
//
// Implementation bodies NOT read (per boundary):
//   - src/pages/blog/index.tsx
//   - src/pages/blog/applied-to-hundreds-of-jobs.tsx
//   - src/pages/blog/job-search-burnout.tsx
//   - src/components/BlogPostLayout.tsx
//
// Novel adversarial angles vs. smoke test:
//   - E3: no h2 before h1 in DOM order
//   - E4: <time dateTime="..."> requires dateTime forwarding (the key mock distinction)
//   - E6: breadcrumb nav has EXACTLY 2 links (not 3); current crumb is text
//   - B3: links appear in POSTS array order
//   - C2+C3: CollectionPage with specific @id (not WebPage) on index
//   - F8+F10: og:title != <title> and og:title must not contain "| OnlyJobs"
//   - G4: dateModified "2026-10-01" (separate from datePublished, easily forgotten)
//   - G5: inLanguage "en-US" (often forgotten)
//   - G6: image URL on onlyjobs.app domain
//   - G7: mainEntityOfPage is an object with @type "WebPage", not a bare string/@id
//   - G9+G12: author/publisher are objects (not strings, not @id-only)
//   - G15+G16: post BreadcrumbList has 3 items with correct position-3 URL
//   - H7: "what didn't" near product-closing language (product-closer proximity test)
//   - I6: on-site/onsite forbidden
//   - J3: no cross-slug utm_content contamination (copy-paste guard)
//   - J4: utm_medium must be "blog" not "about" or other page
//   - L1: Full Footer has EXACTLY ONE /blog link (not multiple)
//   - M1/M2: shared-SEO regression (article ogType on post pages must not change defaults)
//
// Limitations (FINDINGS — not weakened):
//
//   H7 (product-closer proximity): measures char distance between "what didn't" and
//   product phrases. If the copy places them in separate paragraphs > 600 chars apart,
//   this would fail even if technically in the product section. Playwright reading the
//   rendered DOM's block structure is the authoritative check.
//
//   E4 (dateTime element): tests the rendered DOM; if a BlogPostLayout renders <time>
//   as a styled div with a data-* attribute instead, this passes the component render
//   but would fail browser semantics. The query checks both dateTime and datetime cases.
//
//   K4 (logged-in redirect): tests only logged-out path. Re-mocking AuthContext with
//   isLoggedIn=true per test conflicts with module-level mock hoisting. Playwright with
//   authenticated session is the authoritative check for logged-in redirect behavior.
//
//   I1/I2 (em/en-dash): CSS-injected dashes (::before/::after pseudo-elements) are not
//   caught by jsdom textContent. Playwright visual diff is the authoritative check.
