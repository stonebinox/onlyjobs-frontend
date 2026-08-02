/**
 * Page-level wiring tests for OutOfCreditPreview on /dashboard and /today.
 *
 * These tests prove the preview is connected to the API response on both pages.
 * Companion to outOfCreditPreview.test.tsx (component-level) and
 * today.component.test.tsx (full today-page behaviour). The gap those files
 * leave: they mock shouldShow=false by default, so nothing verifies the
 * preview appears when the API actually returns shouldShow=true.
 *
 * BLOCKING 4 from code review onlyjobs-wzo.
 */

// ─── All jest.mock() calls must be at the top (hoisted before imports) ────

let mockGetOutOfCreditPreview: jest.Mock;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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
      ({ children, onClick, type, disabled, 'aria-label': al, href, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl('div'),
    Flex: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Stack: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: makeEl('button'),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) => React.createElement('div', null, children),
    Tab: ({ children }: any) => React.createElement('button', null, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) => React.createElement('div', null, children),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', null, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: () => null,
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Input: makeEl('input'),
    Center: makeEl('div'),
    Container: makeEl('div'),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? Object.values(vals)[0];
      return vals;
    },
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
  useAuth: () => ({
    isLoggedIn: true,
    isReady: true,
    userId: 'user123',
    token: 'tok-abc',
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

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

// Dashboard sub-components — null renders so the page mounts without their deps
jest.mock('@/components/Dashboard/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => null,
}));
jest.mock('@/components/Dashboard/ResumeRequiredBanner', () => ({
  ResumeRequiredBanner: () => null,
}));
jest.mock('@/components/Dashboard/QnARecommendationBanner', () => ({
  QnARecommendationBanner: () => null,
}));
jest.mock('@/components/Dashboard/NoQnABanner', () => ({
  NoQnABanner: () => null,
}));
jest.mock('@/components/Dashboard/StatCard', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/Dashboard/JobMatches', () => ({
  JobMatches: () => null,
}));
jest.mock('@/components/Dashboard/QADrawer', () => ({
  QADrawer: () => null,
}));
jest.mock('@/components/Dashboard/VisitedJobs', () => ({
  VisitedJobs: () => null,
}));
jest.mock('@/components/Dashboard/SkippedJobs', () => ({
  SkippedJobs: () => null,
}));
jest.mock('@/components/Dashboard/AppliedJobs', () => ({
  AppliedJobs: () => null,
}));
jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  JobQuestionsDrawer: () => null,
}));
jest.mock('@/components/Dashboard/GettingStartedChecklist', () => ({
  GettingStartedChecklist: () => null,
}));
jest.mock('@/components/AllJobsTab', () => ({
  AllJobsTab: () => null,
}));
jest.mock('@/components/Guide/Guide', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/CookieConsent', () => ({
  CookieConsent: () => null,
}));
jest.mock('@/config/guides/dashboardGuide', () => ({
  dashboardGuideConfig: {
    pageId: 'dashboard',
    steps: [],
    showModal: false,
    modalTitle: '',
    modalContent: '',
  },
}));
jest.mock('@/components/Today/BriefEntry', () => ({
  BriefEntry: () => null,
}));

jest.mock('react-icons/fi', () => ({
  FiBriefcase: () => null,
  FiCheckCircle: () => null,
  FiTrendingUp: () => null,
  FiUpload: () => null,
  FiMessageSquare: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

const BASE_USER = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  currentLocation: null,
  createdAt: new Date('2024-01-01'),
  resume: { summary: 'Engineer', skills: ['JS'], experience: [], education: [] },
  isVerified: true,
  answeredQuestionsCount: 5,
  preferences: {
    jobTypes: [],
    location: [],
    remoteOnly: false,
    minSalary: 0,
    industries: [],
    minScore: 30,
    matchingEnabled: false,
  },
};

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getOutOfCreditPreview: (...args: any[]) => mockGetOutOfCreditPreview(...args),
    getUserProfile: jest.fn().mockResolvedValue(BASE_USER),
    getMatches: jest.fn().mockResolvedValue([]),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 0.10, hasSufficientBalance: false }),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getAvailableJobsCount: jest.fn().mockResolvedValue(0),
    touchSession: jest.fn().mockResolvedValue(undefined),
    triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
    markMatchClick: jest.fn().mockResolvedValue({ success: true }),
    markMatchAsSkipped: jest.fn().mockResolvedValue({ success: true }),
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    getQuestion: jest.fn().mockResolvedValue(null),
    postAnswer: jest.fn().mockResolvedValue({}),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    skipQuestion: jest.fn().mockResolvedValue({}),
    createAnswer: jest.fn().mockResolvedValue({}),
    getMatchQnAHistory: jest.fn().mockResolvedValue([]),
    updatePreferences: jest.fn().mockResolvedValue({}),
    searchSkills: jest.fn().mockResolvedValue([]),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    resetGuideProgress: jest.fn().mockResolvedValue({}),
    uploadCV: jest.fn().mockResolvedValue({}),
    requestEmailChange: jest.fn().mockResolvedValue({}),
    verifyEmailChange: jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
    verifyInitialEmail: jest.fn().mockResolvedValue({}),
    factoryResetUserAccount: jest.fn().mockResolvedValue({}),
    deleteUserAccount: jest.fn().mockResolvedValue({}),
    updateUserProfile: jest.fn().mockResolvedValue({}),
    updateUserEmail: jest.fn().mockResolvedValue({}),
    updatePassword: jest.fn().mockResolvedValue({}),
    createPaymentOrder: jest.fn().mockResolvedValue({}),
    verifyPayment: jest.fn().mockResolvedValue({}),
    getTransactions: jest.fn().mockResolvedValue({}),
    requestPasswordReset: jest.fn().mockResolvedValue({}),
    resetPassword: jest.fn().mockResolvedValue({}),
    authenticateUser: jest.fn().mockResolvedValue({}),
    getUserName: jest.fn().mockResolvedValue({}),
    getWalletBalance: jest.fn().mockResolvedValue(0.10),
    recordApplicationOutcome: jest.fn().mockResolvedValue({}),
    sendChatMessage: jest.fn().mockResolvedValue({}),
    getChatConversations: jest.fn().mockResolvedValue([]),
    getChatConversation: jest.fn().mockResolvedValue({}),
    getChatMemory: jest.fn().mockResolvedValue({}),
    deleteChatMemory: jest.fn().mockResolvedValue({}),
    getPublicStats: jest.fn().mockResolvedValue(null),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

// ─── Imports (after all jest.mock calls) ─────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import DashboardPage from '@/pages/dashboard/index';
import TodayPage from '@/pages/today';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PREVIEW_SHOW = {
  shouldShow: true,
  reason: 'auto_low_balance',
  walletBalance: 0.10,
  dailyMatchCost: 0.3,
  onDemandMatchCost: 0.05,
  count: 3,
  candidates: [
    {
      title: 'Backend Engineer',
      company: 'Acme Corp',
      location: ['Remote'],
      salary: { min: 100000, max: 150000, currency: 'USD' },
      postedDate: new Date().toISOString(),
    },
  ],
};

const PREVIEW_HIDE = {
  shouldShow: false,
  reason: 'sufficient_balance',
  walletBalance: 1.0,
  dailyMatchCost: 0.3,
  onDemandMatchCost: 0.05,
  count: 0,
  candidates: [],
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetOutOfCreditPreview = jest.fn().mockResolvedValue(PREVIEW_HIDE);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// /dashboard page
// ─────────────────────────────────────────────────────────────────────────────

describe('/dashboard — OutOfCreditPreview wiring', () => {
  it('renders preview content when API returns shouldShow:true', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_SHOW);

    render(<DashboardPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/3 unscored jobs in your 15-day queue/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/add funds/i)).toBeInTheDocument();
  });

  it('does not render the old generic low-balance Alert when preview is shown', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_SHOW);

    render(<DashboardPage />);

    await waitFor(
      () =>
        expect(
          screen.getByText(/unscored jobs in your 15-day queue/i)
        ).toBeInTheDocument(),
      { timeout: 3000 }
    );

    expect(screen.queryByText(/low wallet balance/i)).not.toBeInTheDocument();
  });

  it('preview is absent when API returns shouldShow:false', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_HIDE);

    render(<DashboardPage />);

    // Wait until the API has been called and state settled
    await waitFor(
      () => expect(mockGetOutOfCreditPreview).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );
    // Allow React to flush any pending state updates
    await new Promise((r) => setTimeout(r, 150));

    expect(
      screen.queryByText(/unscored jobs in your 15-day queue/i)
    ).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /today page
// ─────────────────────────────────────────────────────────────────────────────

describe('/today — OutOfCreditPreview wiring', () => {
  it('renders preview content when API returns shouldShow:true', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_SHOW);

    render(<TodayPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/3 unscored jobs in your 15-day queue/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/add funds/i)).toBeInTheDocument();
  });

  it('does not render the old generic low-balance Alert when preview is shown', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_SHOW);

    render(<TodayPage />);

    await waitFor(
      () =>
        expect(
          screen.getByText(/unscored jobs in your 15-day queue/i)
        ).toBeInTheDocument(),
      { timeout: 3000 }
    );

    expect(screen.queryByText(/low wallet balance/i)).not.toBeInTheDocument();
  });

  it('preview is absent when API returns shouldShow:false', async () => {
    mockGetOutOfCreditPreview.mockResolvedValue(PREVIEW_HIDE);

    render(<TodayPage />);

    await waitFor(
      () => expect(mockGetOutOfCreditPreview).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );
    await new Promise((r) => setTimeout(r, 150));

    expect(
      screen.queryByText(/unscored jobs in your 15-day queue/i)
    ).not.toBeInTheDocument();
  });
});
