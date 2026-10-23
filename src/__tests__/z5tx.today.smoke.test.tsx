/**
 * Smoke tests for onlyjobs-z5tx S3: rejection-signal toasts and "Keep showing" action.
 */

// ─── Mock control variables ───────────────────────────────────────────────────

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: URLSearchParams;

// ─── API mock ─────────────────────────────────────────────────────────────────

const mockUnskipMatch = jest.fn();
const mockRevokeBlock = jest.fn();
let mockSkipSignal: any = null;
let mockDrawerOpen = false;
const mockGetSkipped = jest.fn();
const mockGetVisited = jest.fn();
const mockMarkMatchApplied = jest.fn();
const mockMarkMatchAsSkipped = jest.fn();
const mockMarkMatchClick = jest.fn();
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
  BriefEntry: ({ entry, onSkipped }: any) =>
    React.createElement(
      'div',
      { 'data-testid': `brief-entry-${entry._id}` },
      React.createElement(
        'button',
        { onClick: () => onSkipped(entry._id, mockSkipSignal), 'data-testid': `skip-btn-${entry._id}` },
        'Skip'
      )
    ),
}));

jest.mock('@/hooks/useApplyReturnPrompt', () => ({
  useApplyReturnPrompt: () => ({
    selectedJobResult: mockDrawerOpen ? { _id: 'j1', applied: null } : null,
    isDrawerOpen: mockDrawerOpen,
    registerPending: jest.fn(),
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  JobQuestionsDrawer: ({ isOpen, jobResult, onStatusUpdate }: any) =>
    isOpen && jobResult
      ? React.createElement(
          'button',
          { 'data-testid': 'drawer-no', onClick: () => onStatusUpdate?.(jobResult._id, false, mockSkipSignal) },
          'drawer no'
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
    revokeBlock: mockRevokeBlock,
    getSkipped: mockGetSkipped,
    getVisited: mockGetVisited,
    markMatchApplied: mockMarkMatchApplied,
    markMatchAsSkipped: mockMarkMatchAsSkipped,
    markMatchClick: mockMarkMatchClick,
  })),
}));

// ─── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
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
    company: 'Tether',
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

const tempSignal = {
  scope: 'company',
  company: 'Tether',
  duration: 'temporary',
  blockedUntil: '2026-12-22T12:00:00.000Z',
};

beforeEach(() => {
  mockRevokeBlock.mockReset();
  mockUnskipMatch.mockReset();
  mockGetMatches.mockReset();
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockSearchParams = new URLSearchParams();
  mockSkipSignal = null;
  mockDrawerOpen = false;
  mockToastRenders = [];
  mockGetUserProfile.mockResolvedValue({ preferences: { minScore: 30 } });
  mockCheckWalletBalance.mockResolvedValue({ balance: 10, hasSufficientBalance: true });
  mockGetOutOfCreditPreview.mockResolvedValue({ shouldShow: false, reason: 'ok', walletBalance: 10, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] });
  mockGetMatches.mockResolvedValue([makeJob('j1', 90), makeJob('j2', 80)]);
  mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });
});

const renderAndSkip = async () => {
  await act(async () => {
    render(<TodayPage />);
  });
  await waitFor(() => expect(screen.getByTestId('skip-btn-j1')).toBeInTheDocument());
  await act(async () => {
    fireEvent.click(screen.getByTestId('skip-btn-j1'));
  });
  expect(mockToastRenders).toHaveLength(1);
  await waitFor(() => expect(screen.queryByTestId('brief-entry-j1')).toBeNull());
  return render(mockToastRenders[0]);
};

describe('today rejection-signal toasts (smoke)', () => {
  it('temporary company signal: shows "Hiding Tether until 22 Dec." and Keep showing calls revokeBlock', async () => {
    mockSkipSignal = tempSignal;
    mockRevokeBlock.mockResolvedValue({ message: 'ok', revoked: 1 });
    const toastView = await renderAndSkip();
    expect(toastView.getByText('Hiding Tether until 22 Dec.')).toBeInTheDocument();
    expect(toastView.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(toastView.getByRole('button', { name: 'Keep showing Tether' }));
    });
    expect(mockRevokeBlock).toHaveBeenCalledWith('j1');
    expect(toastView.getByText('OK - Tether will keep showing up.')).toBeInTheDocument();
    expect(toastView.queryByRole('button', { name: 'Keep showing Tether' })).toBeNull();
  });

  it('permanent company signal: "Hiding Tether permanently."', async () => {
    mockSkipSignal = { ...tempSignal, duration: 'permanent', blockedUntil: null };
    const toastView = await renderAndSkip();
    expect(toastView.getByText('Hiding Tether permanently.')).toBeInTheDocument();
  });

  it('company_role signal: "Hiding this role at Tether until 22 Dec."', async () => {
    mockSkipSignal = { ...tempSignal, scope: 'company_role' };
    const toastView = await renderAndSkip();
    expect(toastView.getByText('Hiding this role at Tether until 22 Dec.')).toBeInTheDocument();
    expect(toastView.getByRole('button', { name: 'Keep showing Tether' })).toBeInTheDocument();
  });

  it('role/attribute signal: score-lower copy and no Keep showing action', async () => {
    mockSkipSignal = { ...tempSignal, scope: 'attribute' };
    const toastView = await renderAndSkip();
    expect(toastView.getByText("Got it - we'll score similar jobs lower.")).toBeInTheDocument();
    expect(toastView.queryByRole('button', { name: /Keep showing/ })).toBeNull();
    expect(toastView.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('null signal keeps "Job skipped." with Undo only', async () => {
    mockSkipSignal = null;
    const toastView = await renderAndSkip();
    expect(toastView.getByText('Job skipped.')).toBeInTheDocument();
    expect(toastView.queryByRole('button', { name: /Keep showing/ })).toBeNull();
    expect(toastView.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('revokeBlock failure shows the backend message and leaves the card removed', async () => {
    mockSkipSignal = tempSignal;
    mockRevokeBlock.mockResolvedValue({ error: "Couldn't update your hidden companies. Please try again." });
    const toastView = await renderAndSkip();
    await act(async () => {
      fireEvent.click(toastView.getByRole('button', { name: 'Keep showing Tether' }));
    });
    expect(toastView.getByText("Couldn't update your hidden companies. Please try again.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('brief-entry-j1')).toBeNull());
    expect(mockUnskipMatch).not.toHaveBeenCalled();
  });

  it('revokeBlock throwing shows the fallback error and re-enables the button', async () => {
    mockSkipSignal = tempSignal;
    mockRevokeBlock.mockRejectedValue(new Error('network down'));
    const toastView = await renderAndSkip();
    await act(async () => {
      fireEvent.click(toastView.getByRole('button', { name: 'Keep showing Tether' }));
    });
    expect(toastView.getByText("Couldn't update your hidden companies. Please try again.")).toBeInTheDocument();
    expect(toastView.getByRole('button', { name: 'Keep showing Tether' })).not.toBeDisabled();
  });

  it('sidebar No with a company signal shows the Hiding toast with Keep showing and no Undo', async () => {
    mockDrawerOpen = true;
    mockSkipSignal = tempSignal;
    mockRevokeBlock.mockResolvedValue({ message: 'ok', revoked: 1 });
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(screen.getByTestId('drawer-no')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-no'));
    });
    expect(mockToastRenders).toHaveLength(1);
    const toastView = render(mockToastRenders[0]);
    expect(toastView.getByText('Hiding Tether until 22 Dec.')).toBeInTheDocument();
    expect(toastView.queryByRole('button', { name: 'Undo' })).toBeNull();
    await act(async () => {
      fireEvent.click(toastView.getByRole('button', { name: 'Keep showing Tether' }));
    });
    expect(mockRevokeBlock).toHaveBeenCalledWith('j1');
  });

  it('sidebar No with a null signal shows no new toast', async () => {
    mockDrawerOpen = true;
    mockSkipSignal = null;
    await act(async () => {
      render(<TodayPage />);
    });
    await waitFor(() => expect(screen.getByTestId('drawer-no')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByTestId('drawer-no'));
    });
    expect(mockToastRenders).toHaveLength(0);
  });
});
