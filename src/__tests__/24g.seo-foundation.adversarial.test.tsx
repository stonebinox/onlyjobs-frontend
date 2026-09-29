/**
 * ADVERSARIAL TEST — onlyjobs-24g.1: SEO v2 Foundation
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions, do NOT skip-pass when build output is absent.
 *
 * FORBIDDEN IMPLEMENTATION FILES (not opened, not read):
 *   src/pages/index.tsx
 *   src/pages/_document.tsx
 *   src/components/JsonLd.tsx
 *   src/components/Logo.tsx
 *
 * Oracle: the spec pasted in the task prompt, not implementation output.
 * Every expected value below traces to the spec, never to "what the code outputs."
 *
 * DISCLOSURE: see bottom of file.
 */

import React from 'react';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// ─── Build output paths ────────────────────────────────────────────────────────

const NEXT_ROOT = path.resolve(__dirname, '..', '..', '.next');
const SERVER_PAGES = path.join(NEXT_ROOT, 'server', 'pages');
const SITEMAP_PATH = path.resolve(__dirname, '..', '..', 'public', 'sitemap.xml');

function findHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const all = fs.readdirSync(dir, { recursive: true }) as string[];
  return all.filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
}

// ─── Mocks (hoisted by jest before all imports) ───────────────────────────────

const nullIcon = () => null;

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: { on: jest.fn(), off: jest.fn() },
    isReady: true,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// CRITICAL: next/head MUST be a passthrough so the ld+json <script> is queryable.
// Mocking to null would hide the JSON-LD from the rendered output, making spec 3 unverifiable.
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}));

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

// CRITICAL: Heading MUST forward the `as` prop (default 'h2').
// A mock that hardcodes the tag (e.g. makeEl('h2') or makeEl('h3')) makes the h1
// outline assertions meaningless — a wrong impl using <Heading> without as="h1"
// would NOT be caught. This is the adversarial choice.
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, 'aria-label': al, href, role, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl('div'),
    Flex: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Stack: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
    Container: makeEl('div'),
    Center: makeEl('div'),
    Grid: makeEl('div'),
    GridItem: makeEl('div'),
    // ADVERSARIAL: default tag is 'h2' so a page that forgets `as="h1"` on the hero
    // renders h2 and fails the "exactly one h1" and "outline order" tests.
    // Strip Chakra style props (lineHeight, fontSize, fontWeight, etc.) before
    // forwarding to native elements — they are not valid DOM attributes.
    Heading: ({ as: T = 'h2', children, lineHeight, fontSize, fontWeight, fontFamily,
      letterSpacing, textAlign, color, mb, mt, mx, my, px, py, pt, pb, pl, pr,
      w, h, width, height, maxW, minW, flex, display, align, justify,
      noOfLines, isTruncated, bgGradient, bgClip, ...rest }: any) =>
      React.createElement(T, rest, children),
    Text: makeEl('span'),
    Button: makeEl('button'),
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
    Link: ({ children, href, onClick }: any) => React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Modal: ({ isOpen, children }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, '×'),
    Drawer: ({ isOpen, children }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, '×'),
    Collapse: ({ in: isIn, children }: any) => isIn ? React.createElement('div', null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Input: makeEl('input'),
    Textarea: makeEl('textarea'),
    Select: ({ children, ...p }: any) => React.createElement('select', p, children),
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) => React.createElement('div', { role: 'tablist' }, children),
    Tab: ({ children, onClick }: any) => React.createElement('button', { role: 'tab', onClick }, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) => React.createElement('div', { role: 'tabpanel' }, children),
    Accordion: ({ children }: any) => React.createElement('div', null, children),
    AccordionItem: ({ children }: any) => React.createElement('div', null, children),
    AccordionButton: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
    AccordionPanel: ({ children }: any) => React.createElement('div', null, children),
    AccordionIcon: () => null,
    Checkbox: ({ onChange, isChecked }: any) =>
      React.createElement('input', { type: 'checkbox', onChange, checked: isChecked }),
    InputGroup: makeEl('div'),
    InputLeftElement: makeEl('span'),
    InputRightElement: makeEl('span'),
    InputLeftAddon: makeEl('span'),
    InputRightAddon: makeEl('span'),
    FormErrorMessage: makeEl('span'),
    FormHelperText: makeEl('span'),
    Image: ({ src, alt }: any) => React.createElement('img', { src, alt }),
    Avatar: ({ name }: any) => React.createElement('div', { 'aria-label': name }),
    Progress: ({ value }: any) => React.createElement('div', { 'aria-valuenow': value }),
    Switch: (props: any) => React.createElement('input', { type: 'checkbox', ...props }),
    Popover: ({ children }: any) => React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) => React.createElement('div', null, children),
    PopoverBody: ({ children }: any) => React.createElement('div', null, children),
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) => React.createElement('li', { role: 'menuitem', onClick }, children),
    NumberInput: ({ children }: any) => React.createElement('div', null, children),
    NumberInputField: makeEl('input'),
    Radio: ({ value }: any) => React.createElement('input', { type: 'radio', value }),
    RadioGroup: ({ children, onChange }: any) => React.createElement('div', { onChange }, children),
    Stat: makeEl('div'),
    StatLabel: makeEl('span'),
    StatNumber: makeEl('span'),
    StatHelpText: makeEl('span'),
    StatArrow: () => null,
    AlertDialog: ({ isOpen, children }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children }: any) => React.createElement('div', { role: 'alertdialog' }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('h2', null, children),
    AlertDialogBody: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [open, setOpen] = React.useState(false);
      return { isOpen: open, onOpen: () => setOpen(true), onClose: () => setOpen(false), onToggle: () => setOpen((v: boolean) => !v) };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? Object.values(vals)[0];
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
      if (typeof prop === 'string') {
        if (prop.startsWith('use')) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl('div');
      }
      return Reflect.get(target, prop);
    },
  });
});

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));
jest.mock('@/theme/palette', () => ({
  PAPER: '#ffffff',
  PENCIL: { 300: '#aaaaaa', 500: '#555555' },
}));

jest.mock('@/contexts/AuthContext', () => ({
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

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));
jest.mock('@/components/SEO', () => ({ SEO: () => null, __esModule: true, default: () => null }));
jest.mock('@/components/Footer', () => ({ Footer: () => null, __esModule: true, default: () => null }));

jest.mock('@/lib/apiClient', () => ({
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

jest.mock('react-icons/fi', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/bs', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/si', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/md', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/ai', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/io', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/io5', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/hi', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/ri', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/tb', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/lu', () => new Proxy({}, { get: () => nullIcon }));

// Module-level fetch mock. jest.spyOn(global, 'fetch') throws "Property `fetch`
// does not exist" in this jsdom version because fetch is not pre-defined on global.
// Setting it directly as a jest.fn() is the pattern used in other tests (see kda-d line 175).
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
) as any;

// ─── Imports (after all jest.mock calls) ──────────────────────────────────────

// eslint-disable-next-line import/first
import Home from '@/pages/index';

// ─── JSON-LD helper ───────────────────────────────────────────────────────────

function getJsonLd(container: HTMLElement): { ldScript: Element | null; parsed: any } {
  const ldScript = container.querySelector('script[type="application/ld+json"]');
  if (!ldScript) return { ldScript: null, parsed: null };
  try {
    return { ldScript, parsed: JSON.parse(ldScript.innerHTML) };
  } catch {
    return { ldScript, parsed: null };
  }
}

// ─── Spec 1: lang="en-US" in every built HTML page ────────────────────────────
//
// ANTI-PATTERN AVOIDED: the existing no-google-fonts.test.ts skips when the
// build output is absent (~lines 99-107). This test THROWS instead — the spec
// explicitly requires a failing (not skipping) test when build output is missing.

describe('Spec 1 — lang="en-US" in every built HTML page', () => {
  it('throws (not skips) if .next/server/pages is missing', () => {
    if (!fs.existsSync(SERVER_PAGES)) {
      throw new Error(
        'BUILD OUTPUT MISSING: .next/server/pages does not exist. ' +
        'Run "npm run build" before "npm test". ' +
        'This test MUST NOT skip-pass when the build is absent.'
      );
    }
    const htmlFiles = findHtmlFiles(SERVER_PAGES);
    if (htmlFiles.length === 0) {
      throw new Error(
        'BUILD OUTPUT EMPTY: no *.html files in .next/server/pages. ' +
        'Run "npm run build" before "npm test". ' +
        'This test MUST NOT skip-pass when the build is absent.'
      );
    }
    // At least one HTML file must exist (not just an empty dir).
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  it('every emitted HTML page has lang="en-US" on the html element', () => {
    if (!fs.existsSync(SERVER_PAGES)) {
      throw new Error('BUILD OUTPUT MISSING — run "npm run build" before "npm test".');
    }
    const htmlFiles = findHtmlFiles(SERVER_PAGES);
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files found in .next/server/pages — run "npm run build".');
    }
    const missing: string[] = [];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('lang="en-US"')) {
        missing.push(path.relative(NEXT_ROOT, file));
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `SPEC 1 FAILURE — lang="en-US" missing from these built HTML pages:\n` +
        missing.map(f => `  ${f}`).join('\n')
      );
    }
    expect(missing).toHaveLength(0);
  });
});

// ─── Specs 2, 3, 4: Homepage render tests ─────────────────────────────────────
//
// RTL registers a global afterEach(cleanup) that unmounts every rendered component
// after each test. Using a file-level beforeAll means the render is destroyed after
// the first test that runs — subsequent tests see an empty container. Using beforeEach
// inside a shared describe ensures a fresh render for each test.

describe('Homepage render tests — Specs 2, 3, 4', () => {
  let homeContainer: HTMLElement;

  beforeEach(() => {
    // Clear fetch calls from any previous test's render before re-rendering.
    (global.fetch as jest.Mock).mockClear();
    const { container } = render(<Home />);
    homeContainer = container;
  });

  // ─── Spec 2: Homepage has exactly one H1 with correct text; no H2 before it ─

  describe('Spec 2 — Homepage H1 outline', () => {
    it('has EXACTLY ONE <h1> element', () => {
      const h1s = homeContainer.querySelectorAll('h1');
      // Exactly one — not zero (missing), not two (duplicated)
      expect(h1s).toHaveLength(1);
    });

    it('the h1 text matches /Stop applying everywhere\\.\\s*Start applying smarter\\./', () => {
      const h1 = homeContainer.querySelector('h1');
      expect(h1).not.toBeNull();
      const text = h1!.textContent ?? '';
      expect(text).toMatch(/Stop applying everywhere\.\s*Start applying smarter\./);
    });

    it('no <h2> appears BEFORE the <h1> in DOM order (nav wordmark must not be a heading)', () => {
      const h1 = homeContainer.querySelector('h1');
      expect(h1).not.toBeNull();
      const h2s = Array.from(homeContainer.querySelectorAll('h2'));

      const h2sBefore = h2s.filter(h2 => {
        // compareDocumentPosition: if h1 has DOCUMENT_POSITION_FOLLOWING set when
        // compared against h2, then h2 comes before h1 in the tree.
        const pos = h2.compareDocumentPosition(h1!);
        return !!(pos & Node.DOCUMENT_POSITION_FOLLOWING);
      });

      if (h2sBefore.length > 0) {
        const texts = h2sBefore.map(el => `"${el.textContent?.trim()}"`).join(', ');
        throw new Error(
          `SPEC 2 FAILURE — ${h2sBefore.length} <h2> element(s) appear BEFORE the <h1>: ${texts}. ` +
          'The nav wordmark must not be rendered as a heading.'
        );
      }
      expect(h2sBefore).toHaveLength(0);
    });
  });

  // ─── Spec 3: Organization + WebSite JSON-LD on homepage ─────────────────────
  //
  // Each test calls getJsonLd(homeContainer) inline — no nested beforeAll/beforeEach
  // because RTL cleanup would destroy homeContainer between beforeAll and the test.

  describe('Spec 3 — JSON-LD structured data', () => {
    it('a <script type="application/ld+json"> exists in the rendered homepage', () => {
      const { ldScript } = getJsonLd(homeContainer);
      expect(ldScript).not.toBeNull();
    });

    it('JSON-LD parses without throwing', () => {
      const { parsed } = getJsonLd(homeContainer);
      expect(parsed).not.toBeNull();
    });

    it('@context is "https://schema.org"', () => {
      const { parsed } = getJsonLd(homeContainer);
      expect(parsed?.['@context']).toBe('https://schema.org');
    });

    it('@graph is an array', () => {
      const { parsed } = getJsonLd(homeContainer);
      expect(Array.isArray(parsed?.['@graph'])).toBe(true);
    });

    describe('Organization node', () => {
      it('exists in the graph', () => {
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org).toBeDefined();
      });

      it('@id is "https://onlyjobs.app/#organization"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org?.['@id']).toBe('https://onlyjobs.app/#organization');
      });

      it('name is "OnlyJobs"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org?.name).toBe('OnlyJobs');
      });

      it('url is exactly "https://onlyjobs.app/" WITH trailing slash', () => {
        // Adversarial: "https://onlyjobs.app" (no trailing slash) must fail
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org?.url).toBe('https://onlyjobs.app/');
      });

      it('parentOrganization is an OBJECT, not a string', () => {
        // Adversarial: if impl used "parentOrganization": "Aurora Designs LLP" (a string), this fails
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(typeof org?.parentOrganization).toBe('object');
        expect(org?.parentOrganization).not.toBeNull();
      });

      it('parentOrganization["@type"] is "Organization"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org?.parentOrganization?.['@type']).toBe('Organization');
      });

      it('parentOrganization.name is "Aurora Designs LLP"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const org = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'Organization');
        expect(org?.parentOrganization?.name).toBe('Aurora Designs LLP');
      });
    });

    describe('WebSite node', () => {
      it('exists in the graph', () => {
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site).toBeDefined();
      });

      it('@id is "https://onlyjobs.app/#website"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site?.['@id']).toBe('https://onlyjobs.app/#website');
      });

      it('name is "OnlyJobs"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site?.name).toBe('OnlyJobs');
      });

      it('url is exactly "https://onlyjobs.app/" WITH trailing slash', () => {
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site?.url).toBe('https://onlyjobs.app/');
      });

      it('inLanguage is "en-US"', () => {
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site?.inLanguage).toBe('en-US');
      });

      it('publisher references the Organization @id (not a string or different @id)', () => {
        // Adversarial: publisher must be { "@id": "https://onlyjobs.app/#organization" }
        const { parsed } = getJsonLd(homeContainer);
        const site = (parsed?.['@graph'] ?? []).find((n: any) => n['@type'] === 'WebSite');
        expect(site?.publisher?.['@id']).toBe('https://onlyjobs.app/#organization');
      });
    });

    it('graph contains NO node with @type "SoftwareApplication"', () => {
      const { parsed } = getJsonLd(homeContainer);
      const graph = parsed?.['@graph'] ?? [];
      const softwareApp = graph.find((n: any) => n['@type'] === 'SoftwareApplication');
      if (softwareApp) {
        throw new Error(
          'SPEC 3 FAILURE — found unexpected SoftwareApplication node in @graph: ' +
          JSON.stringify(softwareApp)
        );
      }
      expect(softwareApp).toBeUndefined();
    });

    it('raw innerHTML of ld+json script contains no unescaped "<" (guards </script> injection)', () => {
      // The JSON serializer must escape "<" as <.
      // If a raw "<" followed by a tag character appears, a browser could interpret
      // it as an HTML tag, allowing </script> injection to break the page.
      const { ldScript } = getJsonLd(homeContainer);
      const raw = ldScript?.innerHTML ?? '';
      expect(raw).not.toMatch(/<[a-zA-Z/]/);
    });
  });

  // ─── Spec 4: Curation strip — static copy, no live counts, no /jobs/stats fetch

  describe('Spec 4 — Curation strip (static, no live counts)', () => {
    // All assertions use synchronous queries — no waitFor, no async.
    // If any text is absent on first render, it means the impl gates it on data loading:
    // that is a FINDING, because the spec says it must be synchronous.

    describe('new static copy is present on first render (synchronous)', () => {
      it('renders "Curated, not crawled"', () => {
        expect(homeContainer.textContent).toContain('Curated, not crawled');
      });

      it('renders the curated copy body text', () => {
        expect(homeContainer.textContent).toContain(
          'A hand-picked set of quality remote job boards, checked daily. Vague and shady listings filtered out.'
        );
      });

      it('renders "Every match explained"', () => {
        expect(homeContainer.textContent).toContain('Every match explained');
      });

      it('renders the match-explained body text', () => {
        expect(homeContainer.textContent).toContain(
          'See why each job fits you, and what you might not like about it. Not just a keyword hit.'
        );
      });

      it('renders "Pay only on match days"', () => {
        expect(homeContainer.textContent).toContain('Pay only on match days');
      });

      it('renders the pricing body text', () => {
        expect(homeContainer.textContent).toContain(
          'No subscription. $2 free to start, then $0.30 only on days we find you a match.'
        );
      });
    });

    describe('old live-count copy is GONE', () => {
      it('does NOT contain "live jobs in database"', () => {
        // Case-insensitive: the old counter widget used this phrase
        expect(homeContainer.textContent?.toLowerCase()).not.toContain('live jobs in database');
      });

      it('does NOT contain "job seekers using OnlyJobs"', () => {
        expect(homeContainer.textContent?.toLowerCase()).not.toContain('job seekers using onlyjobs');
      });
    });

    it('does NOT call fetch with a URL containing "jobs/stats"', () => {
      // The old curation strip fetched /jobs/stats to show live counts.
      // The new static version must NOT make this call.
      // global.fetch was cleared in beforeEach before the render, so mock.calls
      // captures only calls made during this render.
      const mockCalls = (global.fetch as jest.Mock).mock.calls;
      const statsCallMade = mockCalls.some(([url]: [any]) => {
        const urlStr = typeof url === 'string' ? url : String(url);
        return urlStr.includes('jobs/stats');
      });
      if (statsCallMade) {
        const calls = mockCalls
          .map(([u]: [any]) => typeof u === 'string' ? u : String(u))
          .filter((u: string) => u.includes('jobs/stats'));
        throw new Error(
          'SPEC 4 FAILURE — fetch was called with /jobs/stats URLs:\n' +
          calls.map((u: string) => `  ${u}`).join('\n') +
          '\nThe curation strip must be static — remove the live-count fetch.'
        );
      }
      expect(statsCallMade).toBe(false);
    });

    describe('pricing numbers are preserved (non-count numerics are allowed)', () => {
      it('renders "$2" somewhere on the page', () => {
        // The spec explicitly says pricing numbers are allowed; only job/user COUNTS are banned.
        expect(homeContainer.textContent).toContain('$2');
      });

      it('renders "$0.30" somewhere on the page', () => {
        expect(homeContainer.textContent).toContain('$0.30');
      });
    });
  });
});

// ─── Spec 5: Sitemap has exactly 4 URLs with correct locs and lastmod ─────────

describe('Spec 5 — Sitemap', () => {
  let sitemapXml: string;

  beforeAll(() => {
    sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  });

  it('sitemap.xml exists at public/sitemap.xml', () => {
    expect(fs.existsSync(SITEMAP_PATH)).toBe(true);
  });

  it('has exactly 5 <url> entries', () => {
    const urlBlocks = sitemapXml.match(/<url>/g) ?? [];
    if (urlBlocks.length !== 5) {
      throw new Error(
        `SPEC 5 FAILURE — expected 5 <url> entries, found ${urlBlocks.length}. ` +
        'Check whether /how-it-works or /pricing were incorrectly added, or whether /sample-match-report is missing.'
      );
    }
    expect(urlBlocks).toHaveLength(5);
  });

  it('the five <loc> values are exactly the spec-defined URLs (no /how-it-works or /pricing)', () => {
    const locs = Array.from(sitemapXml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)).map(m => m[1].trim());
    const expected = [
      'https://onlyjobs.app/',
      'https://onlyjobs.app/privacy-policy',
      'https://onlyjobs.app/terms-conditions',
      'https://onlyjobs.app/refund-policy',
      'https://onlyjobs.app/sample-match-report',
    ];
    // Order matters: the spec lists these five in this sequence.
    expect(locs).toEqual(expected);

    // Explicit ban on routes the spec says must NOT appear:
    expect(locs.some(l => l.includes('/how-it-works'))).toBe(false);
    expect(locs.some(l => l.includes('/pricing'))).toBe(false);
  });

  it('every <url> has a <lastmod> matching the W3C date format YYYY-MM-DD', () => {
    const lastmods = Array.from(sitemapXml.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)).map(m => m[1].trim());
    // There must be one lastmod per url (5 total).
    expect(lastmods).toHaveLength(5);
    const invalid = lastmods.filter(d => !/^\d{4}-\d{2}-\d{2}$/.test(d));
    if (invalid.length > 0) {
      throw new Error(
        `SPEC 5 FAILURE — lastmod values not in YYYY-MM-DD format:\n` +
        invalid.map(d => `  "${d}"`).join('\n')
      );
    }
    for (const d of lastmods) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ─── Spec 6: Self-hosted font CSS not dropped by _document.tsx ────────────────

describe('Spec 6 — Font SSR not broken by _document.tsx', () => {
  it('throws (not skips) if .next/server/pages is missing (same guard as Spec 1)', () => {
    if (!fs.existsSync(SERVER_PAGES)) {
      throw new Error(
        'BUILD OUTPUT MISSING: .next/server/pages does not exist. ' +
        'Run "npm run build" before "npm test".'
      );
    }
    const htmlFiles = findHtmlFiles(SERVER_PAGES);
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files in .next/server/pages — run "npm run build".');
    }
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  it('every built HTML page references /_next/static/ (proves <Head> was not dropped)', () => {
    // If _document.tsx omits <Head>, Next.js does not inject the CSS <link> tags.
    // Without those links, no @fontsource CSS loads and the font fallbacks fire silently.
    // A page that dropped <Head> will have no /_next/static/ references.
    if (!fs.existsSync(SERVER_PAGES)) {
      throw new Error('BUILD OUTPUT MISSING — run "npm run build".');
    }
    const htmlFiles = findHtmlFiles(SERVER_PAGES);
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files found — run "npm run build".');
    }
    const missing: string[] = [];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Presence of /_next/static/css/ proves the stylesheet <link> is in the head.
      // Presence of /_next/static/media/ proves preload links for font files are present.
      const hasFontRef =
        content.includes('/_next/static/css/') ||
        content.includes('/_next/static/media/');
      if (!hasFontRef) {
        missing.push(path.relative(NEXT_ROOT, file));
      }
    }
    if (missing.length > 0) {
      throw new Error(
        'SPEC 6 FAILURE — these HTML pages have no /_next/static/css/ or /_next/static/media/ ' +
        'reference, indicating <Head> was dropped from _document.tsx:\n' +
        missing.map(f => `  ${f}`).join('\n')
      );
    }
    expect(missing).toHaveLength(0);
  });

  it('no built HTML page references fonts.googleapis.com or fonts.gstatic.com', () => {
    // Belt-and-suspenders guard complementing no-google-fonts.test.ts.
    if (!fs.existsSync(SERVER_PAGES)) {
      throw new Error('BUILD OUTPUT MISSING — run "npm run build".');
    }
    const htmlFiles = findHtmlFiles(SERVER_PAGES);
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files found — run "npm run build".');
    }
    const hits: { file: string; host: string }[] = [];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com']) {
        if (content.includes(host)) hits.push({ file: path.relative(NEXT_ROOT, file), host });
      }
    }
    if (hits.length > 0) {
      throw new Error(
        'SPEC 6 FAILURE — Google font CDN referenced in HTML:\n' +
        hits.map(h => `  ${h.file}: ${h.host}`).join('\n')
      );
    }
    expect(hits).toHaveLength(0);
  });
});

// ─── DISCLOSURE ───────────────────────────────────────────────────────────────
//
// Files read (allowed by the spec):
//   - jest.config.ts — to understand testEnvironment, moduleNameMapper, transforms
//   - jest.setup.ts — to see what is globally set up
//   - src/__tests__/no-google-fonts.test.ts — to understand the SKIP-PASS anti-pattern
//     to avoid, and the HTML file scanning pattern to reuse
//   - src/__tests__/24g.seo-foundation.smoke.test.tsx — to understand the mock
//     patterns for Chakra, next/document, JsonLd
//   - src/__tests__/kda-b.adversarial.test.tsx — to understand comprehensive Chakra
//     mock with Proxy for unknown exports; API mock structure
//   - src/__tests__/kda-d.adversarial.test.tsx — to understand @/lib/apiClient mock
//     pattern (`createApiClient`); react-icons Proxy mocking
//   - src/__tests__/app-renders.test.tsx — to see next/head passthrough pattern
//
// Incidental knowledge kept OUT of oracles:
//   - The smoke test (24g.seo-foundation.smoke.test.tsx) shows the Chakra Heading
//     mock forwarding `as`. I did NOT read the implementation to derive this — I
//     used the mock pattern as infrastructure, not as an oracle for assertion values.
//   - The smoke test shows _document.tsx uses `lang="en-US"`. I treated this only as
//     a confirmation that the spec is testable, not as the source of the expected value
//     (the spec itself dictates lang="en-US").
//   - kda-d mocks `@/lib/apiClient` with `createApiClient`. I used this as a mock
//     pattern without reading index.tsx to know which API methods the homepage calls.
//
// Untestable items (FINDINGS):
//   - Specs 1 and 6 require a built Next.js artifact (.next/server/pages). If the
//     test runner has not run `npm run build` first, these tests THROW rather than
//     skip-pass. The spec acknowledges this: "Assume the runner does `npm run build`
//     before `npm test`."
//   - Spec 3 (ld+json innerHTML escaping) is testable only if next/head is mocked as
//     passthrough AND the JsonLd component is not mocked to null. The tests enforce
//     both constraints.
//   - Spec 4 (synchronous curation strip) will fail as a render error — not a
//     missing-text assertion — if the homepage imports a module that is not mocked.
//     Any "Cannot read properties of undefined" error during render is a finding:
//     it means the mock coverage is incomplete and the test cannot verify the spec.
