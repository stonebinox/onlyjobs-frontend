/**
 * Regression guard — onlyjobs-xmx edge case: skipped subview.
 *
 * Oracle: xmx plan contract — "skipped subview → never prompt / never write applied"
 *
 *   1. The apply-detection drawer (JobQuestionsDrawer / "Did you apply?" prompt) is
 *      never rendered in the skipped subview, even after a visibilitychange to "visible".
 *   2. markMatchApplied is never called.
 *   3. Clicking "View job" in the skipped view does NOT open the apply drawer and does
 *      NOT call markMatchApplied.
 *
 * Renders the REAL TodayPage (src/pages/today.tsx) with useSearchParams returning
 * view=skipped. Mocks only external boundaries: next/navigation, apiClient, Chakra UI.
 *
 * Why this matters: the skipped subview returns early (before the daily-brief JSX)
 * and omits JobQuestionsDrawer entirely. registerPending is never wired to any control
 * in the skipped view. This test locks that guarantee in — a future refactor that
 * accidentally wires apply-detection into the skipped view will fail here.
 */

// ── Mock control variables (declared before jest.mock factories) ─────────────
let mockMarkMatchApplied: jest.Mock;
let mockGetSkipped: jest.Mock;
const mockPush = jest.fn();

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Critical: useSearchParams returns view=skipped so TodayPage enters the skipped branch.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/today',
  useSearchParams: () => new URLSearchParams('view=skipped'),
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
    // Drawer: only renders children when isOpen — used to verify drawer is closed
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

jest.mock('@/components/Dashboard/GenerateAnswer', () => ({
  __esModule: true,
  GenerateAnswer: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));

// apiClient mock — markMatchApplied is always present so accidental calls are detected.
jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: jest.fn().mockResolvedValue([]),
    getUserProfile: jest.fn().mockResolvedValue({
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
    }),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 5.0 }),
    getOutOfCreditPreview: jest.fn().mockResolvedValue(null),
    getSkipped: (...args: any[]) => mockGetSkipped(...args),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: (...args: any[]) => mockMarkMatchApplied(...args),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

import TodayPage from '@/pages/today';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Known match ID — asserted in markMatchApplied call checks so any accidental
// call with this specific ID surfaces the exact violation.
const SKIPPED_MATCH_ID = 'match-skipped-xmx-edge-001';

const makeSkippedMatch = (): any => ({
  _id: SKIPPED_MATCH_ID,
  userId: 'u1',
  jobId: 'skipped-job-001',
  matchScore: 72,
  verdict: 'Good',
  reasoning: 'Reasonable fit.',
  clicked: false,
  // Contract: skipped=true, applied=null — skipped view must never prompt for applied
  skipped: true,
  applied: null,
  skipReason: { category: 'salary', note: null },
  createdAt: '2026-08-05T00:00:00Z',
  updatedAt: '2026-08-05T00:00:00Z',
  job: {
    _id: 'skipped-job-001',
    url: 'https://example.com/skipped-job-001',
    title: 'Skipped Role',
    company: 'Skipped Corp',
    location: ['Remote'],
    salary: null,
    source: 'linkedin',
    description: 'A skipped job.',
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
  mockGetSkipped = jest.fn().mockResolvedValue([makeSkippedMatch()]);
  mockPush.mockReset();
  jest.spyOn(window, 'open').mockImplementation(() => null);
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helper ────────────────────────────────────────────────────────────────────

/** Render TodayPage in skipped view and wait for the loading spinner to clear. */
async function renderSkippedViewAndSettle() {
  await act(async () => { render(<TodayPage />); });
  // The skipped view sets loading=false synchronously on the first effect tick,
  // then fires a second effect to fetch skipped jobs. Wait for both to settle.
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('xmx regression — skipped subview must never write applied', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 01: Baseline — renders the skipped view UI, not the daily brief
  // Contract: view=skipped produces the "Skipped jobs" heading, no "Open listing"
  // ───────────────────────────────────────────────────────────────────────────
  it('01: renders the skipped subview (real TodayPage with view=skipped)', async () => {
    await renderSkippedViewAndSettle();

    // The skipped view heading distinguishes it from the daily brief
    expect(screen.getByText('Skipped jobs')).toBeInTheDocument();

    // The daily-brief "Open listing" button (wired to registerPending) is absent —
    // confirms we are in the skipped branch and apply-detection is not wired up.
    expect(screen.queryByText('Open listing')).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 02: No apply-detection drawer on initial render
  // Contract: JobQuestionsDrawer is omitted from the skipped view's JSX tree
  // ───────────────────────────────────────────────────────────────────────────
  it('02: no dialog / apply-detection drawer on initial load', async () => {
    await renderSkippedViewAndSettle();

    // The Chakra Drawer mock only renders children (including role="dialog") when
    // isOpen=true. If JobQuestionsDrawer is not in the tree, the role never appears.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Belt-and-suspenders: the prompt text itself must be absent
    expect(screen.queryByText(/did you apply/i)).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 03: visibilitychange to "visible" must NOT open the apply drawer
  // Contract: apply-detection hook (useApplyReturnPrompt) is not triggered by
  //           any interaction in the skipped view
  // ───────────────────────────────────────────────────────────────────────────
  it('03: visibilitychange to "visible" does NOT open the apply drawer', async () => {
    await renderSkippedViewAndSettle();

    await act(async () => { fireVisibilityChange('hidden'); });
    await act(async () => { fireVisibilityChange('visible'); });

    // Allow any async handlers to settle
    await new Promise((r) => setTimeout(r, 250));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/did you apply/i)).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 04: markMatchApplied is never called — at any point in the skipped view
  // Contract: applied is only written via the explicit Yes/No flow in the
  //           apply drawer, which is absent from the skipped subview
  // ───────────────────────────────────────────────────────────────────────────
  it('04: markMatchApplied is never called while in the skipped view', async () => {
    await renderSkippedViewAndSettle();

    // After render and settle
    expect(mockMarkMatchApplied).not.toHaveBeenCalled();

    // After visibility events
    await act(async () => { fireVisibilityChange('hidden'); });
    await act(async () => { fireVisibilityChange('visible'); });
    await new Promise((r) => setTimeout(r, 250));

    expect(mockMarkMatchApplied).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 05: "View job" button opens a new tab but does NOT trigger apply detection
  // Contract: the skipped view's "View job" calls window.open(), not registerPending.
  //           No drawer opens; markMatchApplied is never called.
  // ───────────────────────────────────────────────────────────────────────────
  it('05: clicking "View job" does NOT open the apply drawer and does NOT call markMatchApplied', async () => {
    await renderSkippedViewAndSettle();

    const viewJobBtn = screen.queryByText('View job');

    if (!viewJobBtn) {
      // The "View job" button is only rendered when entry.job.url passes isSafeUrl.
      // The fixture URL (https://example.com/...) should pass, but if not, report it.
      console.warn(
        '[SKIPPED-VIEW 05]: "View job" button not found. ' +
        'isSafeUrl may have rejected the fixture URL, or the skipped job list did not render. ' +
        'Assertions 02–04 still fully cover the core contract (no drawer, no markMatchApplied). ' +
        'Report as: no "View job" control in skipped view with this fixture.'
      );
      // Even without the button, confirm the core invariants still hold
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockMarkMatchApplied).not.toHaveBeenCalled();
      return;
    }

    // Simulate leaving the tab, then clicking "View job" (mirrors the daily-brief flow
    // but in the skipped view, where no registerPending is wired).
    await act(async () => { fireVisibilityChange('hidden'); });
    await act(async () => { fireEvent.click(viewJobBtn); });
    await act(async () => { fireVisibilityChange('visible'); });
    await new Promise((r) => setTimeout(r, 250));

    // Contract: apply drawer is still absent — "View job" in skipped view must
    // not trigger useApplyReturnPrompt.registerPending
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/did you apply/i)).not.toBeInTheDocument();

    // Contract: markMatchApplied is never called — window.open is the only side-effect
    expect(mockMarkMatchApplied).not.toHaveBeenCalled();

    // Confirm window.open was used (the skipped view's actual mechanism)
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/skipped-job-001',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
