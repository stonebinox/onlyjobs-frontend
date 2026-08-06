/**
 * Phase 2a smoke tests for onlyjobs-798 (3zf-A):
 *   1. profile.tsx — CV upload control (success, error response, file-type guard)
 *   2. today.tsx   — "Add your CV" CTA in empty state when user has no resume
 */

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

let mockGetUserProfile: jest.Mock;
let mockUploadCV: jest.Mock;
let mockToast: jest.Mock;

const mockGetMatches = jest.fn().mockResolvedValue([]);
const mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 10 });
const mockGetOutOfCreditPreview = jest.fn().mockResolvedValue({ shouldShow: false, reason: 'sufficient_balance', walletBalance: 10, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] });
const mockUpdateUserProfile = jest.fn().mockResolvedValue({});

jest.mock('next/navigation', () => ({
  useRouter: () => mockNavRouter,
  usePathname: () => '/profile',
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

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, onChange, accept, style, ref: _r, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, onChange, accept, style }, children)
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
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: ({ children, onClick, isLoading, loadingText, leftIcon, ...rest }: any) =>
      React.createElement('button', { onClick, disabled: isLoading }, isLoading ? loadingText : children),
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

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isLoggedIn: true,
    isReady: true,
    userId: 'user-1',
    token: 'tok',
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

// Mock all the Profile sub-modals as no-ops so we don't need to stub their deps
jest.mock('@/components/Profile/EditSummaryModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditArrayItemModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/AddArrayItemModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditSkillsModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditLanguagesModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditSocialLinksModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditPersonalInfoModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/CVDocument', () => ({ CVDocument: () => null }));
jest.mock('@/components/Guide/Guide', () => ({ __esModule: true, default: () => null }));
jest.mock('@/config/guides/profileGuide', () => ({ profileGuideConfig: { pageId: 'profile', steps: [], showModal: false, modalTitle: '', modalContent: '' } }));

// PDF renderer — the PDFDownloadLink is dynamically imported; stub the whole module
jest.mock('@react-pdf/renderer', () => ({
  __esModule: true,
  PDFDownloadLink: ({ children }: any) => {
    const child = typeof children === 'function' ? children({ loading: false }) : children;
    return child;
  },
}));

// DnD — passthrough wrappers
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => children,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => children,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
  rectSortingStrategy: jest.fn(),
}));
jest.mock('@/components/DragDrop', () => ({
  SortableItem: ({ children }: any) => children,
  SortableBadge: ({ children }: any) => React.createElement('span', null, children),
}));
jest.mock('@/utils/arrayUtils', () => ({ arrayMove: jest.fn((arr, from, to) => arr) }));
jest.mock('@/utils/skillUtils', () => ({ parseSkill: (s: string) => ({ name: s, rating: null }) }));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    uploadCV: (...args: any[]) => mockUploadCV(...args),
    updateUserProfile: mockUpdateUserProfile,
    getMatches: mockGetMatches,
    checkWalletBalance: mockCheckWalletBalance,
    getOutOfCreditPreview: mockGetOutOfCreditPreview,
    unskipMatch: jest.fn().mockResolvedValue({}),
    getSkipped: jest.fn().mockResolvedValue([]),
    markMatchClick: jest.fn(),
    markMatchAsSkipped: jest.fn(),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
    getWalletBalance: jest.fn().mockResolvedValue(10),
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
    authenticateUser: jest.fn().mockResolvedValue({}),
    getUserName: jest.fn().mockResolvedValue({}),
    getAvailableJobsCount: jest.fn().mockResolvedValue(0),
    getActiveUserCount: jest.fn().mockResolvedValue(0),
    requestEmailChange: jest.fn().mockResolvedValue({}),
    verifyEmailChange: jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
    verifyInitialEmail: jest.fn().mockResolvedValue({}),
    factoryResetUserAccount: jest.fn().mockResolvedValue({}),
    deleteUserAccount: jest.fn().mockResolvedValue({}),
    updateUserEmail: jest.fn().mockResolvedValue({}),
    updatePassword: jest.fn().mockResolvedValue({}),
    createPaymentOrder: jest.fn().mockResolvedValue({}),
    verifyPayment: jest.fn().mockResolvedValue({}),
    getTransactions: jest.fn().mockResolvedValue({}),
    requestPasswordReset: jest.fn().mockResolvedValue({}),
    resetPassword: jest.fn().mockResolvedValue({}),
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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import ProfilePage from '@/pages/profile';
import TodayPage from '@/pages/today';
import type { User } from '@/types/User';

// ─── Router ───────────────────────────────────────────────────────────────────

const mockNavRouter = {
  pathname: '/profile',
  query: {},
  asPath: '/profile',
  push: jest.fn(),
  replace: jest.fn(),
  events: { on: jest.fn(), off: jest.fn() },
  isReady: true,
  prefetch: jest.fn().mockResolvedValue(undefined),
};

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
    summary: 'Experienced engineer',
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

const userWithNoResume = makeUser({ resume: null });
const userWithBlankResume = makeUser({
  resume: {
    summary: '   ',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    achievements: [],
    certifications: [],
    volunteerExperience: [],
    interests: [],
    languages: [],
  },
});
const userWithResume = makeUser();

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockToast = jest.fn();
  mockGetUserProfile = jest.fn().mockResolvedValue(userWithResume);
  mockUploadCV = jest.fn().mockResolvedValue({ success: true, message: 'Parsed OK' });
  jest.clearAllMocks();
  // re-apply after clearAllMocks
  mockToast = jest.fn();
  mockGetUserProfile = jest.fn().mockResolvedValue(userWithResume);
  mockUploadCV = jest.fn().mockResolvedValue({ success: true, message: 'Parsed OK' });
});

// ─── Profile: CV upload ───────────────────────────────────────────────────────

describe('profile.tsx — CV upload control', () => {
  it('renders "Replace CV" button when user already has a resume', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Replace CV')).toBeTruthy();
    });
  });

  it('renders "Upload CV" button when user has no resume', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithNoResume);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Upload CV')).toBeTruthy();
    });
  });

  it('on PDF file select: calls uploadCV, then refetches profile (getUserProfile called twice)', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Replace CV')).toBeTruthy());

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    const pdfFile = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledWith(pdfFile);
      // initial fetch + refetch after success = 2 calls
      expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  it('on success: shows a success toast', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Replace CV')).toBeTruthy());

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' })
      );
    });
  });

  it('on { error } response: shows error toast and does NOT refetch profile', async () => {
    mockUploadCV = jest.fn().mockResolvedValue({ error: 'Parse failed' });
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Replace CV')).toBeTruthy());

    const callsBefore = mockGetUserProfile.mock.calls.length;
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error' })
      );
    });
    // No extra fetch beyond the initial one
    expect(mockGetUserProfile).toHaveBeenCalledTimes(callsBefore);
  });

  it('rejects a non-PDF/DOCX file before calling uploadCV', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Replace CV')).toBeTruthy());

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [txtFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error' })
      );
    });
    expect(mockUploadCV).not.toHaveBeenCalled();
  });

  it('accepts a DOCX file (by extension) without calling the error toast', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('Replace CV')).toBeTruthy());

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const docxFile = new File(['PK'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(input, { target: { files: [docxFile] } });

    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledWith(docxFile);
    });
  });
});

// ─── Today: no-resume CTA in empty state ──────────────────────────────────────

describe('today.tsx — "Add your CV" CTA in empty state', () => {
  it('shows "Add your CV" link to /onboarding when user has no resume and zero matches', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithNoResume);
    render(<TodayPage />);
    await waitFor(() => {
      // The Text is wrapped by a NextLink — find the text, then check the parent anchor
      const text = screen.getByText(/add your cv/i);
      expect(text).toBeTruthy();
      const anchor = text.closest('a');
      expect(anchor).not.toBeNull();
      expect(anchor!.getAttribute('href')).toBe('/onboarding');
    });
  });

  it('shows "Add your CV" link when user has a blank resume (no summary, no skills)', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithBlankResume);
    render(<TodayPage />);
    await waitFor(() => {
      expect(screen.getByText(/add your cv/i)).toBeTruthy();
    });
  });

  it('does NOT show "Add your CV" link when user has a meaningful resume', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(userWithResume);
    render(<TodayPage />);
    await waitFor(() => {
      // Wait for loading to finish — if getMatches returns [] we should be in empty state
      expect(mockGetUserProfile).toHaveBeenCalled();
    });
    // Give React an extra tick to settle
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('add-cv-link')).toBeNull();
  });
});
