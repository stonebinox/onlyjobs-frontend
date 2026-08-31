/**
 * ADVERSARIAL tests for onlyjobs-3zf.1: ResumeRequiredBanner on /today page.
 *
 * PROHIBITION — implementation files NOT opened:
 *   src/pages/today.tsx
 *   src/components/Dashboard/ResumeRequiredBanner.tsx
 *   src/pages/profile.tsx
 *
 * Files read (explicitly allowed):
 *   src/__tests__/today.component.test.tsx  — mocking patterns
 *   src/types/Resume.ts                      — Resume type shape
 *   src/types/User.ts                        — User type shape
 *   src/utils/resumePredicate.ts             — hasMeaningfulResume oracle
 *
 * Every expected value derives from the CONTRACT below, NOT from code inspection.
 * A FAILING test = a FINDING about a likely implementation bug.
 */

// ─── Mocks (hoisted before imports by Jest) ──────────────────────────────────

let mockAuthState: {
  isLoggedIn: boolean;
  isReady: boolean;
  userId: string | null;
  token: string | null;
  authenticate: jest.Mock;
  logout: jest.Mock;
};

let mockGetMatches: jest.Mock;
let mockGetUserProfile: jest.Mock;
let mockUploadCV: jest.Mock;
let mockTriggerMatchForMe: jest.Mock;

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/today',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
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
    IconButton: ({ 'aria-label': al, onClick, children, ...p }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
    Link: ({ children, href, onClick, ...p }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
    AlertDialog: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children }: any) =>
      React.createElement('div', { role: 'alertdialog' }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('h2', null, children),
    AlertDialogBody: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
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
    Radio: ({ children, value, onChange, checked, ...p }: any) =>
      React.createElement('input', { type: 'radio', value, onChange, checked, ...p }),
    RadioGroup: ({ children, onChange }: any) =>
      React.createElement('div', { onChange }, children),
    Select: makeEl('select'),
    Textarea: makeEl('textarea'),
    Input: makeEl('input'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
    Popover: ({ children }: any) => React.createElement(React.Fragment, null, children),
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) => React.createElement('div', null, children),
    PopoverBody: ({ children }: any) => React.createElement('div', null, children),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    CloseButton: makeEl('button'),
    Icon: () => null,
    Progress: makeEl('div'),
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

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: (...args: any[]) => mockGetMatches(...args),
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    markMatchClick: jest.fn().mockResolvedValue({ success: true }),
    markMatchAsSkipped: jest.fn().mockResolvedValue({ success: true }),
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    triggerMatchForMe: (...args: any[]) => mockTriggerMatchForMe(...args),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 10, hasSufficientBalance: true }),
    getWalletBalance: jest.fn().mockResolvedValue(10),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({ shouldShow: false, reason: 'sufficient_balance', walletBalance: 10, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] }),
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
    uploadCV: (...args: any[]) => mockUploadCV(...args),
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
    recordApplicationOutcome: jest.fn().mockResolvedValue({}),
    createOrGetJobConversation: jest.fn().mockResolvedValue({ conversationId: 'conv-test', messages: [] }),
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

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

import TodayPage from '@/pages/today';

import type { Resume } from '@/types/Resume';
import type { User } from '@/types/User';

// ─── Router (defined after imports so React is in scope) ──────────────────────

const mockRouter = {
  pathname: '/today',
  query: {},
  asPath: '/today',
  push: mockPush,
  replace: mockReplace,
  events: { on: jest.fn(), off: jest.fn() },
  isReady: true,
  prefetch: jest.fn().mockResolvedValue(undefined),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EMPTY_RESUME_ARRAYS: Omit<Resume, 'summary' | 'skills' | 'experience' | 'education'> = {
  certifications: [],
  languages: [],
  projects: [],
  achievements: [],
  volunteerExperience: [],
  interests: [],
};

const makeResumeWith = (
  overrides: Partial<Pick<Resume, 'summary' | 'skills' | 'experience' | 'education'>>
): Resume => ({
  summary: '',
  skills: [],
  experience: [],
  education: [],
  ...EMPTY_RESUME_ARRAYS,
  ...overrides,
});

const makeUserWith = (resume: Resume | null): User => ({
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  currentLocation: null,
  createdAt: new Date('2024-01-01'),
  resume,
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

// ─── Non-meaningful resume cases (banner MUST show) ───────────────────────────
// Derived from hasMeaningfulResume contract + spec examples.
const NON_MEANINGFUL_CASES: Array<[string, Resume | null]> = [
  ['null resume', null],
  [
    'empty arrays + empty summary string',
    makeResumeWith({ summary: '', skills: [], experience: [], education: [] }),
  ],
  [
    'whitespace-only summary (no other fields)',
    makeResumeWith({ summary: '   ', skills: [], experience: [], education: [] }),
  ],
  [
    'experience item with empty text and non-empty link (link does not count)',
    makeResumeWith({ experience: [{ text: '', link: 'http://example.com' }] }),
  ],
  [
    'skills array contains only an empty string',
    makeResumeWith({ skills: [''] }),
  ],
];

// ─── Meaningful resume cases (banner must NOT show) ───────────────────────────
const MEANINGFUL_CASES: Array<[string, Resume]> = [
  ['non-empty summary string', makeResumeWith({ summary: 'Senior engineer' })],
  ['skills contains one non-empty string', makeResumeWith({ skills: ['React'] })],
  ['experience contains object with non-empty text', makeResumeWith({ experience: [{ text: 'Engineer at X Corp' }] })],
  ['education contains one non-empty string', makeResumeWith({ education: ['BSc Computer Science'] })],
];

// ─── beforeEach / afterEach ────────────────────────────────────────────────────

beforeEach(() => {
  mockAuthState = {
    isLoggedIn: true,
    isReady: true,
    userId: 'user123',
    token: 'tok-abc',
    authenticate: jest.fn(),
    logout: jest.fn(),
  };

  mockGetMatches = jest.fn().mockResolvedValue([]);
  mockGetUserProfile = jest.fn().mockResolvedValue(makeUserWith(null));
  mockUploadCV = jest.fn().mockResolvedValue({});
  mockTriggerMatchForMe = jest.fn().mockResolvedValue({ message: 'ok' });

  mockPush.mockReset();
  mockReplace.mockReset();

  jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderAndWait = async () => {
  const result = render(<TodayPage />);
  await waitFor(
    () => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    },
    { timeout: 3000 }
  );
  return result;
};

const getBannerHeading = () => screen.queryByText(/you have not added a cv yet/i);
const getUploadButton = () => screen.queryByRole('button', { name: /upload cv/i });
const getFileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement | null;

// ══════════════════════════════════════════════════════════════════════════════
// 1 — Banner SHOWS for each non-meaningful resume case
// Parametrised over all contract-specified non-meaningful fixtures.
// FINDING if banner is absent: implementation treats a non-meaningful resume as meaningful.
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — Banner shows for every NON-meaningful resume case', () => {
  test.each(NON_MEANINGFUL_CASES)(
    '%s',
    async (_label: string, resume: Resume | null) => {
      mockGetUserProfile.mockResolvedValue(makeUserWith(resume));
      mockGetMatches.mockResolvedValue([]);

      await renderAndWait();

      // CONTRACT: banner heading and upload control must be present.
      expect(getBannerHeading()).toBeInTheDocument();
      expect(getUploadButton()).toBeInTheDocument();
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// 2 — Banner is ABSENT for each meaningful resume case
// FINDING if banner is shown: implementation shows banner despite meaningful resume.
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — Banner hidden for every MEANINGFUL resume case', () => {
  test.each(MEANINGFUL_CASES)(
    '%s',
    async (_label: string, resume: Resume) => {
      mockGetUserProfile.mockResolvedValue(makeUserWith(resume));
      mockGetMatches.mockResolvedValue([]);

      await renderAndWait();

      // CONTRACT: banner must be absent.
      expect(getBannerHeading()).not.toBeInTheDocument();

      // Also assert the upload button is absent (belt-and-suspenders).
      // Use a tighter pattern to avoid matching unrelated buttons.
      const uploadBtn = screen.queryByRole('button', { name: /upload cv/i });
      expect(uploadBtn).not.toBeInTheDocument();
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// 3 — Unsupported file (text/plain, .txt) does NOT call uploadCV
// FINDING if uploadCV is called: client-side validation is absent or wrong.
// ══════════════════════════════════════════════════════════════════════════════

describe('3 — Unsupported file type (.txt / text/plain)', () => {
  it('selecting a .txt file must NOT call uploadCV; banner must remain', async () => {
    mockGetUserProfile.mockResolvedValue(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);
    const txtFile = new File(['hello world'], 'notes.txt', { type: 'text/plain' });

    await renderAndWait();

    // Pre-condition: banner is visible
    expect(getBannerHeading()).toBeInTheDocument();

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, { target: { files: [txtFile] } });

    // Allow async handlers to settle (any validation logic, toast, etc.)
    await new Promise((r) => setTimeout(r, 200));

    // CONTRACT: uploadCV must not be called for an unsupported type
    expect(mockUploadCV).not.toHaveBeenCalled();

    // CONTRACT: banner must still be visible (the file was rejected)
    expect(getBannerHeading()).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4 — Supported .pdf: uploadCV called exactly once with the File object,
//     then getUserProfile refetched exactly once more.
// FINDING: uploadCV not called, called >1×, wrong file, or no refetch.
// ══════════════════════════════════════════════════════════════════════════════

describe('4 — Supported .pdf file triggers uploadCV then getUserProfile refetch', () => {
  it('uploadCV called exactly once with the File; getUserProfile called again', async () => {
    // First profile load: no resume. Refetch after upload: still no resume (separate test 8
    // handles the "banner disappears" case — here we just verify the call sequence).
    mockGetUserProfile
      .mockResolvedValueOnce(makeUserWith(null))
      .mockResolvedValueOnce(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);
    const pdfFile = new File(['%PDF-1.4 fake'], 'resume.pdf', { type: 'application/pdf' });

    await renderAndWait();

    // Count getUserProfile calls after initial page load
    const profileCallsBefore = mockGetUserProfile.mock.calls.length;
    expect(profileCallsBefore).toBeGreaterThanOrEqual(1);

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    // CONTRACT: uploadCV called exactly once
    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // CONTRACT: uploadCV receives the exact File object
    expect(mockUploadCV).toHaveBeenCalledWith(pdfFile);

    // CONTRACT: getUserProfile refetched after upload (call count increases)
    await waitFor(() => {
      expect(mockGetUserProfile.mock.calls.length).toBeGreaterThan(profileCallsBefore);
    }, { timeout: 3000 });

    // Adversarial: refetch is exactly ONE additional call, not a flood
    const profileCallsAfter = mockGetUserProfile.mock.calls.length;
    expect(profileCallsAfter).toBe(profileCallsBefore + 1);
  });

  it('.docx file also passes client validation and calls uploadCV', async () => {
    mockGetUserProfile
      .mockResolvedValueOnce(makeUserWith(null))
      .mockResolvedValueOnce(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);
    const docxFile = new File(['PK...'], 'cv.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await renderAndWait();

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, { target: { files: [docxFile] } });

    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    expect(mockUploadCV).toHaveBeenCalledWith(docxFile);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5 — uploadCV resolves { error: "..." }: no refetch, banner remains.
// FINDING if getUserProfile is called: error case is not handled — the code
// treated the error response as success and refetched.
// FINDING if banner disappears: error result falsely unlocked matching.
// ══════════════════════════════════════════════════════════════════════════════

describe('5 — uploadCV resolves { error } object: no post-upload refetch, banner stays', () => {
  it('no getUserProfile refetch when uploadCV resolves with an error key', async () => {
    mockGetUserProfile.mockResolvedValue(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);
    mockUploadCV.mockResolvedValue({ error: 'Upload failed: invalid PDF' });
    const pdfFile = new File(['fake'], 'bad.pdf', { type: 'application/pdf' });

    await renderAndWait();

    const profileCallsBefore = mockGetUserProfile.mock.calls.length;

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    // Wait for uploadCV to have been called
    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Wait long enough that a refetch WOULD have occurred if the code had a bug
    await new Promise((r) => setTimeout(r, 400));

    // CONTRACT: no additional getUserProfile call after an error response
    expect(mockGetUserProfile.mock.calls.length).toBe(profileCallsBefore);

    // CONTRACT: banner must remain visible
    expect(getBannerHeading()).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6 — uploadCV rejects (throws): no unhandled rejection; button is re-enabled;
//     banner remains.
// FINDING if button stays disabled: loading state leaked on rejection.
// FINDING if banner disappears: rejection was falsely treated as success.
// An unhandled rejection will cause the test itself to fail (Jest default).
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — uploadCV rejects: no unhandled rejection, button re-enabled, banner stays', () => {
  it('rejection is caught; upload button is re-enabled; banner is still visible', async () => {
    mockGetUserProfile.mockResolvedValue(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);
    mockUploadCV.mockRejectedValue(new Error('Network error'));
    const pdfFile = new File(['fake'], 'cv.pdf', { type: 'application/pdf' });

    await renderAndWait();

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    // Trigger upload — the rejection must be caught by the component
    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    // Wait for uploadCV to have been called (and subsequently rejected)
    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Allow async catch handler and state reset to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });

    // CONTRACT: banner must remain (rejection does not unlock matching)
    expect(getBannerHeading()).toBeInTheDocument();

    // CONTRACT: upload button must NOT be permanently disabled/loading
    // The button should have returned to an interactive state.
    const uploadBtn = getUploadButton();
    if (uploadBtn) {
      // FINDING if disabled: loading state leaked — button left permanently stuck
      expect(uploadBtn).not.toBeDisabled();
    } else {
      // If button is not in DOM at all post-rejection, that is also acceptable
      // only if the banner heading is still shown (checked above).
      // If both are absent, something is very wrong — but banner heading is asserted above.
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7 — Success upload but refetched user STILL has no meaningful resume.
// Banner must STAY visible.
// FINDING if banner disappears: implementation uses an "upload succeeded" flag
// rather than re-deriving hasMeaningfulResume from the refetched user.
// This is the critical false-unlock guard.
// ══════════════════════════════════════════════════════════════════════════════

describe('7 — Success upload, refetched user still non-meaningful: banner stays', () => {
  it('banner remains when uploadCV succeeds but refetched resume is still non-meaningful', async () => {
    // uploadCV succeeds (no error), but the parsed resume is still empty
    mockUploadCV.mockResolvedValue({ success: true, message: 'CV uploaded' });
    mockGetUserProfile
      .mockResolvedValueOnce(makeUserWith(null))
      // Refetched user: resume exists in structure but is semantically empty
      .mockResolvedValueOnce(
        makeUserWith(makeResumeWith({ summary: '', skills: [], experience: [], education: [] }))
      );
    mockGetMatches.mockResolvedValue([]);
    const pdfFile = new File(['image-only'], 'cv.pdf', { type: 'application/pdf' });

    await renderAndWait();
    expect(getBannerHeading()).toBeInTheDocument();

    const profileCallsBefore = mockGetUserProfile.mock.calls.length;

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    // Wait for upload + refetch cycle to complete
    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockGetUserProfile.mock.calls.length).toBeGreaterThan(profileCallsBefore);
    }, { timeout: 3000 });

    // Allow state to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // CONTRACT: banner must remain — upload success alone cannot unlock matching;
    // only hasMeaningfulResume(refetchedUser.resume) = true would hide the banner.
    // FINDING if this fails: implementation sets an "uploadedSuccessfully" flag and
    // hides the banner regardless of resume content.
    expect(getBannerHeading()).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8 — Success upload AND refetched user has a meaningful resume: banner gone.
// This is the golden path and verifies the positive case.
// FINDING if banner persists: refetch result is ignored / state not updated.
// ══════════════════════════════════════════════════════════════════════════════

describe('8 — Success upload, refetched user has meaningful resume: banner disappears', () => {
  it('banner disappears when uploadCV succeeds and refetched resume is meaningful', async () => {
    mockUploadCV.mockResolvedValue({ success: true });
    mockGetUserProfile
      .mockResolvedValueOnce(makeUserWith(null))
      .mockResolvedValueOnce(
        makeUserWith(makeResumeWith({ summary: 'Senior software engineer with 10 years experience' }))
      );
    mockGetMatches.mockResolvedValue([]);
    const pdfFile = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });

    await renderAndWait();
    expect(getBannerHeading()).toBeInTheDocument();

    const profileCallsBefore = mockGetUserProfile.mock.calls.length;

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockGetUserProfile.mock.calls.length).toBeGreaterThan(profileCallsBefore);
    }, { timeout: 3000 });

    // Banner must disappear once refetched user has a meaningful resume
    await waitFor(() => {
      expect(getBannerHeading()).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9 — No-double-submit: button is disabled/loading while upload is in flight.
// FINDING if button is NOT disabled: a fast double-click could trigger two uploads.
// If this cannot be driven deterministically, we report it.
// ══════════════════════════════════════════════════════════════════════════════

describe('9 — No-double-submit: second file-change while upload in flight does not start a second upload', () => {
  it('second file select while first upload is pending does NOT call uploadCV again', async () => {
    mockGetUserProfile.mockResolvedValue(makeUserWith(null));
    mockGetMatches.mockResolvedValue([]);

    // Deferred promise — keeps upload in flight until we manually resolve it
    let resolveUpload!: (v: any) => void;
    const uploadPromise = new Promise<any>((resolve) => {
      resolveUpload = resolve;
    });
    mockUploadCV.mockReturnValue(uploadPromise);

    const pdfFile = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });

    await renderAndWait();

    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();

    // Trigger the first upload — starts the in-flight promise
    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    // Wait for uploadCV to be called once (upload is now in flight)
    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // While first upload is still pending, fire a second file-change event
    const secondFile = new File(['%PDF'], 'cv2.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput!, { target: { files: [secondFile] } });

    await new Promise((r) => setTimeout(r, 200));

    // CONTRACT: the re-entrancy guard (if (cvUploading) return) must prevent a second
    // uploadCV call — total count stays at exactly 1, not 2.
    // FINDING if this is 2: double-upload is possible via rapid file-change events.
    expect(mockUploadCV).toHaveBeenCalledTimes(1);

    // Clean up: resolve the first upload and let it settle
    await act(async () => {
      resolveUpload({ success: true });
      await new Promise((r) => setTimeout(r, 100));
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10 — NEGATIVE: no match-trigger API method called across the upload flow.
// FINDING if triggerMatchForMe (or any trigger-like method) is called:
// uploading a CV inadvertently started matching, which may charge the user.
// ══════════════════════════════════════════════════════════════════════════════

describe('10 — No match-trigger API called during the upload flow', () => {
  it('triggerMatchForMe is never called: on banner render, unsupported file, or successful upload', async () => {
    // Scenario: full golden path (null → upload → meaningful refetch)
    mockUploadCV.mockResolvedValue({ success: true });
    mockGetUserProfile
      .mockResolvedValueOnce(makeUserWith(null))
      .mockResolvedValueOnce(
        makeUserWith(makeResumeWith({ skills: ['TypeScript'] }))
      );
    mockGetMatches.mockResolvedValue([]);
    const pdfFile = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });

    await renderAndWait();

    // Verify banner is showing (trigger zone is active)
    expect(getBannerHeading()).toBeInTheDocument();

    // Also try an unsupported file (should not trigger anything)
    const txtFile = new File(['hello'], 'bad.txt', { type: 'text/plain' });
    const fileInput = getFileInput();
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, { target: { files: [txtFile] } });
    await new Promise((r) => setTimeout(r, 100));

    // Now do the valid upload
    fireEvent.change(fileInput!, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUploadCV).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Wait for refetch and state settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });

    // CONTRACT: triggerMatchForMe must never be called during CV upload flow
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11 — REAL API-CLIENT PATH (no @/lib/apiClient mock).
// Tests the actual uploadCV implementation against mocked fetch + localStorage.
// Satisfies "not only a mocked helper" + "no double-mocked seam" requirement.
//
// Contract:
//   - POSTs FormData (key "file") to `${NEXT_PUBLIC_API_URL}/users/cv`
//   - Authorization: Bearer <token from localStorage 'onlyjobs_token'>
//   - Returns parsed JSON on ok
//   - Throws on non-ok response
// ══════════════════════════════════════════════════════════════════════════════

describe('11 — Real createApiClient.uploadCV implementation', () => {
  const TEST_TOKEN = 'real-api-test-token-xyz';
  const TEST_BASE_URL = 'https://api.test.example.com';

  let originalFetch: typeof global.fetch;
  let originalEnvUrl: string | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnvUrl = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = TEST_BASE_URL;

    // Seed localStorage with the token the api client reads
    window.localStorage.setItem('onlyjobs_token', TEST_TOKEN);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnvUrl !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnvUrl;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
    window.localStorage.removeItem('onlyjobs_token');
  });

  it('POSTs FormData to /users/cv with Bearer token on ok response, returns parsed JSON', async () => {
    const responseBody = { success: true, message: 'CV uploaded successfully' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseBody,
    } as Response);

    // Use the real module, bypassing the jest.mock hoisted above
    const realModule = jest.requireActual<typeof import('@/lib/apiClient')>('@/lib/apiClient');
    const client = realModule.createApiClient();

    const cvFile = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });
    const result = await client.uploadCV(cvFile);

    // CONTRACT: fetch called exactly once
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [calledUrl, calledOptions] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    // CONTRACT: URL ends with /users/cv
    expect(calledUrl).toMatch(/\/users\/cv$/);

    // CONTRACT: method is POST
    expect((calledOptions.method ?? '').toUpperCase()).toBe('POST');

    // CONTRACT: body is FormData with key "file"
    expect(calledOptions.body).toBeInstanceOf(FormData);
    const sentFormData = calledOptions.body as FormData;
    const sentFile = sentFormData.get('file');
    expect(sentFile).toBe(cvFile);

    // CONTRACT: Authorization header contains Bearer + token
    const headers = calledOptions.headers as Record<string, string> | Headers;
    let authHeader: string | null = null;
    if (headers instanceof Headers) {
      authHeader = headers.get('Authorization');
    } else if (headers && typeof headers === 'object') {
      authHeader =
        (headers as Record<string, string>)['Authorization'] ??
        (headers as Record<string, string>)['authorization'] ??
        null;
    }
    expect(authHeader).not.toBeNull();
    expect(authHeader).toMatch(/^Bearer /i);
    expect(authHeader).toContain(TEST_TOKEN);

    // CONTRACT: returns parsed JSON body on ok
    expect(result).toEqual(responseBody);
  });

  it('resolves with { error } object on non-ok response (4xx/5xx) — does NOT throw', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as Response);

    const realModule = jest.requireActual<typeof import('@/lib/apiClient')>('@/lib/apiClient');
    const client = realModule.createApiClient();

    const cvFile = new File(['bad'], 'cv.pdf', { type: 'application/pdf' });

    // CONTRACT: uploadCV catches non-ok responses internally and resolves with { error: <string> }.
    // It does NOT throw — the page component handles the error key in the resolved value.
    const result = await client.uploadCV(cvFile);
    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
