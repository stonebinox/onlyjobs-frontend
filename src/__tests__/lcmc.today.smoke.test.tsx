/**
 * Smoke tests for onlyjobs-lcmc / v2uc: show-more, backfill, visited subview.
 * Light Phase 2a suite; the adversarial suite is authored separately.
 */

// ─── Mock control variables ───────────────────────────────────────────────────

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: URLSearchParams;

// ─── API mock ─────────────────────────────────────────────────────────────────

const mockUnskipMatch = jest.fn();
const mockGetSkipped = jest.fn();
const mockGetVisited = jest.fn();
const mockMarkMatchApplied = jest.fn();
const mockMarkMatchAsSkipped = jest.fn();
const mockMarkMatchClick = jest.fn();
let mockUseRealBriefEntry = false;
let mockToastRenders: any[] = [];
const mockGetMatches = jest.fn();
const mockGetUserProfile = jest.fn();
const mockCheckWalletBalance = jest.fn();
const mockGetOutOfCreditPreview = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => mockSearchParams,
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
    List: makeEl('ul'),
    ListItem: makeEl('li'),
    ListIcon: () => null,
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Link: ({ children, href }: any) => React.createElement('a', { href }, children),
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: jest.fn(() => {
      const toastFn = jest.fn((opts: any) => {
        if (opts?.render) mockToastRenders.push(opts.render({ onClose: jest.fn() }));
      });
      return toastFn;
    }),
    useBreakpointValue: (vals: any) =>
      vals && typeof vals === 'object' ? vals.base ?? Object.values(vals)[0] : vals,
    useColorModeValue: (light: any) => light,
    extendTheme: (t: any) => t,
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

jest.mock('@/components/CookieConsent', () => ({
  CookieConsent: () => null,
}));

jest.mock('@/components/SEO', () => ({
  SEO: () => null,
}));

jest.mock('@/components/Footer', () => ({
  Footer: () => null,
}));

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/Dashboard/OutOfCreditPreview', () => ({
  OutOfCreditPreview: () => null,
}));

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('react-icons/fi', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-icons/tb', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-icons/bs', () => new Proxy({}, { get: () => () => null }));

jest.mock('@/components/Today/BriefEntry', () => ({
  BriefEntry: (props: any) => {
    const { entry, onSkipped } = props;
    const Real = mockUseRealBriefEntry
      ? jest.requireActual('@/components/Today/BriefEntry').BriefEntry
      : null;
    return React.createElement(
      'div',
      { 'data-testid': `brief-entry-${entry._id}` },
      Real
        ? React.createElement(Real, props)
        : React.createElement(
            'button',
            { onClick: () => onSkipped(entry._id), 'data-testid': `skip-btn-${entry._id}` },
            'Skip'
          )
    );
  },
}));

jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  JobQuestionsDrawer: ({ isOpen, jobResult, onStatusUpdate }: any) =>
    isOpen && jobResult
      ? React.createElement(
          'button',
          { 'data-testid': 'drawer-yes', onClick: () => onStatusUpdate?.(jobResult._id, true) },
          'drawer yes'
        )
      : null,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    getMatches: mockGetMatches,
    getUserProfile: mockGetUserProfile,
    checkWalletBalance: mockCheckWalletBalance,
    getOutOfCreditPreview: mockGetOutOfCreditPreview,
    unskipMatch: mockUnskipMatch,
    getSkipped: mockGetSkipped,
    getVisited: mockGetVisited,
    markMatchApplied: mockMarkMatchApplied,
    markMatchAsSkipped: mockMarkMatchAsSkipped,
    markMatchClick: mockMarkMatchClick,
  })),
}));

// ─── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, act, waitFor, fireEvent, within } from '@testing-library/react';
import TodayPage from '@/pages/today';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeJob = (id: string, score = 80) => ({
  _id: id,
  userId: 'user1',
  jobId: `job-${id}`,
  matchScore: score,
  verdict: 'Good match',
  reasoning: 'Test',
  clicked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  skipped: false,
  applied: null,
  job: {
    _id: `job-${id}`,
    title: `Role ${id}`,
    company: `Company ${id}`,
    location: ['Remote'],
    salary: { min: 50000, max: 100000, currency: 'USD' },
    tags: [],
    source: 'test',
    description: 'desc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postedDate: new Date().toISOString(),
    scrapedDate: new Date().toISOString(),
    url: `https://example.com/job/${id}`,
  },
});

const makeVisitedJob = (id: string, applied: boolean | null = null) => ({
  ...makeJob(id),
  clicked: true,
  applied,
  ...(applied === false ? { notAppliedReason: { category: 'salary' } } : {}),
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockUnskipMatch.mockClear();
  mockGetSkipped.mockClear();
  mockGetMatches.mockClear();
  mockGetUserProfile.mockClear();
  mockCheckWalletBalance.mockClear();
  mockGetOutOfCreditPreview.mockClear();

  mockAuthState = { isReady: true, isLoggedIn: true };
  mockSearchParams = new URLSearchParams();

  mockGetUserProfile.mockResolvedValue({ preferences: { minScore: 30 } });
  mockCheckWalletBalance.mockResolvedValue({ balance: 10, hasSufficientBalance: true });
  mockGetOutOfCreditPreview.mockResolvedValue({ shouldShow: false, reason: 'ok', walletBalance: 10, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] });
  mockGetMatches.mockResolvedValue([]);
  mockGetSkipped.mockResolvedValue([]);
  mockGetVisited.mockReset();
  mockGetVisited.mockResolvedValue([]);
  mockMarkMatchApplied.mockReset();
  mockMarkMatchApplied.mockResolvedValue({});
  mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });
  mockUseRealBriefEntry = false;
  mockToastRenders = [];
});

const cardIds = () =>
  screen.queryAllByTestId(/^brief-entry-/).map((el) => el.getAttribute('data-testid'));

describe('today show-more + backfill (smoke)', () => {
  it('reveals matches in batches of five and drops the control when none remain', async () => {
    mockGetMatches.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makeJob(`j${i}`, 90 - i))
    );
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(cardIds()).toHaveLength(5));
    fireEvent.click(screen.getByRole('button', { name: 'Show 5 more (7 remaining)' }));
    await waitFor(() => expect(cardIds()).toHaveLength(10));
    fireEvent.click(screen.getByRole('button', { name: 'Show 2 more' }));
    await waitFor(() => expect(cardIds()).toHaveLength(12));
    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).toBeNull();
  });

  it('promotes the next match when a card is skipped', async () => {
    mockGetMatches.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => makeJob(`j${i}`, 90 - i))
    );
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(cardIds()).toHaveLength(5));
    expect(screen.queryByTestId('brief-entry-j5')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByTestId('skip-btn-j0'));
    });
    await waitFor(() => expect(screen.queryByTestId('brief-entry-j0')).toBeNull());
    await waitFor(() => expect(screen.getByTestId('brief-entry-j5')).toBeInTheDocument());
    expect(cardIds()).toHaveLength(5);
    expect(mockGetMatches).toHaveBeenCalledTimes(1);
  });
});

describe('today undo vs. late click recording (regression)', () => {
  it('does not restore an opened card via Undo when the click resolves after the skip', async () => {
    mockUseRealBriefEntry = true;
    mockMarkMatchAsSkipped.mockResolvedValue({});
    let resolveClick!: (v: unknown) => void;
    mockMarkMatchClick.mockReturnValue(new Promise((res) => { resolveClick = res; }));
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    mockGetMatches.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => makeJob(`j${i}`, 90 - i))
    );
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(cardIds()).toHaveLength(5));

    const card = within(screen.getByTestId('brief-entry-j0'));
    fireEvent.click(card.getByRole('button', { name: 'Open listing' }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(mockMarkMatchClick).toHaveBeenCalledWith('j0');

    // Skip BEFORE the click resolves
    fireEvent.click(card.getByRole('button', { name: 'Not for me' }));
    await act(async () => {
      fireEvent.click(card.getByRole('button', { name: 'Salary too low' }));
    });
    await act(async () => {
      fireEvent.click(card.getByRole('button', { name: 'Skip this job' }));
    });
    await waitFor(() => expect(screen.queryByTestId('brief-entry-j0')).toBeNull());
    expect(mockMarkMatchAsSkipped).toHaveBeenCalledWith('j0', 'salary', undefined);

    // Click now resolves, after the skip
    await act(async () => {
      resolveClick({});
    });

    // Press Undo in the skip toast
    const skipToast = mockToastRenders[mockToastRenders.length - 1];
    const { getByRole: toastQuery } = render(skipToast);
    await act(async () => {
      fireEvent.click(toastQuery('button', { name: 'Undo' }));
    });
    expect(mockUnskipMatch).toHaveBeenCalledWith('j0');
    await act(async () => {});
    expect(screen.queryByTestId('brief-entry-j0')).toBeNull();
    openSpy.mockRestore();
  });
});

describe('today visited subview (smoke)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('view=visited');
  });

  it('fetches visited rows only in this view and labels applied:false rows', async () => {
    mockGetVisited.mockResolvedValue([makeVisitedJob('a', null), makeVisitedJob('b', false)]);
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(screen.getByText('Role a')).toBeInTheDocument());
    expect(screen.getByText(/Didn't apply:\s*Salary too low/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Actually, I applied' })).toHaveLength(1);
    expect(mockGetMatches).not.toHaveBeenCalled();
  });

  it('does not fetch visited rows in the brief', async () => {
    mockSearchParams = new URLSearchParams();
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(mockGetMatches).toHaveBeenCalled());
    expect(mockGetVisited).not.toHaveBeenCalled();
  });

  it('"Actually, I applied" removes the row only after success', async () => {
    mockGetVisited.mockResolvedValue([makeVisitedJob('b', false)]);
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(screen.getByText('Role b')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Actually, I applied' }));
    });
    expect(mockMarkMatchApplied).toHaveBeenCalledWith('b', true);
    await waitFor(() => expect(screen.queryByText('Role b')).toBeNull());
  });

  it('shows the error state when the fetch fails', async () => {
    mockGetVisited.mockResolvedValue({ error: 'nope' });
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() =>
      expect(screen.getByText('Failed to load opened jobs')).toBeInTheDocument()
    );
  });
});
