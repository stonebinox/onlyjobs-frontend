/**
 * ADVERSARIAL TEST — kda-B
 * "flip post-login default to /today and retire /dashboard to a redirect adapter"
 *
 * Assume the implementation is subtly WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests.
 *
 * FORBIDDEN FILES (NOT opened):
 *   src/pages/index.tsx
 *   src/pages/dashboard/index.tsx
 *   src/__tests__/kda-b.dashboard-redirect.smoke.test.tsx
 *
 * CONTRACT = oracle. Every expected value traces to the kda-B spec,
 * never to "what the code currently outputs."
 *
 * DISCLOSURE: see bottom of file.
 */

// ─── Mock control variables (declared before jest.mock hoisting) ──────────────

let mockAuthState: {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  authenticate: jest.Mock;
  logout: jest.Mock;
};

let mockSearchParams: URLSearchParams;
let mockPathname: string;

const mockPush = jest.fn();
const mockReplace = jest.fn();

// Tracked API methods — Section C asserts none fire.
const mockApiMethods = {
  getMatches: jest.fn().mockResolvedValue([]),
  getUserProfile: jest.fn().mockResolvedValue(null),
  markMatchClick: jest.fn().mockResolvedValue({ success: true }),
  markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
  markMatchAsSkipped: jest.fn().mockResolvedValue({ success: true }),
  touchSession: jest.fn().mockResolvedValue(undefined),
  getMatchCount: jest.fn().mockResolvedValue(0),
  getWalletBalance: jest.fn().mockResolvedValue(1.0),
  checkWalletBalance: jest.fn().mockResolvedValue({ balance: 1.0, hasSufficientBalance: true }),
  getQuestion: jest.fn().mockResolvedValue(null),
  getAnsweredQuestions: jest.fn().mockResolvedValue([]),
  getOutOfCreditPreview: jest.fn().mockResolvedValue({
    shouldShow: false, reason: 'ok', walletBalance: 1, dailyMatchCost: 0.3,
    onDemandMatchCost: 0.05, count: 0, candidates: [],
  }),
  getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
  matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
  updateMinMatchScore: jest.fn().mockResolvedValue({}),
  triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
  getPublicStats: jest.fn().mockResolvedValue(null),
  getTracker: jest.fn().mockResolvedValue([]),
  recordApplicationOutcome: jest.fn().mockResolvedValue({}),
  authenticateUser: jest.fn().mockResolvedValue({}),
  requestPasswordReset: jest.fn().mockResolvedValue({}),
  resetPassword: jest.fn().mockResolvedValue({}),
  updatePreferences: jest.fn().mockResolvedValue({}),
  getGuideProgress: jest.fn().mockResolvedValue({}),
  updateGuideProgress: jest.fn().mockResolvedValue({}),
  sendChatMessage: jest.fn().mockResolvedValue({}),
  getChatConversations: jest.fn().mockResolvedValue([]),
  getAvailableJobsCount: jest.fn().mockResolvedValue(0),
  getActiveUserCount: jest.fn().mockResolvedValue(0),
  uploadCV: jest.fn().mockResolvedValue({}),
  updateUserProfile: jest.fn().mockResolvedValue({}),
  updatePassword: jest.fn().mockResolvedValue({}),
  createPaymentOrder: jest.fn().mockResolvedValue({}),
  verifyPayment: jest.fn().mockResolvedValue({}),
  getTransactions: jest.fn().mockResolvedValue({}),
  resendVerificationEmail: jest.fn().mockResolvedValue({}),
  verifyInitialEmail: jest.fn().mockResolvedValue({}),
  deleteUserAccount: jest.fn().mockResolvedValue({}),
  factoryResetUserAccount: jest.fn().mockResolvedValue({}),
  searchSkills: jest.fn().mockResolvedValue([]),
};

// ─── Mocks (hoisted by ts-jest before any import) ─────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    pathname: mockPathname ?? '/',
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

// Chakra UI — comprehensive mock (same pattern as today.component.test.tsx).
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, isDisabled, 'aria-label': al, href, role, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled: disabled || isDisabled || undefined, 'aria-label': al, href, role }, children)
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
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: makeEl('button'),
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
    Link: ({ children, href, onClick, ...p }: any) =>
      React.createElement('a', { href, onClick }, children),
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
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
    Collapse: ({ in: isIn, children }: any) => isIn ? React.createElement('div', null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Input: makeEl('input'),
    Select: makeEl('select'),
    Textarea: makeEl('textarea'),
    Tabs: ({ children }: any) => React.createElement(React.Fragment, null, children),
    TabList: ({ children }: any) => React.createElement('div', { role: 'tablist' }, children),
    Tab: ({ children, onClick }: any) => React.createElement('button', { role: 'tab', onClick }, children),
    TabPanels: ({ children }: any) => React.createElement(React.Fragment, null, children),
    TabPanel: ({ children }: any) => React.createElement('div', { role: 'tabpanel' }, children),
    Drawer: ({ isOpen, children }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return { isOpen, onOpen: () => setIsOpen(true), onClose: () => setIsOpen(false), onToggle: () => setIsOpen((v: boolean) => !v) };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) => React.createElement('li', { role: 'menuitem', onClick }, children),
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    Radio: ({ children, value, onChange, checked, ...p }: any) =>
      React.createElement('input', { type: 'radio', value, onChange, checked }),
    RadioGroup: ({ children, onChange }: any) => React.createElement('div', { onChange }, children),
    Progress: makeEl('div'),
    Switch: makeEl('input'),
    Popover: ({ children }: any) => React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) => React.createElement('div', null, children),
    PopoverBody: ({ children }: any) => React.createElement('div', null, children),
    Image: makeEl('img'),
    Avatar: makeEl('div'),
    AvatarBadge: makeEl('span'),
    AlertDialog: ({ isOpen, children }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children }: any) => React.createElement('div', { role: 'alertdialog' }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('h2', null, children),
    AlertDialogBody: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    Accordion: ({ children }: any) => React.createElement('div', null, children),
    AccordionItem: ({ children }: any) => React.createElement('div', null, children),
    AccordionButton: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
    AccordionPanel: ({ children }: any) => React.createElement('div', null, children),
    AccordionIcon: () => null,
    Checkbox: ({ children, onChange, isChecked, ...p }: any) =>
      React.createElement('input', { type: 'checkbox', onChange, checked: isChecked }),
    CheckboxGroup: ({ children }: any) => React.createElement('div', null, children),
    InputGroup: makeEl('div'),
    InputLeftElement: makeEl('span'),
    InputRightElement: makeEl('span'),
    InputLeftAddon: makeEl('span'),
    InputRightAddon: makeEl('span'),
    FormErrorMessage: makeEl('span'),
    FormHelperText: makeEl('span'),
    Stat: makeEl('div'),
    StatLabel: makeEl('span'),
    StatNumber: makeEl('span'),
    StatHelpText: makeEl('span'),
    StatArrow: () => null,
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
  useAuth: () => mockAuthState,
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

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null,
  Footer: () => null,
}));


jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => mockApiMethods,
}));

// Proxy-based icon mocks: any named export from react-icons returns a null-rendering component.
// This avoids maintaining an explicit list of every icon used in the pages under test.
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

// ─── Imports (after all jest.mock() calls) ────────────────────────────────────

import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Named export (Section A)
import { resolveDashboardRedirect } from '@/pages/dashboard';
// Default export adapter (Section C)
import DashboardPage from '@/pages/dashboard';
// Login / landing page (Section B)
import IndexPage from '@/pages/index';

// ─── Global setup ────────────────────────────────────────────────────────────

let origLocation: Location;

beforeAll(() => {
  origLocation = window.location;
});

/** Set window.location.search AND mockSearchParams consistently per-test. */
const setSearch = (rawSearch: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...origLocation,
      pathname: '/',
      href: `http://localhost/${rawSearch}`,
      search: rawSearch,
      hash: '',
      origin: 'http://localhost',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
  });
  // URLSearchParams strips the leading '?'
  mockSearchParams = new URLSearchParams(rawSearch.replace(/^\?/, ''));
};

beforeEach(() => {
  mockPush.mockReset();
  mockReplace.mockReset();
  sessionStorage.clear();
  mockPathname = '/';
  mockAuthState = {
    isReady: true,
    isLoggedIn: true,
    userId: 'user123',
    token: 'tok-abc',
    authenticate: jest.fn(),
    logout: jest.fn(),
  };
  setSearch('');
  Object.values(mockApiMethods).forEach((fn) => {
    if (jest.isMockFunction(fn)) fn.mockClear();
  });
  // index.tsx calls fetch directly (e.g. public stats) and also getPublicStats via apiClient.
  // We make both return a pending promise (never resolve) so the component never re-renders
  // with API data — that keeps state in the initial loading state and avoids render crashes
  // from unexpected response shapes. The redirect effect watches auth state only and fires
  // before any API data arrives, so router.push still fires as expected.
  (global as any).fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
  mockApiMethods.getPublicStats = jest.fn().mockImplementation(() => new Promise(() => {}));
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: origLocation,
  });
  delete (global as any).fetch;
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — resolveDashboardRedirect: pure function contract
//
// Oracle: the mapping specified in the kda-B contract.
// No rendering, no mocks needed — just import and call.
// Any deviation is a FINDING.
// ══════════════════════════════════════════════════════════════════════════════

describe('A — resolveDashboardRedirect: maps URL search string to redirect target', () => {

  // ── A-0: function exists and is exported ──────────────────────────────────
  it('A-0: resolveDashboardRedirect is exported from @/pages/dashboard', () => {
    // FINDING if undefined: the named export is missing — Section C would also break.
    expect(typeof resolveDashboardRedirect).toBe('function');
  });

  // ── A-1: empty and near-empty inputs → /today ─────────────────────────────
  it('A-1a: empty string "" → /today', () => {
    // FINDING: returns /dashboard or anything other than /today
    expect(resolveDashboardRedirect('')).toBe('/today');
  });

  it('A-1b: bare "?" → /today', () => {
    // A lone "?" with no params must NOT accidentally match anything
    expect(resolveDashboardRedirect('?')).toBe('/today');
  });

  // ── A-2: tab=applied → /tracker (no followup) ────────────────────────────
  it('A-2: "?tab=applied" → /tracker', () => {
    // FINDING: returns /tracker?followup=... or /today
    expect(resolveDashboardRedirect('?tab=applied')).toBe('/tracker');
  });

  // ── A-3: tab=applied + followup=true → /tracker?followup=true ─────────────
  it('A-3: "?tab=applied&followup=true" → /tracker?followup=true', () => {
    // FINDING: strips followup (returns /tracker) or returns /today
    expect(resolveDashboardRedirect('?tab=applied&followup=true')).toBe('/tracker?followup=true');
  });

  // ── A-4: followup alone WITHOUT tab=applied → /today ─────────────────────
  it('A-4: "?followup=true" without tab=applied → /today', () => {
    // CRITICAL: followup alone must NOT route to /tracker.
    // FINDING: returns /tracker?followup=true (followup treated as sufficient condition)
    expect(resolveDashboardRedirect('?followup=true')).toBe('/today');
  });

  // ── A-5: tab=applied + followup NOT "true" → /tracker (no followup param) ─
  it('A-5a: "?tab=applied&followup=false" → /tracker (followup param absent)', () => {
    // followup must be exactly "true" to append ?followup=true to the target.
    // FINDING: returns /tracker?followup=false (passes non-"true" followup through)
    expect(resolveDashboardRedirect('?tab=applied&followup=false')).toBe('/tracker');
  });

  it('A-5b: "?tab=applied&followup=0" → /tracker (no followup param)', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=0')).toBe('/tracker');
  });

  it('A-5c: "?tab=applied&followup=" (empty value) → /tracker (no followup param)', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=')).toBe('/tracker');
  });

  // ── A-6: other tab values → /today ────────────────────────────────────────
  it('A-6a: "?tab=matches" → /today', () => {
    // FINDING: anything other than /today
    expect(resolveDashboardRedirect('?tab=matches')).toBe('/today');
  });

  it('A-6b: "?tab=viewed" → /today', () => {
    expect(resolveDashboardRedirect('?tab=viewed')).toBe('/today');
  });

  it('A-6c: "?tab=skipped" → /today?view=skipped', () => {
    expect(resolveDashboardRedirect('?tab=skipped')).toBe('/today?view=skipped');
  });

  it('A-6d: "?tab=alljobs" → /browse', () => {
    expect(resolveDashboardRedirect('?tab=alljobs')).toBe('/browse');
  });

  it('A-6e: "?tab=anything" → /today (unknown tab values default to /today)', () => {
    expect(resolveDashboardRedirect('?tab=anything')).toBe('/today');
  });

  it('A-6f: "?tab=" (empty tab value) → /today', () => {
    expect(resolveDashboardRedirect('?tab=')).toBe('/today');
  });

  // ── A-7: case sensitivity ─────────────────────────────────────────────────
  it('A-7a: "?tab=Applied" (capital A) → /today (tab value is case-sensitive)', () => {
    // FINDING: returns /tracker (ignores case — "applied" === "Applied")
    expect(resolveDashboardRedirect('?tab=Applied')).toBe('/today');
  });

  it('A-7b: "?tab=APPLIED" → /today (tab value must be lowercase "applied")', () => {
    expect(resolveDashboardRedirect('?tab=APPLIED')).toBe('/today');
  });

  it('A-7c: "?tab=applied&followup=TRUE" → /tracker without followup param (followup must be lowercase "true")', () => {
    // FINDING if /tracker?followup=TRUE or /tracker?followup=true (case-insensitive match)
    expect(resolveDashboardRedirect('?tab=applied&followup=TRUE')).toBe('/tracker');
  });

  it('A-7d: "?tab=applied&followup=True" → /tracker without followup param', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=True')).toBe('/tracker');
  });

  // ── A-8: parameter order independence ────────────────────────────────────
  it('A-8: "?followup=true&tab=applied" (reversed order) → /tracker?followup=true', () => {
    // FINDING if /tracker (followup stripped because it appeared before tab was seen)
    // or /today (both params required but parser is order-dependent)
    expect(resolveDashboardRedirect('?followup=true&tab=applied')).toBe('/tracker?followup=true');
  });

  // ── A-9: extra params are stripped from the output ───────────────────────
  it('A-9: "?tab=applied&foo=bar&followup=true" → /tracker?followup=true (foo=bar stripped)', () => {
    // FINDING if /tracker?followup=true&foo=bar (extra params leak into target)
    // or /today (fails to recognise tab=applied among extra params)
    expect(resolveDashboardRedirect('?tab=applied&foo=bar&followup=true')).toBe('/tracker?followup=true');
  });

  it('A-9b: "?tab=applied&baz=qux" → /tracker (extra param stripped, no followup)', () => {
    expect(resolveDashboardRedirect('?tab=applied&baz=qux')).toBe('/tracker');
  });

  // ── A-10: no false positive on substring matches ──────────────────────────
  it('A-10a: "?tab=applied_extra" → /today (partial match must not trigger)', () => {
    // If the impl uses includes() or startsWith() instead of exact match,
    // "applied_extra" would incorrectly match "applied".
    // FINDING if returns /tracker
    expect(resolveDashboardRedirect('?tab=applied_extra')).toBe('/today');
  });

  it('A-10b: "?tab=unapplied" → /today (substring "applied" in "unapplied" must not match)', () => {
    // FINDING if returns /tracker (naive includes("applied") bug)
    expect(resolveDashboardRedirect('?tab=unapplied')).toBe('/today');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — index.tsx: post-login redirect
//
// Render the default export of src/pages/index.tsx with a LOGGED-IN auth state.
// Assert what router.push is called with for each returnTo scenario.
// ══════════════════════════════════════════════════════════════════════════════

describe('B — index.tsx: logged-in user is redirected to the correct destination', () => {

  // Helper: render and wait for router.push to fire (or timeout)
  const renderAndWaitForPush = async () => {
    render(<IndexPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  };

  // ── B-1: THE PRIMARY REGRESSION TEST — no returnTo → /today ─────────────
  it('B-1: no returnTo anywhere → router.push("/today") [PRIMARY BUG: regression to /dashboard]', async () => {
    // No URL param, no sessionStorage.
    // FINDING if called with "/dashboard" — the old default that this task retires.
    // FINDING if called with "/" or "" — undefined behavior.
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    // Explicit regression guard against the old default
    expect(dest).not.toBe('/dashboard');
    // Contract: default is /today
    expect(dest).toBe('/today');
  });

  // ── B-2: valid returnTo from URL param ───────────────────────────────────
  it('B-2a: ?returnTo=/tracker → router.push("/tracker")', async () => {
    setSearch('?returnTo=%2Ftracker');
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/tracker');
  });

  it('B-2b: ?returnTo=/browse → router.push("/browse")', async () => {
    setSearch('?returnTo=%2Fbrowse');
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/browse');
  });

  it('B-2c: ?returnTo=/today → router.push("/today") (cycle is safe)', async () => {
    setSearch('?returnTo=%2Ftoday');
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/today');
  });

  // ── B-3: legacy email-link URL must survive ───────────────────────────────
  it('B-3: ?returnTo=%2Fdashboard%3Ftab%3Dapplied%26followup%3Dtrue → honored as-is', async () => {
    // Contract: a legacy email link pointing to /dashboard?tab=applied&followup=true
    // must be honored so old emails still work. The page should navigate to the
    // decoded path, not intercept/rewrite it.
    setSearch('?returnTo=%2Fdashboard%3Ftab%3Dapplied%26followup%3Dtrue');
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/dashboard?tab=applied&followup=true');
  });

  // ── B-4: sessionStorage returnTo ─────────────────────────────────────────
  it('B-4a: returnTo in sessionStorage → router.push(stored value)', async () => {
    sessionStorage.setItem('onlyjobs_returnTo', '/tracker');
    // No URL param — sessionStorage should be used
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/tracker');
  });

  it('B-4b: sessionStorage with returnTo=/browse → router.push("/browse")', async () => {
    sessionStorage.setItem('onlyjobs_returnTo', '/browse');
    await renderAndWaitForPush();
    expect(mockPush.mock.calls[0][0]).toBe('/browse');
  });

  // ── B-5: URL param WINS over sessionStorage ───────────────────────────────
  it('B-5: URL ?returnTo wins over sessionStorage when both present', async () => {
    sessionStorage.setItem('onlyjobs_returnTo', '/browse');
    setSearch('?returnTo=%2Ftracker');
    await renderAndWaitForPush();
    // FINDING if called with "/browse" (sessionStorage took precedence over URL)
    expect(mockPush.mock.calls[0][0]).toBe('/tracker');
    expect(mockPush.mock.calls[0][0]).not.toBe('/browse');
  });

  // ── B-6: sessionStorage is cleared after use ─────────────────────────────
  it('B-6: sessionStorage["onlyjobs_returnTo"] is cleared after the redirect', async () => {
    sessionStorage.setItem('onlyjobs_returnTo', '/tracker');
    await renderAndWaitForPush();
    // FINDING if still set: the page reuses the same returnTo on next visit
    expect(sessionStorage.getItem('onlyjobs_returnTo')).toBeNull();
  });

  // ── B-7: no redirect when not yet ready ──────────────────────────────────
  it('B-7: isReady=false → router.push NOT called (guard races out)', async () => {
    mockAuthState = {
      isReady: false,
      isLoggedIn: true,
      userId: 'user123',
      token: 'tok',
      authenticate: jest.fn(),
      logout: jest.fn(),
    };
    render(<IndexPage />);
    await new Promise((r) => setTimeout(r, 300));
    // FINDING if called — redirect triggered before auth state is stable
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── B-8: no redirect when logged out ─────────────────────────────────────
  it('B-8: isLoggedIn=false, isReady=true → router.push NOT called', async () => {
    mockAuthState = {
      isReady: true,
      isLoggedIn: false,
      userId: null,
      token: null,
      authenticate: jest.fn(),
      logout: jest.fn(),
    };
    render(<IndexPage />);
    await new Promise((r) => setTimeout(r, 300));
    // FINDING if called — logged-out user is redirected away from the login page
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // OPEN-REDIRECT PROBES (security)
  //
  // Contract: returnTo honored ONLY if startsWith("/") AND NOT startsWith("//").
  // These must all fall back to /today.
  // Any call to router.push with an off-site or protocol-relative URL is a
  // SECURITY FINDING — open-redirect bypass on the login path.
  // ════════════════════════════════════════════════════════════════════════════

  it('B-9: returnTo=//evil.com (protocol-relative) → /today [open-redirect guard]', async () => {
    setSearch('?returnTo=//evil.com');
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    // SECURITY FINDING if dest === "//evil.com" or contains "evil.com"
    expect(dest).toBe('/today');
    expect(dest).not.toMatch(/evil\.com/);
  });

  it('B-10: returnTo=https://evil.com (absolute URL) → /today [open-redirect guard]', async () => {
    setSearch('?returnTo=https%3A%2F%2Fevil.com');
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    // SECURITY FINDING if dest === "https://evil.com"
    expect(dest).toBe('/today');
    expect(dest).not.toMatch(/evil\.com/);
  });

  it('B-11: returnTo=http:/evil.com (single-slash http:) → /today [open-redirect guard]', async () => {
    setSearch('?returnTo=http%3A%2Fevil.com');
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    // SECURITY FINDING if dest === "http:/evil.com" (doesn't start with "/" but might still
    // be treated as relative by some Next.js router configs)
    expect(dest).toBe('/today');
    expect(dest).not.toMatch(/evil\.com/);
  });

  it('B-12: returnTo=/\\evil.com (backslash after slash) — browser-normalisation bypass probe', async () => {
    // In Chrome/Safari, /\evil.com normalises to //evil.com (protocol-relative).
    // If the guard only checks startsWith("//"), this BYPASSES it.
    // We assert what the page actually does; if it calls push("/\\evil.com"), that is a
    // SECURITY FINDING: browsers will navigate off-site despite the guard.
    setSearch('?returnTo=%2F%5Cevil.com');  // %2F = /, %5C = backslash
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    if (dest !== '/today') {
      // Report exact value so the reviewer can assess browser normalisation risk
      console.error(
        `[SECURITY FINDING] B-12: /\\evil.com bypassed open-redirect guard. ` +
        `router.push called with: ${JSON.stringify(dest)}. ` +
        `In Chrome/Safari /\\evil.com normalises to //evil.com (off-site navigation).`
      );
    }
    // Hard assertion — the correct behavior is to fall back to /today
    expect(dest).toBe('/today');
  });

  it('B-13: returnTo=/\\/evil.com → /today or report bypass', async () => {
    // /\/evil.com: starts with /, second char is backslash.
    // In some browser environments normalises to //evil.com.
    setSearch('?returnTo=%2F%5C%2Fevil.com');  // /, \, /, evil.com
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    if (dest !== '/today') {
      console.error(
        `[SECURITY FINDING] B-13: /\\/evil.com bypassed guard. ` +
        `router.push called with: ${JSON.stringify(dest)}.`
      );
    }
    expect(dest).toBe('/today');
  });

  it('B-14: returnTo=/%2Fevil.com (percent-encoded second slash) → /today [open-redirect guard]', async () => {
    // URLSearchParams.get() decodes %2F to /, giving //evil.com.
    // If the page reads the raw search string without decoding, %2F is NOT "/",
    // so it sees "/%2Fevil.com" which starts with "/" and not "//", and lets it through.
    // That would be a bypass.
    // Contract: the guard must handle this correctly.
    setSearch('?returnTo=%2F%2Fevil.com');  // double-percent-encoded: //evil.com
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    if (dest !== '/today') {
      console.error(
        `[SECURITY FINDING] B-14: /%2Fevil.com (double-slash with one encoded) bypassed guard. ` +
        `router.push called with: ${JSON.stringify(dest)}.`
      );
    }
    expect(dest).toBe('/today');
  });

  it('B-15: sessionStorage with off-site returnTo → /today [same guard applies to stored value]', async () => {
    // The open-redirect guard must apply to sessionStorage-sourced returnTo, not just URL params.
    sessionStorage.setItem('onlyjobs_returnTo', '//evil.com');
    await renderAndWaitForPush();
    const dest = mockPush.mock.calls[0][0];
    // SECURITY FINDING if called with "//evil.com"
    expect(dest).toBe('/today');
    expect(dest).not.toMatch(/evil\.com/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — /dashboard adapter component
//
// Render the default export of src/pages/dashboard/index.tsx.
// Assert router.replace() fires with the correct target.
// Assert no API/backend calls are made (pure redirect adapter).
// ══════════════════════════════════════════════════════════════════════════════

describe('C — /dashboard adapter: calls router.replace() with correct target', () => {

  beforeEach(() => {
    mockPathname = '/dashboard';
    // Auth: logged in (adapter should redirect regardless)
    mockAuthState = {
      isReady: true,
      isLoggedIn: true,
      userId: 'user123',
      token: 'tok',
      authenticate: jest.fn(),
      logout: jest.fn(),
    };
  });

  const renderAndWaitForReplace = async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  };

  // ── C-1: empty search → router.replace("/today") ─────────────────────────
  it('C-1: empty search → router.replace("/today")', async () => {
    setSearch('');
    await renderAndWaitForReplace();
    // FINDING if called with "/dashboard" (infinite loop) or "/today" via push not replace
    expect(mockReplace).toHaveBeenCalledWith('/today');
    // Must use replace(), not push() — history entry must not accumulate
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── C-2: tab=applied → router.replace("/tracker") ────────────────────────
  it('C-2: "?tab=applied" → router.replace("/tracker")', async () => {
    setSearch('?tab=applied');
    await renderAndWaitForReplace();
    expect(mockReplace).toHaveBeenCalledWith('/tracker');
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── C-3: tab=applied + followup=true → router.replace("/tracker?followup=true") ──
  it('C-3: "?tab=applied&followup=true" → router.replace("/tracker?followup=true")', async () => {
    setSearch('?tab=applied&followup=true');
    await renderAndWaitForReplace();
    // FINDING if router.replace is called with just "/tracker" (followup lost)
    // or "/tracker?followup=false" (wrong value)
    expect(mockReplace).toHaveBeenCalledWith('/tracker?followup=true');
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── C-4: non-applied tabs → router.replace("/today") ─────────────────────
  it('C-4a: "?tab=matches" → router.replace("/today")', async () => {
    setSearch('?tab=matches');
    await renderAndWaitForReplace();
    expect(mockReplace).toHaveBeenCalledWith('/today');
  });

  it('C-4b: "?tab=viewed" → router.replace("/today")', async () => {
    setSearch('?tab=viewed');
    await renderAndWaitForReplace();
    expect(mockReplace).toHaveBeenCalledWith('/today');
  });

  // ── C-5: order independence ───────────────────────────────────────────────
  it('C-5: "?followup=true&tab=applied" (reversed) → router.replace("/tracker?followup=true")', async () => {
    setSearch('?followup=true&tab=applied');
    await renderAndWaitForReplace();
    expect(mockReplace).toHaveBeenCalledWith('/tracker?followup=true');
  });

  // ── C-6: no API/backend calls — adapter must be a pure redirector ─────────
  it('C-6: adapter fires NO API calls (no backend fetch) — pure redirect only', async () => {
    // Spy on global fetch to catch any untracked HTTP calls.
    // Note: the beforeEach already set global.fetch = jest.fn() so we can spy on it.
    const fetchSpy = jest.spyOn(global as any, 'fetch').mockImplementation(
      () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    setSearch('');
    await renderAndWaitForReplace();

    // FINDING if ANY api method was called — the adapter has no business touching the backend.
    // An accidental import of createApiClient that fires a getMatches() call would be a regression.
    const calledMethods = Object.entries(mockApiMethods)
      .filter(([, fn]) => jest.isMockFunction(fn) && fn.mock.calls.length > 0)
      .map(([name]) => name);

    if (calledMethods.length > 0) {
      console.error(
        `[FINDING] C-6: dashboard adapter made API calls: ${calledMethods.join(', ')}. ` +
        `The adapter must be a pure redirect — no backend calls.`
      );
    }
    expect(calledMethods).toHaveLength(0);

    // Global fetch must also not have been called
    const fetchCalls = fetchSpy.mock.calls.length;
    if (fetchCalls > 0) {
      console.error(
        `[FINDING] C-6: dashboard adapter called global fetch ${fetchCalls} time(s). ` +
        `Pure redirect adapters must make no network requests.`
      );
    }
    expect(fetchCalls).toBe(0);
  });

  // ── C-7: replace fires even when user is not logged in ────────────────────
  it('C-7: unauthenticated visitor also gets replaced (not left on blank /dashboard)', async () => {
    mockAuthState = {
      isReady: true,
      isLoggedIn: false,
      userId: null,
      token: null,
      authenticate: jest.fn(),
      logout: jest.fn(),
    };
    setSearch('');
    // The adapter is just a redirect — it must redirect regardless of auth state.
    // An auth guard that blocks the redirect would leave users on a broken /dashboard.
    render(<DashboardPage />);
    await waitFor(() => {
      // Either replace or push fires (some adapters push for auth redirect, replace for the content redirect)
      expect(mockReplace.mock.calls.length + mockPush.mock.calls.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  // ── C-8: adapter does not render a visible loading spinner persistently ───
  it('C-8: DashboardPage renders and immediately triggers replace (no hanging spinner)', async () => {
    setSearch('?tab=applied&followup=true');
    // If replace fires, the component is working. We just assert timing is fast.
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 }); // 1s is generous for a pure redirect
    expect(mockReplace).toHaveBeenCalledWith('/tracker?followup=true');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCLOSURE
//
// Files read while writing this test:
//   src/__tests__/today.component.test.tsx     — Chakra mock pattern (copied verbatim)
//   src/__tests__/kda-a.allJobs.adversarial.test.tsx — Chakra mock security-button variant
//   src/__tests__/browse.page.test.tsx          — page-level mock structure
//   src/__tests__/tracker.test.tsx              — page-level mock structure (first 80 lines)
//   src/__tests__/app-renders.test.tsx          — minimal mock harness example
//   src/pages/dashboard/ (directory listing)    — confirmed index.tsx + other files exist
//   src/pages/ (directory listing)              — confirmed page files
//
// Files NOT opened (forbidden):
//   src/pages/index.tsx                         ✓ not opened
//   src/pages/dashboard/index.tsx               ✓ not opened
//   src/__tests__/kda-b.dashboard-redirect.smoke.test.tsx  ✓ not opened
//
// How disclosures affected assertions:
//   The Chakra mock pattern was copied from today.component.test.tsx — this influenced
//   the MOCK STRUCTURE only. No assertion derives from implementation internals.
//
//   All expected values come from the kda-B contract spec, not from running the code
//   and recording its output.
//
// Untestable-without-reading finding:
//   B-12/B-13 (backslash probes): The correct behavior depends on whether the implementation
//   normalizes the path before the guard check. Without reading the guard implementation,
//   we cannot know whether it uses raw string comparison or URL normalization. We assert the
//   SAFE outcome (/today) and log a SECURITY FINDING if the guard fails.
//
//   B-14 (/%2Fevil.com): Whether %2F in a URLSearchParams value is decoded before the guard
//   check depends on whether the implementation uses URLSearchParams.get() (which decodes)
//   or raw string parsing (which does not). We assert safe outcome (/today) and report bypass.
// ══════════════════════════════════════════════════════════════════════════════
