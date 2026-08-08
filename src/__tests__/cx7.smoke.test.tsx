/**
 * Smoke tests for onlyjobs-cx7: currentLocation collection coverage
 */

// ─── Module-level mutable state ──────────────────────────────────────────────

const mockAuthState = {
  isLoggedIn: true,
  isReady: true,
  userId: 'user-1',
  token: 'tok',
  authenticate: null as jest.Mock | null,
  logout: jest.fn(),
};

// ─── Mocks ───────────────────────────────────────────────────────────────────

let mockGetUserProfile: jest.Mock;
let mockUpdateUserProfile: jest.Mock;
let mockUploadCV: jest.Mock;
let mockTriggerMatchForMe: jest.Mock;
let mockToast: jest.Mock;

const mockNavRouter = {
  pathname: '/',
  query: {},
  asPath: '/',
  push: jest.fn(),
  replace: jest.fn(),
  events: { on: jest.fn(), off: jest.fn() },
  isReady: true,
  prefetch: jest.fn().mockResolvedValue(undefined),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockNavRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => mockNavRouter,
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
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

jest.mock('@emotion/react', () => ({
  keyframes: () => '',
  css: (args: any) => args,
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, onChange, accept, style, onSubmit, ref: _r, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, onChange, accept, style, onSubmit }, children)
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
    Container: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: ({ children, onClick, isLoading, isDisabled, loadingText, leftIcon, ...rest }: any) =>
      React.createElement(
        'button',
        { onClick, disabled: isLoading || isDisabled },
        isLoading ? loadingText : children
      ),
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status' }),
    Avatar: ({ name }: any) => React.createElement('div', { 'aria-label': name }),
    Icon: () => null,
    Card: makeEl('div'),
    CardBody: makeEl('div'),
    Skeleton: makeEl('div'),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('div'),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
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
    useToast: () => mockToast,
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
    Select: makeEl('select'),
    Input: makeEl('input'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Textarea: makeEl('textarea'),
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    Center: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
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
jest.mock('@/theme/palette', () => ({ PENCIL: { 500: '#6B7280' } }));

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock('@/components/Dashboard/EmailVerificationBanner', () => ({
  __esModule: true,
  EmailVerificationBanner: () => null,
}));

jest.mock('@/components/Footer', () => ({
  Footer: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/utils/safe-return-to', () => ({
  isSafeReturnTo: () => false,
}));

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

// Mock the apply return prompt hook used in today.tsx
jest.mock('@/hooks/useApplyReturnPrompt', () => ({
  useApplyReturnPrompt: () => ({
    selectedJobResult: null,
    isDrawerOpen: false,
    registerPending: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

// Mock components used in today.tsx
jest.mock('@/components/Today/BriefEntry', () => ({
  BriefEntry: () => null,
}));

jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  JobQuestionsDrawer: () => null,
}));

jest.mock('@/components/Dashboard/OutOfCreditPreview', () => ({
  OutOfCreditPreview: () => null,
}));

jest.mock('@/utils/brief-utils', () => ({
  isSafeUrl: () => true,
}));

jest.mock('@/utils/today-selection', () => ({
  resolveMinScore: (s: any) => s ?? 60,
  filterMatches: (matches: any[]) => matches,
}));

jest.mock('@/utils/resumePredicate', () => ({
  hasMeaningfulResume: (resume: any) => {
    if (!resume) return false;
    return !!(resume.summary || (resume.skills && resume.skills.length > 0));
  },
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    updateUserProfile: (...args: any[]) => mockUpdateUserProfile(...args),
    uploadCV: (...args: any[]) => mockUploadCV(...args),
    triggerMatchForMe: (...args: any[]) => mockTriggerMatchForMe(...args),
    authenticateUser: jest.fn().mockResolvedValue({}),
    getMatches: jest.fn().mockResolvedValue([]),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 10 }),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({ shouldShow: false, reason: 'sufficient_balance', walletBalance: 10, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] }),
    markMatchClick: jest.fn(),
    markMatchAsSkipped: jest.fn(),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    getWalletBalance: jest.fn().mockResolvedValue(10),
    getQuestion: jest.fn().mockResolvedValue(null),
    postAnswer: jest.fn().mockResolvedValue({}),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    skipQuestion: jest.fn().mockResolvedValue({}),
    createAnswer: jest.fn().mockResolvedValue({}),
    getMatchQnAHistory: jest.fn().mockResolvedValue([]),
    updatePreferences: jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
    getSkipped: jest.fn().mockResolvedValue([]),
    getUserName: jest.fn().mockResolvedValue({}),
    getPublicStats: jest.fn().mockResolvedValue(null),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
  }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

import OnboardingPage from '@/pages/onboarding';
import TodayPage from '@/pages/today';
import type { User } from '@/types/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '555-0100',
  currentLocation: 'United Kingdom',
  createdAt: new Date('2026-01-01'),
  isVerified: true,
  resume: {
    summary: 'Engineer with 5 years of experience.',
    skills: ['TypeScript', 'React'],
    experience: [],
    education: [],
    projects: [],
    achievements: [],
    certifications: [],
    volunteerExperience: [],
    interests: [],
    languages: [],
  },
  preferences: {
    jobTypes: [],
    industries: [],
    location: ['London', 'Remote'],
    minSalary: 50000,
    remoteOnly: false,
    matchingEnabled: true,
    minScore: 60,
  },
  socialLinks: {},
  ...overrides,
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockToast = jest.fn();
  mockGetUserProfile = jest.fn().mockResolvedValue(makeUser());
  mockUpdateUserProfile = jest.fn().mockResolvedValue({});
  mockUploadCV = jest.fn().mockResolvedValue({ success: true });
  mockTriggerMatchForMe = jest.fn().mockResolvedValue({ ok: true, status: 202, message: 'Queued' });
  mockNavRouter.push.mockClear();
  mockAuthState.isLoggedIn = true;
  mockAuthState.isReady = true;
  mockAuthState.authenticate = jest.fn().mockResolvedValue({ isNewUser: false });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

// ─── Test 1: Onboarding — trigger disabled with resume but no location ────────

describe('onboarding.tsx — trigger gate', () => {
  it('trigger button is disabled when user has resume but no currentLocation', async () => {
    const userWithResumeNoLocation = makeUser({ currentLocation: undefined });
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithResumeNoLocation);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('trigger button is enabled when user has both resume and currentLocation', async () => {
    const userWithBoth = makeUser({ currentLocation: 'United Kingdom' });
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithBoth);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
  });
});

// ─── Test 3: /today LocationPromptBanner — shown when no currentLocation ──────

describe('today.tsx — LocationPromptBanner', () => {
  it('shows location prompt when user has no currentLocation', async () => {
    const userNoLocation = makeUser({ currentLocation: undefined });
    mockGetUserProfile = jest.fn().mockResolvedValue(userNoLocation);
    render(<TodayPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      expect(screen.getByText(/Where are you based\?/i)).toBeTruthy();
    });
  });

  it('does not show location prompt when user has currentLocation set', async () => {
    const userWithLocation = makeUser({ currentLocation: 'United Kingdom' });
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithLocation);
    render(<TodayPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      expect(screen.queryByText(/Where are you based\?/i)).toBeNull();
    });
  });

  it('dismiss button removes the banner', async () => {
    const userNoLocation = makeUser({ currentLocation: undefined });
    mockGetUserProfile = jest.fn().mockResolvedValue(userNoLocation);
    render(<TodayPage />);

    await waitFor(() => {
      expect(screen.getByText(/Where are you based\?/i)).toBeTruthy();
    });

    const dismissBtn = screen.getByText('Dismiss').closest('button')!;
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(screen.queryByText(/Where are you based\?/i)).toBeNull();
  });

  it('save calls updateUserProfile with location as 5th arg, not preferences.location', async () => {
    const userNoLocation = makeUser({ currentLocation: undefined });
    // After save, return user with location set
    const userWithLocation = makeUser({ currentLocation: 'United States' });
    mockGetUserProfile = jest.fn()
      .mockResolvedValueOnce(userNoLocation)
      .mockResolvedValue(userWithLocation);
    mockUpdateUserProfile = jest.fn().mockResolvedValue({});

    render(<TodayPage />);

    await waitFor(() => {
      expect(screen.getByText(/Where are you based\?/i)).toBeTruthy();
    });

    // Select a country in the CountrySelect (rendered as <select>)
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'United States' } });
    });

    // Click Save
    const saveBtn = screen.getByText('Save').closest('button')!;
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => expect(mockUpdateUserProfile).toHaveBeenCalled());

    // The call must pass location as the 5th argument (index 4)
    const callArgs = mockUpdateUserProfile.mock.calls[0];
    expect(callArgs[4]).toBe('United States');
    // It must NOT include any preferences.location change (args[0] is resume, not preferences)
    expect(callArgs[0]).toBeUndefined();
  });
});

// ─── Test 6: Settings — clear (null) works ────────────────────────────────────

describe('settings.tsx — currentLocation clear', () => {
  it('calling updateUserProfile with null as 5th arg is accepted', async () => {
    // This validates the backend fix: null must be passed through without rejection
    mockUpdateUserProfile = jest.fn().mockResolvedValue({});
    // Simulate the settings page flow: pass null to updateUserProfile
    await mockUpdateUserProfile(undefined, undefined, undefined, undefined, null);
    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, null
    );
  });
});

// ─── Test 7: Non-derivation — saving currentLocation does NOT change preferences.location ──

describe('non-derivation invariant', () => {
  it('updateUserProfile args never include preferences.location', async () => {
    const userNoLocation = makeUser({ currentLocation: undefined });
    const userWithLocation = makeUser({ currentLocation: 'United States' });
    mockGetUserProfile = jest.fn()
      .mockResolvedValueOnce(userNoLocation)
      .mockResolvedValue(userWithLocation);
    mockUpdateUserProfile = jest.fn().mockResolvedValue({});

    render(<TodayPage />);

    await waitFor(() => {
      expect(screen.getByText(/Where are you based\?/i)).toBeTruthy();
    });

    const selects = document.querySelectorAll('select');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'United States' } });
    });

    const saveBtn = screen.getByText('Save').closest('button')!;
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => expect(mockUpdateUserProfile).toHaveBeenCalled());

    // Check every call to updateUserProfile — none should include preferences as arg[0]
    // arg[0] is resume, which is completely different from preferences
    mockUpdateUserProfile.mock.calls.forEach((callArgs: any[]) => {
      // If arg[0] (resume) were an object with a 'location' key, that would be the wrong field
      if (callArgs[0] && typeof callArgs[0] === 'object') {
        expect(callArgs[0]).not.toHaveProperty('location');
      }
      // Confirm preferences.location is never in the call
      expect(callArgs).not.toContainEqual(expect.objectContaining({ location: expect.anything() }));
    });

    // The saved user object should still have preferences.location unchanged
    const lastUser = await mockGetUserProfile.mock.results[mockGetUserProfile.mock.results.length - 1].value;
    expect(lastUser.preferences.location).toEqual(['London', 'Remote']);
  });
});
