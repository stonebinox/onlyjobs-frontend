/**
 * ADVERSARIAL TEST — kda-D frontend: resolveDashboardRedirect skipped-tab mapping
 *
 * Assume the implementation is subtly WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests.
 *
 * FORBIDDEN FILES (NOT opened):
 *   frontend/src/pages/today.tsx
 *   frontend/src/pages/dashboard/index.tsx
 *   frontend/src/__tests__/kda-d.smoke.test.tsx
 *
 * CONTRACT = oracle:
 *   resolveDashboardRedirect("?tab=skipped") === "/today?view=skipped"
 *   Other branches must not have regressed.
 *
 * Harness pattern derived from kda-b.dashboard-redirect.smoke.test.tsx.
 * DISCLOSURE: see bottom of file.
 */

// ── Mocks (hoisted before any import) ────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

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

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, 'aria-label': al, href, role }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl('div'),
    Flex: makeEl('div'),
    Center: makeEl('div'),
    Container: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Stack: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h2'),
    Button: makeEl('button'),
    Input: makeEl('input'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Badge: makeEl('span'),
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Link: ({ children, href }: any) => React.createElement('a', { href }, children),
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) =>
      vals && typeof vals === 'object' ? vals.base ?? Object.values(vals)[0] : vals,
    useColorModeValue: (light: any) => light,
    extendTheme: (t: any) => t,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
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

jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: false }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));
jest.mock('@/components/SEO', () => ({ SEO: () => null }));
jest.mock('@/components/Footer', () => ({ Footer: () => null, __esModule: true, default: () => null }));
jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    getPublicStats: jest.fn().mockResolvedValue(null),
    authenticateUser: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

const nullIcon = () => null;
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

global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve(null) }) as any;

// ── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { resolveDashboardRedirect } from '@/pages/dashboard';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — kda-D core contract: tab=skipped → /today?view=skipped
//
// This is the new mapping added by kda-D. Probe it aggressively for:
//   - Wrong target path (e.g. /today instead of /today?view=skipped)
//   - Wrong view param value (e.g. ?view=Skipped or ?view=skip)
//   - Case-insensitive match (tab=Skipped incorrectly routing to /today?view=skipped)
//   - Substring collisions (tab=notskipped, tab=skippped)
//   - Param contamination (extra params leaking into the target)
// ══════════════════════════════════════════════════════════════════════════════

describe('A — resolveDashboardRedirect: tab=skipped → /today?view=skipped (kda-D core)', () => {

  it('A-1: "?tab=skipped" → exactly "/today?view=skipped" [PRIMARY contract assertion]', () => {
    const result = resolveDashboardRedirect('?tab=skipped');
    // FINDING if "/today": view param is missing — skipped tab routes same as default
    // FINDING if "/today?view=Skipped": wrong capitalisation of view value
    // FINDING if "/today?tab=skipped": tab leaked into target instead of view param
    // FINDING if "/dashboard?tab=skipped": not redirected at all
    expect(result).toBe('/today?view=skipped');
  });

  it('A-2: view param value must be exactly "skipped", not capitalised or abbreviated', () => {
    const result = resolveDashboardRedirect('?tab=skipped');
    // Confirm the view value itself
    expect(result).toBe('/today?view=skipped');
    // Explicit checks for wrong capitalisations that might pass a loose equality check:
    expect(result).not.toBe('/today?view=Skipped');
    expect(result).not.toBe('/today?view=SKIPPED');
    expect(result).not.toBe('/today?view=skip');
  });

  it('A-3: target path must be "/today", not "/" or "/dashboard" or "/browse"', () => {
    const result = resolveDashboardRedirect('?tab=skipped');
    expect(result.startsWith('/today')).toBe(true);
    expect(result).not.toMatch(/^\/dashboard/);
    expect(result).not.toMatch(/^\/browse/);
    expect(result).not.toBe('/today');  // must include the ?view=skipped
  });

  it('A-4: "?tab=Skipped" (capital S) → /today (case-sensitive tab match)', () => {
    // FINDING if "/today?view=skipped": implementation uses case-insensitive comparison
    expect(resolveDashboardRedirect('?tab=Skipped')).toBe('/today');
  });

  it('A-5: "?tab=SKIPPED" (all caps) → /today (case-sensitive tab match)', () => {
    expect(resolveDashboardRedirect('?tab=SKIPPED')).toBe('/today');
  });

  it('A-6: "?tab=notskipped" → /today (substring "skipped" must not match)', () => {
    // FINDING if "/today?view=skipped": impl uses includes("skipped") instead of exact match
    expect(resolveDashboardRedirect('?tab=notskipped')).toBe('/today');
  });

  it('A-7: "?tab=skippped" (triple p typo) → /today (exact match only)', () => {
    expect(resolveDashboardRedirect('?tab=skippped')).toBe('/today');
  });

  it('A-8: "?tab=skipped&followup=true" → /today?view=skipped (followup param stripped)', () => {
    // The skipped tab takes no followup modifier — the target must be clean.
    // FINDING if "/today?view=skipped&followup=true": followup leaked into the target
    const result = resolveDashboardRedirect('?tab=skipped&followup=true');
    expect(result).toBe('/today?view=skipped');
  });

  it('A-9: "?tab=skipped&foo=bar" → /today?view=skipped (extra params stripped)', () => {
    // FINDING if "/today?view=skipped&foo=bar": extra params contaminate the target
    expect(resolveDashboardRedirect('?tab=skipped&foo=bar')).toBe('/today?view=skipped');
  });

  it('A-10: "?followup=true&tab=skipped" (reversed param order) → /today?view=skipped', () => {
    // FINDING if "/today": order-dependent parser misses tab when it follows followup
    expect(resolveDashboardRedirect('?followup=true&tab=skipped')).toBe('/today?view=skipped');
  });

  it('A-11: tab=skipped maps to /today?view=skipped, NOT /skipped', () => {
    const result = resolveDashboardRedirect('?tab=skipped');
    // Paranoia check: ensure it's not routing to a top-level /skipped page
    expect(result).not.toBe('/skipped');
    expect(result).not.toMatch(/^\/skipped/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — regression: other branches must not have changed in kda-D
//
// Any diff to the function that added the skipped case could accidentally break
// another branch. These are targeted regression probes, not full coverage.
// ══════════════════════════════════════════════════════════════════════════════

describe('B — regression: other resolveDashboardRedirect branches unaffected by kda-D', () => {

  it('B-1: "" (empty) → /today [regression: default unchanged]', () => {
    // FINDING if "/today?view=skipped": empty string erroneously maps to skipped view
    expect(resolveDashboardRedirect('')).toBe('/today');
  });

  it('B-2: "?tab=applied" → /tracker [regression: applied tab unchanged]', () => {
    // FINDING if "/today?view=skipped": applied branch incorrectly now routes to skipped
    expect(resolveDashboardRedirect('?tab=applied')).toBe('/tracker');
  });

  it('B-3: "?tab=applied&followup=true" → /tracker?followup=true [regression: followup preserved]', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=true')).toBe('/tracker?followup=true');
  });

  it('B-4: "?tab=alljobs" → /browse [regression: alljobs tab unchanged]', () => {
    // FINDING if "/today": alljobs now routes to default instead of browse
    // FINDING if "/today?view=skipped": alljobs routes to skipped view
    expect(resolveDashboardRedirect('?tab=alljobs')).toBe('/browse');
  });

  it('B-5: "?tab=matches" → /today [regression: matches tab unchanged]', () => {
    expect(resolveDashboardRedirect('?tab=matches')).toBe('/today');
  });

  it('B-6: "?tab=viewed" → /today [regression: viewed tab unchanged]', () => {
    expect(resolveDashboardRedirect('?tab=viewed')).toBe('/today');
  });

  it('B-7: "?tab=unknown_xyz" → /today [regression: unknown tabs still default]', () => {
    expect(resolveDashboardRedirect('?tab=unknown_xyz')).toBe('/today');
  });

  it('B-8: "?" (bare question mark) → /today [regression: near-empty unchanged]', () => {
    expect(resolveDashboardRedirect('?')).toBe('/today');
  });

  it('B-9: "?tab=applied&followup=false" → /tracker (no followup param) [regression]', () => {
    // followup must be exactly "true" — not "false", not absent
    expect(resolveDashboardRedirect('?tab=applied&followup=false')).toBe('/tracker');
  });

  it('B-10: function is exported from @/pages/dashboard [contract: named export exists]', () => {
    // FINDING if undefined: the export was removed or renamed
    expect(typeof resolveDashboardRedirect).toBe('function');
  });
});

/*
 * ══════════════════════════════════════════════════════════════════════════════
 * DISCLOSURE
 *
 * Files opened while writing this test (from the allowed list):
 *   frontend/src/__tests__/kda-b.dashboard-redirect.smoke.test.tsx — mock pattern, import path
 *   frontend/src/__tests__/kda-b.adversarial.test.tsx              — extended mock set, test structure
 *
 * Files NOT opened (forbidden):
 *   frontend/src/pages/today.tsx                        ✓ not opened
 *   frontend/src/pages/dashboard/index.tsx              ✓ not opened
 *   frontend/src/__tests__/kda-d.smoke.test.tsx         ✓ not opened
 *   backend/src/controllers/matchController.ts          ✓ not opened
 *   backend/src/__tests__/unskip.test.ts                ✓ not opened
 *
 * Incidental disclosures:
 *   - kda-b.dashboard-redirect.smoke.test.tsx confirmed the import path:
 *     `import { resolveDashboardRedirect } from '@/pages/dashboard/index'`
 *     and the alias `@/pages/dashboard` (both resolve to the same module).
 *     The smoke test already had `tab=skipped → /today?view=skipped` in line 215 — this
 *     confirms the mapping was already registered in the function. Seeing that line did
 *     NOT influence the assertions; they derive from the kda-D contract spec alone.
 *   - kda-b.adversarial.test.tsx lines A-6c confirmed: "?tab=skipped" → "/today?view=skipped".
 *     This was incidental. All adversarial probes (A-2 through A-11) were derived from the
 *     spec contract, not from this confirmation.
 *
 * How disclosures affected assertions:
 *   - Mock structure was copied from kda-b.adversarial.test.tsx. No assertion encodes
 *     implementation internals.
 *   - All expected values (/today?view=skipped, /tracker, /browse, /today) come from the
 *     kda-D contract and the pre-existing kda-B contract spec, never from running the code.
 *
 * Untestable-without-reading findings:
 *   - The view param value "skipped" in the target URL: without opening the implementation,
 *     we cannot confirm whether the value is hardcoded or derived from the tab name. We
 *     assert it must be the literal string "skipped" (lowercase, exact). If the implementation
 *     derives it from the tab (e.g., `/today?view=${tab}`), that happens to produce the same
 *     result for lowercase "skipped" but would fail for any capitalisation variant — which
 *     tests A-4/A-5 already cover from the input direction.
 * ══════════════════════════════════════════════════════════════════════════════
 */
