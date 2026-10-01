/**
 * REGRESSION TEST — onlyjobs-24g.11: footer link contrast fix
 *
 * Source-based: styled-components mocks discard CSS interpolations and drop
 * unknown props, so a prop/CSS assertion under the render mock is a false
 * green. These tests read the actual source file for the CSS contract, then
 * render to confirm both footer variants mount without error.
 */

import React from "react";
import fs from "fs";
import path from "path";
import { render } from "@testing-library/react";

const FOOTER_PATH = path.resolve(
  __dirname,
  "..",
  "components",
  "Footer.tsx"
);

// ── Source-based contract tests ───────────────────────────────────────────────

describe("Footer source — contrast CSS contract (onlyjobs-24g.11)", () => {
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(FOOTER_PATH, "utf-8");
  });

  function styledBlock(source: string, name: string): string {
    const start = source.indexOf(`const ${name} = styled(Link)` + "`");
    if (start === -1) throw new Error(`${name} styled(Link) block not found in Footer.tsx`);
    const open = source.indexOf("`", start);
    const close = source.indexOf("`", open + 1);
    if (close === -1) throw new Error(`${name} styled block has no closing backtick`);
    return source.slice(open + 1, close);
  }

  it.each(["ContactLink", "MinimalLink"])(
    "S1(%s): BASE color (before any &: pseudo-class) is #abc9ed — light brand blue, AAA on dark footer",
    (name) => {
      const css = styledBlock(src, name);
      // Assert the BASE color (before any &: pseudo-class) so a dark base with a
      // light :visited cannot false-pass — the default/unvisited color is the
      // contrast-critical one.
      const base = css.split("&:")[0];
      if (!/color:\s*#abc9ed/i.test(base)) {
        throw new Error(
          `S1 FAILURE (${name}) — base color declaration is not #abc9ed in ${name} styled(Link) block.\n` +
            `  The default/unvisited color must be #ABC9ED (not just a pseudo-class rule).\n` +
            `  Base CSS (before first &:):\n  ${base.trim()}`
        );
      }
      expect(base).toMatch(/color:\s*#abc9ed/i);
    }
  );

  it.each(["ContactLink", "MinimalLink"])(
    "S2(%s): BASE rule (before any &: pseudo-class) contains text-decoration: underline — required for link affordance",
    (name) => {
      const css = styledBlock(src, name);
      const base = css.split("&:")[0];
      if (!/text-decoration:\s*underline/i.test(base)) {
        throw new Error(
          `S2 FAILURE (${name}) — "text-decoration: underline" not found in the BASE rule of ${name} styled(Link) block (before first &: pseudo-class).\n` +
            `  ${name} must be underlined by default, not only in a hover/visited state.\n` +
            `  Base CSS (before first &:):\n  ${base.trim()}`
        );
      }
      expect(base).toMatch(/text-decoration:\s*underline/i);
    }
  );

  it.each(["ContactLink", "MinimalLink"])(
    "S3(%s): styled block contains focus-visible — keyboard accessibility",
    (name) => {
      const css = styledBlock(src, name);
      if (!css.includes("focus-visible")) {
        throw new Error(
          `S3 FAILURE (${name}) — "focus-visible" not found in ${name} styled(Link) block in Footer.tsx.\n` +
            `  ${name} must include a :focus-visible rule.`
        );
      }
      expect(css).toContain("focus-visible");
    }
  );

  it.each(["ContactLink", "MinimalLink"])(
    "S5(%s): :visited rule sets color #abc9ed — visited links keep light brand blue contrast",
    (name) => {
      const css = styledBlock(src, name);
      if (!/&:visited\s*\{[^}]*color:\s*#abc9ed/i.test(css)) {
        throw new Error(
          `S5 FAILURE (${name}) — :visited rule does not set color:#abc9ed in ${name} styled(Link) block.\n` +
            `  Visited links must retain the AAA-contrast light brand blue (#ABC9ED) on the dark footer.`
        );
      }
      expect(css).toMatch(/&:visited\s*\{[^}]*color:\s*#abc9ed/i);
    }
  );

  it.each(["ContactLink", "MinimalLink"])(
    "S6(%s): :hover/:focus-visible rule sets color #ffffff — interactive state goes white",
    (name) => {
      const css = styledBlock(src, name);
      if (!/&:hover[\s\S]*?color:\s*#ffffff/i.test(css)) {
        throw new Error(
          `S6 FAILURE (${name}) — hover/focus-visible rule does not set color:#ffffff in ${name} styled(Link) block.\n` +
            `  The hover/focus-visible state must go white (#FFFFFF) for maximum contrast on the dark footer.`
        );
      }
      expect(css).toMatch(/&:hover[\s\S]*?color:\s*#ffffff/i);
    }
  );

  it.each(["ContactLink", "MinimalLink"])(
    "S7(%s): :focus-visible rule sets outline 2px solid #ffffff — visible keyboard focus ring",
    (name) => {
      const css = styledBlock(src, name);
      if (!/&:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+#ffffff/i.test(css)) {
        throw new Error(
          `S7 FAILURE (${name}) — :focus-visible rule does not set "outline: 2px solid #ffffff" in ${name} styled(Link) block.\n` +
            `  A white 2px focus ring is required for keyboard accessibility on the dark footer.`
        );
      }
      expect(css).toMatch(/&:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+#ffffff/i);
    }
  );

  it("S4: source does NOT contain semantic.primary — dead color token fully removed", () => {
    if (src.includes("semantic.primary")) {
      throw new Error(
        `S4 FAILURE — "semantic.primary" still present in Footer.tsx.\n` +
          `  All inline color="semantic.primary" props and CSS interpolations must be removed.\n` +
          `  Lines containing it:\n` +
          src
            .split("\n")
            .filter((l) => l.includes("semantic.primary"))
            .map((l, i) => `  ${i + 1}: ${l}`)
            .join("\n")
      );
    }
    expect(src).not.toContain("semantic.primary");
  });
});

// ── Render smoke tests ────────────────────────────────────────────────────────
// Reuse mock pattern from 24g.4.about.adversarial.test.tsx to keep parity.

const nullIcon = () => null;

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
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

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(({ children, ...rest }: any, ref: any) =>
      React.createElement(tag, { ref, ...rest }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  return new Proxy(
    {
      __esModule: true,
      Box: makeEl("div"),
      Container: makeEl("div"),
      VStack: makeEl("div"),
      HStack: makeEl("div"),
      Heading: ({ as: T = "h2", children, ...rest }: any) =>
        React.createElement(T, rest, children),
      Text: makeEl("span"),
      Badge: makeEl("span"),
      useColorModeValue: (light: any) => light,
    },
    {
      get(target: any, prop: any) {
        if (prop in target) return target[prop];
        if (typeof prop === "string") {
          if (prop.startsWith("use")) {
            if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
            return cache[`hook:${prop}`];
          }
          return makeEl("div");
        }
        return target[prop];
      },
    }
  );
});

jest.mock("react-icons/fi", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/bs", () => new Proxy({}, { get: () => nullIcon }));
jest.mock("react-icons/si", () => new Proxy({}, { get: () => nullIcon }));

// eslint-disable-next-line import/first
import { Footer } from "@/components/Footer";

describe("Footer render smoke — both variants mount without error (onlyjobs-24g.11)", () => {
  it("R1: <Footer /> (full) mounts without throwing", () => {
    expect(() => render(<Footer />)).not.toThrow();
  });

  it("R2: <Footer minimal /> (dashboard strip) mounts without throwing", () => {
    expect(() => render(<Footer minimal />)).not.toThrow();
  });

  it("R3: full footer renders expected link hrefs", () => {
    const { container } = render(<Footer />);
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (a) => a.getAttribute("href")
    );
    expect(hrefs).toContain("/privacy-policy");
    expect(hrefs).toContain("/about");
    expect(hrefs).toContain("/blog");
  });

  it("R4: minimal footer renders Privacy, Terms, Contact links", () => {
    const { container } = render(<Footer minimal />);
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (a) => a.getAttribute("href")
    );
    expect(hrefs).toContain("/privacy-policy");
    expect(hrefs).toContain("/terms-conditions");
    expect(hrefs).toContain("mailto:contact@auroradesignshq.com");
  });
});
