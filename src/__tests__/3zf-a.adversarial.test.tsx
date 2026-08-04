/**
 * ADVERSARIAL TEST — onlyjobs-798
 * "Restore CV upload + a no-resume CTA on /today"
 *
 * Assume the implementation is subtly WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests.
 *
 * FORBIDDEN FILES (NOT opened):
 *   src/pages/profile.tsx
 *   src/pages/today.tsx
 *   src/__tests__/3zf-a.smoke.test.tsx
 *
 * CONTRACT = oracle. Every expected value traces to the onlyjobs-798 spec.
 * See DISCLOSURE section at the bottom of this file.
 */

// ─── Mock control variables (declared before jest.mock hoisting) ─────────────
// Variables starting with "mock" are exempt from jest's TDZ guard in factory
// closures — they can be safely referenced in jest.mock() factories.

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

const mockPush = jest.fn();
const mockReplace = jest.fn();

// Shared toast spy — captured by the Chakra mock so B-2 can detect toast calls.
const mockToastCall = jest.fn();

// ─── Navigation mocks ────────────────────────────────────────────────────────

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

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

// ─── Chakra UI — full mock matching the project harness pattern ───────────────

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
    // Alert must render with role so B-2 can find it
    Alert: ({ children }: any) => React.createElement('div', { role: 'alert' }, children),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    AlertDialog: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    AlertDialogOverlay: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children }: any) =>
      React.createElement('div', { role: 'alertdialog' }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('h2', null, children),
    AlertDialogBody: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
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
    DrawerCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
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
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    FormErrorMessage: makeEl('span'),
    FormHelperText: makeEl('span'),
    Input: makeEl('input'),
    Textarea: makeEl('textarea'),
    Select: makeEl('select'),
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    NumberInputStepper: makeEl('div'),
    NumberIncrementStepper: makeEl('button'),
    NumberDecrementStepper: makeEl('button'),
    Checkbox: ({ children, onChange, isChecked }: any) =>
      React.createElement('input', { type: 'checkbox', onChange, checked: isChecked }),
    Switch: ({ onChange, isChecked }: any) =>
      React.createElement('input', { type: 'checkbox', onChange, checked: isChecked }),
    Radio: ({ children, value, onChange, checked }: any) =>
      React.createElement('input', { type: 'radio', value, onChange, checked }),
    RadioGroup: ({ children, onChange }: any) =>
      React.createElement('div', { onChange }, children),
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) => React.createElement('div', { role: 'tablist' }, children),
    Tab: ({ children, onClick }: any) =>
      React.createElement('button', { role: 'tab', onClick }, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) => React.createElement('div', { role: 'tabpanel' }, children),
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
    useToast: () => mockToastCall,
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
    useTheme: () => ({
      colors: {
        brand:   { 50: '#EEF4FB', 100: '#D5E4F6', 200: '#ABC9ED', 300: '#6CA0E0', 400: '#2D77D2', 500: '#1D4E89', 600: '#163B69', 700: '#112D50', 800: '#0C213B', 900: '#071322' },
        primary: { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69', 700: '#112D50', 800: '#0C213B', 900: '#071322' },
        gray:    { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280', 800: '#1F2937', 900: '#111827' },
        match:   { strong: '#22C55E', mild: '#F59E0B', weak: '#9CA3AF', none: '#D1D5DB' },
        surface: { bg: '#F4F5F3', border: '#E5E7EB' },
        text:    { primary: '#16202A', secondary: '#4B5563' },
        semantic: { error: '#EF4444', success: '#22C55E' },
      },
    }),
    usePrefersReducedMotion: () => false,
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

// ─── PDF — @react-pdf/renderer uses ESM which jest-jsdom cannot parse ────────

jest.mock('@react-pdf/renderer', () => ({
  __esModule: true,
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  Link: ({ children }: any) => children,
  StyleSheet: { create: (s: any) => s },
  PDFDownloadLink: ({ children }: any) =>
    typeof children === 'function'
      ? children({ loading: false, url: 'blob:mock', blob: null, error: null })
      : children,
  BlobProvider: ({ children }: any) =>
    typeof children === 'function'
      ? children({ blob: null, loading: false, url: null, error: null })
      : children,
  pdf: jest.fn().mockResolvedValue({ toBlob: jest.fn().mockResolvedValue(new Blob()) }),
  Font: { register: jest.fn() },
}));

jest.mock('@/components/Profile/CVDocument', () => ({
  __esModule: true,
  default: () => null,
  CVDocument: () => null,
}));

// ─── Theme / styling ─────────────────────────────────────────────────────────

// Guide.tsx reads `theme.colors.brand[N]` directly (imported theme object).
// The mock factory must NOT reference module-scope variables — they are TDZ-
// undefined when jest.mock factories are hoisted.  All values are inlined.
jest.mock('@/theme/theme', () => {
  const P = {
    50: '#EEF4FB', 100: '#D5E4F6', 200: '#ABC9ED', 300: '#6CA0E0',
    400: '#2D77D2', 500: '#1D4E89', 600: '#163B69', 700: '#112D50',
    800: '#0C213B', 900: '#071322',
  };
  return {
    __esModule: true,
    default: {
      colors: {
        brand: P, primary: P, blue: P, secondary: P, accent: P,
        gray: { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280', 900: '#111827' },
        match: { strong: '#22C55E', mild: '#F59E0B', weak: '#9CA3AF', none: '#D1D5DB' },
        freshness: { fresh: '#10B981', warm: '#F59E0B', stale: '#9CA3AF' },
        surface: { bg: '#F4F5F3', card: '#FFFFFF', border: '#E5E7EB', borderSubtle: '#F3F4F6' },
        text: { primary: '#16202A', secondary: '#4B5563', tertiary: '#9CA3AF', inverse: '#FFFFFF' },
        semantic: { link: '#1D4E89', linkHover: '#112D50', success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#1D4E89', primary: '#1D4E89' },
      },
    },
  };
});

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

// ─── React Icons — all packs stubbed with null renderers ─────────────────────

const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock('react-icons/fi', () => nullIconProxy);
jest.mock('react-icons/bs', () => nullIconProxy);
jest.mock('react-icons/si', () => nullIconProxy);
jest.mock('react-icons/md', () => nullIconProxy);
jest.mock('react-icons/ai', () => nullIconProxy);
jest.mock('react-icons/io', () => nullIconProxy);
jest.mock('react-icons/io5', () => nullIconProxy);
jest.mock('react-icons/hi', () => nullIconProxy);
jest.mock('react-icons/ri', () => nullIconProxy);
jest.mock('react-icons/tb', () => nullIconProxy);
jest.mock('react-icons/lu', () => nullIconProxy);
jest.mock('react-icons/fa', () => nullIconProxy);
jest.mock('react-icons/vsc', () => nullIconProxy);
jest.mock('react-icons/go', () => nullIconProxy);
jest.mock('react-icons/ti', () => nullIconProxy);
jest.mock('react-icons/cg', () => nullIconProxy);
jest.mock('react-icons/bi', () => nullIconProxy);

// ─── Guide component — calls useTheme().colors.brand[N] unconditionally ──────

jest.mock('@/components/Guide/Guide', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-joyride', () => ({ __esModule: true, default: () => null }));

// ─── Project mocks ───────────────────────────────────────────────────────────

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
jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null,
  Footer: () => null,
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

// ─── API client mock — closure captures by reference for per-test control ────

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getMatches: (...args: any[]) => mockGetMatches(...args),
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    uploadCV: (...args: any[]) => mockUploadCV(...args),
    // Stubs for methods the pages may call but are not under test here
    markMatchClick: jest.fn().mockResolvedValue({ success: true }),
    markMatchAsSkipped: jest.fn().mockResolvedValue({ success: true }),
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 10, hasSufficientBalance: true }),
    getWalletBalance: jest.fn().mockResolvedValue(10),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({
      shouldShow: false, reason: 'sufficient_balance', walletBalance: 10,
      dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [],
    }),
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
    updateUserProfile: jest.fn().mockResolvedValue({}),
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

global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: () => Promise.resolve(null),
}) as any;

// ─── Imports (after all jest.mock calls) ─────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import TodayPage from '@/pages/today';
import ProfilePage from '@/pages/profile';

import type { User } from '@/types/User';
import type { Resume } from '@/types/Resume';

// ─── Router object (defined after imports so React is in scope) ──────────────

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

const BASE_RESUME: Resume = {
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
  projects: [],
  achievements: [],
  volunteerExperience: [],
  interests: [],
  summary: '',
};

const makeUser = (resume: Resume | null): User => ({
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
  mockGetUserProfile = jest.fn().mockResolvedValue(makeUser(null));
  mockUploadCV = jest.fn().mockResolvedValue({});

  mockPush.mockReset();
  mockReplace.mockReset();

  jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find the "Add your CV" CTA: a link to /profile whose text or aria-label
 * mentions CV or resume.  The discriminator is the CV mention — a plain
 * "Profile" navigation link must NOT match.
 */
const findCvCta = (): HTMLElement | null => {
  const links = Array.from(document.querySelectorAll('a'));
  const match = links.find(a => {
    const href = a.getAttribute('href') ?? '';
    const text = ((a.textContent ?? '') + ' ' + (a.getAttribute('aria-label') ?? '')).toLowerCase();
    return href === '/profile' && /\bcv\b|\bresume\b/.test(text);
  });
  return (match as HTMLElement) ?? null;
};

/** Render /today and wait until the loading spinner has cleared. */
const renderTodayAndWait = async () => {
  render(<TodayPage />);
  await waitFor(
    () => { expect(screen.queryByRole('status')).not.toBeInTheDocument(); },
    { timeout: 4000 }
  );
};

/** Render /profile and wait until getUserProfile has been called (initial load). */
const renderProfileAndWait = async () => {
  render(<ProfilePage />);
  await waitFor(
    () => { expect(mockGetUserProfile).toHaveBeenCalled(); },
    { timeout: 4000 }
  );
  // Flush any micro-task / setState queued after the initial fetch
  await new Promise(r => setTimeout(r, 150));
};

/**
 * Assign a File to a hidden file input by overriding the read-only `files`
 * property, then fire the `change` event so the handler runs.
 */
const fireFileChange = (input: HTMLInputElement, file: File) => {
  Object.defineProperty(input, 'files', {
    value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
};

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — /today: no-resume CTA predicate
//
// Contract: In the empty state (zero matches), show "Add your CV" → /profile
// IFF the user has NO MEANINGFUL RESUME.
//
// Meaningful resume = has a non-blank summary OR at least one skill.
// An empty/whitespace summary AND empty skills array = NOT meaningful.
//
// The predicate has TWO halves (summary-branch AND skills-branch) that must
// both be tested independently.  A wrong predicate:
//   • that only checks `skills.length` will nag users who have a summary (A-4)
//   • that only checks `summary.trim()` will nag users who have skills (A-5)
//   • that only checks `resume !== null` will hide the CTA from users with an
//     empty-but-non-null resume (A-2, A-3)
// ══════════════════════════════════════════════════════════════════════════════

describe('A — /today: no-resume CTA predicate (onlyjobs-798 §1)', () => {
  // All cases use empty matches — this is the empty state.
  beforeEach(() => {
    mockGetMatches = jest.fn().mockResolvedValue([]);
  });

  it('A-1: resume:null → CTA PRESENT [user has no CV at all]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(makeUser(null));
    await renderTodayAndWait();

    const cta = findCvCta();
    // FINDING if null: implementation never shows the CTA even for a completely absent resume.
    expect(cta).not.toBeNull();
  });

  it('A-2: resume:{summary:"   ", skills:[]} → CTA PRESENT [whitespace-only summary = no meaningful resume]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, summary: '   ', skills: [] })
    );
    await renderTodayAndWait();

    const cta = findCvCta();
    // FINDING if null: impl uses `summary !== ""` instead of `summary.trim() !== ""`
    //   — treats whitespace as content and hides the CTA from a user who effectively has no CV.
    expect(cta).not.toBeNull();
  });

  it('A-3: resume:{summary:"", skills:[]} → CTA PRESENT [empty string + empty skills = no meaningful resume]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, summary: '', skills: [] })
    );
    await renderTodayAndWait();

    const cta = findCvCta();
    // FINDING if null: impl only checks `resume !== null` and ignores content,
    //   hiding the CTA from users who have an empty resume object.
    expect(cta).not.toBeNull();
  });

  it('A-4: resume:{summary:"Engineer", skills:[]} → CTA ABSENT [non-blank summary alone = meaningful]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, summary: 'Engineer', skills: [] })
    );
    await renderTodayAndWait();
    // Extra settle time — CTA must be absent, not just not-yet-rendered.
    await new Promise(r => setTimeout(r, 300));

    const cta = findCvCta();
    // FINDING if present: impl only checks `skills.length > 0` and ignores summary —
    //   wrongly nags a user who already wrote a summary.
    expect(cta).toBeNull();
  });

  it('A-5: resume:{summary:"   ", skills:["React"]} → CTA ABSENT [one skill alone = meaningful]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, summary: '   ', skills: ['React'] })
    );
    await renderTodayAndWait();
    await new Promise(r => setTimeout(r, 300));

    const cta = findCvCta();
    // FINDING if present: impl only checks `summary.trim() !== ""` and ignores skills —
    //   wrongly nags a user who already added a skill.
    expect(cta).toBeNull();
  });

  it('A-6: CTA link href is exactly "/profile" [link destination contract]', async () => {
    mockGetUserProfile = jest.fn().mockResolvedValue(makeUser(null));
    await renderTodayAndWait();

    const cta = findCvCta();
    expect(cta).not.toBeNull();
    // FINDING if "/profile/cv" or "/settings" etc.: link takes user to wrong page.
    expect(cta?.getAttribute('href')).toBe('/profile');
  });

  it('A-7: with matches (non-empty state) — CTA not required [sanity: empty-state guard]', async () => {
    // The contract binds the CTA to the EMPTY state only.  When there are
    // matches, the page is not in the empty state and the CTA is not required.
    // This test confirms we are not accidentally asserting about the wrong state.
    mockGetMatches = jest.fn().mockResolvedValue([
      {
        _id: 'm1', userId: 'user123', jobId: 'j1', matchScore: 80,
        verdict: 'Strong Match', reasoning: 'Great fit.', clicked: false,
        skipped: false, applied: null, createdAt: '2024-01-01', updatedAt: '2024-01-01',
        job: {
          _id: 'j1', title: 'Engineer', company: 'Acme', location: ['Remote'],
          salary: null, tags: [], source: 'LinkedIn', description: 'desc',
          createdAt: '2024-01-01', updatedAt: '2024-01-01', postedDate: '2024-01-01',
          scrapedDate: '2024-01-01', url: 'https://example.com/job',
        },
      },
    ]);
    mockGetUserProfile = jest.fn().mockResolvedValue(makeUser(null));
    await renderTodayAndWait();
    // No assertion on CTA presence — just verify the page renders without throwing.
    // If this throws, the match fixture is malformed.
    expect(true).toBe(true);
  });

  it('A-8: experience-only resume → CTA ABSENT [experience alone = meaningful]', async () => {
    // Contract: experience is one of the four meaningful fields. A user who has
    // uploaded experience entries but no summary/skills must NOT see the CTA.
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, experience: ['Senior dev at Acme'] })
    );
    await renderTodayAndWait();
    await new Promise(r => setTimeout(r, 300));

    const cta = findCvCta();
    // FINDING if present: impl does not check experience — treats experience-only
    //   resume as empty and wrongly nags a user who already provided work history.
    expect(cta).toBeNull();
  });

  it('A-9: education-only resume → CTA ABSENT [education alone = meaningful]', async () => {
    // Contract: education is one of the four meaningful fields. A user who has
    // uploaded education entries but no summary/skills/experience must NOT see the CTA.
    mockGetUserProfile = jest.fn().mockResolvedValue(
      makeUser({ ...BASE_RESUME, education: ['BS Computer Science'] })
    );
    await renderTodayAndWait();
    await new Promise(r => setTimeout(r, 300));

    const cta = findCvCta();
    // FINDING if present: impl does not check education — treats education-only
    //   resume as empty and wrongly nags a user who already provided education history.
    expect(cta).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — /profile CV upload
//
// Contract:
//   B-1: PDF/DOCX file → uploadCV(file) called; on SUCCESS → getUserProfile
//        refetched (profile refreshed with parsed CV data).
//   B-2: error result shape { error: "..." } → uploadCV called; getUserProfile
//        NOT refetched (error is not treated as success); error shown in UI.
//   B-3: text/plain or .txt file → uploadCV NOT called at all (client-side
//        rejection before any API call).
//
// The adversarial assertion order: B-2's "no refetch on error" is the primary
// probe — this is the classic "resolved-with-error treated as resolved-with-
// success" bug (analogous to the sendMatchSummaryEmail { data:null, error }
// bug described in CLAUDE.md §Phase 4).  B-3's "invalid type not uploaded"
// is the second critical probe.
// ══════════════════════════════════════════════════════════════════════════════

describe('B — /profile CV upload (onlyjobs-798 §2)', () => {
  const PROFILE_USER = makeUser({
    ...BASE_RESUME,
    summary: 'Software Engineer',
    skills: ['TypeScript', 'React'],
  });

  beforeEach(() => {
    mockGetUserProfile = jest.fn().mockResolvedValue(PROFILE_USER);
    mockUploadCV = jest.fn().mockResolvedValue({});
    mockToastCall.mockReset();
  });

  it('B-1: valid PDF → uploadCV called with the File; getUserProfile refetched after success', async () => {
    mockUploadCV = jest.fn().mockResolvedValue({ message: 'CV uploaded successfully' });

    await renderProfileAndWait();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // FINDING if null: the profile page has no <input type="file"> — CV upload UI is missing.
    expect(fileInput).not.toBeNull();

    const callsBeforeUpload = mockGetUserProfile.mock.calls.length;

    const pdfFile = new File(['%PDF-1.4 adversarial content'], 'resume.pdf', {
      type: 'application/pdf',
    });
    fireFileChange(fileInput, pdfFile);

    // uploadCV must be called exactly once with the File object itself.
    await waitFor(() => expect(mockUploadCV).toHaveBeenCalledTimes(1), { timeout: 3000 });

    // FINDING if called with something else: impl may wrap the file in FormData
    // before calling the mock — but the mock contract receives the raw File.
    expect(mockUploadCV.mock.calls[0][0]).toBe(pdfFile);

    // On success, the profile must be re-fetched to reflect the parsed CV.
    await waitFor(
      () => expect(mockGetUserProfile.mock.calls.length).toBeGreaterThan(callsBeforeUpload),
      { timeout: 3000 }
    );
  });

  it('B-2 [PRIMARY]: error result {error:"..."} → uploadCV called; getUserProfile NOT refetched; error shown', async () => {
    // uploadCV resolves (not throws) with an error-shaped response.
    // This probes the "{ data:null, error } treated as success" failure mode.
    mockUploadCV = jest.fn().mockResolvedValue({ error: 'Unsupported file format' });

    await renderProfileAndWait();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const callsBeforeUpload = mockGetUserProfile.mock.calls.length;

    const pdfFile = new File(['%PDF-1.4 adversarial content'], 'resume.pdf', {
      type: 'application/pdf',
    });
    fireFileChange(fileInput, pdfFile);

    // uploadCV must have been attempted — the error happens server-side.
    await waitFor(() => expect(mockUploadCV).toHaveBeenCalledTimes(1), { timeout: 3000 });

    // Give async state updates time to settle.
    await new Promise(r => setTimeout(r, 400));

    // KEY ADVERSARIAL ASSERTION: an error result must NOT trigger a refetch.
    // FINDING if callCount > callsBeforeUpload: impl treats { error:"..." } as
    //   success and calls getUserProfile again — user sees stale data with no
    //   indication anything went wrong, and the CV was not actually updated.
    expect(mockGetUserProfile.mock.calls.length).toBe(callsBeforeUpload);

    // The error must be surfaced.  Accept either:
    //   (a) a DOM alert element / error text — for inline error display
    //   (b) a toast call (useToast result called with status:"error" or a message)
    //       — for implementations that use Chakra's toast for error feedback
    // FINDING if none: impl swallows { error:"..." } completely — silent failure.
    const alertEl = document.querySelector('[role="alert"]');
    const errorTextEl = screen.queryByText(/error|failed|unable|could not|wrong|problem|try again/i);
    const hasToast = mockToastCall.mock.calls.length > 0;
    expect(alertEl !== null || errorTextEl !== null || hasToast).toBe(true);
  });

  it('B-3: text/plain file → uploadCV NOT called [client-side rejection before API call]', async () => {
    await renderProfileAndWait();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const txtFile = new File(['plain text resume content'], 'resume.txt', {
      type: 'text/plain',
    });
    fireFileChange(fileInput, txtFile);

    // Allow all async handlers to settle.
    await new Promise(r => setTimeout(r, 400));

    // FINDING if called once: impl skips client-side type validation and passes
    //   .txt files to the server — wastes a round-trip and may produce a
    //   confusing server error instead of a clear "unsupported format" message.
    expect(mockUploadCV).not.toHaveBeenCalled();
  });

  it('B-4: .txt file (extension only, no type) → uploadCV NOT called [name-based rejection]', async () => {
    // Browsers sometimes report type="" for unknown extensions.
    // The client must also reject by name pattern, not only by MIME type.
    await renderProfileAndWait();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const txtFile = new File(['plain text resume content'], 'resume.txt', { type: '' });
    fireFileChange(fileInput, txtFile);

    await new Promise(r => setTimeout(r, 400));

    // FINDING if called: impl checks MIME type only (which may be empty) and
    //   misses the .txt extension — passes an unsupported file to the server.
    expect(mockUploadCV).not.toHaveBeenCalled();
  });

  it('B-5: DOCX file → uploadCV called [positive control: DOCX is an accepted format]', async () => {
    // Contrast with B-3/B-4: DOCX should NOT be rejected client-side.
    mockUploadCV = jest.fn().mockResolvedValue({ message: 'CV uploaded successfully' });

    await renderProfileAndWait();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const docxFile = new File(
      ['PK\x03\x04 docx content'],
      'resume.docx',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    );
    fireFileChange(fileInput, docxFile);

    await waitFor(() => expect(mockUploadCV).toHaveBeenCalledTimes(1), { timeout: 3000 });
    // FINDING if NOT called: impl rejects DOCX — only accepts PDF, missing a supported format.
    expect(mockUploadCV).toHaveBeenCalledWith(docxFile);
  });
});

/*
 * ══════════════════════════════════════════════════════════════════════════════
 * DISCLOSURE
 *
 * Files opened while writing this test (from the ALLOWED list):
 *   src/types/User.ts                          — User type shape (resume: Resume | null)
 *   src/types/Resume.ts                        — Resume type shape (summary, skills fields)
 *   src/lib/apiClient.ts (lines 157-185, 527-545) — uploadCV and getUserProfile signatures
 *   src/__tests__/today.component.test.tsx     — Chakra mock pattern, createApiClient mock
 *                                                pattern, renderAndWait helper pattern,
 *                                                full list of apiClient stub methods
 *   src/__tests__/kda-d.adversarial.test.tsx   — react-icons mock pattern, GuideContext mock
 *   src/__tests__/kda-b.adversarial.test.tsx   — extended apiClient stub list (lines 39-80)
 *
 * Files NOT opened (forbidden):
 *   src/pages/profile.tsx                      ✓ not opened
 *   src/pages/today.tsx                        ✓ not opened
 *   src/__tests__/3zf-a.smoke.test.tsx         ✓ not opened
 *
 * Incidental disclosures from allowed files:
 *   - today.component.test.tsx line 295: `uploadCV: jest.fn().mockResolvedValue({})` —
 *     confirms uploadCV exists on the apiClient mock; did not reveal implementation.
 *   - kda-b.adversarial.test.tsx line 71: same stub.
 *   - apiClient.ts line 179: `return data;` (success path returns raw JSON).
 *   - apiClient.ts line 183: `return { error: (error as Error).message }` (error shape).
 *     The error-result shape `{ error: "..." }` in B-2 derives from this public
 *     signature, not from implementation knowledge of profile.tsx.
 *   - today.component.test.tsx lines 253-320: full apiClient stub set copied as a
 *     defensive fallback; none of these stubs encode implementation behavior.
 *   - today.component.test.tsx makeUser fixture (line 387): used as template for
 *     makeUser helper here; the preferences shape was incidentally visible.
 *     The B-series tests assert on uploadCV/getUserProfile call counts, not on
 *     any preference field.
 *
 * How disclosures affected assertions:
 *   - The error shape { error: "..." } in B-2 is from apiClient's public return
 *     type (line 183).  The assertion (no refetch on error) derives from the
 *     contract spec, not from any implementation detail of profile.tsx.
 *   - Chakra mock, router mock, and apiClient stub set are harness infrastructure;
 *     they were copied verbatim from existing tests and do not encode any
 *     implementation logic under test.
 *   - All expected values (CTA present/absent, refetch yes/no, uploadCV called/not)
 *     derive from the onlyjobs-798 contract spec, never from running the code.
 *
 * Untestable-without-reading findings:
 *   - The exact text of the "Add your CV" CTA (A-1 through A-6): without opening
 *     today.tsx, the findCvCta() helper matches /\bcv\b|\bresume\b/ on the link text.
 *     If the implementation uses different text (e.g., "Complete your profile"), the
 *     CTA-PRESENT assertions (A-1, A-2, A-3) will fail even on a correct implementation.
 *     This is a testability boundary: the CTA text is an implementation detail.
 *   - The exact error UI rendered by profile.tsx on upload error (B-2): the assertion
 *     accepts any `[role="alert"]` element or text matching /error|failed|.../i.
 *     If the error is shown only as a toast (not in the static DOM), the assertion
 *     may pass vacuously.  A narrow assertion would require reading the source.
 *   - The file input trigger mechanism in profile.tsx (B-1 through B-5): the tests
 *     find `document.querySelector('input[type="file"]')` directly.  If the input
 *     is conditionally rendered or lives inside a shadow DOM, all B-series tests
 *     will fail with "fileInput is null" rather than surfacing a predicate bug.
 * ══════════════════════════════════════════════════════════════════════════════
 */
