/**
 * Gap 3 — /today: no-resume CTA must appear when the user HAS matches
 *
 * Contract: "shown whenever profile has no CV, regardless of match count"
 * (see today.tsx comment on the no-resume nudge block).
 *
 * Oracle: the CTA is NOT gated behind the zero-match empty state.
 * A user with an empty resume AND non-empty matches must still see
 * a link to /onboarding so they can improve their profile.
 *
 * FINDING if the test fails: the /onboarding CTA is only shown in the
 * empty-match state and disappears when matches exist — the user loses
 * the profile-improvement prompt exactly when they're most engaged.
 */

// ── Mock control variables ────────────────────────────────────────────────────

let mockGetMatches: jest.Mock;
let mockGetUserProfile: jest.Mock;
let mockCheckWalletBalance: jest.Mock;
let mockGetOutOfCreditPreview: jest.Mock;
let mockGetSkipped: jest.Mock;

const mockPush = jest.fn();

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

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
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    Slider: makeEl('div'),
    SliderTrack: makeEl('div'),
    SliderFilledTrack: makeEl('div'),
    SliderThumb: makeEl('div'),
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

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: (...args: any[]) => mockGetMatches(...args),
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    checkWalletBalance: (...args: any[]) => mockCheckWalletBalance(...args),
    getOutOfCreditPreview: (...args: any[]) => mockGetOutOfCreditPreview(...args),
    getSkipped: (...args: any[]) => mockGetSkipped(...args),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

import TodayPage from '@/pages/today';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeMatch = (): any => ({
  _id: 'match-kjc-gap3-001',
  userId: 'u1',
  jobId: 'job1',
  matchScore: 72,
  verdict: 'Good',
  reasoning: 'Solid fit.',
  clicked: false,
  applied: null,
  skipped: false,
  createdAt: '2026-08-06T00:00:00Z',
  updatedAt: '2026-08-06T00:00:00Z',
  job: {
    _id: 'job-kjc-001',
    url: 'https://example.com/job-kjc-001',
    title: 'Frontend Engineer',
    company: 'TestCo',
    location: ['Remote'],
    salary: null,
    source: 'linkedin',
    description: 'A test role.',
    postedDate: null,
    scrapedDate: null,
  },
});

// User with NO meaningful resume
const USER_NO_RESUME = {
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
};

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetMatches = jest.fn().mockResolvedValue([makeMatch()]);
  mockGetUserProfile = jest.fn().mockResolvedValue(USER_NO_RESUME);
  mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 5.0 });
  mockGetOutOfCreditPreview = jest.fn().mockResolvedValue(null);
  mockGetSkipped = jest.fn().mockResolvedValue([]);
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

/** Render TodayPage and wait for the loading spinner to clear. */
async function renderAndSettle() {
  await act(async () => { render(<TodayPage />); });
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('kjc gap3 — /today: no-resume CTA present regardless of match count', () => {

  it(
    'user with NO resume AND non-empty matches → /onboarding link is present ' +
    '(CTA is not gated to the zero-match empty state)',
    async () => {
      // Confirm the setup: matches is non-empty AND resume is null
      // (i.e. this is the with-matches + no-resume scenario, not the empty state)
      const matches = await mockGetMatches();
      expect(matches.length).toBeGreaterThan(0);
      expect(USER_NO_RESUME.resume).toBeNull();

      await renderAndSettle();

      // Contract: the no-resume nudge is shown "whenever profile has no CV,
      // regardless of match count" (today.tsx comment).
      // The link renders as <a href="/onboarding"> via the NextLink mock.
      //
      // FINDING if null: the /onboarding CTA is missing when matches exist —
      // it is incorrectly gated to the zero-match empty state only.
      const onboardingLink = document.querySelector('a[href="/onboarding"]');
      expect(onboardingLink).not.toBeNull();

      // Also assert the CTA text is visible so we know the right element was found
      const body = document.body.textContent ?? '';
      expect(/add.*cv|cv.*unlock|unlock.*match|onboarding/i.test(body)).toBe(true);
    }
  );
});
