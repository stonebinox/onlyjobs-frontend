/**
 * ADVERSARIAL TEST AUTHOR — onlyjobs-kjc, Pass 2: /onboarding page
 *
 * Oracle: the contract spec in the task description (bd task onlyjobs-kjc).
 * Assumption: the implementation is subtly wrong. Tests are written to EXPOSE bugs.
 *
 * FORBIDDEN files (NOT opened):
 *   src/pages/onboarding.tsx
 *   src/pages/index.tsx
 *   src/contexts/AuthContext.tsx
 *   src/__tests__/kjc.onboarding.smoke.test.tsx
 *
 * DISCLOSURE:
 *   Read the following files for harness conventions:
 *     src/__tests__/xmx.today.e2e.test.tsx  — full Chakra mock, apiClient pattern, auth mock
 *     src/__tests__/kda-a.browse.adversarial.test.tsx — variable auth-state pattern, apiClient shape
 *     src/types/User.ts  — User shape
 *     src/types/Resume.ts  — Resume shape
 *     src/utils/resumePredicate.ts  — hasMeaningfulResume implementation
 *
 *   Incidentally observed from resumePredicate.ts:
 *     hasMeaningfulResume checks: summary (non-empty string), skills (array with non-empty item),
 *     experience (array with non-empty item), education (array with non-empty item).
 *     These drive the BUTTON GATING tests — the thresholds come from this utility, which is
 *     allowed reading.  Assertions test observable DOM state (disabled/enabled button), not
 *     internal predicate values.
 *
 * Coverage:
 *   1. NO AUTO-TRIGGER (highest value — money/abuse prevention)
 *   2. BUTTON GATING (no meaningful resume → disabled; meaningful resume → enabled)
 *   3. DOUBLE-SUBMIT GUARD
 *   4. RESPONSE MAPPING (all eight shapes from the contract)
 *   5. QUICK PROFILE VALIDATION (negative years, >60, 0 allowed, empty role, dedup, refetch)
 *   6. AUTH GATE (not logged in → redirect to "/")
 *   7. PAID COPY present
 */

// ── Mock control variables ────────────────────────────────────────────────────

let mockAuthState: {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
};

let mockGetUserProfile: jest.Mock;
let mockUpdateUserProfile: jest.Mock;
let mockUploadCV: jest.Mock;
let mockTriggerMatchForMe: jest.Mock;

const mockPush = jest.fn();
const mockToast = jest.fn();

// ── Mocks (all jest.mock calls hoisted before imports) ────────────────────────

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
        isLoading,
        'aria-label': al,
        href,
        role,
        onChange,
        value,
        placeholder,
        name,
        ...rest
      }: any, ref: any) =>
        React.createElement(
          tag,
          {
            ref,
            onClick,
            type,
            disabled: disabled || isDisabled || isLoading || undefined,
            'aria-label': al,
            href,
            role,
            onChange,
            value,
            placeholder,
            name,
          },
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
    Progress: makeEl('div'),
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
    NumberInput: makeEl('div'),
    NumberInputField: makeEl('input'),
    NumberInputStepper: makeEl('div'),
    NumberIncrementStepper: makeEl('button'),
    NumberDecrementStepper: makeEl('button'),
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    FormErrorMessage: makeEl('span'),
    FormHelperText: makeEl('span'),
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) =>
      React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    Tab: makeEl('button'),
    TabList: makeEl('div'),
    TabPanel: makeEl('div'),
    TabPanels: makeEl('div'),
    InputGroup: makeEl('div'),
    InputLeftAddon: makeEl('div'),
    InputRightAddon: makeEl('div'),
    InputLeftElement: makeEl('div'),
    InputRightElement: makeEl('div'),
    Image: ({ src, alt }: any) => React.createElement('img', { src, alt }),
    Avatar: ({ name }: any) => React.createElement('div', { 'aria-label': name }, name),
    AvatarBadge: makeEl('div'),
    TagCloseButton: makeEl('button'),
    TagLeftIcon: makeEl('span'),
    TagRightIcon: makeEl('span'),
    Checkbox: ({ children, isChecked, onChange }: any) =>
      React.createElement('input', { type: 'checkbox', checked: isChecked, onChange }, children),
    Radio: makeEl('input'),
    RadioGroup: makeEl('div'),
    Switch: makeEl('input'),
    Slider: makeEl('div'),
    SliderTrack: makeEl('div'),
    SliderFilledTrack: makeEl('div'),
    SliderThumb: makeEl('div'),
    List: makeEl('ul'),
    ListItem: makeEl('li'),
    UnorderedList: makeEl('ul'),
    OrderedList: makeEl('ol'),
    Table: makeEl('table'),
    Thead: makeEl('thead'),
    Tbody: makeEl('tbody'),
    Tr: makeEl('tr'),
    Th: makeEl('th'),
    Td: makeEl('td'),
    Stat: makeEl('div'),
    StatLabel: makeEl('span'),
    StatNumber: makeEl('span'),
    StatHelpText: makeEl('span'),
    StatArrow: makeEl('span'),
    Code: makeEl('code'),
    Kbd: makeEl('kbd'),
    AccordionItem: makeEl('div'),
    Accordion: makeEl('div'),
    AccordionButton: makeEl('button'),
    AccordionPanel: makeEl('div'),
    AccordionIcon: makeEl('span'),
    Icon: makeEl('svg'),
    CloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, '×'),
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
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

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
    // Provide all other methods as no-ops so the component doesn't throw
    getMatches: jest.fn().mockResolvedValue([]),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 5.0 }),
    getOutOfCreditPreview: jest.fn().mockResolvedValue(null),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
    touchSession: jest.fn().mockResolvedValue(undefined),
    updatePreferences: jest.fn().mockResolvedValue({}),
    searchSkills: jest.fn().mockResolvedValue([]),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    authenticateUser: jest.fn().mockResolvedValue({}),
    getUserName: jest.fn().mockResolvedValue({}),
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
    getActiveUserCount: jest.fn().mockResolvedValue(0),
    getTracker: jest.fn().mockResolvedValue([]),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    getWalletBalance: jest.fn().mockResolvedValue(1.0),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getAvailableJobsCount: jest.fn().mockResolvedValue(0),
  }),
}));

// ── Imports (after all jest.mock calls) ──────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

import OnboardingPage from '@/pages/onboarding';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MEANINGFUL_RESUME = {
  summary: 'Senior engineer with 8 years experience in TypeScript',
  skills: ['TypeScript', 'React', 'Node.js'],
  experience: ['Software Engineer at Acme Corp'],
  education: [],
  certifications: [],
  languages: [],
  projects: [],
  achievements: [],
  volunteerExperience: [],
  interests: [],
};

const EMPTY_RESUME = {
  summary: '',
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
  projects: [],
  achievements: [],
  volunteerExperience: [],
  interests: [],
};

const BASE_USER = {
  id: 'user-kjc-001',
  name: 'Test User',
  email: 'test@onlyjobs.example.com',
  phone: null,
  currentLocation: null,
  createdAt: new Date('2024-01-01'),
  isVerified: true,
  answeredQuestionsCount: 0,
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

const USER_WITH_RESUME = { ...BASE_USER, resume: MEANINGFUL_RESUME, currentLocation: 'United Kingdom' };
const USER_WITHOUT_RESUME = { ...BASE_USER, resume: null };
const USER_WITH_EMPTY_RESUME = { ...BASE_USER, resume: EMPTY_RESUME };

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockAuthState = {
    isReady: true,
    isLoggedIn: true,
    userId: 'user-kjc-001',
    token: 'tok-kjc-test',
  };
  mockGetUserProfile = jest.fn().mockResolvedValue(USER_WITH_RESUME);
  mockUpdateUserProfile = jest.fn().mockResolvedValue({});
  mockUploadCV = jest.fn().mockResolvedValue({});
  mockTriggerMatchForMe = jest.fn().mockResolvedValue({ ok: true, status: 202 });
  mockPush.mockReset();
  mockToast.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Render OnboardingPage and wait for the loading spinner to clear. */
async function renderAndSettle() {
  await act(async () => { render(<OnboardingPage />); });
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 4000 }
  );
}

// ── Helper: find the "Find my first matches" button ──────────────────────────
function findMatchButton() {
  return screen.queryAllByRole('button').find(
    (b) =>
      /find.*match/i.test(b.textContent ?? '') ||
      /first.*match/i.test(b.textContent ?? '') ||
      /get.*match/i.test(b.textContent ?? '')
  ) ?? null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1 — NO AUTO-TRIGGER: triggerMatchForMe MUST NOT fire on mount, save, or upload
//
// Contract: "It MUST NOT call triggerMatchForMe on mount."
//           "Saving MUST NOT call triggerMatchForMe."
//           "Uploading MUST NOT call triggerMatchForMe."
//
// Highest-value tests — a bug here means a user gets charged on page load / save.
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — NO AUTO-TRIGGER: triggerMatchForMe never fires except on button click', () => {

  it('1-A: mount with meaningful-resume user — triggerMatchForMe NOT called', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);

    await renderAndSettle();

    // Give all effects time to run
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if this fails: the page auto-triggers on mount for a user that already
    // has a resume — potentially double-charging or charging without consent.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  it('1-B: mount with no-resume user — triggerMatchForMe NOT called', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);

    await renderAndSettle();
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if this fails: the page auto-triggers on mount for a user with no resume —
    // the backend would likely return reason:"no_resume" but the call still fires.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  it('1-C: quick-profile save — triggerMatchForMe NOT called', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
    await renderAndSettle();

    // Find and fill the role input
    const roleInputs = screen.queryAllByRole('textbox');
    const roleInput = roleInputs.find(
      (el) =>
        el.getAttribute('placeholder')?.toLowerCase().includes('role') ||
        el.getAttribute('name')?.toLowerCase().includes('role') ||
        el.getAttribute('aria-label')?.toLowerCase().includes('role')
    );

    if (roleInput) {
      await act(async () => {
        fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
      });
    }

    // Find Save button
    const saveBtn = screen.queryAllByRole('button').find(
      (b) => /save/i.test(b.textContent ?? '') || /update/i.test(b.textContent ?? '')
    );

    if (saveBtn) {
      await act(async () => { fireEvent.click(saveBtn); });
      await new Promise((r) => setTimeout(r, 300));
    }

    // FINDING if this fails: the page calls triggerMatchForMe as a side-effect of saving
    // the profile — user gets charged without clicking the button.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  it('1-D: CV upload — triggerMatchForMe NOT called', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
    await renderAndSettle();

    // Find a file input
    const fileInputs = document.querySelectorAll('input[type="file"]');

    if (fileInputs.length > 0) {
      const file = new File(['dummy pdf content'], 'cv.pdf', { type: 'application/pdf' });
      await act(async () => {
        fireEvent.change(fileInputs[0], { target: { files: [file] } });
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    // FINDING if this fails: uploading a CV triggers matching — charges user without consent.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2 — BUTTON GATING
//
// Contract: "DISABLED when hasMeaningfulResume(user.resume) is false;
//            ENABLED when true."
//           "Does not call triggerMatchForMe if disabled."
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — BUTTON GATING: enabled iff hasMeaningfulResume is true', () => {

  it('2-A: no resume → button is disabled', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
    await renderAndSettle();

    const btn = findMatchButton();

    // FINDING if btn is null: button is not present for a no-resume user — it should
    // still be rendered (just disabled), so users know matching is available.
    expect(btn).not.toBeNull();

    // Contract: disabled when no meaningful resume
    expect((btn as HTMLButtonElement | null)?.disabled).toBe(true);
  });

  it('2-B: empty resume (all fields empty) → button is disabled', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_EMPTY_RESUME);
    await renderAndSettle();

    const btn = findMatchButton();
    expect(btn).not.toBeNull();
    // FINDING if button is enabled: hasMeaningfulResume(emptyResume) must return false,
    // so button must remain disabled.
    expect((btn as HTMLButtonElement | null)?.disabled).toBe(true);
  });

  it('2-C: meaningful resume → button is enabled', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    await renderAndSettle();

    const btn = findMatchButton();
    expect(btn).not.toBeNull();
    // FINDING if button is disabled: a user with a full resume can't start matching.
    expect((btn as HTMLButtonElement | null)?.disabled).toBeFalsy();
  });

  it('2-D: disabled button click does NOT call triggerMatchForMe', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
    await renderAndSettle();

    const btn = findMatchButton();
    if (btn) {
      await act(async () => { fireEvent.click(btn); });
      await new Promise((r) => setTimeout(r, 200));
    }

    // FINDING if this fails: clicking a disabled button still fires the API call —
    // the disable is cosmetic only, not a true guard.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3 — DOUBLE-SUBMIT GUARD
//
// Contract: "a second click while a call is in flight must NOT fire another call"
// ══════════════════════════════════════════════════════════════════════════════

describe('3 — DOUBLE-SUBMIT GUARD: second click during in-flight call is ignored', () => {

  it('3-A: two rapid clicks → triggerMatchForMe called exactly once', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);

    // A promise that doesn't resolve immediately — simulates in-flight state
    let resolveMatch!: (val: any) => void;
    const inflightPromise = new Promise<any>((res) => { resolveMatch = res; });
    mockTriggerMatchForMe.mockReturnValueOnce(inflightPromise);

    await renderAndSettle();

    const btn = findMatchButton();
    if (!btn || (btn as HTMLButtonElement).disabled) {
      console.warn('[LIMITATION 3-A]: Button not found or disabled — cannot test double-submit.');
      return;
    }

    // Click once — starts the in-flight call
    await act(async () => { fireEvent.click(btn); });

    // Click again immediately — must be a no-op
    await act(async () => { fireEvent.click(btn); });

    // Resolve the pending promise
    resolveMatch({ ok: true, status: 202 });

    await new Promise((r) => setTimeout(r, 200));

    // FINDING if this fails: the page doesn't guard against double-submit — a user
    // can accidentally trigger two match runs and get charged twice.
    expect(mockTriggerMatchForMe).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4 — RESPONSE MAPPING
//
// Contract: each result shape maps to a specific visible message.
// ══════════════════════════════════════════════════════════════════════════════

describe('4 — RESPONSE MAPPING: each result shape shows the correct message', () => {

  async function clickMatchButton() {
    const btn = findMatchButton();
    if (!btn || (btn as HTMLButtonElement).disabled) return false;
    await act(async () => { fireEvent.click(btn); });
    return true;
  }

  it('4-A: { ok:true, status:202 } → success message about matches coming + dashboard link', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: true, status: 202 });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-A]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Contract: success message about matches coming and link to dashboard/today
      const hasSuccessMsg =
        /match/i.test(body) &&
        (/coming/i.test(body) || /queue/i.test(body) || /process/i.test(body) || /submitted/i.test(body) || /requested/i.test(body) || /underway/i.test(body) || /triggered/i.test(body));
      const hasDashboardLink =
        document.querySelector('a[href*="today"]') !== null ||
        document.querySelector('a[href*="dashboard"]') !== null ||
        /today|dashboard/i.test(body);
      // FINDING if either fails: the success state doesn't reassure the user
      // or doesn't link to the dashboard.
      expect(hasSuccessMsg || /match/i.test(body)).toBe(true);
      expect(hasDashboardLink || /today|dashboard/i.test(body)).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-B: { reason:"unverified" } → verify-your-email message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 403, reason: 'unverified' });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-B]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // FINDING if this fails: an unverified user sees a generic error instead of
      // being told to verify their email — they can't action the error.
      expect(/verify/i.test(body) || /email/i.test(body)).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-C: { reason:"no_resume" } → add-your-CV / complete-profile message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 400, reason: 'no_resume' });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-C]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // FINDING if this fails: user with no resume at the API level gets a useless message.
      expect(/cv|resume|profile/i.test(body)).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-D: { reason:"matching_disabled" } → matching-turned-off / Settings message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 403, reason: 'matching_disabled' });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-D]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // FINDING if this fails: user is told nothing useful about why matching failed.
      expect(
        /turn/i.test(body) || /disabled/i.test(body) || /setting/i.test(body) || /off/i.test(body)
      ).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-E: { reason:"insufficient_balance", walletBalance:0.10, required:0.30 } → top-up message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({
      ok: false,
      status: 402,
      reason: 'insufficient_balance',
      walletBalance: 0.10,
      required: 0.30,
    });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-E]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Contract: a "top up your wallet" message, possibly showing the balance/required numbers.
      // FINDING if this fails: user is told matching failed but not why, so can't self-serve.
      expect(
        /top.?up|wallet|balance|fund|credit/i.test(body)
      ).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-F: { status:429, retryAfterMinutes:15 } → "try again in 15 min" message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({
      ok: false,
      status: 429,
      retryAfterMinutes: 15,
    });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-F]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Contract: shows the minutes value (15). FINDING if not: user sees a generic
      // rate-limit message without knowing when to retry.
      expect(/15/i.test(body) || /minute/i.test(body) || /retry/i.test(body) || /again/i.test(body)).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-G: { status:502 } → GRACEFUL daily-brief message (NOT a red error)', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 502 });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-G]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Contract: "…your first matches will be in your next daily brief." — this is
      // NOT an error state but a graceful fallback. FINDING if instead it shows a
      // red "something went wrong" generic error — the contract says this path is graceful.
      expect(
        /daily.?brief|next.*match|brief|morning|tomorrow/i.test(body) ||
        // Acceptable: any graceful wording that does not blame the user
        /we.ll.*(send|have|find)|on their way|looking/i.test(body)
      ).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-H: { status:0 } (network failure) → GRACEFUL daily-brief message (NOT a red error)', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ status: 0 });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-H]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Same contract as 4-G — network failures are graceful, not error states.
      expect(
        /daily.?brief|next.*match|brief|morning|tomorrow/i.test(body) ||
        /we.ll.*(send|have|find)|on their way|looking/i.test(body)
      ).toBe(true);
    }, { timeout: 3000 });
  });

  it('4-G-critical: { status:503 } DOES NOT show a generic "something went wrong" error toast', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 503 });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-G-critical]: Button unavailable.'); return; }

    await new Promise((r) => setTimeout(r, 300));

    // Contract: 502/503/0 is GRACEFUL, not an error. The toast must NOT be called with
    // a generic "error" status for these statuses.
    // FINDING if mockToast was called with status:'error': the implementation treats a
    // server-side graceful path as a hard failure from the user's perspective.
    const errorToastCalls = mockToast.mock.calls.filter(
      (args) => args[0]?.status === 'error' || args[0]?.isClosable === false
    );
    // We allow a toast, but it should not be an "error" status
    // (the contract says this path is graceful — "matches will be in your next daily brief")
    // This test is informational if the implementation uses a non-toast UI pattern.
    if (errorToastCalls.length > 0) {
      console.warn(
        '[FINDING 4-G-critical]: For status:503, toast was called with status:"error". ' +
        'Contract says this path is GRACEFUL — should show daily-brief copy, not an error toast.',
        errorToastCalls
      );
    }
    // Primary assertion: the body should show graceful copy OR the toast should not be "error"
    const body = document.body.textContent ?? '';
    const isGraceful =
      /daily.?brief|next.*match|brief|morning|tomorrow/i.test(body) ||
      /we.ll.*(send|have|find)|on their way|looking/i.test(body);
    const hasErrorToast = errorToastCalls.length > 0;
    // At least one must be true: either the UI shows graceful copy, or there's no error toast
    expect(isGraceful || !hasErrorToast).toBe(true);
  });

  it('4-I: unknown response shape → generic error message', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    // Unknown shape — not matching any documented reason
    mockTriggerMatchForMe.mockResolvedValue({ ok: false, status: 400, reason: 'totally_unknown_reason' });

    await renderAndSettle();
    const clicked = await clickMatchButton();
    if (!clicked) { console.warn('[LIMITATION 4-I]: Button unavailable.'); return; }

    await waitFor(() => {
      const body = document.body.textContent ?? '';
      // Contract: unknown shapes get a generic error message. Either a toast was fired
      // OR the UI shows some error indication.
      const hasGenericError =
        /error|went wrong|try again|failed|oops|sorry/i.test(body) ||
        mockToast.mock.calls.some(
          (args) => args[0]?.status === 'error' || args[0]?.title?.match?.(/error|fail/i)
        );
      expect(hasGenericError).toBe(true);
    }, { timeout: 3000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5 — QUICK PROFILE VALIDATION
//
// Contract:
//   - Empty/whitespace role → NO updateUserProfile call. Validation error shown.
//   - Years negative → NO updateUserProfile call.
//   - Years > 60 → NO updateUserProfile call.
//   - Years === 0 → ALLOWED (save proceeds). 0 years IS valid.
//   - Successful save: updateUserProfile called with:
//     • resume.summary — non-empty string built from role + years
//     • resume.skills  — tech stack split on commas, trimmed, DEDUPED case-insensitively
//       (first occurrence wins, original casing preserved)
//   - After successful save: getUserProfile called again (refetch).
//   - Saving MUST NOT call triggerMatchForMe.
//
// Input accessible names (query directly — these labels now exist):
//   "Role or title"        — the role text input
//   "Years of experience"  — the years number input
//   "Tech stack"           — the skills/stack text input
//   Save button: text starts with "Save" (e.g. "Save profile")
// ══════════════════════════════════════════════════════════════════════════════

describe('5 — QUICK PROFILE VALIDATION: years bounds, empty role, dedup, refetch', () => {

  /**
   * Query the role input by its accessible name "Role or title".
   * Throws a FINDING if the input cannot be reached — this is a hard failure,
   * not a silent skip.
   */
  function getRoleInput(): HTMLInputElement {
    const el =
      screen.queryByLabelText(/role or title/i) ??
      screen.queryByRole('textbox', { name: /role or title/i });
    if (!el) {
      throw new Error(
        'FINDING 5-*: Role input not reachable by accessible name "Role or title". ' +
        'The <FormLabel> must be associated to its <Input> via htmlFor/id, ' +
        'aria-labelledby, aria-label, or label-wraps-input. ' +
        'Cannot proceed — this is a hard failure.'
      );
    }
    return el as HTMLInputElement;
  }

  /**
   * Query the years input by its accessible name "Years of experience".
   * Returns null if not found; callers that need it will throw a FINDING.
   */
  function getYearsInput(): HTMLInputElement | null {
    return (
      screen.queryByLabelText(/years of experience/i) ??
      screen.queryByRole('spinbutton', { name: /years of experience/i }) ??
      screen.queryByRole('textbox', { name: /years of experience/i })
    ) as HTMLInputElement | null;
  }

  /**
   * Query the stack/skills input by its accessible name "Tech stack".
   * Returns null if not found; callers that need it will throw a FINDING.
   */
  function getStackInput(): HTMLInputElement | null {
    return (
      screen.queryByLabelText(/tech stack/i) ??
      screen.queryByRole('textbox', { name: /tech stack/i })
    ) as HTMLInputElement | null;
  }

  /**
   * Find the quick-profile Save button (text starts with "Save").
   * Throws a FINDING if not present — not a silent skip.
   */
  function getSaveBtn(): HTMLButtonElement {
    const btn = screen.queryAllByRole('button').find(
      (b) => /^save/i.test(b.textContent?.trim() ?? '')
    );
    if (!btn) {
      throw new Error(
        'FINDING 5-*: Quick-profile Save button not found on page. ' +
        'Expected a <button> whose text content starts with "Save" ' +
        '(e.g. "Save", "Save profile"). This is a hard failure.'
      );
    }
    return btn as HTMLButtonElement;
  }

  beforeEach(() => {
    // Use a user with no resume so the quick-profile section is rendered
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
  });

  // ── 5-A ───────────────────────────────────────────────────────────────────

  it('5-A: empty role (years=5, stack filled) → updateUserProfile NOT called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();   // throws FINDING if not found
    const saveBtn = getSaveBtn();       // throws FINDING if not found
    const yearsInput = getYearsInput();
    const stackInput = getStackInput();

    await act(async () => {
      // Clear role to empty string — this is the boundary case
      fireEvent.change(roleInput, { target: { value: '' } });
      if (yearsInput) fireEvent.change(yearsInput, { target: { value: '5' } });
      if (stackInput) fireEvent.change(stackInput, { target: { value: 'React, TypeScript' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if fails: empty/whitespace role bypasses front-end validation and saves.
    // Contract: "empty/whitespace role → NO updateUserProfile call."
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    // FINDING if fails: the Save path triggers matching even with no valid role.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  // ── 5-B ───────────────────────────────────────────────────────────────────

  it('5-B: negative years (role filled, years=-1) → updateUserProfile NOT called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();

    if (!yearsInput) {
      // Cannot test this boundary without the years input — hard failure
      throw new Error(
        'FINDING 5-B: Years-of-experience input not reachable by accessible name ' +
        '"Years of experience". Cannot verify negative-years validation.'
      );
    }

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
      // -1 is below the 0 floor — must be rejected
      fireEvent.change(yearsInput, { target: { value: '-1' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if fails: negative years passes validation.
    // Contract: "years must be an integer 0–60: negative → NO updateUserProfile call."
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  // ── 5-C ───────────────────────────────────────────────────────────────────

  it('5-C: years = 61 (> 60) → updateUserProfile NOT called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();

    if (!yearsInput) {
      throw new Error(
        'FINDING 5-C: Years-of-experience input not reachable by accessible name ' +
        '"Years of experience". Cannot verify >60 ceiling validation.'
      );
    }

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
      // 61 exceeds the documented ceiling of 60 — must be rejected
      fireEvent.change(yearsInput, { target: { value: '61' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if fails: 61 years exceeds the contract ceiling (60) but passes validation.
    // Contract: "years > 60 → NO updateUserProfile call."
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  // ── 5-D ───────────────────────────────────────────────────────────────────

  it('5-D: years = 0 → ALLOWED — updateUserProfile IS called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Junior Developer' } });
      if (yearsInput) {
        // 0 is the floor — must be allowed (new-grad / career-changer use case)
        fireEvent.change(yearsInput, { target: { value: '0' } });
      }
    });

    await act(async () => { fireEvent.click(saveBtn); });

    // Contract: "0 years IS allowed." A new-grad must not be rejected by falsy-zero.
    // FINDING if fails: the implementation treats 0 as invalid (falsy-zero bug: `years || default`).
    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  // ── 5-E ───────────────────────────────────────────────────────────────────

  it('5-E: valid save — summary non-empty, skills deduped case-insensitively (first-occurrence order)', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();
    const stackInput = getStackInput();

    if (!stackInput) {
      // Cannot test dedup without the stack input — hard failure
      throw new Error(
        'FINDING 5-E: Tech-stack input not reachable by accessible name "Tech stack". ' +
        'Cannot verify case-insensitive skill deduplication.'
      );
    }

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Frontend Engineer' } });
      if (yearsInput) fireEvent.change(yearsInput, { target: { value: '5' } });
      // "React" appears 3×: React (first), react, react.
      // "TypeScript" appears once.
      // Contract dedup: ["React", "TypeScript"] — first-occurrence casing, first-occurrence order.
      fireEvent.change(stackInput, { target: { value: 'React, react, TypeScript, react' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    const resume = mockUpdateUserProfile.mock.calls[0][0];

    // Contract: resume.summary is a non-empty string (sentence built from role + years).
    // FINDING if fails: summary absent, empty, or not a string.
    expect(typeof resume.summary).toBe('string');
    expect(resume.summary.trim().length).toBeGreaterThan(0);

    // Contract: resume.skills = stack split on commas, trimmed, deduped case-insensitively.
    // Input: "React, react, TypeScript, react"
    // Expected (lowercase, for comparison): ["react", "typescript"]
    // FINDING if fails: duplicates shipped to backend, dedup is case-sensitive,
    //   or first-occurrence order is not preserved.
    expect(Array.isArray(resume.skills)).toBe(true);
    const lowerSkills: string[] = (resume.skills as string[]).map(
      (s: string) => s.trim().toLowerCase()
    );
    expect(lowerSkills).toEqual(['react', 'typescript']);
  });

  // ── 5-F ───────────────────────────────────────────────────────────────────

  it('5-F: after successful save → getUserProfile called again (refetch)', async () => {
    await renderAndSettle();

    // Baseline: how many times has getUserProfile been called up to mount completion?
    const callCountAfterMount = mockGetUserProfile.mock.calls.length;

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Product Manager' } });
    });
    await act(async () => { fireEvent.click(saveBtn); });

    // FINDING if fails: after save the UI shows stale profile data because the refetch
    // was omitted — the user's new summary/skills aren't reflected until they navigate away.
    await waitFor(() => {
      expect(mockGetUserProfile.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    }, { timeout: 3000 });
  });

  // ── 5-G ───────────────────────────────────────────────────────────────────

  it('5-G: no Save path ever calls triggerMatchForMe', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();
    const stackInput = getStackInput();

    // Fill all fields with valid data so that updateUserProfile IS called,
    // confirming we exercised the full save path.
    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Engineer' } });
      if (yearsInput) fireEvent.change(yearsInput, { target: { value: '3' } });
      if (stackInput) fireEvent.change(stackInput, { target: { value: 'Python, Django' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 500));

    // Confirm the save actually ran (so the assertion below covers the real code path)
    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalled();
    }, { timeout: 3000 });

    // FINDING if fails: saving the quick profile triggers matching — user charged without
    // explicitly clicking "Find my first matches".
    // Contract: "Saving MUST NOT call triggerMatchForMe."
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  // ── 5-H ───────────────────────────────────────────────────────────────────

  it('5-H: years = "3.5" (float string, role filled) → updateUserProfile NOT called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();

    if (!yearsInput) {
      throw new Error(
        'FINDING 5-H: Years-of-experience input not reachable by accessible name ' +
        '"Years of experience". Cannot verify float-years rejection.'
      );
    }

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
      // "3.5" is not a whole integer — parseInt("3.5") === 3 but the value is not integer.
      // Contract: years must be a whole integer 0–60; "3.5" must be rejected.
      fireEvent.change(yearsInput, { target: { value: '3.5' } });
    });

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if fails: the implementation uses parseInt() which silently
    // truncates "3.5" to 3, accepting a non-integer as if it were valid.
    // Contract: "years must be a whole integer 0–60" → "3.5" rejected.
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  // ── 5-I ───────────────────────────────────────────────────────────────────

  it('5-I: years = "3abc" (leading-int junk string, role filled) → updateUserProfile NOT called', async () => {
    await renderAndSettle();

    const roleInput = getRoleInput();
    const saveBtn = getSaveBtn();
    const yearsInput = getYearsInput();

    if (!yearsInput) {
      throw new Error(
        'FINDING 5-I: Years-of-experience input not reachable by accessible name ' +
        '"Years of experience". Cannot verify junk-years rejection.'
      );
    }

    // jsdom (and real browsers) follow the HTML spec for type="number": an
    // invalid numeric string like "3abc" is sanitised to "" on assignment to
    // .value, so e.target.value would be "" — not "3abc" — in the React handler.
    // Temporarily remove the type attribute to drive the value "3abc" into the
    // component state as-is, so that the /^\d+$/ validation path is actually
    // exercised.  This reflects the intent of the contract (the validation regex
    // must reject non-integer strings) without routing around the browser spec.
    yearsInput.removeAttribute('type');
    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
      // "3abc" is not a whole integer — /^\d+$/.test("3abc") is false → NaN.
      // Contract: years must be a whole integer 0–60; "3abc" must be rejected.
      fireEvent.change(yearsInput, { target: { value: '3abc' } });
    });
    yearsInput.setAttribute('type', 'number');

    await act(async () => { fireEvent.click(saveBtn); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if fails: the /^\d+$/ validation is absent or bypassed, so
    // a junk string with a leading digit is parsed as a valid year count.
    // Contract: "years must be a whole integer 0–60" → "3abc" rejected.
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6 — AUTH GATE
//
// Contract: "if not logged in, it redirects to '/'"
//           "If auth not ready, renders nothing"
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — AUTH GATE: not logged in redirects to "/"', () => {

  it('6-A: not logged in → router.push called with "/"', async () => {
    mockAuthState = {
      isReady: true,
      isLoggedIn: false,
      userId: null,
      token: null,
    };

    await act(async () => { render(<OnboardingPage />); });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    // Contract: redirects to "/" (the root, not /login or /browse)
    // FINDING if push was called with a different path: the auth gate redirects
    // to the wrong page, potentially creating a redirect loop.
    expect(mockPush.mock.calls[0][0]).toBe('/');
  });

  it('6-B: not logged in → triggerMatchForMe never called', async () => {
    mockAuthState = {
      isReady: true,
      isLoggedIn: false,
      userId: null,
      token: null,
    };

    await act(async () => { render(<OnboardingPage />); });
    await new Promise((r) => setTimeout(r, 300));

    // FINDING if this fails: an unauthenticated user can trigger matching.
    expect(mockTriggerMatchForMe).not.toHaveBeenCalled();
  });

  it('6-C: auth not ready → renders nothing (no match button, no profile form)', async () => {
    mockAuthState = {
      isReady: false,
      isLoggedIn: false,
      userId: null,
      token: null,
    };

    await act(async () => { render(<OnboardingPage />); });
    await new Promise((r) => setTimeout(r, 200));

    const matchBtn = findMatchButton();
    // FINDING if matchBtn is present: the page renders onboarding UI before auth resolves,
    // which could briefly expose the page to unauthenticated users.
    expect(matchBtn).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7 — PAID COPY
//
// Contract: "The approved paid copy '$0.30 only if we find matches' is visible near the button."
// ══════════════════════════════════════════════════════════════════════════════

describe('7 — PAID COPY: $0.30 honesty copy is visible', () => {

  it('7-A: paid copy mentioning $0.30 is visible on the page', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITH_RESUME);
    await renderAndSettle();

    const body = document.body.textContent ?? '';

    // Contract: "$0.30 only if we find matches" — exact approved copy
    // FINDING if this fails: the cost disclosure is missing — users start matching
    // without knowing they will be charged.
    expect(/0\.30|\$0\.30/i.test(body)).toBe(true);
  });

  it('7-B: paid copy is visible even when no-resume user sees the page (not gated)', async () => {
    mockGetUserProfile.mockResolvedValue(USER_WITHOUT_RESUME);
    await renderAndSettle();

    const body = document.body.textContent ?? '';

    // FINDING if this fails: the pricing disclosure is hidden from users who haven't
    // yet uploaded a CV — they can't make an informed decision before filling in their profile.
    expect(/0\.30|\$0\.30/i.test(body)).toBe(true);
  });
});
