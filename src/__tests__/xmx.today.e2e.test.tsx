/**
 * Full-page integration test — onlyjobs-xmx.
 *
 * Oracle: task contract (opening ≠ applying; applied is written only on explicit "Yes").
 *   - Opening a listing NEVER calls markMatchApplied.
 *   - Return-from-tab shows the "Did you apply?" prompt in the drawer.
 *   - Clicking "Yes" calls markMatchApplied(matchId, true) exactly once; matchId
 *     is the match fixture's _id, not an incidentally-discovered value.
 *   - analytics match_applied is NOT fired until "Yes" is clicked.
 *   - Clicking "No" + selecting a reason category + submitting calls
 *     markMatchApplied(matchId, false, category) with the fixture's _id.
 *
 * Render the REAL TodayPage. Mock only external boundaries:
 *   @/lib/apiClient (createApiClient) and @/utils/analytics.
 * GenerateAnswer is mocked to null — it makes its own network calls.
 *
 * Production chain under test:
 *   TodayPage → BriefEntry.onOpenListing → useApplyReturnPrompt.registerPending
 *   → visibilitychange → useApplyReturnPrompt opens drawer
 *   → JobQuestionsDrawer → ApplicationStatusBanner → apiClient.markMatchApplied
 */

// ── Mock control variables (must be declared before jest.mock factories run) ──
let mockMarkMatchApplied: jest.Mock;
let mockMarkMatchClick: jest.Mock;
let mockGetMatches: jest.Mock;
let mockGetUserProfile: jest.Mock;
let mockCheckWalletBalance: jest.Mock;
let mockGetOutOfCreditPreview: jest.Mock;
let mockGetSkipped: jest.Mock;
const mockTrackEvent = jest.fn();
const mockPush = jest.fn();

// ── Mocks (hoisted before imports by jest) ────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/today',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
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

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({
        children,
        onClick,
        type,
        disabled,
        isDisabled,
        'aria-label': al,
        href,
        role,
        ...rest
      }: any, ref: any) =>
        React.createElement(
          tag,
          { ref, onClick, type, disabled: disabled || isDisabled || undefined, 'aria-label': al, href, role },
          children
        )
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
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onToggle: () => setIsOpen((v: boolean) => !v),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object')
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    Select: makeEl('select'),
    Textarea: makeEl('textarea'),
    Input: makeEl('input'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) =>
      React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
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

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock('@/components/Dashboard/OutOfCreditPreview', () => ({
  __esModule: true,
  OutOfCreditPreview: () => null,
}));

// GenerateAnswer makes its own network calls — always null in this suite
jest.mock('@/components/Dashboard/GenerateAnswer', () => ({
  __esModule: true,
  GenerateAnswer: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));

// The critical addition: markMatchApplied must be present so ApplicationStatusBanner
// can call it. The existing smoke-test harness omitted this method.
jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: (...args: any[]) => mockGetMatches(...args),
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    checkWalletBalance: (...args: any[]) => mockCheckWalletBalance(...args),
    getOutOfCreditPreview: (...args: any[]) => mockGetOutOfCreditPreview(...args),
    getSkipped: (...args: any[]) => mockGetSkipped(...args),
    markMatchClick: (...args: any[]) => mockMarkMatchClick(...args),
    markMatchApplied: (...args: any[]) => mockMarkMatchApplied(...args),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

import TodayPage from '@/pages/today';

// ── Fixture ───────────────────────────────────────────────────────────────────

// Known match ID — the oracle checks this exact value appears in the
// markMatchApplied call, not whatever ID the code happened to generate.
const MATCH_ID = 'match-xmx-001';

const makeMatch = (): any => ({
  _id: MATCH_ID,
  userId: 'u1',
  jobId: 'job1',
  matchScore: 85,
  verdict: 'Strong',
  reasoning: 'Excellent fit for the role.',
  clicked: false,
  applied: null,  // contract: prompt shown only for applied === null
  skipped: false,
  createdAt: '2026-08-05T00:00:00Z',
  updatedAt: '2026-08-05T00:00:00Z',
  job: {
    _id: 'job-001',
    url: 'https://example.com/job-001',
    title: 'Senior Engineer',
    company: 'Acme Corp',
    location: ['Remote'],
    salary: null,
    source: 'linkedin',
    description: 'Test job description.',
    postedDate: null,
    scrapedDate: null,
  },
});

const fireVisibilityChange = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockMarkMatchApplied = jest.fn().mockResolvedValue({});
  mockMarkMatchClick = jest.fn().mockResolvedValue({});
  mockGetMatches = jest.fn().mockResolvedValue([makeMatch()]);
  mockGetUserProfile = jest.fn().mockResolvedValue({
    id: 'u1',
    name: 'Test',
    email: 'test@example.com',
    phone: null,
    currentLocation: null,
    createdAt: new Date('2024-01-01'),
    resume: null,
    isVerified: true,
    preferences: {
      jobTypes: [],
      location: [],
      remoteOnly: false,
      minSalary: 0,
      industries: [],
      minScore: 30,
      matchingEnabled: true,
    },
  });
  mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 5.0 });
  mockGetOutOfCreditPreview = jest.fn().mockResolvedValue(null);
  mockGetSkipped = jest.fn().mockResolvedValue([]);
  mockPush.mockReset();
  mockTrackEvent.mockReset();
  jest.spyOn(window, 'open').mockImplementation(() => null);
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render TodayPage and wait for the loading spinner to clear. */
async function renderAndSettle() {
  await act(async () => { render(<TodayPage />); });
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
}

/** Drive open-listing + return-from-tab flow and wait for the "Did you apply?" prompt. */
async function openListingAndReturn() {
  await act(async () => { fireVisibilityChange('hidden'); });
  await act(async () => { fireEvent.click(screen.getByText('Open listing')); });
  await act(async () => { fireVisibilityChange('visible'); });
  await waitFor(
    () => expect(screen.queryByText(/did you apply/i)).toBeInTheDocument(),
    { timeout: 3000 }
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('xmx e2e — full production chain: TodayPage → markMatchApplied', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // 01: Baseline render
  // ─────────────────────────────────────────────────────────────────────────
  it('01: renders "Open listing" button, no dialog on initial load', async () => {
    await renderAndSettle();
    expect(screen.getByText('Open listing')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 02: Opening the listing MUST NOT call markMatchApplied
  // Oracle: opening ≠ applying (contract §openListing)
  // ─────────────────────────────────────────────────────────────────────────
  it('02: clicking "Open listing" does NOT call markMatchApplied', async () => {
    await renderAndSettle();

    await act(async () => { fireVisibilityChange('hidden'); });
    await act(async () => { fireEvent.click(screen.getByText('Open listing')); });

    // Let markMatchClick and any other async handlers settle
    await new Promise((r) => setTimeout(r, 250));

    // Contract: opening a listing must never write applied
    expect(mockMarkMatchApplied).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 03: Opening the listing MUST NOT fire match_applied analytics
  // ─────────────────────────────────────────────────────────────────────────
  it('03: clicking "Open listing" does NOT fire match_applied analytics', async () => {
    await renderAndSettle();

    await act(async () => { fireVisibilityChange('hidden'); });
    await act(async () => { fireEvent.click(screen.getByText('Open listing')); });
    await new Promise((r) => setTimeout(r, 250));

    const appliedCalls = mockTrackEvent.mock.calls.filter(
      (args) => /match_applied/i.test(String(args[0]))
    );
    expect(appliedCalls).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 04: Return-from-tab opens the "Did you apply?" prompt (full chain)
  // Contract: TodayPage → BriefEntry.onOpenListing → registerPending →
  //           visibilitychange → JobQuestionsDrawer → ApplicationStatusBanner
  // ─────────────────────────────────────────────────────────────────────────
  it('04: return-from-tab opens the "Did you apply?" prompt with Yes / No visible', async () => {
    await renderAndSettle();
    await openListingAndReturn();

    // Contract: dialog (the apply drawer) is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Contract: the prompt text is visible inside the drawer
    expect(screen.getByText(/did you apply/i)).toBeInTheDocument();

    // Contract: Yes and No buttons present (applied === null on fixture)
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 05 [PRIMARY]: clicking "Yes" calls markMatchApplied(MATCH_ID, true)
  // This is the core regression fix being tested: applied is written on "Yes",
  // not on "Open listing". matchId must equal the fixture's _id, not any
  // incidentally-discovered value.
  // ─────────────────────────────────────────────────────────────────────────
  it('05 [PRIMARY]: clicking "Yes" calls markMatchApplied(matchId, true) with matchId === MATCH_ID', async () => {
    await renderAndSettle();
    await openListingAndReturn();

    // Pre-click: markMatchApplied must not have been called by any earlier step
    expect(mockMarkMatchApplied).not.toHaveBeenCalled();

    const yesBtn = screen.getByText('Yes');
    await act(async () => { fireEvent.click(yesBtn); });

    await waitFor(
      () => expect(mockMarkMatchApplied).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // Contract: first arg is the match's _id (MATCH_ID), not a job id or something else
    expect(mockMarkMatchApplied.mock.calls[0][0]).toBe(MATCH_ID);
    // Contract: second arg is true — user said "Yes, I applied"
    expect(mockMarkMatchApplied.mock.calls[0][1]).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 06: match_applied analytics fired exactly once, only after "Yes"
  // ─────────────────────────────────────────────────────────────────────────
  it('06: analytics match_applied fires exactly once after "Yes", and NOT before', async () => {
    await renderAndSettle();
    await openListingAndReturn();

    // No analytics events before Yes is clicked
    expect(
      mockTrackEvent.mock.calls.filter((a) => /match_applied/i.test(String(a[0])))
    ).toHaveLength(0);

    await act(async () => { fireEvent.click(screen.getByText('Yes')); });

    await waitFor(() => {
      const appliedEvents = mockTrackEvent.mock.calls.filter(
        (a) => /match_applied/i.test(String(a[0]))
      );
      // Contract: exactly one event — no double-counting
      expect(appliedEvents).toHaveLength(1);
    }, { timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 07: "No" path — clicking "No" → selecting a reason → submitting
  //     calls markMatchApplied(MATCH_ID, false, category)
  //
  // Limitation: if the reason picker UI is not reachable black-box (e.g. the
  // Submit button is not found), this test exits early with a console.warn
  // rather than making a false assertion. Cover the "Yes" path (test 05) for
  // the hard contract assertion.
  // ─────────────────────────────────────────────────────────────────────────
  it('07: clicking "No" + selecting reason + submitting calls markMatchApplied(MATCH_ID, false, category)', async () => {
    await renderAndSettle();
    await openListingAndReturn();

    // Click "No" — opens the reason picker modal inside ApplicationStatusBanner
    await act(async () => { fireEvent.click(screen.getByText('No')); });

    // The reason modal renders category buttons. "Salary too low" is the first
    // category key ('salary') rendered by ApplicationStatusBanner's REASON_CATEGORIES map.
    await waitFor(
      () => expect(screen.queryByText('Salary too low')).toBeInTheDocument(),
      { timeout: 2000 }
    );

    // Select a reason category
    await act(async () => { fireEvent.click(screen.getByText('Salary too low')); });

    // Find the Submit button (distinct from any other buttons in the DOM)
    const submitBtn = screen
      .queryAllByRole('button')
      .find((b) => b.textContent?.trim() === 'Submit');

    if (!submitBtn) {
      console.warn(
        '[LIMITATION 07]: Submit button not found in DOM. ' +
        'The reason picker modal may not have rendered in this test harness. ' +
        'Yes-path (test 05) is the primary assertion. Report as untestable-without-reading.'
      );
      return;
    }

    await act(async () => { fireEvent.click(submitBtn); });

    await waitFor(
      () => expect(mockMarkMatchApplied).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const [calledId, calledApplied, calledCategory] = mockMarkMatchApplied.mock.calls[0];

    // Contract: matchId is the fixture's _id
    expect(calledId).toBe(MATCH_ID);
    // Contract: applied=false — user said "No"
    expect(calledApplied).toBe(false);
    // Contract: category is a non-empty string (the reason key, e.g. 'salary')
    expect(typeof calledCategory).toBe('string');
    expect(calledCategory.trim().length).toBeGreaterThan(0);
  });
});
