/**
 * Smoke tests for onlyjobs-kjc Pass 2:
 *   1. index.tsx — new-signup routing to /onboarding
 *   2-7. onboarding.tsx — trigger button state, CV upload, quick-profile save
 */

// ─── Module-level mutable state (for reactive auth mock in index test) ──────

const mockAuthState = {
  isLoggedIn: false,
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

import Home from '@/pages/index';
import OnboardingPage from '@/pages/onboarding';
import type { User } from '@/types/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '555-0100',
  currentLocation: 'London',
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
    location: [],
    minSalary: 50000,
    remoteOnly: false,
    matchingEnabled: true,
    minScore: 60,
  },
  socialLinks: {},
  ...overrides,
});

const userWithMeaningfulResume = makeUser();
const userWithNoResume = makeUser({ resume: null });

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockToast = jest.fn();
  mockGetUserProfile = jest.fn().mockResolvedValue(userWithMeaningfulResume);
  mockUpdateUserProfile = jest.fn().mockResolvedValue({});
  mockUploadCV = jest.fn().mockResolvedValue({ success: true });
  mockTriggerMatchForMe = jest.fn().mockResolvedValue({ ok: true, status: 202, message: 'Queued' });
  mockNavRouter.push.mockClear();
  mockAuthState.isLoggedIn = true;
  mockAuthState.isReady = true;
  mockAuthState.authenticate = jest.fn().mockResolvedValue({ isNewUser: false });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ jobCount: 0, userCount: 0 }) });
});

// ─── Test 1: new-signup routing ───────────────────────────────────────────────

describe('index.tsx — new-signup routing', () => {
  it('routes to /onboarding when authenticate returns isNewUser:true', async () => {
    // Start as logged-out so the redirect effect waits
    mockAuthState.isLoggedIn = false;
    mockAuthState.authenticate = jest.fn().mockImplementation(async () => {
      // Simulate auth provider setting isLoggedIn on success
      mockAuthState.isLoggedIn = true;
      return { isNewUser: true };
    });

    // Simulate a stale return target left from a prior protected-page visit
    sessionStorage.setItem('onlyjobs_returnTo', '/browse');

    render(<Home />);

    // Fill in the form
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(emailInputs.length).toBeGreaterThan(0);
    expect(passwordInputs.length).toBeGreaterThan(0);

    fireEvent.change(emailInputs[0], { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });

    // Submit the form via submit event (Button mock doesn't forward type="submit")
    const submitBtn = screen.getByText(/Create account/i);
    await act(async () => {
      fireEvent.submit(submitBtn);
    });

    // After authenticate resolves, setLoading(false) triggers re-render.
    // The redirect useEffect sees isNewUserRef.current=true and isLoggedIn=true → /onboarding
    await waitFor(() => {
      expect(mockNavRouter.push).toHaveBeenCalledWith('/onboarding');
    });

    // The stale return target must be cleared so a later visit to / is not misdirected
    expect(sessionStorage.getItem('onlyjobs_returnTo')).toBeNull();
  });
});

// ─── Tests 2-7: onboarding.tsx ───────────────────────────────────────────────

describe('onboarding.tsx', () => {
  it('trigger button is disabled when user has no resume', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithNoResume);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('trigger button is enabled when user has a meaningful resume', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithMeaningfulResume);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('clicking trigger calls triggerMatchForMe exactly once', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithMeaningfulResume);
    render(<OnboardingPage />);

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    const triggerBtn = screen.getByRole('button', { name: /Find my first matches/i });
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    expect(mockTriggerMatchForMe).toHaveBeenCalledTimes(1);
  });

  it('status:0 shows graceful daily-brief message', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithMeaningfulResume);
    mockTriggerMatchForMe = jest.fn().mockResolvedValue({
      ok: false,
      status: 0,
      error: 'Service unavailable',
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Find my first matches/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    const triggerBtn = screen.getByRole('button', { name: /Find my first matches/i });
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/your next daily brief/i)).toBeTruthy();
    });
  });

  it('no auto-trigger on CV upload', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithNoResume);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const pdfFile = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    });

    await waitFor(() => expect(mockUploadCV).toHaveBeenCalledWith(pdfFile));

    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  it('no auto-trigger on quick-profile save', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithNoResume);
    render(<OnboardingPage />);

    await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled());

    // Fill in role
    const textInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    const roleInput = textInputs[0] as HTMLInputElement;
    expect(roleInput).not.toBeNull();

    fireEvent.change(roleInput, { target: { value: 'Frontend Engineer' } });

    const saveBtn = screen.getByText('Save profile').closest('button')!;
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => expect(mockUpdateUserProfile).toHaveBeenCalled());

    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });
});
