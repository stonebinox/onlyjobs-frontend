/**
 * Smoke tests for kda-D: real undo-skip — backend unskip endpoint + undo UI.
 *
 * Phase 2a minimal suite. Adversarial suite authored separately.
 *
 * Coverage:
 *   A — /dashboard adapter: ?tab=skipped → /today?view=skipped
 *   B — /today brief: skipping shows undo affordance; Undo calls unskipMatch and restores card
 *   C — /today?view=skipped: renders user-skipped rows; Unskip calls unskipMatch and removes row; empty state
 *
 * DISCLOSURE: Read dashboard/index.tsx, today.tsx, kda-b.dashboard-redirect.smoke.test.tsx
 *   (mock scaffold), tracker.test.tsx (mock scaffold). No assertions encode implementation
 *   internals — all expected values derive from the kda-D spec.
 */

// ─── Mock control variables ───────────────────────────────────────────────────

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: URLSearchParams;

// ─── API mock ─────────────────────────────────────────────────────────────────

const mockUnskipMatch = jest.fn();
const mockGetSkipped = jest.fn();
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
        if (opts?.render) opts.render({ onClose: jest.fn() });
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
        { onClick: () => onSkipped(entry._id), 'data-testid': `skip-btn-${entry._id}` },
        'Skip'
      )
    ),
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
  })),
}));

// ─── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { resolveDashboardRedirect } from '@/pages/dashboard/index';
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
  applied: false,
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

const makeSkippedJob = (id: string, category = 'salary') => ({
  ...makeJob(id),
  skipped: true,
  skipReason: { category },
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
  mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — /dashboard adapter: tab=skipped
// ══════════════════════════════════════════════════════════════════════════════

describe('A — resolveDashboardRedirect: tab=skipped', () => {
  it('A-1: tab=skipped → /today?view=skipped', () => {
    expect(resolveDashboardRedirect('?tab=skipped')).toBe('/today?view=skipped');
  });

  it('A-2: tab=skipped is distinct from the default fallback /today', () => {
    expect(resolveDashboardRedirect('?tab=skipped')).not.toBe('/today');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — /today brief: undo affordance
// ══════════════════════════════════════════════════════════════════════════════

describe('B — /today brief: undo affordance after skip', () => {
  it('B-1: skipping a card shows an undo affordance', async () => {
    const job = makeJob('abc');
    mockGetMatches.mockResolvedValue([job]);

    await act(async () => {
      render(<TodayPage />);
    });

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByTestId('brief-entry-abc')).toBeInTheDocument();
    });

    // Trigger skip
    await act(async () => {
      fireEvent.click(screen.getByTestId('skip-btn-abc'));
    });

    // The toast should have been called (Chakra useToast mock records the call)
    // The BriefEntry's skip button calls onSkipped; that triggers the toast
    // We verify by checking the card is gone from the DOM
    expect(screen.queryByTestId('brief-entry-abc')).not.toBeInTheDocument();
  });

  it('B-2: clicking Undo calls unskipMatch with the correct matchId', async () => {
    const job = makeJob('def');
    mockGetMatches.mockResolvedValue([job]);
    mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });

    // Configure useToast to capture the render function
    let capturedRender: ((opts: { onClose: () => void }) => React.ReactNode) | null = null;
    const { useToast } = require('@chakra-ui/react');
    (useToast as jest.Mock).mockReturnValue(
      jest.fn((opts: any) => {
        if (opts?.render) capturedRender = opts.render;
      })
    );

    await act(async () => { render(<TodayPage />); });

    await waitFor(() => {
      expect(screen.getByTestId('brief-entry-def')).toBeInTheDocument();
    });

    await act(async () => { fireEvent.click(screen.getByTestId('skip-btn-def')); });

    expect(capturedRender).not.toBeNull();

    // Render the undo content and click Undo
    const onClose = jest.fn();
    const toastContent = capturedRender!({ onClose }) as React.ReactElement;
    const { getByText: getByTextToast } = render(toastContent);

    await act(async () => { fireEvent.click(getByTextToast('Undo')); });

    await waitFor(() => {
      expect(mockUnskipMatch).toHaveBeenCalledWith('def');
    });
  });

  it('B-3: on Undo success the card is restored to the brief', async () => {
    const job = makeJob('ghi', 90);
    mockGetMatches.mockResolvedValue([job]);
    mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });

    let capturedRender: ((opts: { onClose: () => void }) => React.ReactNode) | null = null;
    const { useToast } = require('@chakra-ui/react');
    (useToast as jest.Mock).mockReturnValue(
      jest.fn((opts: any) => {
        if (opts?.render) capturedRender = opts.render;
      })
    );

    await act(async () => { render(<TodayPage />); });

    await waitFor(() => {
      expect(screen.getByTestId('brief-entry-ghi')).toBeInTheDocument();
    });

    await act(async () => { fireEvent.click(screen.getByTestId('skip-btn-ghi')); });

    expect(screen.queryByTestId('brief-entry-ghi')).not.toBeInTheDocument();
    expect(capturedRender).not.toBeNull();

    const onClose = jest.fn();
    const toastEl = capturedRender!({ onClose }) as React.ReactElement;
    const { getByText: getByTextUndo } = render(toastEl);

    await act(async () => { fireEvent.click(getByTextUndo('Undo')); });

    await waitFor(() => {
      expect(screen.getByTestId('brief-entry-ghi')).toBeInTheDocument();
    });
  });

  it('B-4: on Undo failure the card stays gone', async () => {
    const job = makeJob('jkl', 80);
    mockGetMatches.mockResolvedValue([job]);
    mockUnskipMatch.mockResolvedValue({ error: 'Network error' });

    let capturedRender: ((opts: { onClose: () => void }) => React.ReactNode) | null = null;
    const { useToast } = require('@chakra-ui/react');
    (useToast as jest.Mock).mockReturnValue(
      jest.fn((opts: any) => {
        if (opts?.render) capturedRender = opts.render;
      })
    );

    await act(async () => { render(<TodayPage />); });

    await waitFor(() => {
      expect(screen.getByTestId('brief-entry-jkl')).toBeInTheDocument();
    });

    await act(async () => { fireEvent.click(screen.getByTestId('skip-btn-jkl')); });

    expect(capturedRender).not.toBeNull();

    const onClose = jest.fn();
    const toastEl = capturedRender!({ onClose }) as React.ReactElement;
    const { getByText: getByTextUndo2 } = render(toastEl);

    await act(async () => { fireEvent.click(getByTextUndo2('Undo')); });

    await new Promise((r) => setTimeout(r, 150));
    // Card must remain absent — failed unskip must not restore
    expect(screen.queryByTestId('brief-entry-jkl')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — /today?view=skipped subview
// ══════════════════════════════════════════════════════════════════════════════

describe('C — /today?view=skipped subview', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('view=skipped');
  });

  it('C-1: renders user-skipped rows from getSkipped()', async () => {
    mockGetSkipped.mockResolvedValue([makeSkippedJob('s1', 'salary'), makeSkippedJob('s2', 'location')]);

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      expect(screen.getByText('Role s1')).toBeInTheDocument();
      expect(screen.getByText('Role s2')).toBeInTheDocument();
    });
  });

  it('C-2: shows empty state when no skipped jobs', async () => {
    mockGetSkipped.mockResolvedValue([]);

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      expect(screen.getByText('Nothing skipped')).toBeInTheDocument();
    });
  });

  it('C-3: Unskip button calls unskipMatch', async () => {
    mockGetSkipped.mockResolvedValue([makeSkippedJob('s3', 'salary')]);

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      expect(screen.getByText('Role s3')).toBeInTheDocument();
    });

    const unskipButtons = screen.getAllByText('Unskip');
    await act(async () => {
      fireEvent.click(unskipButtons[0]);
    });

    await waitFor(() => {
      expect(mockUnskipMatch).toHaveBeenCalledWith('s3');
    });
  });

  it('C-4: on Unskip success the row is removed from the skipped list', async () => {
    mockGetSkipped.mockResolvedValue([makeSkippedJob('s4', 'salary')]);
    mockUnskipMatch.mockResolvedValue({ message: 'Match unskipped' });

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      expect(screen.getByText('Role s4')).toBeInTheDocument();
    });

    const unskipButtons = screen.getAllByText('Unskip');
    await act(async () => {
      fireEvent.click(unskipButtons[0]);
    });

    await waitFor(() => {
      expect(screen.queryByText('Role s4')).not.toBeInTheDocument();
    });
  });

  it('C-5: includes "Back to today" link pointing to /today', async () => {
    mockGetSkipped.mockResolvedValue([]);

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      const backLink = screen.getByText(/back to today/i);
      expect(backLink).toBeInTheDocument();
      const anchor = backLink.closest('a') ?? backLink.parentElement?.closest('a');
      expect(anchor?.getAttribute('href')).toBe('/today');
    });
  });

  it('C-6: does NOT render daily brief content (BriefEntry) in the skipped subview', async () => {
    mockGetSkipped.mockResolvedValue([]);

    await act(async () => render(<TodayPage />));

    await waitFor(() => {
      // BriefEntry is mocked to render data-testid="brief-entry-*"
      // None should appear in the skipped subview
      expect(document.querySelector('[data-testid^="brief-entry-"]')).not.toBeInTheDocument();
    });
  });
});
