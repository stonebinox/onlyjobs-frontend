/**
 * SMOKE TEST — onlyjobs-24g.7: Blog infrastructure + 2 posts
 *
 * Just-enough tests to verify the feature compiles, renders, and has the
 * right JSON-LD / SEO / structural shape. Adversarial suite is separate.
 *
 * IMPORTANT: Chakra mock MUST forward `as` AND `dateTime` to satisfy the spec.
 */

import React from "react";
import { render } from "@testing-library/react";

// ── Mocks (hoisted by jest before all imports) ────────────────────────────────

const nullIcon = () => null;

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/blog",
    query: {},
    asPath: "/blog",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/blog",
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head must be passthrough so meta tags and ld+json are queryable.
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

// CRITICAL: Chakra mock MUST forward `as` (so Box as="main" renders <main>)
// AND forward `dateTime` (so Box as="time" dateTime="..." renders correctly).
// Heading also forwards `as` (default h2 so wrong usage fails the h1 count test).
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  // Box forwards `as` prop and `dateTime` attribute.
  const makeForwardingEl = (defaultTag: string) => {
    const key = `fwd:${defaultTag}`;
    if (cache[key]) return cache[key];
    const C = ({
      as: T = defaultTag,
      children,
      dateTime,
      onClick,
      "aria-label": al,
      href,
      role,
      // strip Chakra layout/style props
      py, px, pt, pb, pl, pr, mt, mb, mx, my, w, h, width, height,
      maxW, minW, flex, display, align, justify, spacing, wrap,
      fontSize, fontWeight, fontFamily, letterSpacing, textAlign,
      color, bg, bgColor, borderTopWidth, borderColor,
      ...rest
    }: any) =>
      React.createElement(T, { dateTime, onClick, "aria-label": al, href, role }, children);
    C.displayName = `Forwarding(${defaultTag})`;
    cache[key] = C;
    return C;
  };

  // Simple non-forwarding element (for things that don't need `as`).
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, "aria-label": al, href, role }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, "aria-label": al, href, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    // CRITICAL: Box forwards `as` so <Box as="main"> renders <main>.
    Box: makeForwardingEl("div"),
    Flex: makeForwardingEl("div"),
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
    // ADVERSARIAL: default tag is 'h2' so a page that forgets as="h1" fails the h1 count.
    Heading: ({
      as: T = "h2",
      children,
      lineHeight, fontSize, fontWeight, fontFamily, letterSpacing,
      textAlign, color, mb, mt, mx, my, px, py, pt, pb, pl, pr,
      w, h, width, height, maxW, minW, flex, display, align, justify,
      noOfLines, isTruncated, bgGradient, bgClip, size,
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
      colorScheme,
      size,
      ...rest
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
    DrawerOverlay: ({ children }: any) => React.createElement("div", null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    DrawerHeader: ({ children }: any) => React.createElement("h2", null, children),
    DrawerBody: ({ children }: any) => React.createElement("div", null, children),
    DrawerFooter: ({ children }: any) => React.createElement("div", null, children),
    DrawerCloseButton: ({ onClick }: any) =>
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
    InputLeftAddon: makeEl("span"),
    InputRightAddon: makeEl("span"),
    FormErrorMessage: makeEl("span"),
    FormHelperText: makeEl("span"),
    Image: ({ src, alt }: any) => React.createElement("img", { src, alt }),
    Avatar: ({ name }: any) => React.createElement("div", { "aria-label": name }),
    Progress: ({ value }: any) =>
      React.createElement("div", { "aria-valuenow": value }),
    Switch: (props: any) => React.createElement("input", { type: "checkbox", ...props }),
    Popover: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) => React.createElement("div", null, children),
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
    Radio: ({ value }: any) => React.createElement("input", { type: "radio", value }),
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
    AlertDialogBody: ({ children }: any) => React.createElement("div", null, children),
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

jest.mock("@/components/CookieConsent", () => ({ CookieConsent: () => null }));
jest.mock("@/components/Footer", () => ({
  Footer: () => React.createElement("footer", null, "Footer"),
  __esModule: true,
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
import { POSTS } from "@/content/blog";
// eslint-disable-next-line import/first
import BlogIndexPage from "@/pages/blog/index";
// eslint-disable-next-line import/first
import AppliedToHundredsPage from "@/pages/blog/applied-to-hundreds-of-jobs";
// eslint-disable-next-line import/first
import JobSearchBurnoutPage from "@/pages/blog/job-search-burnout";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getArticleNode(container: HTMLElement): any {
  for (const parsed of getAllJsonLdScripts(container)) {
    if (!parsed) continue;
    const graph: any[] = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    const article = graph.find((n: any) => n["@type"] === "Article");
    if (article) return article;
  }
  return null;
}

function getMeta(container: HTMLElement, selector: string, attr = "content"): string | null {
  return container.querySelector(selector)?.getAttribute(attr) ?? null;
}

// ── Suite 1: blog.ts data contract ───────────────────────────────────────────

describe("blog.ts — data contract", () => {
  it("exports exactly 2 posts", () => {
    expect(POSTS).toHaveLength(2);
  });

  it('first post slug is "applied-to-hundreds-of-jobs"', () => {
    expect(POSTS[0].slug).toBe("applied-to-hundreds-of-jobs");
  });

  it('second post slug is "job-search-burnout"', () => {
    expect(POSTS[1].slug).toBe("job-search-burnout");
  });

  it("every post has a non-empty h1, description, ogTitle, ogDescription, datePublished", () => {
    for (const post of POSTS) {
      expect(post.h1).toBeTruthy();
      expect(post.description).toBeTruthy();
      expect(post.ogTitle).toBeTruthy();
      expect(post.ogDescription).toBeTruthy();
      expect(post.datePublished).toBe("2026-10-01");
    }
  });
});

// ── Suite 2: /blog/applied-to-hundreds-of-jobs ───────────────────────────────

describe("/blog/applied-to-hundreds-of-jobs page", () => {
  let container: HTMLElement;
  const record = POSTS[0];

  beforeEach(() => {
    ({ container } = render(<AppliedToHundredsPage />));
  });

  it("renders exactly one <h1>", () => {
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
  });

  it("the h1 text matches record.h1", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe(record.h1);
  });

  it("Article JSON-LD node exists", () => {
    const article = getArticleNode(container);
    expect(article).not.toBeNull();
  });

  it('Article author @id is "https://onlyjobs.app/about#person"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.["@id"]).toBe("https://onlyjobs.app/about#person");
  });

  it('Article author @type is "Person"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.["@type"]).toBe("Person");
  });

  it('Article author name is "Anoop Santhanam"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.name).toBe("Anoop Santhanam");
  });

  it('Article publisher @id is "https://onlyjobs.app/#organization"', () => {
    const article = getArticleNode(container);
    expect(article?.publisher?.["@id"]).toBe("https://onlyjobs.app/#organization");
  });

  it('Article mainEntityOfPage @type is "WebPage"', () => {
    const article = getArticleNode(container);
    expect(article?.mainEntityOfPage?.["@type"]).toBe("WebPage");
  });

  it('Article datePublished is "2026-10-01"', () => {
    const article = getArticleNode(container);
    expect(article?.datePublished).toBe("2026-10-01");
  });

  it("Article image array is non-empty", () => {
    const article = getArticleNode(container);
    expect(Array.isArray(article?.image)).toBe(true);
    expect(article?.image?.length).toBeGreaterThan(0);
  });

  it('og:type is "article"', () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    expect(ogType).toBe("article");
  });

  it('<time dateTime="2026-10-01"> element exists', () => {
    const timeEl = container.querySelector('time[dateTime="2026-10-01"]');
    expect(timeEl).not.toBeNull();
  });
});

// ── Suite 3: /blog/job-search-burnout ────────────────────────────────────────

describe("/blog/job-search-burnout page", () => {
  let container: HTMLElement;
  const record = POSTS[1];

  beforeEach(() => {
    ({ container } = render(<JobSearchBurnoutPage />));
  });

  it("renders exactly one <h1>", () => {
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
  });

  it("the h1 text matches record.h1", () => {
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe(record.h1);
  });

  it("Article JSON-LD node exists", () => {
    const article = getArticleNode(container);
    expect(article).not.toBeNull();
  });

  it('Article author @id is "https://onlyjobs.app/about#person"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.["@id"]).toBe("https://onlyjobs.app/about#person");
  });

  it('Article author @type is "Person"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.["@type"]).toBe("Person");
  });

  it('Article author name is "Anoop Santhanam"', () => {
    const article = getArticleNode(container);
    expect(article?.author?.name).toBe("Anoop Santhanam");
  });

  it('Article publisher @id is "https://onlyjobs.app/#organization"', () => {
    const article = getArticleNode(container);
    expect(article?.publisher?.["@id"]).toBe("https://onlyjobs.app/#organization");
  });

  it('Article mainEntityOfPage @type is "WebPage"', () => {
    const article = getArticleNode(container);
    expect(article?.mainEntityOfPage?.["@type"]).toBe("WebPage");
  });

  it('Article datePublished is "2026-10-01"', () => {
    const article = getArticleNode(container);
    expect(article?.datePublished).toBe("2026-10-01");
  });

  it("Article image array is non-empty", () => {
    const article = getArticleNode(container);
    expect(Array.isArray(article?.image)).toBe(true);
    expect(article?.image?.length).toBeGreaterThan(0);
  });

  it('og:type is "article"', () => {
    const ogType = getMeta(container, 'meta[property="og:type"]');
    expect(ogType).toBe("article");
  });

  it('<time dateTime="2026-10-01"> element exists', () => {
    const timeEl = container.querySelector('time[dateTime="2026-10-01"]');
    expect(timeEl).not.toBeNull();
  });
});

// ── Suite 4: /blog index page ─────────────────────────────────────────────────

describe("/blog index page", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<BlogIndexPage />));
  });

  it('renders exactly one <h1> with text "Blog"', () => {
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe("Blog");
  });

  it('renders a link to "/blog/applied-to-hundreds-of-jobs"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const link = anchors.find(
      (a) => a.getAttribute("href") === "/blog/applied-to-hundreds-of-jobs"
    );
    expect(link).not.toBeNull();
  });

  it('renders a link to "/blog/job-search-burnout"', () => {
    const anchors = Array.from(container.querySelectorAll("a"));
    const link = anchors.find(
      (a) => a.getAttribute("href") === "/blog/job-search-burnout"
    );
    expect(link).not.toBeNull();
  });

  it("JSON-LD does NOT contain an Article @type node", () => {
    for (const parsed of getAllJsonLdScripts(container)) {
      if (!parsed) continue;
      const graph: any[] = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
      const article = graph.find((n: any) => n["@type"] === "Article");
      expect(article).toBeUndefined();
    }
  });
});
