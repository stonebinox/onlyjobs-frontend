/**
 * Smoke tests for /browse page — Phase 2a only.
 * Oracle: onlyjobs-q3y spec (kda-A).
 *
 * Contracts tested:
 *   (a) A verified user sees the free-tier copy and the AllJobsTab region.
 *   (b) An unverified user sees the "verify your email" prompt and NOT the jobs list.
 *
 * Files deliberately NOT opened (implementation isolation):
 *   src/pages/browse.tsx — assertions derive solely from the spec.
 *
 * Files read (allowed):
 *   src/__tests__/tracker.test.tsx — Chakra mock pattern (copied verbatim)
 *   src/lib/apiClient.ts — method names for stub coverage
 *   src/contexts/AuthContext.tsx — interface shape for mock
 */

// ─── Mock control variables ────────────────────────────────────────────────────

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
let mockGetUserProfile: jest.Mock;
let mockCheckWalletBalance: jest.Mock;
const mockPush = jest.fn();

// ─── Mocks (all jest.mock() calls are hoisted) ─────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/browse',
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
  SEO: ({ noindex }: any) =>
    noindex
      ? React.createElement('meta', { name: 'robots', content: 'noindex' })
      : null,
}));

// AllJobsTab — mocked so browse page tests don't depend on its internals.
jest.mock('@/components/AllJobsTab', () => ({
  __esModule: true,
  AllJobsTab: () =>
    React.createElement('div', { 'data-testid': 'all-jobs-tab' }),
}));

// JobQuestionsDrawer — mocked to avoid drawer dependency chain.
jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  __esModule: true,
  JobQuestionsDrawer: () => null,
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    checkWalletBalance: (...args: any[]) => mockCheckWalletBalance(...args),
  }),
}));

// ─── Imports (must follow all jest.mock() calls) ───────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BrowsePage from '@/pages/browse';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeVerifiedUser = () => ({
  id: 'u1',
  name: 'Test User',
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

const makeUnverifiedUser = () => ({
  ...makeVerifiedUser(),
  isVerified: false,
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockGetUserProfile = jest.fn().mockResolvedValue(makeVerifiedUser());
  mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 5.00 });
  mockPush.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderAndWait = async () => {
  const result = render(<BrowsePage />);
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. Verified user sees free-tier copy and AllJobsTab
//    Contract: a verified, logged-in user visiting /browse sees the
//    free-tier messaging and the job list component.
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — verified user sees free-tier copy and AllJobsTab', () => {
  it('renders the Browse heading', async () => {
    mockGetUserProfile.mockResolvedValue(makeVerifiedUser());
    await renderAndWait();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('renders free-tier copy confirming browsing and applying are free', async () => {
    mockGetUserProfile.mockResolvedValue(makeVerifiedUser());
    await renderAndWait();
    // Contract: the page must clearly communicate the free-tier value proposition.
    expect(
      screen.getByText(/browsing and applying are always free/i)
    ).toBeInTheDocument();
  });

  it('renders the AllJobsTab region for a verified user', async () => {
    mockGetUserProfile.mockResolvedValue(makeVerifiedUser());
    await renderAndWait();
    expect(screen.getByTestId('all-jobs-tab')).toBeInTheDocument();
  });

  it('does NOT show the verify-email prompt for a verified user', async () => {
    mockGetUserProfile.mockResolvedValue(makeVerifiedUser());
    await renderAndWait();
    expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Unverified user sees verify prompt, NOT the jobs list
//    Contract: the backend /api/jobs rejects unverified users (403), so
//    /browse must gate on isVerified and show a clear call to action instead.
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — unverified user sees verify prompt, NOT AllJobsTab', () => {
  it('renders the "Verify your email" prompt for an unverified user', async () => {
    mockGetUserProfile.mockResolvedValue(makeUnverifiedUser());
    await renderAndWait();
    expect(
      screen.getByText(/verify your email to browse jobs/i)
    ).toBeInTheDocument();
  });

  it('does NOT render the AllJobsTab for an unverified user', async () => {
    mockGetUserProfile.mockResolvedValue(makeUnverifiedUser());
    await renderAndWait();
    expect(screen.queryByTestId('all-jobs-tab')).not.toBeInTheDocument();
  });

  it('renders the Browse heading even for unverified users (page still loads)', async () => {
    mockGetUserProfile.mockResolvedValue(makeUnverifiedUser());
    await renderAndWait();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });
});
