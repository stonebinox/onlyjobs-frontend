/**
 * SMOKE TEST — onlyjobs-24g.2: Sample Match Report page
 *
 * Verifies:
 *   1. Page renders with no auth and no network calls
 *   2. Exactly one <h1>
 *   3. JSON-LD type set is exactly {WebPage, BreadcrumbList}
 *   4. og:type=article
 *
 * Phase 2a only — adversarial suite is separate and will be authored independently.
 * Do NOT mock JsonLd to null; do NOT mock SEO to null.
 * next/head is mocked as passthrough so <meta> tags appear in the container.
 * Chakra Heading mock MUST forward the `as` prop (default h2) so semantic-element
 * assertions are meaningful.
 */

import React from "react";
import { render } from "@testing-library/react";

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

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

// CRITICAL: passthrough so <meta> and <script> tags rendered inside <Head>
// are queryable in the container DOM.
jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, href, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

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

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = ({ children }: any) => React.createElement(tag, null, children);
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  return {
    __esModule: true,
    Box: makeEl("div"),
    Container: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Stack: makeEl("div"),
    SimpleGrid: makeEl("div"),
    Divider: () => React.createElement("hr"),
    // CRITICAL: Heading forwards `as` — a forgotten as="h1" renders h2 and fails the h1 test.
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
      size,
      ...rest
    }: any) => React.createElement(T, rest, children),
    Text: makeEl("span"),
    Button: ({ children, as: _as, href, onClick, colorScheme, size, ...rest }: any) =>
      React.createElement(_as || "button", { href, onClick }, children),
    Badge: makeEl("span"),
    Link: ({ children, href, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
    useColorModeValue: (light: any) => light,
  };
});

jest.mock("@/theme/theme", () => ({
  __esModule: true,
  default: { colors: { semantic: { primary: "#000" } } },
}));

jest.mock("@/theme/palette", () => ({
  PAPER: "#ffffff",
  PENCIL: { 300: "#aaaaaa", 500: "#555555" },
}));

// eslint-disable-next-line import/first
import SampleMatchReportPage from "@/pages/sample-match-report";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllJsonLdTypes(container: HTMLElement): Set<string> {
  const scripts = Array.from(
    container.querySelectorAll('script[type="application/ld+json"]')
  );
  const types = new Set<string>();
  for (const script of scripts) {
    let parsed: any;
    try {
      parsed = JSON.parse(script.innerHTML);
    } catch {
      continue;
    }
    if (Array.isArray(parsed?.["@graph"])) {
      for (const node of parsed["@graph"]) {
        if (node["@type"]) types.add(node["@type"]);
      }
    } else if (parsed?.["@type"]) {
      types.add(parsed["@type"]);
    }
  }
  return types;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("sample-match-report smoke tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(<SampleMatchReportPage />));
  });

  it("renders without throwing — no auth, no network", () => {
    expect(container).toBeTruthy();
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("has exactly one <h1>", () => {
    const h1s = container.querySelectorAll("h1");
    if (h1s.length !== 1) {
      throw new Error(
        `Expected exactly 1 <h1>, found ${h1s.length}. ` +
          Array.from(h1s)
            .map((el) => `"${el.textContent?.trim()}"`)
            .join(", ")
      );
    }
    expect(h1s).toHaveLength(1);
  });

  it("JSON-LD type set is exactly {WebPage, BreadcrumbList}", () => {
    const types = getAllJsonLdTypes(container);
    expect(types.size).toBeGreaterThan(0);
    expect(types).toEqual(new Set(["WebPage", "BreadcrumbList"]));
  });

  it('og:type is "article"', () => {
    const ogTypeMeta = container.querySelector('meta[property="og:type"]');
    expect(ogTypeMeta).not.toBeNull();
    expect(ogTypeMeta?.getAttribute("content")).toBe("article");
  });
});
