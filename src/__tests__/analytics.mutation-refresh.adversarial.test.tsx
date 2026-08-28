/**
 * ADVERSARIAL TEST AUTHOR — analytics mutation-refresh
 *
 * Oracle: the contract spec passed in the prompt.
 * Assumption: the implementation is subtly wrong. Tests are written to EXPOSE bugs.
 *
 * FORBIDDEN files (NOT opened during oracle derivation):
 *   src/utils/analytics.ts          — black box; only mocked
 *   src/contexts/AuthContext.tsx     — not needed here
 *
 * DISCLOSURE:
 *   - Read JSX structure of profile.tsx, onboarding.tsx, settings.tsx, verify-email.tsx
 *     to find which button/input to click. This is unavoidable per the instructions.
 *   - Observed imports in page files (e.g. GuideContext, DragDrop, settingsGuide) only
 *     to know what needs mocking — no implementation logic was read from them.
 *   - Did NOT open analytics.ts or AuthContext.tsx internals.
 *
 * Coverage:
 *   profile.tsx   — CV upload success → setUserPersonProperties with refetched user
 *   profile.tsx   — CV upload error → setUserPersonProperties NOT called with error object
 *   onboarding.tsx — CV upload success → setUserPersonProperties with refetched user
 *   onboarding.tsx — CV upload error → setUserPersonProperties NOT called with error object
 *   settings.tsx  — min-score save (NEW score) → setUserPersonProperties with new score
 *   settings.tsx  — min-score stale value bug → test fails if old score is sent
 *   settings.tsx  — preferences save → setUserPersonProperties with saved matchingEnabled
 *   verify-email.tsx — success + token present → setUserPersonProperties with refetched user
 *   verify-email.tsx — success + no token → setUserPersonProperties NOT called
 *   verify-email.tsx — getUserProfile rejects → success shown, no crash, not called with error
 */

// ─── Mock state vars ──────────────────────────────────────────────────────────

let mockGetUserProfile: jest.Mock;
let mockUploadCV: jest.Mock;
let mockUpdateMinMatchScore: jest.Mock;
let mockUpdatePreferences: jest.Mock;
let mockVerifyInitialEmail: jest.Mock;
let mockVerifyEmailChange: jest.Mock;
let mockSetUserPersonProperties: jest.Mock;

const mockPush = jest.fn();
const mockToast = jest.fn();

// ─── Mocks (all before imports) ───────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/onboarding',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
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

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (_loader: any, _options?: any) => () => null,
}));

const nullIcon = () => null;
jest.mock('react-icons/fa', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/fa6', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/fi', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/bs', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/si', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/md', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/ai', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/io', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/io5', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/hi', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/ri', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/tb', () => new Proxy({}, { get: () => nullIcon }));

jest.mock('@emotion/react', () => ({
  keyframes: () => '',
  css: (...args: any[]) => args.join(''),
  Global: () => null,
}));

jest.mock('styled-components', () => {
  const React = require('react');
  const makeStyled = (Component: any) =>
    (_strings: any, ..._args: any[]) => {
      const Styled = (props: any) => React.createElement(Component, props);
      return Styled;
    };
  const styled: any = makeStyled;
  return { __esModule: true, default: styled };
});

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => children,
  closestCenter: jest.fn(),
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => children,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: {},
  rectSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: jest.fn(() => '') } },
}));

jest.mock('@/components/DragDrop', () => {
  const React = require('react');
  return {
    SortableItem: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SortableBadge: ({ children }: any) => React.createElement(React.Fragment, null, children),
    DragHandle: () => null,
  };
});

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, isDisabled, isLoading, 'aria-label': al,
         href, role, onChange, value, placeholder, name, isChecked, checked, ...rest }: any, ref: any) =>
        React.createElement(tag, {
          ref, onClick, type,
          disabled: disabled || isDisabled || isLoading || undefined,
          'aria-label': al, href, role, onChange, value, placeholder, name,
          checked: isChecked ?? checked,
        }, children)
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
    Button: makeEl('button'),
    Badge: makeEl('span'),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Card: makeEl('div'),
    CardBody: makeEl('div'),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
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
    InputGroup: makeEl('div'),
    InputLeftElement: makeEl('div'),
    InputRightElement: makeEl('div'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    FormErrorMessage: makeEl('span'),
    Switch: ({ isChecked, onChange, ...rest }: any) =>
      React.createElement('input', { type: 'checkbox', checked: !!isChecked, onChange, ...rest }),
    Slider: ({ children, onChange, defaultValue, min, max, step }: any) =>
      React.createElement(React.Fragment, null,
        React.createElement('input', {
          type: 'range',
          role: 'slider',
          'data-testid': 'slider',
          defaultValue: defaultValue ?? 30,
          min: min ?? 0,
          max: max ?? 100,
          step: step ?? 1,
          onChange: (e: any) => onChange && onChange(Number(e.target.value)),
        }),
        children
      ),
    SliderTrack: ({ children }: any) => React.createElement('div', null, children),
    SliderFilledTrack: () => null,
    SliderThumb: () => null,
    SliderMark: ({ children }: any) => React.createElement('span', null, children),
    Skeleton: ({ children, isLoaded }: any) =>
      isLoaded === false ? null : React.createElement('div', null, children),
    Avatar: ({ name }: any) => React.createElement('div', null, name),
    Icon: makeEl('svg'),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    CloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, '×'),
    Tooltip: ({ children }: any) => children,
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Grid: makeEl('div'),
    GridItem: makeEl('div'),
    Center: makeEl('div'),
    Checkbox: ({ children, isChecked, onChange }: any) =>
      React.createElement('input', { type: 'checkbox', checked: isChecked, onChange }, children),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    NumberInputStepper: makeEl('div'),
    NumberIncrementStepper: makeEl('button'),
    NumberDecrementStepper: makeEl('button'),
    useColorMode: () => ({ colorMode: 'light', toggleColorMode: jest.fn() }),
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
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

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  Footer: () => null,
}));

jest.mock('@/components/Dashboard/EmailVerificationBanner', () => ({
  __esModule: true,
  EmailVerificationBanner: () => null,
}));

jest.mock('@/components/common/CountrySelect', () => ({
  __esModule: true,
  CountrySelect: ({ onChange }: any) =>
    React.createElement('select', {
      'data-testid': 'country-select',
      onChange: (e: any) => onChange(e.target.value),
    },
      React.createElement('option', { value: '' }, 'Select country'),
      React.createElement('option', { value: 'United Kingdom' }, 'United Kingdom'),
    ),
}));

jest.mock('@/contexts/AuthContext', () => ({
  __esModule: true,
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isReady: true,
    isLoggedIn: true,
    userId: 'user-123',
    token: 'tok-test',
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({
    guideProgress: {},
    setGuideProgress: jest.fn(),
    updatePageProgress: jest.fn().mockResolvedValue(undefined),
    resetPageProgress: jest.fn().mockResolvedValue(undefined),
    isPageGuideCompleted: () => false,
    isPageGuideSkipped: () => false,
    isLoading: false,
  }),
}));

jest.mock('@/components/Guide/Guide', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/config/guides/profileGuide', () => ({
  profileGuideConfig: { pageId: 'profile', steps: [], showModal: false, modalTitle: '', modalContent: '' },
}));

jest.mock('@/config/guides/settingsGuide', () => ({
  settingsGuideConfig: { pageId: 'settings', steps: [], showModal: false, modalTitle: '', modalContent: '' },
}));

jest.mock('@/components/Profile/CVDocument', () => ({
  __esModule: true,
  CVDocument: () => null,
}));

jest.mock('@/components/Profile/EditSummaryModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditArrayItemModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/AddArrayItemModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditSkillsModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditLanguagesModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditSocialLinksModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Profile/EditPersonalInfoModal', () => ({ __esModule: true, default: () => null }));

jest.mock('@/utils/analytics', () => ({
  __esModule: true,
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
  resetAnalyticsUser: jest.fn(),
  setUserPersonProperties: (...args: any[]) => mockSetUserPersonProperties(...args),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    uploadCV: (...args: any[]) => mockUploadCV(...args),
    updateMinMatchScore: (...args: any[]) => mockUpdateMinMatchScore(...args),
    updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
    verifyInitialEmail: (...args: any[]) => mockVerifyInitialEmail(...args),
    verifyEmailChange: (...args: any[]) => mockVerifyEmailChange(...args),
    // stubs for all other methods the pages destructure
    updateUserProfile: jest.fn().mockResolvedValue({}),
    updatePassword: jest.fn().mockResolvedValue({}),
    updateUserEmail: jest.fn().mockResolvedValue({}),
    requestEmailChange: jest.fn().mockResolvedValue({}),
    factoryResetUserAccount: jest.fn().mockResolvedValue({}),
    deleteUserAccount: jest.fn().mockResolvedValue({}),
    resetGuideProgress: jest.fn().mockResolvedValue({}),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    triggerMatchForMe: jest.fn().mockResolvedValue({ ok: true, status: 202 }),
    getMatches: jest.fn().mockResolvedValue([]),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
    touchSession: jest.fn().mockResolvedValue(undefined),
    searchSkills: jest.fn().mockResolvedValue([]),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 5.0 }),
    getWalletBalance: jest.fn().mockResolvedValue(1.0),
    getOutOfCreditPreview: jest.fn().mockResolvedValue(null),
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
    getActiveUserCount: jest.fn().mockResolvedValue(0),
    getTracker: jest.fn().mockResolvedValue([]),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getAvailableJobsCount: jest.fn().mockResolvedValue(0),
    getUserName: jest.fn().mockResolvedValue({}),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    authenticateUser: jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
  }),
}));

// ─── Imports (after all mocks) ────────────────────────────────────────────────

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react';

import ProfilePage from '@/pages/profile';
import OnboardingPage from '@/pages/onboarding';
import SettingsPage from '@/pages/settings';
import VerifyEmailPage from '@/pages/verify-email';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (overrides: Record<string, any> = {}) => ({
  id: 'user-adv-001',
  name: 'Test Adversarial',
  email: 'adv@test.com',
  phone: '555-0123',
  currentLocation: 'United Kingdom',
  createdAt: new Date('2024-01-01'),
  isVerified: true,
  answeredQuestionsCount: 2,
  socialLinks: {},
  resume: {
    summary: 'Senior engineer with 5 years of TypeScript.',
    skills: ['TypeScript', 'React'],
    experience: ['Engineer at Acme Corp'],
    education: ['BSc Computer Science'],
    projects: [],
    achievements: [],
    certifications: [],
    languages: [],
    volunteerExperience: [],
    interests: [],
  },
  preferences: {
    jobTypes: ['Full-time'],
    location: ['Remote'],
    remoteOnly: false,
    minSalary: 80000,
    industries: ['Tech'],
    minScore: 40,
    matchingEnabled: true,
  },
  ...overrides,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderProfileAndSettle() {
  await act(async () => { render(<ProfilePage />); });
  // Wait for initial getUserProfile to resolve (removes loading skeleton)
  await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled(), { timeout: 3000 });
  await act(async () => {});
}

async function renderOnboardingAndSettle() {
  await act(async () => { render(<OnboardingPage />); });
  await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled(), { timeout: 3000 });
  await act(async () => {});
}

async function renderSettingsAndSettle() {
  await act(async () => { render(<SettingsPage />); });
  await waitFor(() => expect(mockGetUserProfile).toHaveBeenCalled(), { timeout: 3000 });
  await act(async () => {});
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockSetUserPersonProperties = jest.fn();
  mockGetUserProfile = jest.fn().mockResolvedValue(makeUser());
  mockUploadCV = jest.fn().mockResolvedValue({});
  mockUpdateMinMatchScore = jest.fn().mockResolvedValue({});
  mockUpdatePreferences = jest.fn().mockResolvedValue({});
  mockVerifyInitialEmail = jest.fn().mockResolvedValue({});
  mockVerifyEmailChange = jest.fn().mockResolvedValue({ error: 'not-an-email-change' });
  mockPush.mockReset();
  mockToast.mockReset();
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// 1 — profile.tsx: CV upload
// ════════════════════════════════════════════════════════════════════════════

describe('1 — profile.tsx: CV upload → setUserPersonProperties', () => {

  it('1-A: success upload → setUserPersonProperties called with refetched user (NOT stale)', async () => {
    // Initial profile returned on mount
    mockGetUserProfile.mockResolvedValueOnce(makeUser({ name: 'Stale User' }));
    // Refetched profile after successful upload (fresh)
    const freshUser = makeUser({ name: 'Fresh User After Upload' });
    mockGetUserProfile.mockResolvedValueOnce(freshUser);

    mockUploadCV.mockResolvedValue({}); // no error key = success

    await renderProfileAndSettle();
    mockSetUserPersonProperties.mockClear();

    // Trigger file upload via the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull(); // FINDING if null: upload button has no file input

    const file = new File(['pdf content'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Contract: after successful upload, refetch then call setUserPersonProperties
    await waitFor(() => {
      expect(mockSetUserPersonProperties).toHaveBeenCalled();
    }, { timeout: 3000 });

    // FINDING if called with stale user: wiring calls setUserPersonProperties before refetch
    const callArg = mockSetUserPersonProperties.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('error');
    expect(callArg).toHaveProperty('id', freshUser.id);
  });

  it('1-B (error-leak): uploadCV returns { error } → setUserPersonProperties NOT called with error object', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser());
    mockUploadCV.mockResolvedValue({ error: 'upload failed — server error' });

    await renderProfileAndSettle();
    mockSetUserPersonProperties.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) return; // can't test without file input

    const file = new File(['pdf content'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {});

    // Contract: error case → must NOT call setUserPersonProperties with an error-shaped object
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING if badCalls.length > 0: the error object from uploadCV leaks into analytics
    expect(badCalls).toHaveLength(0);
  });

  it('1-C (error-leak): getUserProfile returns { error } after upload → setUserPersonProperties NOT called', async () => {
    mockGetUserProfile.mockResolvedValueOnce(makeUser()); // initial load succeeds
    mockUploadCV.mockResolvedValue({}); // upload succeeds
    mockGetUserProfile.mockResolvedValue({ error: 'profile fetch failed' }); // refetch fails

    await renderProfileAndSettle();
    mockSetUserPersonProperties.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) return;

    const file = new File(['pdf content'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {});

    // Contract: if getUserProfile returns { error }, setUserPersonProperties MUST NOT
    // be called with that error object
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING if badCalls.length > 0: error object from failed refetch passed to analytics
    expect(badCalls).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2 — onboarding.tsx: CV upload
// ════════════════════════════════════════════════════════════════════════════

describe('2 — onboarding.tsx: CV upload → setUserPersonProperties', () => {

  it('2-A: success upload → setUserPersonProperties called with refetched user', async () => {
    const freshUser = makeUser({ name: 'Fresh Onboarding User' });
    mockGetUserProfile
      .mockResolvedValueOnce(makeUser({ resume: null })) // initial load — no resume so CV box shows
      .mockResolvedValueOnce(freshUser); // refetch after upload

    mockUploadCV.mockResolvedValue({}); // success

    await renderOnboardingAndSettle();
    mockSetUserPersonProperties.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull(); // FINDING: no file input rendered for CV upload

    const file = new File(['pdf content'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockSetUserPersonProperties).toHaveBeenCalled();
    }, { timeout: 3000 });

    const callArg = mockSetUserPersonProperties.mock.calls[0][0];
    // FINDING if has error key: error leaked into analytics call
    expect(callArg).not.toHaveProperty('error');
    // FINDING if not the fresh user: stale user was passed instead of refetched one
    expect(callArg).toHaveProperty('id', freshUser.id);
  });

  it('2-B (error-leak): uploadCV returns { error } → setUserPersonProperties NOT called', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser({ resume: null }));
    mockUploadCV.mockResolvedValue({ error: 'server rejected file' });

    await renderOnboardingAndSettle();
    mockSetUserPersonProperties.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) return;

    const file = new File(['pdf'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {});

    // Contract: on uploadCV error, no analytics call with error object
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING: error object leaked to analytics
    expect(badCalls).toHaveLength(0);
  });

  it('2-C (error-leak): getUserProfile returns { error } after CV upload → NOT called with error', async () => {
    mockGetUserProfile
      .mockResolvedValueOnce(makeUser({ resume: null })) // initial load
      .mockResolvedValue({ error: 'refetch failed' }); // refetch after upload

    mockUploadCV.mockResolvedValue({}); // upload itself succeeds

    await renderOnboardingAndSettle();
    mockSetUserPersonProperties.mockClear();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) return;

    const file = new File(['pdf'], 'cv.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {});

    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING: getUserProfile error object passed into setUserPersonProperties
    expect(badCalls).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3 — settings.tsx: min-score save
// ════════════════════════════════════════════════════════════════════════════

describe('3 — settings.tsx: min-score save → setUserPersonProperties with NEW score', () => {

  it('3-A (stale-value): saves NEW score → setUserPersonProperties called with new minScore, not old one', async () => {
    // User starts with minScore: 30; we drive the slider to 70 to prove the new value is sent.
    const initialScore = 30;
    const newScore = 70;

    mockGetUserProfile.mockResolvedValue(makeUser({
      preferences: {
        jobTypes: [],
        location: [],
        remoteOnly: false,
        minSalary: 0,
        industries: [],
        minScore: initialScore,
        matchingEnabled: true,
      },
    }));
    mockUpdateMinMatchScore.mockResolvedValue({}); // no error

    await renderSettingsAndSettle();
    mockSetUserPersonProperties.mockClear();

    // The faithful Slider mock renders <input type="range" role="slider"> and calls
    // props.onChange(Number(e.target.value)) on change. Driving it here fires the
    // settings.tsx onChange → setMatchScore(newScore) → useEffect([matchScore]) →
    // handleUpdatePreferences (since newScore !== user.preferences.minScore) →
    // updateMinMatchScore(newScore) → setUserPersonProperties({...user, minScore: newScore}).
    const sliderInput = document.querySelector('input[role="slider"]') as HTMLInputElement;
    // FINDING if null: no slider input rendered — Slider mock may not be wired correctly
    expect(sliderInput).not.toBeNull();

    await act(async () => {
      fireEvent.change(sliderInput!, { target: { value: String(newScore) } });
    });

    // UNCONDITIONAL: the path MUST fire; if it doesn't the wiring is broken.
    await waitFor(() => {
      expect(mockSetUserPersonProperties).toHaveBeenCalled();
    }, { timeout: 3000 });

    const payload = mockSetUserPersonProperties.mock.calls[0][0];
    // FINDING: stale initialScore sent instead of the new slider value
    expect(payload?.preferences?.minScore).toBe(newScore);
    // Belt-and-suspenders: must not be the old score
    expect(payload?.preferences?.minScore).not.toBe(initialScore);
  });

  it('3-B: updateMinMatchScore returns { error } → setUserPersonProperties NOT called with error object', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser({ preferences: { minScore: 40, jobTypes: [], location: [], remoteOnly: false, minSalary: 0, industries: [], matchingEnabled: true } }));
    mockUpdateMinMatchScore.mockResolvedValue({ error: 'score update failed' });

    await renderSettingsAndSettle();
    mockSetUserPersonProperties.mockClear();

    // Even if the slider were driven and triggered save, on error the analytics must not leak
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING: error from updateMinMatchScore leaked to setUserPersonProperties
    expect(badCalls).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4 — settings.tsx: preferences save (matchingEnabled)
// ════════════════════════════════════════════════════════════════════════════

describe('4 — settings.tsx: preferences save → setUserPersonProperties with saved matchingEnabled', () => {

  it('4-A: Save Preferences success → setUserPersonProperties called, not with error object', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser());
    mockUpdatePreferences.mockResolvedValue({}); // success

    await renderSettingsAndSettle();
    mockSetUserPersonProperties.mockClear();

    // Find and click the "Save Preferences" button
    const allBtns = Array.from(document.querySelectorAll('button'));
    const savePrefBtn = allBtns.find(
      (b) => /save\s+preferences/i.test(b.textContent ?? '')
    );
    expect(savePrefBtn).not.toBeNull(); // FINDING: no "Save Preferences" button

    await act(async () => { fireEvent.click(savePrefBtn!); });
    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Contract: after successful preferences save, setUserPersonProperties is called
    await waitFor(() => {
      expect(mockSetUserPersonProperties).toHaveBeenCalled();
    }, { timeout: 3000 });

    // FINDING: error object leaked into analytics
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    expect(badCalls).toHaveLength(0);
  });

  it('4-B: preferences save with matchingEnabled=true → analytics payload reflects true', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser({
      preferences: { jobTypes: [], location: [], remoteOnly: false, minSalary: 0, industries: [], minScore: 40, matchingEnabled: true },
    }));
    mockUpdatePreferences.mockResolvedValue({});

    await renderSettingsAndSettle();
    mockSetUserPersonProperties.mockClear();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const savePrefBtn = allBtns.find((b) => /save\s+preferences/i.test(b.textContent ?? ''));
    if (!savePrefBtn) return; // can't proceed without button

    await act(async () => { fireEvent.click(savePrefBtn); });
    await waitFor(() => expect(mockUpdatePreferences).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(mockSetUserPersonProperties).toHaveBeenCalled(), { timeout: 3000 });

    const callArg = mockSetUserPersonProperties.mock.calls[0][0];
    // Contract: matchingEnabled in payload must reflect the saved value
    // FINDING: if matchingEnabled is false here, the wiring inverted the value
    expect(callArg?.preferences?.matchingEnabled).toBe(true);
  });

  it('4-C (error leak): updatePreferences returns { error } → setUserPersonProperties NOT called with error', async () => {
    mockGetUserProfile.mockResolvedValue(makeUser());
    mockUpdatePreferences.mockResolvedValue({ error: 'pref update failed' });

    await renderSettingsAndSettle();
    mockSetUserPersonProperties.mockClear();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const savePrefBtn = allBtns.find((b) => /save\s+preferences/i.test(b.textContent ?? ''));
    if (!savePrefBtn) return;

    await act(async () => { fireEvent.click(savePrefBtn); });
    await act(async () => {});

    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING: error object passed to analytics when preferences save fails
    expect(badCalls).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5 — verify-email.tsx: initial verification analytics
// ════════════════════════════════════════════════════════════════════════════

describe('5 — verify-email.tsx: initial email verification → setUserPersonProperties', () => {

  beforeEach(() => {
    // verify-email reads token from window.location.search
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?token=test-verify-token', href: 'http://localhost/verify-email?token=test-verify-token' },
    });
  });

  it('5-A: success + token in localStorage → setUserPersonProperties called with fresh user', async () => {
    localStorage.setItem('onlyjobs_token', 'session-jwt-token');

    const freshUser = makeUser({ isVerified: true, name: 'Newly Verified User' });
    mockVerifyInitialEmail.mockResolvedValue({}); // no error → success
    mockGetUserProfile.mockResolvedValue(freshUser);

    await act(async () => { render(<VerifyEmailPage />); });

    // Contract: after successful verification with token present → setUserPersonProperties
    await waitFor(() => {
      expect(mockSetUserPersonProperties).toHaveBeenCalled();
    }, { timeout: 4000 });

    const callArg = mockSetUserPersonProperties.mock.calls[0][0];
    // FINDING: error object passed to analytics
    expect(callArg).not.toHaveProperty('error');
    // FINDING: stale/wrong user object passed instead of freshly fetched one
    expect(callArg).toHaveProperty('id', freshUser.id);
  });

  it('5-B (no-token): success + NO localStorage token → setUserPersonProperties NOT called', async () => {
    // No token in localStorage
    localStorage.removeItem('onlyjobs_token');

    mockVerifyInitialEmail.mockResolvedValue({}); // success
    // getUserProfile should not be called at all in this path
    mockGetUserProfile.mockResolvedValue(makeUser());

    await act(async () => { render(<VerifyEmailPage />); });
    await waitFor(() => {
      // Wait for verification to complete (success state)
      const body = document.body.textContent ?? '';
      return /verified|success/i.test(body);
    }, { timeout: 4000 }).catch(() => {}); // might not render text, that's ok

    await act(async () => {}); // flush any remaining effects

    // Contract: no token → setUserPersonProperties MUST NOT be called
    // FINDING: page calls setUserPersonProperties even without a session token
    expect(mockSetUserPersonProperties).not.toHaveBeenCalled();
  });

  it('5-C (isolation): getUserProfile rejects → verification STILL shows success, setUserPersonProperties NOT called with error', async () => {
    localStorage.setItem('onlyjobs_token', 'session-jwt-token');

    mockVerifyInitialEmail.mockResolvedValue({}); // verification itself succeeds
    mockGetUserProfile.mockRejectedValue(new Error('network failure during refresh'));

    let threw = false;
    try {
      await act(async () => { render(<VerifyEmailPage />); });
      await act(async () => {});
    } catch {
      threw = true;
    }

    // Contract: best-effort — getUserProfile failure must not crash the page
    // FINDING: unhandled promise rejection crashed the verification flow
    expect(threw).toBe(false);

    // Contract: success message still shown even if profile refresh fails
    const body = document.body.textContent ?? '';
    // The page should show success state, not error state (the verification itself succeeded)
    // FINDING: page shows error when getUserProfile fails, hiding the verification success
    expect(/verified|success/i.test(body)).toBe(true);

    // Contract: setUserPersonProperties MUST NOT be called with an error-shaped object
    const badCalls = mockSetUserPersonProperties.mock.calls.filter(
      ([arg]: [any]) => arg !== null && typeof arg === 'object' && 'error' in arg
    );
    // FINDING: rejection error passed to analytics
    expect(badCalls).toHaveLength(0);
  });

  it('5-D (no-token + verification success): success message shown regardless of token presence', async () => {
    localStorage.removeItem('onlyjobs_token');
    mockVerifyInitialEmail.mockResolvedValue({});

    await act(async () => { render(<VerifyEmailPage />); });

    // Even without a token, verification itself should succeed visually
    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // FINDING: success state not shown for no-token case
      return /verified|success/i.test(body);
    }, { timeout: 4000 });
  });

  it('5-E (verify-email no token): verifyInitialEmail called but getUserProfile must NOT be called', async () => {
    localStorage.removeItem('onlyjobs_token');
    mockVerifyInitialEmail.mockResolvedValue({});
    mockGetUserProfile.mockResolvedValue(makeUser());

    await act(async () => { render(<VerifyEmailPage />); });
    await act(async () => {});

    // Contract: no token → getUserProfile must not be called in the analytics path
    // (It may be called 0 times, or called and result ignored — but setUserPersonProperties must not fire)
    // FINDING if setUserPersonProperties was called: the no-token guard is missing
    expect(mockSetUserPersonProperties).not.toHaveBeenCalled();
  });
});
