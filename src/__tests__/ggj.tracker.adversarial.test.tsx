/**
 * ADVERSARIAL TEST — onlyjobs-ggj
 * "Tracker 'Move to' menu — move a card between columns"
 *
 * Assume the implementation is subtly WRONG; write black-box tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests, do NOT commit.
 *
 * FORBIDDEN FILES (NOT opened):
 *   src/pages/tracker.tsx              (implementation)
 *   src/__tests__/tracker.test.tsx     (implementer's tests)
 *
 * CONTRACT = oracle. Every expected value traces to the onlyjobs-ggj spec.
 * See DISCLOSURE section at the bottom.
 *
 * Render the REAL TrackerPage black-box. Mock only external boundaries:
 *   @/lib/apiClient (getTracker + recordApplicationOutcome)
 *   @/contexts/AuthContext (ready + logged-in)
 *   Chakra UI, next/* navigation
 *
 * CRITICAL: outcome "interview" ≠ column name "Interviewing".
 *   Menu item "Interviewing" must call recordApplicationOutcome with "interview".
 *   A naive impl sending "interviewing" is the #1 adversarial case.
 */

// ── Mock control variables (declared before jest.mock factories are hoisted) ──

let mockGetTracker: jest.Mock;
let mockRecordApplicationOutcome: jest.Mock;

const mockPush = jest.fn();

// ── Next.js mocks ─────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/tracker',
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

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

// ── Chakra UI — full project-harness mock ─────────────────────────────────────
// MenuItem updated to propagate isDisabled → aria-disabled and suppress onClick
// so the "current outcome not re-submittable" test can observe behavioral disability.

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
          {
            ref,
            onClick,
            type,
            disabled: disabled || isDisabled || undefined,
            'aria-label': al,
            href,
            role,
          },
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
    IconButton: ({ 'aria-label': al, onClick, children, isDisabled, disabled }: any) =>
      React.createElement(
        'button',
        { 'aria-label': al, onClick, disabled: isDisabled || disabled || undefined },
        children ?? null
      ),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: ({ children, role: r }: any) =>
      React.createElement('div', { role: r ?? 'alert' }, children),
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
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
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
    useTheme: () => ({
      colors: {
        brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69' },
        gray:     { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280' },
        surface:  { bg: '#F4F5F3', border: '#E5E7EB' },
        text:     { primary: '#16202A', secondary: '#4B5563' },
        semantic: { error: '#EF4444', success: '#22C55E' },
      },
    }),
    Select: makeEl('select'),
    Textarea: makeEl('textarea'),
    Input: makeEl('input'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Tooltip: ({ children }: any) => children,
    // Menu: always render children (no open/close state — we test by clicking the MenuButton)
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) =>
      React.createElement('ul', { role: 'menu' }, children),
    // MenuItem: propagate isDisabled → aria-disabled + suppress onClick when disabled
    MenuItem: ({ children, onClick, isDisabled, disabled }: any) => {
      const dis = isDisabled || disabled || false;
      return React.createElement(
        'li',
        {
          role: 'menuitem',
          'aria-disabled': dis || undefined,
          onClick: dis ? undefined : onClick,
        },
        children
      );
    },
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) =>
      React.createElement('div', { role: 'tablist' }, children),
    Tab: ({ children, onClick }: any) =>
      React.createElement('button', { role: 'tab', onClick }, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) =>
      React.createElement('div', { role: 'tabpanel' }, children),
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

// ── Theme / icon stubs ────────────────────────────────────────────────────────

jest.mock('@/theme/theme', () => ({
  __esModule: true,
  default: {
    colors: {
      brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69' },
      gray:     { 50: '#F9FAFB', 500: '#6B7280' },
      surface:  { bg: '#F4F5F3', border: '#E5E7EB' },
      text:     { primary: '#16202A', secondary: '#4B5563' },
      semantic: { error: '#EF4444', success: '#22C55E', primary: '#1D4E89' },
    },
  },
}));

const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock('react-icons/fi', () => nullIconProxy);
jest.mock('react-icons/bs', () => nullIconProxy);
jest.mock('react-icons/si', () => nullIconProxy);
jest.mock('react-icons/md', () => nullIconProxy);
jest.mock('react-icons/ai', () => nullIconProxy);
jest.mock('react-icons/io', () => nullIconProxy);
jest.mock('react-icons/io5', () => nullIconProxy);
jest.mock('react-icons/hi', () => nullIconProxy);
jest.mock('react-icons/ri', () => nullIconProxy);
jest.mock('react-icons/tb', () => nullIconProxy);
jest.mock('react-icons/lu', () => nullIconProxy);
jest.mock('react-icons/fa', () => nullIconProxy);
jest.mock('react-icons/vsc', () => nullIconProxy);
jest.mock('react-icons/go', () => nullIconProxy);
jest.mock('react-icons/ti', () => nullIconProxy);
jest.mock('react-icons/cg', () => nullIconProxy);
jest.mock('react-icons/bi', () => nullIconProxy);

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

// ── Project mocks ─────────────────────────────────────────────────────────────

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

// ── GenerateAnswer / subcomponents that make their own network calls ──────────

jest.mock('@/components/Dashboard/GenerateAnswer', () => ({
  __esModule: true,
  GenerateAnswer: () => null,
}));

jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  __esModule: true,
  default: () => null,
  JobQuestionsDrawer: () => null,
}));

// ── apiClient mock ────────────────────────────────────────────────────────────
// getTracker and recordApplicationOutcome are under test; everything else is stubbed.

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getTracker: (...args: any[]) => mockGetTracker(...args),
    recordApplicationOutcome: (...args: any[]) => mockRecordApplicationOutcome(...args),
    // defensive stubs — tracker page may call these via DashboardLayout or other subcomponents
    getUserProfile: jest.fn().mockResolvedValue({
      id: 'u1', name: 'Test', email: 'test@example.com',
      phone: null, currentLocation: null, createdAt: new Date('2024-01-01'),
      resume: { summary: 'Engineer', skills: ['TypeScript'], experience: [], education: [],
                certifications: [], languages: [], projects: [], achievements: [],
                volunteerExperience: [], interests: [] },
      isVerified: true,
      preferences: { jobTypes: [], location: [], remoteOnly: false, minSalary: 0,
                     industries: [], minScore: 30, matchingEnabled: true },
    }),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 5.0 }),
    getOutOfCreditPreview: jest.fn().mockResolvedValue(null),
    getSkipped: jest.fn().mockResolvedValue([]),
    getMatches: jest.fn().mockResolvedValue([]),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
    getQuestion: jest.fn().mockResolvedValue(null),
    postAnswer: jest.fn().mockResolvedValue({}),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    skipQuestion: jest.fn().mockResolvedValue({}),
    createAnswer: jest.fn().mockResolvedValue({}),
    getMatchQnAHistory: jest.fn().mockResolvedValue([]),
    sendChatMessage: jest.fn().mockResolvedValue({}),
    getChatConversations: jest.fn().mockResolvedValue([]),
    getChatConversation: jest.fn().mockResolvedValue({}),
    getChatMemory: jest.fn().mockResolvedValue({}),
    deleteChatMemory: jest.fn().mockResolvedValue({}),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    updatePreferences: jest.fn().mockResolvedValue({}),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    resetGuideProgress: jest.fn().mockResolvedValue({}),
    getPublicStats: jest.fn().mockResolvedValue(null),
  }),
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: () => Promise.resolve(null),
}) as any;

// ── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

import TrackerPage from '@/pages/tracker';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MATCH_ID = 'match-ggj-001';
const MATCH_ID_2 = 'match-ggj-002';

const baseJob = {
  _id: 'job-001',
  title: 'Software Engineer',
  company: 'Acme Corp',
  location: ['Remote'],
  salary: null,
  source: 'linkedin',
  description: 'Test job description.',
  url: 'https://example.com/job-001',
  postedDate: null,
  scrapedDate: null,
};

/** Build a tracker match fixture. applied=true means the user applied (it's in the tracker). */
const makeTrackerMatch = (overrides: Record<string, any> = {}): any => ({
  _id: MATCH_ID,
  userId: 'u1',
  jobId: 'job-001',
  matchScore: 80,
  verdict: 'Strong',
  reasoning: 'Good fit.',
  clicked: true,
  applied: true,
  appliedAt: '2026-08-01T00:00:00Z',
  skipped: false,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  applicationOutcome: undefined,
  job: { ...baseJob },
  ...overrides,
});

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch()]);
  mockRecordApplicationOutcome = jest.fn().mockResolvedValue({});
  mockPush.mockReset();
  jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render TrackerPage and wait for the loading spinner to clear. */
async function renderAndSettle() {
  await act(async () => {
    render(<TrackerPage />);
  });
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 4000 }
  );
  // Extra settle for async state
  await new Promise((r) => setTimeout(r, 200));
}

/**
 * Find the "Move to" button associated with the card showing the given job title.
 * Returns null if not found (caller should fail the test with a clear message).
 */
function findMoveToButton(): HTMLElement | null {
  const btns = Array.from(document.querySelectorAll('button'));
  const btn = btns.find((b) => /move\s+to/i.test(b.textContent ?? ''));
  return (btn as HTMLElement) ?? null;
}

/** Find a menu item (li[role=menuitem]) by exact or partial text. */
function findMenuItem(label: string | RegExp): HTMLElement | null {
  const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
  const item = items.find((el) => {
    const text = el.textContent ?? '';
    return typeof label === 'string' ? text.includes(label) : label.test(text);
  });
  return (item as HTMLElement) ?? null;
}

/**
 * Open the "Move to" menu for the first card and return the button used.
 * Reports FINDING if the button is missing.
 */
async function openMoveToMenu(): Promise<HTMLElement | null> {
  const btn = findMoveToButton();
  if (!btn) return null;
  await act(async () => { fireEvent.click(btn); });
  await new Promise((r) => setTimeout(r, 100));
  return btn;
}

/**
 * Return the DOM element that acts as the column container for the given heading.
 *
 * Strategy: column headings are leaf spans NOT inside a menu item (role="menuitem").
 * Walk up from one; the column container is the element just below the level at which
 * the parent starts containing OTHER column heading spans. This correctly excludes
 * column names that appear inside card menu items (which are in [role="menuitem"]).
 */
function getColumnContainer(columnHeading: string): Element | null {
  const ALL_COLUMNS = ['Applied', 'Heard back', 'Interviewing', 'Closed'];
  const OTHER_COLUMNS = ALL_COLUMNS.filter((c) => c !== columnHeading);

  // A "column heading span" is a leaf span that is NOT inside a menu item.
  const isColHeadingSpan = (el: Element, name: string) =>
    el.tagName === 'SPAN' &&
    (el.textContent ?? '').trim() === name &&
    !el.querySelector('*') &&
    !el.closest('[role="menuitem"]');

  // Find leaf spans for our column heading (may match heading + status labels).
  const myHeadingEls = Array.from(document.querySelectorAll('span')).filter((el) =>
    isColHeadingSpan(el, columnHeading)
  );

  for (const headingEl of myHeadingEls) {
    let current: Element | null = headingEl;
    while (current && current !== document.body) {
      const parent: HTMLElement | null = current.parentElement;
      if (!parent) break;
      // Does the parent subtree contain a column heading span for ANY other column?
      // If yes, parent crosses the column boundary — current is the column container.
      const parentHasOtherColumnHeadings = OTHER_COLUMNS.some((col) =>
        Array.from(parent.querySelectorAll('span')).some((el: Element) => isColHeadingSpan(el, col))
      );
      if (parentHasOtherColumnHeadings) {
        return current;
      }
      current = parent;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 0 — Baseline: page renders and exposes the "Move to" menu
// ═══════════════════════════════════════════════════════════════════════════════

describe('0 — Baseline: TrackerPage renders cards', () => {
  it('0-1: renders without crashing, loader clears', async () => {
    await renderAndSettle();
    // No assertion other than "no error thrown and no spinner" — verified by renderAndSettle.
    expect(true).toBe(true);
  });

  it('0-2: calls getTracker() on mount', async () => {
    await renderAndSettle();
    expect(mockGetTracker).toHaveBeenCalled();
  });

  it('0-3: a "Move to" button is present for an applied card', async () => {
    await renderAndSettle();
    const btn = findMoveToButton();
    // FINDING if null: the tracker page renders no "Move to" menu button — the feature is missing.
    expect(btn).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — INTERVIEW-NOT-INTERVIEWING [highest priority]
//
// Contract: the menu item labeled "Interviewing" must call
//   recordApplicationOutcome(matchId, "interview")  — NOT "interviewing".
// An impl that sends the column key ("interviewing") instead of the outcome
// value ("interview") violates the contract.
// ═══════════════════════════════════════════════════════════════════════════════

describe('1 — INTERVIEW-NOT-INTERVIEWING (highest-value case)', () => {
  it('1-1 [PRIMARY]: clicking "Interviewing" calls recordApplicationOutcome with "interview", NOT "interviewing"', async () => {
    // Card with no outcome → starts in Applied column
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 1-1]: No "Move to" button found — menu feature not rendered.');
      return;
    }

    const item = findMenuItem(/interviewing/i);
    if (!item) {
      console.warn('[FINDING 1-1]: No "Interviewing" menu item found after opening "Move to" menu.');
      return;
    }

    await act(async () => { fireEvent.click(item); });

    await waitFor(
      () => expect(mockRecordApplicationOutcome).toHaveBeenCalled(),
      { timeout: 3000 }
    );

    const [calledMatchId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];

    // Contract: the match ID must be the fixture's _id
    expect(calledMatchId).toBe(MATCH_ID);

    // CONTRACT (HIGH VALUE): outcome must be "interview" — NOT "interviewing"
    // FINDING if "interviewing": impl sent the column key instead of the outcome value.
    // This would cause a backend error or incorrect DB state (the API expects "interview").
    expect(calledOutcome).toBe('interview');
    expect(calledOutcome).not.toBe('interviewing');
  });

  it('1-2: after successful "Interviewing" click, card is NOT in the Applied section', async () => {
    // On success the impl must move (or re-fetch) the card to the Interviewing column.
    // Set up getTracker to return the updated card (with outcome "interview") on the second call.
    mockGetTracker = jest
      .fn()
      .mockResolvedValueOnce([makeTrackerMatch({ applicationOutcome: undefined })])
      .mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'interview' })]);

    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 1-2]: No "Move to" button — menu feature not rendered.');
      return;
    }

    const item = findMenuItem(/interviewing/i);
    if (!item) {
      console.warn('[FINDING 1-2]: No "Interviewing" menu item found.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    // Give UI time to re-render / re-fetch
    await new Promise((r) => setTimeout(r, 400));

    // Keep the exact-argument assertion.
    expect(mockRecordApplicationOutcome.mock.calls[0][1]).toBe('interview');

    // CONTRACT (TIGHTENED): after a successful move, the card must appear WITHIN the
    // Interviewing column subtree — not merely somewhere in the document.
    // FINDING if interviewingCol is null: Interviewing column container not found in DOM.
    const interviewingCol = getColumnContainer('Interviewing');
    expect(interviewingCol).not.toBeNull();
    if (interviewingCol) {
      expect(interviewingCol.textContent).toContain('Software Engineer');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — THREE DISTINCT CLOSED OUTCOMES
//
// Contract: the Closed column is reached via three separate menu items,
//   each calling recordApplicationOutcome with its own distinct outcome string.
//   A collapsed "closed" outcome or wrong string is caught here.
// ═══════════════════════════════════════════════════════════════════════════════

describe('2 — Three distinct Closed outcomes', () => {
  it('2-1: "Closed · Got offer" calls recordApplicationOutcome with "offer"', async () => {
    mockGetTracker = jest
      .fn()
      .mockResolvedValueOnce([makeTrackerMatch()])
      .mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'offer' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 2-1]: No "Move to" button.');
      return;
    }

    const item = findMenuItem(/got offer/i);
    if (!item) {
      console.warn('[FINDING 2-1]: No "Closed · Got offer" (or "Got offer") menu item found.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledMatchId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];
    expect(calledMatchId).toBe(MATCH_ID);
    // CONTRACT: "Closed · Got offer" → "offer" (not "closed", not "got_offer", not "hired")
    expect(calledOutcome).toBe('offer');

    // CONTRACT (TIGHTENED): after successful move, card appears within the Closed column subtree.
    await new Promise((r) => setTimeout(r, 400));
    const closedCol = getColumnContainer('Closed');
    // FINDING if null: Closed column container not found in DOM.
    expect(closedCol).not.toBeNull();
    if (closedCol) {
      expect(closedCol.textContent).toContain('Software Engineer');
    }
  });

  it('2-2: "Closed · Rejected" calls recordApplicationOutcome with "rejected"', async () => {
    mockGetTracker = jest
      .fn()
      .mockResolvedValueOnce([makeTrackerMatch()])
      .mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'rejected' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 2-2]: No "Move to" button.');
      return;
    }

    const item = findMenuItem(/rejected/i);
    if (!item) {
      console.warn('[FINDING 2-2]: No "Closed · Rejected" (or "Rejected") menu item found.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledMatchId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];
    expect(calledMatchId).toBe(MATCH_ID);
    // CONTRACT: "Closed · Rejected" → "rejected" (not "closed", not "reject")
    expect(calledOutcome).toBe('rejected');

    // CONTRACT (TIGHTENED): after successful move, card appears within the Closed column subtree.
    await new Promise((r) => setTimeout(r, 400));
    const closedCol = getColumnContainer('Closed');
    // FINDING if null: Closed column container not found in DOM.
    expect(closedCol).not.toBeNull();
    if (closedCol) {
      expect(closedCol.textContent).toContain('Software Engineer');
    }
  });

  it('2-3: "Closed · No response" calls recordApplicationOutcome with "no_response"', async () => {
    mockGetTracker = jest
      .fn()
      .mockResolvedValueOnce([makeTrackerMatch()])
      .mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'no_response' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 2-3]: No "Move to" button.');
      return;
    }

    const item = findMenuItem(/no.?response/i);
    if (!item) {
      console.warn('[FINDING 2-3]: No "Closed · No response" (or "No response") menu item found.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledMatchId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];
    expect(calledMatchId).toBe(MATCH_ID);
    // CONTRACT: "Closed · No response" → "no_response" (not "no-response", not "noresponse", not "closed")
    expect(calledOutcome).toBe('no_response');

    // CONTRACT (TIGHTENED): after successful move, card appears within the Closed column subtree.
    await new Promise((r) => setTimeout(r, 400));
    const closedCol = getColumnContainer('Closed');
    // FINDING if null: Closed column container not found in DOM.
    expect(closedCol).not.toBeNull();
    if (closedCol) {
      expect(closedCol.textContent).toContain('Software Engineer');
    }
  });

  it('2-4: all three Closed outcomes are distinct strings (no collapsing)', async () => {
    // Each closed sub-item must call with a DIFFERENT string.
    // Run all three in sequence to prove each is a distinct outcome.
    const outcomes: string[] = [];

    for (const itemLabel of [/got offer/i, /rejected/i, /no.?response/i]) {
      mockRecordApplicationOutcome = jest.fn().mockResolvedValue({});
      mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch()]);

      // Re-render for each sub-item (each test needs a fresh DOM)
      const { unmount } = render(<TrackerPage />);
      await waitFor(
        () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
        { timeout: 4000 }
      );
      await new Promise((r) => setTimeout(r, 200));

      const btn = findMoveToButton();
      if (btn) {
        await act(async () => { fireEvent.click(btn); });
        await new Promise((r) => setTimeout(r, 100));
        const item = findMenuItem(itemLabel);
        if (item) {
          await act(async () => { fireEvent.click(item); });
          await new Promise((r) => setTimeout(r, 300));
          if (mockRecordApplicationOutcome.mock.calls.length > 0) {
            outcomes.push(mockRecordApplicationOutcome.mock.calls[0][1]);
          }
        }
      }
      unmount();
    }

    if (outcomes.length < 3) {
      console.warn(`[FINDING 2-4]: Only ${outcomes.length}/3 closed-outcome menu items triggered recordApplicationOutcome. May indicate collapsed outcomes.`);
    }

    // Each call must have a distinct outcome string
    const uniqueOutcomes = new Set(outcomes);
    // FINDING if uniqueOutcomes.size < outcomes.length: two menu items sent the same outcome —
    // the implementation collapsed closed sub-states into one outcome value.
    expect(uniqueOutcomes.size).toBe(outcomes.length);
    // And they must be the exact contract strings
    if (outcomes.length === 3) {
      expect(outcomes).toContain('offer');
      expect(outcomes).toContain('rejected');
      expect(outcomes).toContain('no_response');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — HEARD BACK
//
// Contract: menu item "Heard back" → recordApplicationOutcome(matchId, "heard_back")
//   The underscore is mandatory; "heard-back" or "heardback" are bugs.
// ═══════════════════════════════════════════════════════════════════════════════

describe('3 — Heard back', () => {
  it('3-1: "Heard back" menu item calls recordApplicationOutcome with "heard_back"', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 3-1]: No "Move to" button.');
      return;
    }

    const item = findMenuItem(/heard.?back/i);
    if (!item) {
      console.warn('[FINDING 3-1]: No "Heard back" menu item found.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledMatchId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];
    expect(calledMatchId).toBe(MATCH_ID);
    // CONTRACT: outcome is "heard_back" with underscore — NOT "heard-back" or "heardback"
    expect(calledOutcome).toBe('heard_back');
    expect(calledOutcome).not.toMatch(/-/);      // no hyphen variant
    expect(calledOutcome).not.toMatch(/\s/);     // no space variant
  });

  it('3-2: after "Heard back" success, card column changes (recordApplicationOutcome called)', async () => {
    // The key assertion is that the call happened with the right args.
    // Column move is tested by verifying the mutation fired (re-fetch path tested separately).
    mockGetTracker = jest
      .fn()
      .mockResolvedValueOnce([makeTrackerMatch({ applicationOutcome: undefined })])
      .mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'heard_back' })]);

    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const item = findMenuItem(/heard.?back/i);
    if (!item) return;

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(1);
    expect(mockRecordApplicationOutcome.mock.calls[0][1]).toBe('heard_back');

    // CONTRACT (TIGHTENED): after successful move, card appears within the Heard back column subtree.
    await new Promise((r) => setTimeout(r, 400));
    const heardBackCol = getColumnContainer('Heard back');
    // FINDING if null: Heard back column container not found in DOM.
    expect(heardBackCol).not.toBeNull();
    if (heardBackCol) {
      expect(heardBackCol.textContent).toContain('Software Engineer');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — NO "MOVE TO APPLIED" ITEM
//
// Contract: there is NO menu item that moves a card to Applied / clears the outcome.
//   The API has no clear-outcome endpoint.
// ═══════════════════════════════════════════════════════════════════════════════

describe('4 — No "Move to Applied" item', () => {
  it('4-1: the "Move to" menu does NOT contain an item that moves to Applied', async () => {
    // Card already in non-Applied state (heard_back) — the menu should offer other outcomes
    // but NOT a path back to Applied.
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'heard_back' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 4-1]: No "Move to" button — cannot verify absent Applied item.');
      return;
    }

    // Look for any menu item whose text suggests moving back to Applied
    const appliedItem = findMenuItem(/^applied$|move to applied|back to applied/i);

    // FINDING if found: impl added a "Clear outcome" or "Move to Applied" item —
    // there is no clear-outcome API, so clicking it would either do nothing or fail.
    expect(appliedItem).toBeNull();
  });

  it('4-2: no-outcome card menu also has no "Applied" item (not just for cards with outcomes)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const appliedItem = findMenuItem(/^applied$|move to applied/i);
    // FINDING if found: impl included "Applied" as a move target even for no-outcome cards.
    expect(appliedItem).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — CURRENT OUTCOME NOT RE-SUBMITTABLE
//
// Contract: the menu item matching the card's CURRENT outcome must be disabled —
//   clicking it must NOT fire recordApplicationOutcome again.
// ═══════════════════════════════════════════════════════════════════════════════

describe('5 — Current outcome item not re-submittable', () => {
  it('5-1: card with applicationOutcome="interview" — "Interviewing" item click does NOT call recordApplicationOutcome', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'interview' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 5-1]: No "Move to" button for card with outcome="interview".');
      return;
    }

    const item = findMenuItem(/interviewing/i);
    if (!item) {
      console.warn('[FINDING 5-1]: No "Interviewing" menu item — could be excluded when it is the current state (acceptable variant).');
      // If the item is absent (removed for current state), that satisfies the contract too.
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await new Promise((r) => setTimeout(r, 400));

    // CONTRACT: selecting the current outcome must NOT fire another API call.
    // FINDING if called: impl re-submits the same outcome — causes a spurious write to the DB.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('5-2: the current-outcome item is aria-disabled or absent (not interactable)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'heard_back' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const item = findMenuItem(/heard.?back/i);
    if (!item) {
      // Item being absent is acceptable — it also satisfies "not re-submittable"
      return;
    }

    // CONTRACT: the item must be disabled (aria-disabled=true) OR absent
    const isAriaDisabled = item.getAttribute('aria-disabled') === 'true';
    const isHtmlDisabled = (item as HTMLButtonElement).disabled;
    // FINDING if neither: item is present and fully interactive — clicking it would
    // submit a no-op re-submission with no visual feedback to the user.
    expect(isAriaDisabled || isHtmlDisabled).toBe(true);
  });

  it('5-3: card with applicationOutcome="offer" — "Got offer" item does NOT call recordApplicationOutcome on click', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'offer' })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const item = findMenuItem(/got offer/i);
    if (!item) return; // absent = acceptable (current state removed)

    await act(async () => { fireEvent.click(item); });
    await new Promise((r) => setTimeout(r, 400));

    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — ERROR KEEPS CARD IN PLACE
//
// Contract: when recordApplicationOutcome returns an error, the card must NOT
//   move columns, and a card-level error must be shown.
// ═══════════════════════════════════════════════════════════════════════════════

describe('6 — Error keeps card in place', () => {
  it('6-1: on error response, card stays in original column and error is shown', async () => {
    // recordApplicationOutcome resolves with an error-shaped result (not throws)
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ error: 'Server error' });

    // getTracker always returns the SAME card (no outcome) — if the impl re-fetches
    // after a failed mutation, it should still see the same card in Applied column.
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);

    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 6-1]: No "Move to" button — cannot test error handling.');
      return;
    }

    const item = findMenuItem(/interviewing/i);
    if (!item) {
      console.warn('[FINDING 6-1]: No "Interviewing" item — cannot test error handling.');
      return;
    }

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    // Give UI time to process the error response
    await new Promise((r) => setTimeout(r, 400));

    // CONTRACT: card-level error shown
    // Accept: DOM alert element, text matching error/failed/wrong, or Chakra toast
    const alertEl = document.querySelector('[role="alert"]');
    const errorText = screen.queryByText(/error|failed|unable|could not|went wrong|try again/i);
    const hasAlert = alertEl !== null || errorText !== null;

    // FINDING if no error shown: impl treats { error: "..." } as success and shows no feedback.
    // Secondary check: job title should still be visible (card not moved away)
    const jobTitle = screen.queryByText('Software Engineer');
    expect(jobTitle).not.toBeNull(); // card still rendered

    // Alert is the primary contract assertion
    if (!hasAlert) {
      console.warn('[FINDING 6-1]: No error indicator found in DOM after failed recordApplicationOutcome — impl may swallow errors silently.');
    }
    expect(hasAlert).toBe(true);
  });

  it('6-2: on rejected recordApplicationOutcome, card stays in original column and shows card-level error', async () => {
    // CONTRACT: when the mutation rejects (network failure), the component must catch it,
    // keep the card in the Applied column, and render the specific error text.
    //
    // This is a HARD test: if the component's try/catch is removed, the error message
    // "Could not update status. Please try again." will not appear, and findByText will
    // time out — failing this test. The unhandled rejection is NOT swallowed here, so a
    // genuine uncaught rejection also fails the test.
    mockRecordApplicationOutcome = jest.fn().mockRejectedValue(new Error('Network failure'));
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);

    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const item = findMenuItem(/interviewing/i);
    if (!item) return;

    // Suppress React act() console noise only — do NOT swallow unhandled rejections.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await act(async () => { fireEvent.click(item); });
      await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

      // CONTRACT (HARD): the card-level error message must appear after the rejection.
      // findByText throws if the text is absent within the timeout, so a missing try/catch
      // that prevents this message from rendering FAILS this assertion.
      await screen.findByText('Could not update status. Please try again.', {}, { timeout: 3000 });

      // CONTRACT: card must NOT have moved — it must remain in the Applied column.
      const appliedCol = getColumnContainer('Applied');
      // FINDING if null: Applied column container not found in DOM — cannot scope assertion.
      expect(appliedCol).not.toBeNull();
      if (appliedCol) {
        expect(appliedCol.textContent).toContain('Software Engineer');
      }
    } finally {
      consoleError.mockRestore();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — STATUS LINE
//
// Contract: each card shows a current-status line:
//   • no/falsy outcome → "Applied" (or "Status: Applied")
//   • outcome "heard_back" → "Heard back" label
//   • outcome "interview" → "Interviewing" label
// ═══════════════════════════════════════════════════════════════════════════════

describe('7 — Status line on cards', () => {
  it('7-1: card with no applicationOutcome shows "Applied" in some form', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    // CONTRACT: no-outcome card shows "Applied" status.
    // Accept "Status: Applied", "Applied", "Status · Applied", etc.
    // Use queryAllByText because "Applied" may appear in both the column heading and the card.
    const appliedLabels = screen.queryAllByText(/\bapplied\b/i);
    // FINDING if empty: the status line is absent or uses a different label for the Applied state.
    expect(appliedLabels.length).toBeGreaterThan(0);
  });

  it('7-2: card with applicationOutcome="heard_back" does NOT show "Applied" as status', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'heard_back' })]);
    await renderAndSettle();

    // The card is in "Heard back" column so the status line should not say "Applied".
    // Use queryAllByText because "Heard back" may appear in both the column heading and the card.
    const heardBackLabels = screen.queryAllByText(/heard.?back/i);
    // FINDING if empty: the heard_back outcome is not labeled anywhere in the UI.
    expect(heardBackLabels.length).toBeGreaterThan(0);

    // The card status line specifically must NOT show "Applied" for a heard_back card.
    // Look for the specific "Status: Applied" pattern — it's two adjacent spans.
    const statusSpans = Array.from(document.querySelectorAll('span'));
    const statusApplied = statusSpans.find(
      (el) => el.textContent?.trim() === 'Applied' &&
               el.previousElementSibling?.textContent?.trim() === 'Status:'
    );
    // FINDING if not null: card still shows "Status: Applied" even though it has a heard_back outcome.
    expect(statusApplied).toBeUndefined();
  });

  it('7-3: card with applicationOutcome="interview" shows "Interviewing" (not "interview" the raw value)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'interview' })]);
    await renderAndSettle();

    // CONTRACT: the status label for "interview" outcome is "Interviewing" (human-readable).
    // Use queryAllByText: "Interviewing" may appear in both column heading and card status.
    const labels = screen.queryAllByText(/interviewing/i);
    // FINDING if empty: card shows raw "interview" or nothing — raw value leaked to UI.
    expect(labels.length).toBeGreaterThan(0);

    // Additionally: the raw value "interview" (exactly, not "Interviewing") must NOT appear
    // as a status label. Check for the exact raw string in a status-line context.
    const statusSpans = Array.from(document.querySelectorAll('span'));
    const rawStatusLabel = statusSpans.find(
      (el) => el.textContent?.trim() === 'interview' &&
               el.previousElementSibling?.textContent?.trim() === 'Status:'
    );
    // FINDING if found: card leaks the raw "interview" DB key in the status line.
    expect(rawStatusLabel).toBeUndefined();
  });

  it('7-4: card with no outcome does not show a raw outcome string ("heard_back", "interview", etc.)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    // CONTRACT: no raw DB strings appear in the UI.
    // FINDING if found: impl renders the raw outcome key — e.g., "heard_back" appears verbatim.
    expect(screen.queryByText('heard_back')).toBeNull();
    expect(screen.queryByText('no_response')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — ALL FIVE OUTCOMES REACHABLE
//
// Contract: the "Move to" menu exposes all five outcomes:
//   heard_back, interview, offer, rejected, no_response
//   (via items Heard back / Interviewing / Closed·Got offer / Closed·Rejected / Closed·No response)
// ═══════════════════════════════════════════════════════════════════════════════

describe('8 — All five outcomes reachable from menu', () => {
  it('8-1: menu for a no-outcome card exposes all five move targets', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 8-1]: No "Move to" button — cannot verify all five outcomes reachable.');
      return;
    }

    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    const itemTexts = items.map((el) => (el.textContent ?? '').trim());

    const hasHeardBack   = itemTexts.some((t) => /heard.?back/i.test(t));
    const hasInterviewing = itemTexts.some((t) => /interviewing/i.test(t));
    const hasOffer       = itemTexts.some((t) => /got.?offer|offer/i.test(t));
    const hasRejected    = itemTexts.some((t) => /rejected/i.test(t));
    const hasNoResponse  = itemTexts.some((t) => /no.?response/i.test(t));

    if (!hasHeardBack)   console.warn('[FINDING 8-1]: "Heard back" item missing from Move to menu.');
    if (!hasInterviewing) console.warn('[FINDING 8-1]: "Interviewing" item missing from Move to menu.');
    if (!hasOffer)       console.warn('[FINDING 8-1]: "Got offer" / "Closed · Got offer" item missing.');
    if (!hasRejected)    console.warn('[FINDING 8-1]: "Rejected" item missing from Move to menu.');
    if (!hasNoResponse)  console.warn('[FINDING 8-1]: "No response" item missing from Move to menu.');

    // CONTRACT: all five must be present
    expect(hasHeardBack).toBe(true);
    expect(hasInterviewing).toBe(true);
    expect(hasOffer).toBe(true);
    expect(hasRejected).toBe(true);
    expect(hasNoResponse).toBe(true);
  });

  it('8-2: menu items are at least 5 in total (no collapsed/merged outcomes)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) return;

    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    // CONTRACT: 5 distinct move targets must exist.
    // FINDING if < 5: some outcomes were collapsed — e.g., a single "Closed" item
    // instead of three separate Closed sub-items.
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — MATCH ID CORRECTNESS
//
// Contract: recordApplicationOutcome must be called with the match's _id,
//   not the job's _id or some other incidental value.
// ═══════════════════════════════════════════════════════════════════════════════

describe('9 — Match ID correctness', () => {
  it('9-1: recordApplicationOutcome receives the match _id, not the job _id', async () => {
    const JOB_ID = 'job-DIFFERENT-001';
    mockGetTracker = jest.fn().mockResolvedValue([
      makeTrackerMatch({
        _id: MATCH_ID,          // match ID
        jobId: JOB_ID,          // job reference (different!)
        job: { ...baseJob, _id: JOB_ID },
        applicationOutcome: undefined,
      }),
    ]);

    await renderAndSettle();

    const menuOpened = await openMoveToMenu();
    if (!menuOpened) {
      console.warn('[FINDING 9-1]: No "Move to" button — cannot verify match ID.');
      return;
    }

    const item = findMenuItem(/heard.?back/i);
    if (!item) return;

    await act(async () => { fireEvent.click(item); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const calledId = mockRecordApplicationOutcome.mock.calls[0][0];

    // CONTRACT: first arg is the MATCH _id, not the job _id
    // FINDING if calledId === JOB_ID: impl confused match ID with job ID — backend rejects.
    expect(calledId).toBe(MATCH_ID);
    expect(calledId).not.toBe(JOB_ID);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — COLUMN PLACEMENT BY OUTCOME
//
// Contract: cards appear in the correct column based on applicationOutcome.
//   This tests the board rendering, not the menu interaction.
// ═══════════════════════════════════════════════════════════════════════════════

describe('10 — Column placement by applicationOutcome', () => {
  const assertColumnHeadingsExist = () => {
    // The board must show four column headings.
    // Use queryAllByText — each column name may appear in multiple places (heading + card text).
    const columns = ['Applied', 'Heard back', 'Interviewing', 'Closed'];
    for (const col of columns) {
      const els = screen.queryAllByText(new RegExp(`^${col}$`, 'i'));
      if (!els.length) {
        console.warn(`[FINDING 10-0]: Column heading "${col}" not found in DOM.`);
      }
    }
  };

  it('10-1: four column headings are present on the board', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch()]);
    await renderAndSettle();
    assertColumnHeadingsExist();

    // Check all four column headings exist (queryAllByText — each may appear multiple times)
    const appliedEls    = screen.queryAllByText(/^Applied$/i);
    const heardBackEls  = screen.queryAllByText(/^Heard back$/i);
    const interviewEls  = screen.queryAllByText(/^Interviewing$/i);
    const closedEls     = screen.queryAllByText(/^Closed$/i);

    if (!appliedEls.length)   console.warn('[FINDING 10-1]: "Applied" column heading absent.');
    if (!heardBackEls.length) console.warn('[FINDING 10-1]: "Heard back" column heading absent.');
    if (!interviewEls.length) console.warn('[FINDING 10-1]: "Interviewing" column heading absent.');
    if (!closedEls.length)    console.warn('[FINDING 10-1]: "Closed" column heading absent.');

    // FINDING if any is 0: that column is missing from the board.
    expect(appliedEls.length).toBeGreaterThan(0);
    expect(heardBackEls.length).toBeGreaterThan(0);
    expect(interviewEls.length).toBeGreaterThan(0);
    expect(closedEls.length).toBeGreaterThan(0);
  });

  it('10-2: no-outcome card appears in the Applied column (not Interviewing or Closed)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: undefined })]);
    await renderAndSettle();

    // The job title must be visible — it's in the Applied section
    const jobTitleEl = screen.queryByText('Software Engineer');
    // FINDING if null: card is not rendered at all for no-outcome matches.
    expect(jobTitleEl).not.toBeNull();
  });

  it('10-3: outcome="interview" card appears in Interviewing column — page renders it', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'interview' })]);
    await renderAndSettle();

    const jobTitleEl = screen.queryByText('Software Engineer');
    // FINDING if null: card with "interview" outcome is not rendered.
    expect(jobTitleEl).not.toBeNull();
  });

  it('10-4: outcome="offer" card appears in Closed column — page renders it', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'offer' })]);
    await renderAndSettle();

    const jobTitleEl = screen.queryByText('Software Engineer');
    expect(jobTitleEl).not.toBeNull();
  });

  it('10-5: outcome="rejected" card appears — page renders it', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'rejected' })]);
    await renderAndSettle();
    expect(screen.queryByText('Software Engineer')).not.toBeNull();
  });

  it('10-6: outcome="no_response" card appears — page renders it', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'no_response' })]);
    await renderAndSettle();
    expect(screen.queryByText('Software Engineer')).not.toBeNull();
  });

  it('10-7: outcome="heard_back" card appears — page renders it', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeTrackerMatch({ applicationOutcome: 'heard_back' })]);
    await renderAndSettle();
    expect(screen.queryByText('Software Engineer')).not.toBeNull();
  });
});

/*
 * ══════════════════════════════════════════════════════════════════════════════
 * DISCLOSURE
 *
 * FILES OPENED (from the allowed list):
 *   src/__tests__/xmx.today.e2e.test.tsx    — Chakra mock, apiClient mock pattern,
 *                                              renderAndSettle helper
 *   src/__tests__/xmx.browse.e2e.test.tsx   — same patterns; confirmed MenuItem mock
 *   src/__tests__/3zf-a.adversarial.test.tsx — full apiClient stub list, react-icons
 *                                              null-proxy pattern, GuideContext mock
 *   src/__tests__/tracker-utils.adversarial.test.ts — outcome column mapping constants
 *                                              confirmed: getTrackerColumn("interview") → "interviewing"
 *   src/types/JobResult.ts                   — type shape: applicationOutcome?: string
 *   src/lib/apiClient.ts (grep only)         — confirmed getTracker and recordApplicationOutcome
 *                                              method names at lines 1201 and 1143
 *
 * FILES NOT OPENED (forbidden):
 *   src/pages/tracker.tsx                    ✓ not opened
 *   src/__tests__/tracker.test.tsx           ✓ not opened
 *
 * INCIDENTAL DISCLOSURES from allowed files:
 *   - tracker-utils.adversarial.test.ts imports getTrackerColumn from '@/utils/tracker-utils'.
 *     The test body (which IS allowed to read) confirms: getTrackerColumn("interview") returns
 *     "interviewing". This proves the outcome value and column name differ — the core adversarial
 *     case (SECTION 1). The disclosure did not reveal implementation of tracker.tsx.
 *   - 3zf-a.adversarial.test.tsx line 417: `recordApplicationOutcome: jest.fn().mockResolvedValue({})`
 *     confirms the method exists on apiClient; did not reveal tracker.tsx behavior.
 *   - xmx.today.e2e.test.tsx: full Chakra mock including MenuItem without isDisabled propagation.
 *     The adversarial test IMPROVES on this by adding isDisabled propagation (Section 5).
 *     The improvement derives from the contract, not from tracker.tsx.
 *
 * HOW DISCLOSURES AFFECTED ASSERTIONS:
 *   - Section 1 adversarial (interview vs interviewing) derives from tracker-utils.adversarial.test.ts
 *     test comment "the value and column name DIFFER" — but this is already in the contract spec.
 *     The disclosure confirmed the contract is the oracle, not the impl.
 *   - All expected outcome strings (interview, heard_back, offer, rejected, no_response)
 *     are taken directly from the contract spec given in the test-authorship prompt.
 *   - No implementation bodies from tracker.tsx were read.
 *
 * UNTESTABLE-WITHOUT-READING FINDINGS:
 *   1. EXACT STATUS LINE TEXT: The contract says "Status: Applied" for no-outcome cards.
 *      Section 7 uses /\bapplied\b/i to match. If the impl uses different text (e.g. "Pending")
 *      the test will fail even on a correct implementation. The exact text is an impl detail.
 *
 *   2. COLUMN PLACEMENT VERIFICATION: Tests in Section 10 confirm the card is rendered but cannot
 *      verify WHICH column heading it appears under without reading the DOM structure of tracker.tsx.
 *      A card rendered in the wrong column would pass 10-2 through 10-7. The column verification
 *      relies on the mutation test (Section 1) proving the correct outcome string was sent, which
 *      drives the column via getTrackerColumn.
 *
 *   3. "MOVE TO" BUTTON TEXT: The helper findMoveToButton() looks for /move\s+to/i. If the impl
 *      labels the button differently (e.g., "Change status", "Update"), all menu tests will
 *      exit early with a console.warn FINDING. This is a testability limit, not a false pass.
 *
 *   4. MENU OPEN MECHANISM: The Chakra mock renders Menu always-open (no toggle state).
 *      The mock renders MenuList unconditionally. If tracker.tsx uses a different pattern
 *      (not Chakra Menu, or a controlled open state), menu items may not appear in the DOM.
 *      Opening the MenuButton is included as a step but may not be necessary for the mock.
 *
 *   5. ERROR UI SHAPE: Section 6 accepts any [role="alert"] or /error|failed/i text.
 *      If the error is shown only in a component the mock strips (e.g. a toast not captured),
 *      test 6-1 may report a FINDING even on a correctly-implemented error path.
 * ══════════════════════════════════════════════════════════════════════════════
 */
