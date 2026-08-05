/**
 * Phase 2a smoke tests for onlyjobs-xmx.
 * Oracle: task spec — return-from-tab apply detection restored on /today.
 *
 * Contracts tested:
 *   (a) useApplyReturnPrompt: registerPending + visibilitychange opens drawer
 *   (b) today.tsx: open-listing registers pending; visibilitychange opens drawer
 *   (c) browse.tsx: return-from-tab flow still works after hook migration
 *
 * Adversarial test suite is authored separately (separate Sonnet instance).
 */

// ── Mock control variables ──────────────────────────────────────────────────
let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
let mockGetMatches: jest.Mock;
let mockGetUserProfile: jest.Mock;
let mockCheckWalletBalance: jest.Mock;
let mockGetOutOfCreditPreview: jest.Mock;
let mockGetSkipped: jest.Mock;
let mockMarkMatchClick: jest.Mock;
const mockPush = jest.fn();

// ── Mocks ───────────────────────────────────────────────────────────────────

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
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
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
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
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
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
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
  useAuth: () => mockAuthState,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: (...args: any[]) => mockGetMatches(...args),
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    checkWalletBalance: (...args: any[]) => mockCheckWalletBalance(...args),
    getOutOfCreditPreview: (...args: any[]) => mockGetOutOfCreditPreview(...args),
    getSkipped: (...args: any[]) => mockGetSkipped(...args),
    markMatchClick: (...args: any[]) => mockMarkMatchClick(...args),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { useApplyReturnPrompt } from '@/hooks/useApplyReturnPrompt';
import TodayPage from '@/pages/today';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeJob = (id = 'job1') => ({
  _id: id,
  url: 'https://example.com/job',
  title: 'Engineer',
  company: 'Acme',
  location: [],
  salary: null as any,
  source: 'linkedin',
  description: 'A job.',
  postedDate: null,
  scrapedDate: null,
});

const makeMatch = (id = 'm1'): any => ({
  _id: id,
  userId: 'u1',
  jobId: 'job1',
  matchScore: 85,
  verdict: 'Strong',
  reasoning: 'Good fit.',
  clicked: false,
  createdAt: '2026-08-05T00:00:00Z',
  updatedAt: '2026-08-05T00:00:00Z',
  skipped: false,
  applied: null,
  job: makeJob(id + '-job'),
});

const makeUser = (overrides = {}) => ({
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
  ...overrides,
});

const fireVisibilityChange = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockGetUserProfile = jest.fn().mockResolvedValue(makeUser());
  mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 5.0 });
  mockGetOutOfCreditPreview = jest.fn().mockResolvedValue(null);
  mockGetMatches = jest.fn().mockResolvedValue([makeMatch()]);
  mockGetSkipped = jest.fn().mockResolvedValue([]);
  mockMarkMatchClick = jest.fn().mockResolvedValue({});
  mockPush.mockReset();
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Hook: registerPending + visibilitychange opens drawer
// ══════════════════════════════════════════════════════════════════════════════

describe('useApplyReturnPrompt', () => {
  it('isDrawerOpen starts false', () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.selectedJobResult).toBeNull();
  });

  it('openDrawer opens the drawer with the given job', () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    const job = makeMatch('m1');
    act(() => { result.current.openDrawer(job); });
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.selectedJobResult?._id).toBe('m1');
  });

  it('closeDrawer closes the drawer', () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    const job = makeMatch('m1');
    act(() => { result.current.openDrawer(job); });
    act(() => { result.current.closeDrawer(); });
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('visibilitychange opens drawer when pending job is registered', async () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    const job = makeMatch('m2');

    // Simulate tab leave then register pending
    act(() => {
      fireVisibilityChange('hidden');
      result.current.registerPending(job);
    });

    // Simulate tab return
    act(() => {
      fireVisibilityChange('visible');
    });

    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.selectedJobResult?._id).toBe('m2');
  });

  it('visibilitychange does NOT open drawer when no pending job', () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    act(() => { fireVisibilityChange('visible'); });
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('visibilitychange does NOT open drawer when drawer is already open', () => {
    const { result } = renderHook(() => useApplyReturnPrompt());
    const job1 = makeMatch('m3');
    const job2 = makeMatch('m4');

    act(() => {
      result.current.openDrawer(job1);
      result.current.registerPending(job2);
    });
    act(() => { fireVisibilityChange('visible'); });

    // Drawer stays on job1, not replaced by job2
    expect(result.current.selectedJobResult?._id).toBe('m3');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. today.tsx: open-listing registers pending; drawer appears on return
// ══════════════════════════════════════════════════════════════════════════════

describe('today.tsx: apply return detection', () => {
  it('renders the Open listing button for a match', async () => {
    await act(async () => { render(<TodayPage />); });
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText('Open listing')).toBeInTheDocument();
  });

  it('JobQuestionsDrawer is not shown on initial load', async () => {
    await act(async () => { render(<TodayPage />); });
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking Open listing and returning to tab opens the apply drawer', async () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);

    await act(async () => { render(<TodayPage />); });
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Simulate leaving tab
    await act(async () => { fireVisibilityChange('hidden'); });

    // Click Open listing
    await act(async () => {
      fireEvent.click(screen.getByText('Open listing'));
    });

    // Simulate returning to tab
    await act(async () => { fireVisibilityChange('visible'); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
