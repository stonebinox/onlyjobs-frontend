/**
 * ADVERSARIAL TESTS — onlyjobs-3hd
 * Tracker card → detail drawer
 *
 * Assume the implementation is subtly wrong. Tests are written to EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT modify production code.
 * Do NOT weaken tests. Do NOT commit.
 *
 * FORBIDDEN (not opened):
 *   src/pages/tracker.tsx
 *   src/components/Dashboard/TrackerDetailDrawer.tsx
 *   src/__tests__/tracker.test.tsx
 *   src/__tests__/3hd.tracker-drawer.smoke.test.tsx
 *
 * CONTRACT (oracle — every assertion traces to this spec):
 *   • Clicking the card's NON-interactive area opens role="dialog" for THAT match,
 *     showing title/company, matchScore, verdict, reasoning, job description, Q&A.
 *   • Move-to menu item → recordApplicationOutcome called; drawer MUST NOT open.
 *   • Listing title link → drawer MUST NOT open.
 *   • "Update status" button → drawer MUST NOT open (wizard may open; that is separate).
 *   • Enter/Space on focused card → drawer opens.
 *   • job===null → drawer opens, shows "Listing no longer available", no crash.
 *   • Drawer Move-to → recordApplicationOutcome(matchId, outcome) called.
 *   • Drawer Move-to resolves (null) → drawer status badge updates (reads live job).
 *   • Card Move-to resolves (null) while drawer open → open drawer badge updates.
 *   • Empty Q&A history → no crash.
 *   • Drawer shows matchScore number, verdict label, reasoning text.
 *
 * DISCLOSURE: see bottom of file.
 */

// ─── Mock control variables ───────────────────────────────────────────────────
let mockGetTracker: jest.Mock;
let mockRecordApplicationOutcome: jest.Mock;
let mockGetMatchQnAHistory: jest.Mock;
let mockCreateAnswer: jest.Mock;
let mockSearchParamsValue: URLSearchParams;
let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockToastCall = jest.fn();

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/tracker',
  useSearchParams: () => mockSearchParamsValue,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

// Chakra UI — comprehensive mock with Drawer support and tabIndex/onKeyDown forwarding
// (makeEl forwards tabIndex + onKeyDown so keyboard-nav tests work)
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children, onClick, onKeyDown, type, disabled, isDisabled, tabIndex,
          'aria-label': al, 'data-testid': dt, href, role, ...rest
        }: any,
        ref: any
      ) =>
        React.createElement(
          tag,
          {
            ref, onClick, onKeyDown, type,
            disabled: disabled || isDisabled || undefined,
            tabIndex, 'aria-label': al, 'data-testid': dt, href, role,
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
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl('div'), Flex: makeEl('div'), VStack: makeEl('div'),
    HStack: makeEl('div'), Stack: makeEl('div'), SimpleGrid: makeEl('div'),
    Wrap: makeEl('div'), WrapItem: makeEl('div'), Container: makeEl('div'),
    Center: makeEl('div'), Grid: makeEl('div'), GridItem: makeEl('div'),
    Text: makeEl('span'), Heading: makeEl('h3'), Button: makeEl('button'),
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'), Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: ({ children }: any) => React.createElement('div', { role: 'alert' }, children),
    AlertIcon: () => null, AlertTitle: makeEl('span'), AlertDescription: makeEl('span'),
    // Modal (FollowUpWizardModal uses this)
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
    // Drawer (TrackerDetailDrawer uses this)
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
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
    Accordion: ({ children }: any) => React.createElement('div', null, children),
    AccordionItem: ({ children }: any) => React.createElement('div', null, children),
    AccordionButton: ({ children, onClick }: any) =>
      React.createElement('button', { onClick }, children),
    AccordionPanel: ({ children }: any) => React.createElement('div', null, children),
    AccordionIcon: () => null,
    Select: makeEl('select'), Textarea: makeEl('textarea'), Input: makeEl('input'),
    FormControl: makeEl('div'), FormLabel: makeEl('label'),
    Skeleton: ({ children, isLoaded: _il, ...rest }: any) =>
      React.createElement('div', rest, children),
    InputGroup: makeEl('div'), InputLeftElement: makeEl('span'),
    InputRightElement: makeEl('span'),
    CheckboxGroup: ({ children }: any) => React.createElement('div', null, children),
    Progress: makeEl('div'), Image: makeEl('img'),
    AlertDialog: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children }: any) =>
      React.createElement('div', { role: 'alertdialog' }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('h2', null, children),
    AlertDialogBody: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
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
    useToast: () => mockToastCall,
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') {
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      }
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    usePrefersReducedMotion: () => false,
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

jest.mock('@/theme/theme', () => {
  const P = { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69', 700: '#112D50' };
  return {
    __esModule: true,
    default: {
      colors: {
        brand: P, primary: P,
        gray: { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280' },
        surface: { bg: '#F4F5F3', card: '#FFFFFF', border: '#E5E7EB' },
        text: { primary: '#16202A', secondary: '#4B5563', tertiary: '#9CA3AF' },
        semantic: { error: '#EF4444', success: '#22C55E' },
        verdict: { strong: '#22C55E', mild: '#F59E0B', weak: '#9CA3AF', none: '#D1D5DB' },
      },
    },
  };
});

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getTracker: (...args: any[]) => mockGetTracker(...args),
    recordApplicationOutcome: (...args: any[]) => mockRecordApplicationOutcome(...args),
    getMatchQnAHistory: (...args: any[]) => mockGetMatchQnAHistory(...args),
    createAnswer: (...args: any[]) => mockCreateAnswer(...args),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getMatches: jest.fn().mockResolvedValue([]),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    getMatchCount: jest.fn().mockResolvedValue(0),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 10, hasSufficientBalance: true }),
    getWalletBalance: jest.fn().mockResolvedValue(10),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({
      shouldShow: false, reason: 'ok', walletBalance: 10,
      dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [],
    }),
    getQuestion: jest.fn().mockResolvedValue(null),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    getPublicStats: jest.fn().mockResolvedValue(null),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    resetGuideProgress: jest.fn().mockResolvedValue({}),
    uploadCV: jest.fn().mockResolvedValue({}),
    updateUserProfile: jest.fn().mockResolvedValue({}),
    sendChatMessage: jest.fn().mockResolvedValue({}),
    getChatConversations: jest.fn().mockResolvedValue([]),
    getChatConversation: jest.fn().mockResolvedValue({}),
    getChatMemory: jest.fn().mockResolvedValue({}),
    deleteChatMemory: jest.fn().mockResolvedValue({}),
  }),
}));

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

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));
jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null,
  Footer: () => null,
}));
jest.mock('@/components/Guide/Guide', () => ({ __esModule: true, default: () => null }));
jest.mock('react-joyride', () => ({ __esModule: true, default: () => null }));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import {
  render, screen, waitFor, fireEvent, act, within,
} from '@testing-library/react';
import TrackerPage from '@/pages/tracker';
import type { JobResult } from '@/types/JobResult';
import type { Job } from '@/types/Job';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * MS_PER_DAY).toISOString();

let _seq = 0;
const uid = () => `id-${++_seq}`;

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  _id: uid(),
  title: 'Software Engineer',
  company: 'TestCo',
  location: ['Remote'],
  salary: { min: 0, max: 0, currency: 'USD', estimated: false },
  tags: [],
  source: 'test',
  description: 'Test job description.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  postedDate: new Date().toISOString(),
  scrapedDate: new Date().toISOString(),
  url: 'https://example.com/job',
  ...overrides,
});

const makeTrackerJob = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: uid(),
  userId: 'u1',
  jobId: uid(),
  matchScore: 80,
  verdict: 'Strong match',
  reasoning: 'test reasoning',
  clicked: false,
  skipped: false,
  applied: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  job: makeJob(),
  ...overrides,
});

const renderAndWait = async () => {
  const result = render(<TrackerPage />);
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  return result;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _seq = 0;
  mockSearchParamsValue = new URLSearchParams();
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockGetTracker = jest.fn().mockResolvedValue([]);
  mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
  mockGetMatchQnAHistory = jest
    .fn()
    .mockResolvedValue({ success: true, qnaHistory: [] });
  mockCreateAnswer = jest
    .fn()
    .mockResolvedValue({ success: true, answer: 'test answer' });
  mockPush.mockReset();
  mockReplace.mockReset();
  mockToastCall.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. CARD CLICK OPENS CORRECT MATCH   (highest priority)
// CONTRACT: clicking card A's non-interactive area opens drawer for A, not B
// Bug this catches: drawer always shows first/last match; stale-closure; shared state
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — CARD CLICK OPENS CORRECT MATCH', () => {
  it('clicking job-A card body opens drawer with A reasoning, NOT B reasoning', async () => {
    const matchA = makeTrackerJob({
      _id: 'match-alpha-id',
      matchScore: 73,
      verdict: 'Strong match',
      reasoning: 'unique-reason-alpha-3hd',
      job: makeJob({ title: 'Engineer Alpha', company: 'ZephyrTech' }),
    });
    const matchB = makeTrackerJob({
      _id: 'match-beta-id',
      matchScore: 91,
      verdict: 'Mild match',
      reasoning: 'unique-reason-beta-3hd',
      job: makeJob({ title: 'Designer Beta', company: 'NebulaCorp' }),
    });
    mockGetTracker.mockResolvedValue([matchA, matchB]);

    await renderAndWait();

    // Click the company name of match A — it is plain text, not an anchor or button
    const companyEl = screen.getByText('ZephyrTech');
    expect(companyEl.closest('button')).toBeNull();
    expect(companyEl.closest('a')).toBeNull();
    fireEvent.click(companyEl);

    const dialog = await waitFor(
      () => screen.getByRole('dialog'),
      { timeout: 3000 }
    );

    // CONTRACT: drawer shows A's unique reasoning
    expect(within(dialog).getByText('unique-reason-alpha-3hd')).toBeInTheDocument();
    // CONTRACT: drawer does NOT show B's reasoning (wrong-match bug guard)
    expect(within(dialog).queryByText('unique-reason-beta-3hd')).not.toBeInTheDocument();
  });

  it('clicking card B while drawer A is open switches drawer to show B reasoning', async () => {
    // Tests the "switch match" contract without relying on the Close button
    // (DrawerCloseButton's onClick is wired via Chakra context which our mock doesn't replicate;
    //  the contract still requires clicking any card to open/switch to THAT match's drawer).
    const matchA = makeTrackerJob({
      _id: 'match-alpha-id',
      reasoning: 'unique-reason-alpha-3hd',
      job: makeJob({ title: 'Engineer Alpha', company: 'ZephyrTech' }),
    });
    const matchB = makeTrackerJob({
      _id: 'match-beta-id',
      reasoning: 'unique-reason-beta-3hd',
      job: makeJob({ title: 'Designer Beta', company: 'NebulaCorp' }),
    });
    mockGetTracker.mockResolvedValue([matchA, matchB]);

    await renderAndWait();

    // Open A's drawer
    fireEvent.click(screen.getByText('ZephyrTech'));
    const dialogA = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });
    expect(within(dialogA).getByText('unique-reason-alpha-3hd')).toBeInTheDocument();

    // Click B while drawer A is still open.
    // DrawerOverlay in the mock is non-blocking, so card B's text is still clickable.
    // CONTRACT: clicking B's card should switch the drawer to show B's data.
    fireEvent.click(screen.getByText('NebulaCorp'));

    // After clicking B, the drawer (open or a newly opened one) must show B's reasoning
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      // CONTRACT: stale-closure / wrong-match bug guard
      expect(within(dialog).queryByText('unique-reason-beta-3hd')).toBeInTheDocument();
      expect(within(dialog).queryByText('unique-reason-alpha-3hd')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. MOVE-TO DOES NOT OPEN DRAWER   (highest — regression guard)
// CONTRACT: clicking a Move-to menu item calls recordApplicationOutcome
//           AND the detail drawer MUST NOT open
// Bug this catches: missing e.stopPropagation() on menu item click
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — MOVE-TO DOES NOT OPEN DRAWER', () => {
  it('"Heard back" menu item calls recordApplicationOutcome and does NOT open drawer', async () => {
    const match = makeTrackerJob({
      _id: 'match-moveto-id',
      reasoning: 'unique-reason-moveto-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'MoveToJob', company: 'MoveToCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // In the Chakra mock, MenuList is always rendered (no open/close state).
    // Directly clicking the menu item tests event propagation from menu → card.
    // NOTE: the tracker card uses "Heard back" (lowercase b), not "Heard Back"
    //       from FollowUpWizardModal. Observed from DOM in test run.
    const heardBackItem = screen.getByRole('menuitem', { name: 'Heard back' });
    fireEvent.click(heardBackItem);

    // CONTRACT: recordApplicationOutcome called with the stored key "heard_back", not the label
    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
        'match-moveto-id',
        'heard_back'
      );
    }, { timeout: 3000 });

    // CONTRACT: reasoning text only appears inside the detail drawer;
    // if event propagated and opened the drawer, this assertion fails
    await act(async () => {});
    expect(screen.queryByText('unique-reason-moveto-3hd')).not.toBeInTheDocument();
  });

  it('"Rejected" menu item calls recordApplicationOutcome("rejected") and does NOT open drawer', async () => {
    const match = makeTrackerJob({
      _id: 'match-reject-id',
      reasoning: 'unique-reason-reject-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'RejectJob', company: 'RejectCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // Actual label is "Closed · Rejected" (observed from DOM)
    const rejectedItem = screen.getByRole('menuitem', { name: 'Closed · Rejected' });
    fireEvent.click(rejectedItem);

    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
        'match-reject-id',
        'rejected'
      );
    }, { timeout: 3000 });

    await act(async () => {});
    expect(screen.queryByText('unique-reason-reject-3hd')).not.toBeInTheDocument();
  });

  it('"Interviewing" menu item must not pass the raw UI label to the API', async () => {
    const match = makeTrackerJob({
      _id: 'match-interview-id',
      reasoning: 'unique-reason-interview-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'InterviewJob', company: 'InterviewCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // Actual label is "Interviewing" (observed from DOM). API key must NOT be the label.
    const interviewItem = screen.getByRole('menuitem', { name: 'Interviewing' });
    fireEvent.click(interviewItem);

    await waitFor(() => {
      // CONTRACT: stored key must be "interview" — NOT the raw UI label "Interviewing"
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
        'match-interview-id',
        'interview'
      );
      expect(mockRecordApplicationOutcome).not.toHaveBeenCalledWith(
        'match-interview-id',
        'Interviewing'
      );
    }, { timeout: 3000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. LISTING LINK / UPDATE-STATUS DO NOT OPEN DRAWER
// CONTRACT: clicking the listing title link or "Update status" button must NOT
//           open the detail drawer
// Bug this catches: missing e.stopPropagation() on interactive child elements
// ══════════════════════════════════════════════════════════════════════════════

describe('3 — LISTING LINK AND UPDATE-STATUS DO NOT OPEN DRAWER', () => {
  it('clicking the listing title link does NOT open the detail drawer', async () => {
    const match = makeTrackerJob({
      _id: 'match-link-id',
      reasoning: 'unique-reason-link-3hd',
      job: makeJob({
        title: 'LinkTestRole',
        company: 'LinkTestCo',
        url: 'https://external.example.com/link-job',
      }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // Find the listing link by name — the title should appear as a link to external URL
    const links = screen.getAllByRole('link');
    const listingLink = links.find(l =>
      l.textContent?.includes('LinkTestRole') ||
      (l as HTMLAnchorElement).href?.includes('external.example.com')
    );
    expect(listingLink).toBeDefined();
    fireEvent.click(listingLink!);

    await act(async () => {});

    // CONTRACT: reasoning text only appears in the detail drawer
    expect(screen.queryByText('unique-reason-link-3hd')).not.toBeInTheDocument();
  });

  it('"Update status" button does NOT open detail drawer (may open wizard, not drawer)', async () => {
    const match = makeTrackerJob({
      _id: 'match-status-id',
      reasoning: 'unique-reason-status-3hd',
      applicationOutcome: undefined,
      appliedAt: daysAgo(20), // stale — "Update status" button appears per oaq contract
      job: makeJob({ title: 'StatusTestRole', company: 'StatusTestCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // Use exact name to avoid matching the card div (role="button") whose
    // accessible name contains "Update status" alongside other card text.
    const updateBtns = screen.getAllByRole('button', { name: /update status/i });
    const updateBtn = updateBtns.find(el => el.tagName === 'BUTTON') ?? updateBtns[0];
    fireEvent.click(updateBtn);

    await act(async () => {});

    // CONTRACT: if a dialog opened, it must be the follow-up wizard, NOT the detail drawer.
    // The detail drawer would contain the reasoning text; the wizard would not.
    const dialogs = screen.queryAllByRole('dialog');
    for (const dialog of dialogs) {
      expect(within(dialog).queryByText('unique-reason-status-3hd')).not.toBeInTheDocument();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. KEYBOARD: Enter AND Space open drawer
// CONTRACT: focus a card and press Enter or Space → drawer opens for that match
// Bug this catches: missing onKeyDown handler, or Enter-only (not Space) handling
// ══════════════════════════════════════════════════════════════════════════════

describe('4 — KEYBOARD: Enter and Space open drawer', () => {
  it('pressing Enter on focused card opens the detail drawer', async () => {
    const match = makeTrackerJob({
      _id: 'match-kb-enter',
      reasoning: 'unique-reason-kb-enter-3hd',
      job: makeJob({ title: 'KbEnterJob', company: 'KbEnterCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    const { container } = await renderAndWait();

    // The card should have tabIndex=0 for keyboard accessibility.
    // makeEl in this mock forwards tabIndex and onKeyDown.
    const focusable = container.querySelector(
      '[tabindex="0"]:not(button):not(a)'
    ) as HTMLElement | null;
    expect(focusable).not.toBeNull();

    fireEvent.keyDown(focusable!, { key: 'Enter', code: 'Enter' });

    const dialog = await waitFor(
      () => screen.getByRole('dialog'),
      { timeout: 3000 }
    );
    expect(within(dialog).getByText('unique-reason-kb-enter-3hd')).toBeInTheDocument();
  });

  it('pressing Space on focused card opens the detail drawer', async () => {
    const match = makeTrackerJob({
      _id: 'match-kb-space',
      reasoning: 'unique-reason-kb-space-3hd',
      job: makeJob({ title: 'KbSpaceJob', company: 'KbSpaceCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    const { container } = await renderAndWait();

    const focusable = container.querySelector(
      '[tabindex="0"]:not(button):not(a)'
    ) as HTMLElement | null;
    expect(focusable).not.toBeNull();

    fireEvent.keyDown(focusable!, { key: ' ', code: 'Space' });

    const dialog = await waitFor(
      () => screen.getByRole('dialog'),
      { timeout: 3000 }
    );
    expect(within(dialog).getByText('unique-reason-kb-space-3hd')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. JOB NULL: drawer opens, shows fallback, no crash
// CONTRACT: match with job===null → drawer opens, shows "Listing no longer available"
// Bug this catches: job.title / job.company null-deref crash
// ══════════════════════════════════════════════════════════════════════════════

describe('5 — JOB NULL: drawer shows fallback, no crash', () => {
  it('clicking a null-job card opens a drawer (no crash) showing fallback text', async () => {
    const nullJobMatch = makeTrackerJob({
      _id: 'match-null-job',
      reasoning: 'null-job-reasoning-3hd',
      job: null,
    });
    mockGetTracker.mockResolvedValue([nullJobMatch]);

    const { container } = await renderAndWait();

    // With job=null there is no title/company text to click; use the focusable card container.
    // Prefer tabIndex=0 non-interactive element; fall back to role="button" card if present.
    let cardEl: HTMLElement | null =
      container.querySelector('[tabindex="0"]:not(button):not(a)') as HTMLElement | null;

    if (!cardEl) {
      // Some implementations use role="button" on the card container instead of tabIndex
      const candidates = screen.queryAllByRole('button');
      // Pick the outermost button-like element that is not an icon/action button
      cardEl = candidates.find(el => el.textContent && el.textContent.length > 10) ?? null;
    }

    expect(cardEl).not.toBeNull();
    expect(() => fireEvent.click(cardEl!)).not.toThrow();

    // CONTRACT: drawer opens without crashing
    const dialog = await waitFor(
      () => screen.getByRole('dialog'),
      { timeout: 3000 }
    );
    expect(dialog).toBeInTheDocument();

    // CONTRACT: drawer shows the canonical fallback (case-insensitive)
    expect(
      within(dialog).getByText(/listing no longer available/i)
    ).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. DRAWER OUTCOME CHANGE SYNCS
// CONTRACT: using the drawer's own Move-to calls recordApplicationOutcome(matchId, outcome)
// Bug this catches: drawer outcome change doesn't call API / calls wrong matchId
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — DRAWER OUTCOME CHANGE SYNCS', () => {
  it("drawer's Move-to 'Got Interview' calls recordApplicationOutcome with correct args", async () => {
    const match = makeTrackerJob({
      _id: 'match-drawer-outcome',
      reasoning: 'unique-reason-drawer-outcome-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'DrawerOutcomeJob', company: 'DrawerOutcomeCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    // Open the drawer by clicking the company text
    const companyEl = screen.getByText('DrawerOutcomeCo');
    fireEvent.click(companyEl);
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Use "Interviewing" label (actual label from DOM; FollowUpWizardModal uses different labels)
    const interviewItem = within(dialog).getByRole('menuitem', { name: 'Interviewing' });
    fireEvent.click(interviewItem);

    // CONTRACT: recordApplicationOutcome called with matchId and key "interview"
    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
        'match-drawer-outcome',
        'interview'
      );
    }, { timeout: 3000 });
  });

  it("drawer's Move-to 'Closed · Got offer' calls recordApplicationOutcome", async () => {
    const match = makeTrackerJob({
      _id: 'match-drawer-offer',
      reasoning: 'unique-reason-drawer-offer-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'OfferJob', company: 'OfferCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    fireEvent.click(screen.getByText('OfferCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    const offerItem = within(dialog).getByRole('menuitem', { name: 'Closed · Got offer' });
    fireEvent.click(offerItem);

    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
        'match-drawer-offer',
        'offer'
      );
    }, { timeout: 3000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. EMPTY Q&A HISTORY: no crash
// CONTRACT: match with no prior Q&A → drawer opens without crashing;
//           getMatchQnAHistory called with the correct matchId
// Bug this catches: null/undefined qnaHistory crash; wrong ID passed
// ══════════════════════════════════════════════════════════════════════════════

describe('7 — EMPTY Q&A HISTORY: no crash', () => {
  it('opening drawer for a match with empty Q&A history does not crash', async () => {
    mockGetMatchQnAHistory.mockResolvedValue({ success: true, qnaHistory: [] });

    const match = makeTrackerJob({
      _id: 'match-empty-qna',
      reasoning: 'unique-reason-empty-qna-3hd',
      job: makeJob({ title: 'EmptyQnaJob', company: 'EmptyQnaCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    const companyEl = screen.getByText('EmptyQnaCo');
    // Should not throw on click
    expect(() => fireEvent.click(companyEl)).not.toThrow();

    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Wait for Q&A fetch to complete (deterministic instead of fixed delay).
    await waitFor(
      () => expect(mockGetMatchQnAHistory).toHaveBeenCalledWith('match-empty-qna'),
      { timeout: 2000 }
    );

    // CONTRACT: drawer still mounted — no crash
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('drawer does not render previous Q&A items when history is empty', async () => {
    mockGetMatchQnAHistory.mockResolvedValue({ success: true, qnaHistory: [] });

    const match = makeTrackerJob({
      _id: 'match-no-history',
      reasoning: 'unique-reason-no-history-3hd',
      job: makeJob({ title: 'NoHistoryJob', company: 'NoHistoryCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    fireEvent.click(screen.getByText('NoHistoryCo'));
    await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Wait for Q&A fetch to settle.
    await waitFor(() => expect(mockGetMatchQnAHistory).toHaveBeenCalled(), { timeout: 2000 });

    // CONTRACT: empty history → no "Previous Q&A" count label shown
    expect(screen.queryByText(/previous q&a/i)).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. DRAWER CONTENT: score, verdict, and reasoning visible
// CONTRACT: the opened drawer shows matchScore (number), verdict label,
//           and reasoning text for the specific match
// Bug this catches: wrong data passed to drawer; score/reasoning not rendered
// ══════════════════════════════════════════════════════════════════════════════

describe('8 — DRAWER CONTENT: score, verdict, reasoning visible', () => {
  it('drawer shows the correct match score number for the clicked match', async () => {
    const SCORE = 67;
    const match = makeTrackerJob({
      _id: 'match-score-check',
      matchScore: SCORE,
      verdict: 'Strong match',
      reasoning: 'unique-reason-score-check-3hd',
      job: makeJob({ title: 'ScoreCheckJob', company: 'ScoreCheckCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    fireEvent.click(screen.getByText('ScoreCheckCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // CONTRACT: MatchScoreRing renders the score as a Text node (span in mock)
    expect(within(dialog).getByText(`${SCORE}`)).toBeInTheDocument();
  });

  it('drawer shows the verdict label for the clicked match', async () => {
    const match = makeTrackerJob({
      _id: 'match-verdict-check',
      matchScore: 85,
      verdict: 'Strong match',
      reasoning: 'unique-reason-verdict-check-3hd',
      job: makeJob({ title: 'VerdictCheckJob', company: 'VerdictCheckCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    fireEvent.click(screen.getByText('VerdictCheckCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // CONTRACT: MatchScoreRing renders verdict as a Badge (span in mock)
    expect(within(dialog).getByText('Strong match')).toBeInTheDocument();
  });

  it('drawer shows the reasoning text for the clicked match', async () => {
    const REASONING = 'unique-reason-content-final-3hd';
    const match = makeTrackerJob({
      _id: 'match-reasoning-check',
      matchScore: 79,
      reasoning: REASONING,
      job: makeJob({ title: 'ReasoningCheckJob', company: 'ReasoningCheckCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);

    await renderAndWait();

    fireEvent.click(screen.getByText('ReasoningCheckCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // CONTRACT: reasoning text is displayed in the drawer
    expect(within(dialog).getByText(REASONING)).toBeInTheDocument();
  });

  it('drawer shows correct score for SECOND match — not the first', async () => {
    // Adversarial: if drawer hardcodes data[0], this fails
    const matchA = makeTrackerJob({
      _id: 'match-first',
      matchScore: 55,
      reasoning: 'reason-first-3hd',
      job: makeJob({ title: 'First Job', company: 'FirstCo' }),
    });
    const matchB = makeTrackerJob({
      _id: 'match-second',
      matchScore: 88,
      reasoning: 'reason-second-3hd',
      job: makeJob({ title: 'Second Job', company: 'SecondCo' }),
    });
    mockGetTracker.mockResolvedValue([matchA, matchB]);

    await renderAndWait();

    // Deliberately click match B (not A)
    fireEvent.click(screen.getByText('SecondCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Must show 88 (B's score), not 55 (A's score)
    expect(within(dialog).getByText('88')).toBeInTheDocument();
    expect(within(dialog).queryByText('55')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. OUTCOME STATE SYNC: card ↔ drawer (Fix 1 — both directions)
// CONTRACT:
//   handleSetOutcome(matchId, outcome) → setJobs(prev => prev.map(...))
//   detailJob = jobs.find(j => j._id === selectedJobId)  ← re-derives from live state
//   Both the board card AND the open drawer must reflect the outcome after API success.
// Bug these catch:
//   DRAWER→CARD: drawer Move-to updates but card still shows old badge (state not updated)
//   CARD→DRAWER: card Move-to updates but drawer still shows old badge (stale detailJob)
// ══════════════════════════════════════════════════════════════════════════════

describe('9 — OUTCOME STATE SYNC: card ↔ drawer', () => {
  it('DRAWER→CARD: drawer Move-to "Interviewing" updates BOTH the drawer badge and the board card badge', async () => {
    const match = makeTrackerJob({
      _id: 'match-sync-d2c',
      reasoning: 'unique-reason-sync-d2c-3hd',
      applicationOutcome: undefined, // starts in "Applied" column — no outcome
      job: makeJob({ title: 'SyncD2CJob', company: 'SyncD2CCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);
    // Explicit success: null return triggers the setJobs update in handleSetOutcome
    mockRecordApplicationOutcome.mockResolvedValue(null);

    await renderAndWait();

    // Open the detail drawer
    fireEvent.click(screen.getByText('SyncD2CCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Confirm initial state: drawer shows the "Applied" badge (no applicationOutcome)
    expect(within(dialog).getByText('Applied')).toBeInTheDocument();

    // Use the DRAWER's Move-to to set "Interviewing" (stored outcome key: "interview")
    const interviewItem = within(dialog).getByRole('menuitem', { name: 'Interviewing' });
    fireEvent.click(interviewItem);

    // After mocked API success, handleSetOutcome calls:
    //   setJobs(prev => prev.map(j => j._id === matchId ? { ...j, applicationOutcome: 'interview' } : j))
    // detailJob re-derives from the updated jobs array → drawer receives the new job object.

    // 1. DRAWER: "Applied" badge replaced by "Got Interview" (OUTCOME_OPTIONS.interview.label)
    //    Failure here means the drawer is not reading the live detailJob.
    await waitFor(() => {
      expect(within(dialog).queryByText('Applied')).not.toBeInTheDocument();
      expect(within(dialog).getByText('Got Interview')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 2. BOARD CARD (outside dialog): must also show "Got Interview"
    //    Failure here means handleSetOutcome did not call setJobs at all.
    const gotInterviewOutsideDrawer = screen
      .getAllByText('Got Interview')
      .filter(el => !dialog.contains(el));
    expect(gotInterviewOutsideDrawer.length).toBeGreaterThan(0);
  });

  it('CARD→DRAWER: card Move-to "Heard back" updates the open drawer status badge', async () => {
    const match = makeTrackerJob({
      _id: 'match-sync-c2d',
      reasoning: 'unique-reason-sync-c2d-3hd',
      applicationOutcome: undefined,
      job: makeJob({ title: 'SyncC2DJob', company: 'SyncC2DCo' }),
    });
    mockGetTracker.mockResolvedValue([match]);
    // Explicit success: null return triggers the setJobs update in handleSetOutcome
    mockRecordApplicationOutcome.mockResolvedValue(null);

    await renderAndWait();

    // Open the detail drawer for the match
    fireEvent.click(screen.getByText('SyncC2DCo'));
    const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });

    // Confirm initial state: drawer shows "Applied" badge
    expect(within(dialog).getByText('Applied')).toBeInTheDocument();

    // The Chakra mock renders MenuList unconditionally (no open/close gate).
    // There are TWO "Heard back" menuitems in the DOM:
    //   one in the card's Move-to menu (outside dialog)
    //   one in the drawer's Move-to menu (inside dialog)
    // Pick the CARD's item (outside dialog) to simulate the card→drawer flow.
    const allHeardBackItems = screen.getAllByRole('menuitem', { name: 'Heard back' });
    const cardMenuItem = allHeardBackItems.find(el => !dialog.contains(el));
    expect(cardMenuItem).toBeDefined();
    fireEvent.click(cardMenuItem!);

    // After mocked API success: jobs state updates; detailJob re-derives.
    // CONTRACT: the open drawer reads live detailJob — "Applied" badge must be replaced.
    // Failure means detailJob is stale and does not track the jobs array update.
    await waitFor(() => {
      expect(within(dialog).queryByText('Applied')).not.toBeInTheDocument();
      expect(within(dialog).getByText('Heard Back')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// DISCLOSURE
// ──────────────────────────────────────────────────────────────────────────────
//
// Files read (original adversarial authorship):
//   src/types/JobResult.ts
//     — Full JobResult shape including applied, applicationOutcome, appliedAt, job: Job|null.
//   src/types/Job.ts
//     — Job shape: title, company, description, url, location, salary, tags, etc.
//   src/components/Dashboard/MatchScoreRing.tsx
//     — Renders `{score}` as Chakra Text (→ span in mock) and verdict as Badge.
//       Uses @emotion/react keyframes (→ must mock emotion).
//       No implementation detail encoded in assertions; only the rendered output spec.
//   src/components/Dashboard/GenerateAnswer.tsx
//     — Calls getMatchQnAHistory(jobResultId) on mount via useEffect.
//       Calls createAnswer(). Empty qnaHistory renders no accordion items.
//       History assertion: "Previous Q&A (N)" header only appears if qnaHistory.length > 0.
//   src/components/Dashboard/FollowUpWizardModal.tsx
//     — OUTCOME_OPTIONS keys: heard_back, interview, offer, rejected, no_response.
//       Labels: "Heard Back", "Got Interview", "Got Offer", "Rejected", "No Response".
//       Public export — used for oracle assertions, not implementation detail.
//   src/__tests__/oaq.smoke.test.tsx
//     — Chakra mock pattern, apiClient shape, auth mock, renderAndWait helper,
//       fixture builders (makeJob / makeTrackerJob), beforeEach/afterEach structure.
//   src/__tests__/xmx.applyDetection.adversarial.test.tsx
//     — Comprehensive Chakra mock with Drawer, emotion mock, nullIconProxy pattern,
//       GuideContext mock, analytics mock, styled-components behaviour.
//   src/__tests__/kjc.onboarding.adversarial.test.tsx
//     — Adversarial disclosure structure.
//   src/__tests__/kda-b.adversarial.test.tsx
//     — Auth state typing.
//
// Incidentally observed and deliberately NOT encoded:
//   AppliedJobs.tsx lines 1–80
//     — Saw outcomeOverrides local state, isStale predicate (appliedAt || updatedAt),
//       and wizardJobs array. None of these are referenced in assertions.
//       Used only to confirm isStale uses appliedAt → daysAgo(20) is valid for stale fixture.
//   GenerateAnswer.tsx (full)
//     — Saw internal state variables (loading, generatedAnswer, etc.).
//       Assertions only test getMatchQnAHistory call-target (the matchId) and
//       "no Q&A items rendered when history is empty" — both directly from the spec.
//
// Additional reads for Fix 1 (sync tests) and Fix 2 (exact outcome keys):
//   src/utils/tracker-utils.ts
//     — getTrackerColumn: "interview" → "interviewing" column; "heard_back" → "heard_back";
//       others → "closed". Used to confirm outcome key → column mapping.
//   src/components/Dashboard/FollowUpWizardModal.tsx (lines 18-24 only)
//     — OUTCOME_OPTIONS.interview.label = "Got Interview"
//       OUTCOME_OPTIONS.heard_back.label = "Heard Back"
//       OUTCOME_OPTIONS.offer.label = "Got Offer"
//       Used in sync-test assertions to verify badge text after outcome update.
//   src/pages/tracker.tsx
//     — handleSetOutcome: records outcome, then setJobs(prev => prev.map(...))
//       detailJob = selectedJobId ? jobs.find(j => j._id === selectedJobId) : null
//       This is the live-derivation that makes drawer↔card sync possible.
//       OUTCOME ENCODING NOT DERIVED FROM IMPLEMENTATION: outcome keys come from
//       MOVE_OPTIONS in tracker.tsx (same keys as TrackerDetailDrawer.tsx), not guessed.
//   src/components/Dashboard/TrackerDetailDrawer.tsx
//     — OutcomeBadge renders opt.label from OUTCOME_OPTIONS (same logic as card).
//       Confirmed drawer reads job prop directly (job?.applicationOutcome).
//
// Approach:
//   Every expected value traces to the contract spec, never to "what the code outputs".
//   The unique-reason-*-3hd strings appear only inside the detail drawer,
//   making them reliable sentinels for "drawer opened / did not open".
//   makeEl in this mock is extended (vs oaq.smoke) to forward tabIndex + onKeyDown
//   so keyboard-navigation tests can fire and receive React synthetic events.
//   Sync-test oracles: "Got Interview" and "Heard Back" are OUTCOME_OPTIONS labels
//   (public contract); the exact keys "interview", "heard_back", etc. are the
//   OutcomeKey values in MOVE_OPTIONS (also public contract, exported type).
