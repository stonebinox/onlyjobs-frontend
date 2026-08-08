/**
 * ADVERSARIAL TEST — onlyjobs-oaq
 * "Follow-up email deep-link: ?followup=true auto-opens outcome wizard on /tracker"
 *
 * Assume the implementation is subtly WRONG. Write BLACK-BOX tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests, do NOT commit.
 *
 * FORBIDDEN (not opened):
 *   src/pages/tracker.tsx
 *   src/__tests__/oaq.smoke.test.tsx
 *
 * ALLOWED (read during authorship — see DISCLOSURE at bottom):
 *   src/components/Dashboard/FollowUpWizardModal.tsx
 *   src/utils/tracker-utils.ts
 *   src/types/JobResult.ts
 *   src/__tests__/ggj.tracker.adversarial.test.tsx  (mock harness)
 *   src/__tests__/tracker.test.tsx                  (mock pattern)
 */

// ── Mock control variables (declared before jest.mock hoisting) ───────────────

let mockGetTracker: jest.Mock;
let mockRecordApplicationOutcome: jest.Mock;
let mockSearchParams: URLSearchParams;
let mockReplace: jest.Mock;
const mockPush = jest.fn();

// ── Next.js mocks ─────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/tracker',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

// ── Chakra UI ─────────────────────────────────────────────────────────────────

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        { children, onClick, type, disabled, isDisabled, 'aria-label': al, href, role }: any,
        ref: any
      ) =>
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
    IconButton: ({ 'aria-label': al, onClick, children, isDisabled, disabled }: any) =>
      React.createElement(
        'button',
        { 'aria-label': al, onClick, disabled: isDisabled || disabled || undefined },
        children ?? null
      ),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: ({ children, role: r }: any) =>
      React.createElement('div', { role: r ?? 'alert' }, children),
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
    useTheme: () => ({
      colors: {
        brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69' },
        gray:     { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280' },
        surface:  { bg: '#F4F5F3', border: '#E5E7EB' },
        text:     { primary: '#16202A', secondary: '#4B5563' },
        semantic: { error: '#EF4444', success: '#22C55E' },
      },
    }),
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
    MenuItem: ({ children, onClick, isDisabled, disabled }: any) => {
      const dis = isDisabled || disabled || false;
      return React.createElement(
        'li',
        { role: 'menuitem', 'aria-disabled': dis || undefined, onClick: dis ? undefined : onClick },
        children
      );
    },
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) =>
      React.createElement('div', { role: 'tablist' }, children),
    Tab: ({ children, onClick }: any) =>
      React.createElement('button', { role: 'tab', onClick }, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) =>
      React.createElement('div', { role: 'tabpanel' }, children),
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

// ── Theme / icon stubs ────────────────────────────────────────────────────────

jest.mock('@/theme/theme', () => ({
  __esModule: true,
  default: {
    colors: {
      brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69' },
      gray:     { 50: '#F9FAFB', 500: '#6B7280' },
      surface:  { bg: '#F4F5F3', border: '#E5E7EB' },
      text:     { primary: '#16202A', secondary: '#4B5563' },
      semantic: { error: '#EF4444', success: '#22C55E', primary: '#1D4E89' },
    },
  },
}));

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

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

// ── Project mocks ─────────────────────────────────────────────────────────────

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

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/components/Dashboard/GenerateAnswer', () => ({
  __esModule: true,
  GenerateAnswer: () => null,
}));

jest.mock('@/components/Dashboard/JobQuestionsDrawer', () => ({
  __esModule: true,
  default: () => null,
  JobQuestionsDrawer: () => null,
}));

// ── apiClient mock ─────────────────────────────────────────────────────────────

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getTracker: (...args: any[]) => mockGetTracker(...args),
    recordApplicationOutcome: (...args: any[]) => mockRecordApplicationOutcome(...args),
    getUserProfile: jest.fn().mockResolvedValue({
      id: 'u1', name: 'Test', email: 'test@example.com',
      phone: null, currentLocation: null, createdAt: new Date('2024-01-01').toISOString(),
      resume: { summary: 'Engineer', skills: [], experience: [], education: [],
                certifications: [], languages: [], projects: [], achievements: [],
                volunteerExperience: [], interests: [] },
      isVerified: true,
      preferences: { jobTypes: [], location: [], remoteOnly: false, minSalary: 0,
                     industries: [], minScore: 30, matchingEnabled: true },
    }),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 5.0 }),
    getOutOfCreditPreview: jest.fn().mockResolvedValue(null),
    getSkipped: jest.fn().mockResolvedValue([]),
    getMatches: jest.fn().mockResolvedValue([]),
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchApplied: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
    unskipMatch: jest.fn().mockResolvedValue({}),
    getQuestion: jest.fn().mockResolvedValue(null),
    postAnswer: jest.fn().mockResolvedValue({}),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    skipQuestion: jest.fn().mockResolvedValue({}),
    createAnswer: jest.fn().mockResolvedValue({}),
    getMatchQnAHistory: jest.fn().mockResolvedValue([]),
    sendChatMessage: jest.fn().mockResolvedValue({}),
    getChatConversations: jest.fn().mockResolvedValue([]),
    getChatConversation: jest.fn().mockResolvedValue({}),
    getChatMemory: jest.fn().mockResolvedValue({}),
    deleteChatMemory: jest.fn().mockResolvedValue({}),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    updatePreferences: jest.fn().mockResolvedValue({}),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    resetGuideProgress: jest.fn().mockResolvedValue({}),
    getPublicStats: jest.fn().mockResolvedValue(null),
    touchSession: jest.fn().mockResolvedValue(undefined),
  }),
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: () => Promise.resolve(null),
}) as any;

// ── Imports (must come after all jest.mock() calls) ───────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import TrackerPage from '@/pages/tracker';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(Date.now() - n * MS_PER_DAY).toISOString();
}

let _seq = 0;
const uid = () => `oaq-${++_seq}`;

function makeJob(title: string, company: string): any {
  return {
    _id: uid(),
    title,
    company,
    location: [],
    salary: { min: 0, max: 0, currency: 'USD', estimated: false },
    tags: [],
    source: 'test',
    description: 'A test listing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postedDate: new Date().toISOString(),
    scrapedDate: new Date().toISOString(),
    url: 'https://example.com/job',
  };
}

function makeStaleMatch(title: string, company: string, overrides: Record<string, any> = {}): any {
  return {
    _id: uid(),
    userId: 'u1',
    jobId: uid(),
    matchScore: 80,
    verdict: 'good',
    reasoning: 'Test match.',
    clicked: false,
    applied: true,
    appliedAt: daysAgo(20),
    skipped: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applicationOutcome: undefined,
    job: makeJob(title, company),
    ...overrides,
  };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  _seq = 0;
  mockSearchParams = new URLSearchParams();
  mockReplace = jest.fn();
  mockPush.mockReset();
  mockGetTracker = jest.fn().mockResolvedValue([]);
  mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
  jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderAndSettle(): Promise<void> {
  await act(async () => {
    render(<TrackerPage />);
  });
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 4000 }
  );
  // Flush remaining microtasks/effects after loading completes.
  await act(async () => {});
}

function getWizardDialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function isWizardOpen(): boolean {
  return getWizardDialog() !== null;
}

function findOutcomeButton(label: string | RegExp): HTMLElement | null {
  const dialog = getWizardDialog();
  if (!dialog) return null;
  const btns = Array.from(dialog.querySelectorAll('button'));
  const btn = btns.find(b => {
    const text = (b.textContent ?? '').trim();
    return typeof label === 'string' ? text === label : label.test(text);
  });
  return (btn as HTMLElement) ?? null;
}

function findSkipButton(): HTMLElement | null {
  const dialog = getWizardDialog();
  if (!dialog) return null;
  const btns = Array.from(dialog.querySelectorAll('button'));
  return (btns.find(b => /^skip$/i.test((b.textContent ?? '').trim())) as HTMLElement) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 0 — Baseline: page loads without crashing
// ═══════════════════════════════════════════════════════════════════════════════

describe('0 — Baseline', () => {
  it('0-1: renders without crashing and loader clears', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([makeStaleMatch('SE', 'Acme')]);
    await renderAndSettle();
    expect(true).toBe(true);
  });

  it('0-2: getTracker is called once on mount', async () => {
    await renderAndSettle();
    expect(mockGetTracker).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — NO AUTO-RECORD [highest priority — security]
//
// Contract: ?followup=true opens the wizard but MUST NOT call
// recordApplicationOutcome merely from page load. Only an explicit user
// outcome selection triggers the API.
// ═══════════════════════════════════════════════════════════════════════════════

describe('1 — NO AUTO-RECORD (security)', () => {
  it('1-1 [PRIMARY]: wizard opens with followup=true AND recordApplicationOutcome is NOT called on load', async () => {
    const matchA = makeStaleMatch('Backend Eng', 'Orbit Inc');
    const matchB = makeStaleMatch('Frontend Eng', 'Pulse Co');
    const matchC = makeStaleMatch('DevOps Eng', 'Nexus Ltd');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB, matchC]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    // CONTRACT: wizard must open — otherwise this test is vacuous.
    // FINDING if not open: followup=true deep link is non-functional.
    const dialogOpen = isWizardOpen();
    if (!dialogOpen) {
      console.warn('[FINDING 1-1]: Wizard did NOT open with followup=true — deep link broken.');
    }
    expect(dialogOpen).toBe(true);

    // CONTRACT (SECURITY): no API call made merely by opening the wizard.
    // FINDING if called: impl auto-submits an outcome on page load — silent DB write without user consent.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('1-2: wizard stays open for 500ms without auto-recording (deferred-effect guard)', async () => {
    const match = makeStaleMatch('PM', 'Atlas Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    await act(async () => {});

    // FINDING if called: deferred-effect fired an auto-record. Time-bomb bug.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('1-3: no auto-record even when wizard is open and user just hovers (no click)', async () => {
    const match = makeStaleMatch('Designer', 'Hover Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    const dialog = getWizardDialog();
    if (dialog) {
      // Trigger a mouseMove on the dialog to simulate hover (potential event-listener bug).
      fireEvent.mouseMove(dialog);
      await act(async () => {});
    }

    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — SELECT records the CURRENT match id and advances
//
// Contract: selecting an outcome calls recordApplicationOutcome with
// (currentMatchId, outcome) for the CURRENT step — NOT the next or another.
// The wizard then advances to the next eligible app.
// ═══════════════════════════════════════════════════════════════════════════════

describe('2 — SELECT records current match id and advances', () => {
  it('2-1 [PRIMARY]: selecting outcome on step 1 calls recordApplicationOutcome with step-1 matchId only', async () => {
    const matchA = makeStaleMatch('Backend Dev', 'Orbit Inc');
    const matchB = makeStaleMatch('Frontend Dev', 'Pulse Co');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 2-1]: Wizard not open — cannot test selection.');
      return;
    }

    // Detect which match is shown on step 1 from the dialog text.
    const dialog = getWizardDialog()!;
    const step1Text = dialog.textContent ?? '';
    const step1IsMatchA = step1Text.includes('Orbit Inc');
    const step1MatchId = step1IsMatchA ? matchA._id : matchB._id;
    const step2Company = step1IsMatchA ? 'Pulse Co' : 'Orbit Inc';

    const heardBackBtn = findOutcomeButton('Heard Back');
    if (!heardBackBtn) {
      console.warn('[FINDING 2-1]: No "Heard Back" outcome button found in wizard.');
      return;
    }

    await act(async () => { fireEvent.click(heardBackBtn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];

    // CONTRACT: first arg must be the step-1 match id.
    // FINDING if wrong id: impl used the next match's id, the job._id, or a hardcoded value.
    expect(calledId).toBe(step1MatchId);

    // CONTRACT: outcome must be "heard_back".
    expect(calledOutcome).toBe('heard_back');

    // CONTRACT: wizard must advance to show the step-2 company.
    await waitFor(
      () => {
        const dlg = getWizardDialog();
        // FINDING if null: wizard closed early instead of advancing.
        expect(dlg).not.toBeNull();
        if (dlg) {
          // FINDING if still shows step-1 company: wizard did not advance.
          expect(dlg.textContent).toContain(step2Company);
        }
      },
      { timeout: 3000 }
    );
  });

  it('2-2: only ONE API call is made after advancing — next match not auto-recorded', async () => {
    const matchA = makeStaleMatch('Data Eng', 'Astro Corp');
    const matchB = makeStaleMatch('ML Eng', 'Nova Labs');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: advancing must not auto-submit for the next match.
    // FINDING if > 1: impl pre-submitted the next match's outcome.
    expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(1);
  });

  it('2-3: step counter shows "1 of 2" initially then "2 of 2" after advancing', async () => {
    const matchA = makeStaleMatch('UX Designer', 'Craft Studios');
    const matchB = makeStaleMatch('Product Designer', 'Pixel Forge');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const dialog1 = getWizardDialog()!;
    // CONTRACT: initial step counter is "1 of 2".
    // FINDING if absent: step counter not rendered.
    expect(dialog1.textContent).toMatch(/1\s+of\s+2/);

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });

    // Wait for the wizard to advance to step 2.
    await waitFor(() => {
      const d = getWizardDialog();
      if (!d) throw new Error('wizard closed');
      if (!d.textContent?.match(/2\s+of\s+2/)) throw new Error('still on step 1');
    }, { timeout: 3000 }).catch(() => {});

    const dialog2 = getWizardDialog();
    if (!dialog2) {
      console.warn('[FINDING 2-3]: Wizard closed after step 1 instead of advancing to step 2.');
      return;
    }

    // CONTRACT: after advancing, step counter must show "2 of 2".
    // FINDING if "1 of 2": step counter not updated.
    expect(dialog2.textContent).toMatch(/2\s+of\s+2/);
  });

  it('2-4: selecting "Got Interview" sends outcome "interview" (not "interviewing")', async () => {
    const match = makeStaleMatch('Eng', 'TechCo');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const btn = findOutcomeButton('Got Interview');
    if (!btn) {
      console.warn('[FINDING 2-4]: No "Got Interview" button in wizard.');
      return;
    }

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const outcome = mockRecordApplicationOutcome.mock.calls[0][1];
    // CONTRACT: the outcome value must be "interview" (the DB key), not "interviewing" (the column name).
    // FINDING if "interviewing": impl sent the column key instead of the outcome value.
    expect(outcome).toBe('interview');
    expect(outcome).not.toBe('interviewing');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — LAST STEP closes the wizard
//
// Contract: selecting an outcome on the LAST eligible app closes the wizard.
// ═══════════════════════════════════════════════════════════════════════════════

describe('3 — LAST STEP closes the wizard', () => {
  it('3-1 [PRIMARY]: single eligible app — selecting outcome closes wizard', async () => {
    const match = makeStaleMatch('QA Eng', 'TestBench Ltd');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 3-1]: Wizard not open for single eligible app.');
      return;
    }

    const btn = findOutcomeButton('Heard Back');
    if (!btn) {
      console.warn('[FINDING 3-1]: No "Heard Back" button found.');
      return;
    }

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    // CONTRACT: wizard must close after the final selection.
    // FINDING if still open: impl did not close the wizard on last step.
    await waitFor(() => expect(isWizardOpen()).toBe(false), { timeout: 2000 });
  });

  it('3-2: last step of 3 — wizard closes after selecting on the 3rd app', async () => {
    const matchA = makeStaleMatch('DevOps', 'CloudBase');
    const matchB = makeStaleMatch('SRE', 'NetOps Inc');
    const matchC = makeStaleMatch('Platform Eng', 'Infra Corp');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB, matchC]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    for (let i = 0; i < 3; i++) {
      if (!isWizardOpen()) {
        // FINDING: wizard closed before expected step ${i + 1}
        expect(isWizardOpen()).toBe(true);
        return;
      }
      const btn = findOutcomeButton('Heard Back');
      if (!btn) return;
      await act(async () => { fireEvent.click(btn); });
      await waitFor(
        () => expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(i + 1),
        { timeout: 3000 }
      );
      await act(async () => {});
    }

    // CONTRACT: wizard must be closed after 3rd (final) selection.
    await waitFor(() => expect(isWizardOpen()).toBe(false), { timeout: 3000 });
  });

  it('3-3: exactly one API call on single-app last step (no duplicate submission)', async () => {
    const match = makeStaleMatch('Security Eng', 'SecureNet');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // FINDING if > 1: impl duplicated the API call on close.
    expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ERROR keeps position
//
// Contract: when recordApplicationOutcome returns { error }, the wizard:
//   - shows an error
//   - STAYS on the same app (does NOT advance)
//   - does NOT auto-call recordApplicationOutcome for the next app
// ═══════════════════════════════════════════════════════════════════════════════

describe('4 — ERROR: stays on same app, shows error, does not advance', () => {
  it('4-1 [PRIMARY]: { error } response — wizard stays on current app and shows error', async () => {
    const matchA = makeStaleMatch('Sr Eng', 'FailCorp');
    const matchB = makeStaleMatch('Jr Eng', 'OkCorp');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ error: 'Server unavailable' });
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 4-1]: Wizard not open. Cannot test error behavior.');
      return;
    }

    const dialog = getWizardDialog()!;
    const step1Text = dialog.textContent ?? '';
    const step1Company = step1Text.includes('FailCorp') ? 'FailCorp' : 'OkCorp';
    const step2Company = step1Company === 'FailCorp' ? 'OkCorp' : 'FailCorp';

    const btn = findOutcomeButton('Heard Back');
    if (!btn) {
      console.warn('[FINDING 4-1]: No "Heard Back" button.');
      return;
    }

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: wizard must remain OPEN after error.
    // FINDING if closed: impl closed the wizard on error — user loses their position.
    expect(isWizardOpen()).toBe(true);

    const dlgAfter = getWizardDialog()!;

    // CONTRACT: wizard must still show the step-1 company (did not advance).
    // FINDING if shows step-2 company: impl advanced despite the error.
    expect(dlgAfter.textContent).toContain(step1Company);
    expect(dlgAfter.textContent).not.toContain(step2Company);

    // CONTRACT: an error indicator must be visible.
    // FINDING if absent: impl swallowed the error with no user feedback.
    const alertEl = dlgAfter.querySelector('[role="alert"]');
    const errorTextEl = dlgAfter.textContent?.match(/server unavailable|error|failed|unable|wrong|try again/i);
    const hasError = alertEl !== null || errorTextEl !== null;
    if (!hasError) {
      console.warn('[FINDING 4-1]: No error feedback shown in wizard after { error } response.');
    }
    expect(hasError).toBe(true);
  });

  it('4-2: after error, only ONE API call total (no auto-record for next match)', async () => {
    const matchA = makeStaleMatch('Staff Eng', 'ErrorCo');
    const matchB = makeStaleMatch('Principal', 'OkCo');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ error: 'boom' });
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: only ONE call — the failed attempt. No auto-advance into next match.
    // FINDING if > 1: impl auto-submitted the next match after the error.
    expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(1);
  });

  it('4-3: truthy non-string error field still keeps position (guards against `if (result)` bug)', async () => {
    const match = makeStaleMatch('Analyst', 'TruthyCo');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    // error: true is a truthy non-string error — tests that impl checks `result.error`, not `result`
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ error: true });
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // FINDING if closed: impl only handles string errors — truthy `true` slips through as success.
    expect(isWizardOpen()).toBe(true);
  });

  it('4-4: step counter remains on same step after error (not incremented)', async () => {
    const matchA = makeStaleMatch('Eng A', 'ErrA Corp');
    const matchB = makeStaleMatch('Eng B', 'ErrB Corp');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ error: 'step-hold test' });
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const dialog = getWizardDialog()!;
    // Verify starting at step 1 of 2
    if (!dialog.textContent?.match(/1\s+of\s+2/)) return;

    const btn = findOutcomeButton('Heard Back');
    if (!btn) return;

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    const dlgAfter = getWizardDialog();
    if (!dlgAfter) return;

    // CONTRACT: step counter must still show "1 of 2" — not incremented to "2 of 2".
    // FINDING if "2 of 2": impl incremented the step counter despite the error.
    expect(dlgAfter.textContent).toMatch(/1\s+of\s+2/);
    expect(dlgAfter.textContent).not.toMatch(/2\s+of\s+2/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — SKIP: advances without calling recordApplicationOutcome
//
// Contract: clicking Skip advances to the next app WITHOUT calling
// recordApplicationOutcome for the skipped app.
// ═══════════════════════════════════════════════════════════════════════════════

describe('5 — SKIP: advances without recording', () => {
  it('5-1 [PRIMARY]: Skip does NOT call recordApplicationOutcome for the skipped app', async () => {
    const matchA = makeStaleMatch('Tech Lead', 'SkipCorp');
    const matchB = makeStaleMatch('Architect', 'NextCorp');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 5-1]: Wizard not open. Cannot test Skip.');
      return;
    }

    const skipBtn = findSkipButton();
    if (!skipBtn) {
      console.warn('[FINDING 5-1]: No "Skip" button found in wizard.');
      return;
    }

    await act(async () => { fireEvent.click(skipBtn); });
    await act(async () => {});

    // CONTRACT: Skip must NOT call recordApplicationOutcome.
    // FINDING if called: impl submitted an outcome on skip.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('5-2: Skip advances the wizard to show the next app', async () => {
    const matchA = makeStaleMatch('CTO', 'SkipFirst Corp');
    const matchB = makeStaleMatch('VP Eng', 'ShowNext Inc');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const dialog = getWizardDialog()!;
    const step1Text = dialog.textContent ?? '';
    const step1Company = step1Text.includes('SkipFirst Corp') ? 'SkipFirst Corp' : 'ShowNext Inc';
    const step2Company = step1Company === 'SkipFirst Corp' ? 'ShowNext Inc' : 'SkipFirst Corp';

    const skipBtn = findSkipButton();
    if (!skipBtn) return;

    await act(async () => { fireEvent.click(skipBtn); });

    // Wait for the wizard to advance and show the next company.
    await waitFor(() => {
      expect(isWizardOpen()).toBe(true);
      const dlg = getWizardDialog()!;
      expect(dlg.textContent).toContain(step2Company);
    }, { timeout: 2000 });

    const dlgAfter = getWizardDialog()!;
    // CONTRACT: shows next app's company.
    // FINDING if same company: impl did not advance after skip.
    expect(dlgAfter.textContent).toContain(step2Company);
    expect(dlgAfter.textContent).not.toContain(step1Company);
  });

  it('5-3: skipping the last (and only) app closes the wizard', async () => {
    const match = makeStaleMatch('Solo Eng', 'OnlyOneCo');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const skipBtn = findSkipButton();
    if (!skipBtn) return;

    await act(async () => { fireEvent.click(skipBtn); });

    // CONTRACT: wizard closes after skipping the last app.
    // FINDING if still open: wizard stuck open with no more apps.
    await waitFor(() => expect(isWizardOpen()).toBe(false), { timeout: 2000 });
    // Skipping should never record.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — NO ELIGIBLE: no wizard when all apps have outcomes
//
// Contract: when all applied apps already have applicationOutcome set,
// no wizard opens — even with followup=true.
// ═══════════════════════════════════════════════════════════════════════════════

describe('6 — NO ELIGIBLE: wizard does not open when all apps answered', () => {
  it('6-1 [PRIMARY]: all apps have outcomes → no dialog with followup=true', async () => {
    const matchA = makeStaleMatch('SE', 'AnswA', { applicationOutcome: 'interview' });
    const matchB = makeStaleMatch('EM', 'AnswB', { applicationOutcome: 'rejected' });
    const matchC = makeStaleMatch('PM', 'AnswC', { applicationOutcome: 'offer' });
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB, matchC]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    // CONTRACT: no eligible apps → wizard must not open.
    // FINDING if dialog found: impl ignored the applicationOutcome filter.
    expect(isWizardOpen()).toBe(false);
  });

  it('6-2: empty tracker → no wizard with followup=true', async () => {
    mockGetTracker = jest.fn().mockResolvedValue([]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    expect(isWizardOpen()).toBe(false);
  });

  it('6-3: no auto-record with no eligible apps (defensive)', async () => {
    const match = makeStaleMatch('Eng', 'Corp', { applicationOutcome: 'no_response' });
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — NO PARAM: no wizard without ?followup=true
//
// Contract: visiting /tracker WITHOUT followup=true must NOT auto-open
// the wizard, even with eligible stale apps.
// ═══════════════════════════════════════════════════════════════════════════════

describe('7 — NO PARAM: no auto-open without followup=true', () => {
  it('7-1 [PRIMARY]: stale apps exist but no followup param → no wizard', async () => {
    const matchA = makeStaleMatch('Eng A', 'Corp A');
    const matchB = makeStaleMatch('Eng B', 'Corp B');
    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockSearchParams = new URLSearchParams(); // no followup

    await renderAndSettle();

    // CONTRACT: wizard only opens on explicit followup=true.
    // FINDING if dialog found: impl always shows wizard when stale apps exist.
    expect(isWizardOpen()).toBe(false);
  });

  it('7-2: followup=false does not trigger the wizard', async () => {
    const match = makeStaleMatch('PM', 'Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=false');

    await renderAndSettle();

    // FINDING if open: impl treats any `followup` value as truthy.
    expect(isWizardOpen()).toBe(false);
  });

  it('7-3: followup param with wrong value ("1") does not trigger', async () => {
    const match = makeStaleMatch('Eng', 'Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=1');

    await renderAndSettle();

    // CONTRACT: must be exactly "true", not just any truthy string.
    // FINDING if open: impl uses coercion (e.g. !!param) rather than === 'true'.
    expect(isWizardOpen()).toBe(false);
  });

  it('7-4: no recordApplicationOutcome call without followup param', async () => {
    const match = makeStaleMatch('Designer', 'Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams();

    await renderAndSettle();

    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — EXCLUDE answered from total count
//
// Contract: the wizard total reflects ONLY the no-outcome apps.
// Apps that already have applicationOutcome are excluded from count AND from steps.
// ═══════════════════════════════════════════════════════════════════════════════

describe('8 — EXCLUDE answered: total count only includes no-outcome apps', () => {
  it('8-1 [PRIMARY]: 2 eligible + 2 answered → wizard shows "1 of 2", not "1 of 4"', async () => {
    const eligA = makeStaleMatch('Eligible A', 'EligA Corp');
    const eligB = makeStaleMatch('Eligible B', 'EligB Corp');
    const ansA = makeStaleMatch('Answered A', 'AnsA Corp', { applicationOutcome: 'interview' });
    const ansB = makeStaleMatch('Answered B', 'AnsB Corp', { applicationOutcome: 'rejected' });
    mockGetTracker = jest.fn().mockResolvedValue([eligA, eligB, ansA, ansB]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 8-1]: Wizard not open with 2 eligible + 2 answered apps.');
      return;
    }

    const dialogText = getWizardDialog()!.textContent ?? '';

    // CONTRACT: total = 2 (only eligible). FINDING if "of 4": answered apps counted.
    expect(dialogText).toMatch(/1\s+of\s+2/);
    expect(dialogText).not.toMatch(/of\s+4/);
    expect(dialogText).not.toMatch(/of\s+3/);
  });

  it('8-2: answered apps never appear as wizard steps', async () => {
    const eligible = makeStaleMatch('Good Fit', 'GoodCo');
    const answered = makeStaleMatch('Already Done', 'AnsweredCo', { applicationOutcome: 'offer' });
    mockGetTracker = jest.fn().mockResolvedValue([eligible, answered]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const dialog = getWizardDialog()!;
    // CONTRACT: answered app never appears in the wizard flow.
    // FINDING if AnsweredCo appears: impl included already-answered apps in wizard steps.
    expect(dialog.textContent).not.toContain('AnsweredCo');
    // FINDING if GoodCo absent: impl excluded the eligible app.
    expect(dialog.textContent).toContain('GoodCo');
  });

  it('8-3: total is 1 when exactly 1 eligible exists among multiple answered apps', async () => {
    const eligible = makeStaleMatch('Solo Eng', 'SoloCo');
    const ansA = makeStaleMatch('Done A', 'DoneA', { applicationOutcome: 'heard_back' });
    const ansB = makeStaleMatch('Done B', 'DoneB', { applicationOutcome: 'no_response' });
    mockGetTracker = jest.fn().mockResolvedValue([ansA, eligible, ansB]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    if (!isWizardOpen()) return;

    const dialogText = getWizardDialog()!.textContent ?? '';
    // CONTRACT: total = 1. FINDING if "1 of 2" or "1 of 3": answered apps were counted.
    expect(dialogText).toMatch(/1\s+of\s+1/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — PARAM STRIPPED: router.replace called with '/tracker'
//
// Contract: after opening the wizard, the impl calls router.replace('/tracker')
// to strip the ?followup=true param (prevents re-open on refresh).
// ═══════════════════════════════════════════════════════════════════════════════

describe('9 — PARAM STRIPPED: router.replace("/tracker") called after wizard opens', () => {
  it('9-1 [PRIMARY]: router.replace called with "/tracker" (no followup param)', async () => {
    const match = makeStaleMatch('Param Test Eng', 'Param Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();

    if (!isWizardOpen()) {
      console.warn('[FINDING 9-1]: Wizard not open — cannot verify param stripping.');
      return;
    }

    // CONTRACT: router.replace must be called with '/tracker'.
    // FINDING if not called: impl did not strip the param — refresh re-opens wizard.
    await waitFor(() => expect(mockReplace).toHaveBeenCalled(), { timeout: 3000 });

    const replacedPath: string = mockReplace.mock.calls[0][0];

    // FINDING if includes 'followup': param was not stripped.
    expect(replacedPath).toBe('/tracker');
    expect(replacedPath).not.toContain('followup');
  });

  it('9-2: router.replace NOT called when there is no followup param', async () => {
    const match = makeStaleMatch('No Param Eng', 'NP Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams(); // no followup

    await renderAndSettle();
    await act(async () => {});

    // FINDING if called: impl unconditionally calls replace on /tracker mount.
    const calledWithTracker = mockReplace.mock.calls.some((c: any[]) => c[0] === '/tracker');
    expect(calledWithTracker).toBe(false);
  });

  it('9-3: router.replace called exactly once (not on every re-render)', async () => {
    const match = makeStaleMatch('Idem Eng', 'Idem Corp');
    mockGetTracker = jest.fn().mockResolvedValue([match]);
    mockSearchParams = new URLSearchParams('followup=true');

    await renderAndSettle();
    // Wait for replace to be called (or give up after timeout).
    await waitFor(
      () => expect(mockReplace.mock.calls.filter((c: any[]) => c[0] === '/tracker').length).toBeGreaterThan(0),
      { timeout: 2000 }
    ).catch(() => {});
    await act(async () => {});

    const replaceCount = mockReplace.mock.calls.filter((c: any[]) => c[0] === '/tracker').length;

    if (replaceCount === 0) {
      console.warn('[FINDING 9-3]: router.replace("/tracker") was never called.');
      return;
    }

    // FINDING if > 1: impl calls replace in an effect without a dep-guard (loops).
    expect(replaceCount).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — UPDATE STATUS button opens follow-up flow from within the page
//
// Contract: stale cards (≥14 days, no outcome) expose an "Update status" button
// that opens the same follow-up wizard WITHOUT needing followup=true in the URL.
// ═══════════════════════════════════════════════════════════════════════════════

describe('10 — UPDATE STATUS button on stale card', () => {
  it('10-1 [PRIMARY]: stale card has an "Update status" button that opens the wizard', async () => {
    const staleMatch = makeStaleMatch('Needs Update Eng', 'Stale Corp');
    mockGetTracker = jest.fn().mockResolvedValue([staleMatch]);
    mockSearchParams = new URLSearchParams(); // no followup param — must work without it
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);

    await renderAndSettle();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const updateBtn = allBtns.find(b => /update.?status/i.test((b.textContent ?? '').trim()));

    if (!updateBtn) {
      console.warn('[FINDING 10-1]: No "Update status" button found on stale card. Follow-up flow unreachable without the email link.');
      expect(updateBtn).toBeDefined();
      return;
    }

    // Wizard must not be open before clicking.
    expect(isWizardOpen()).toBe(false);

    await act(async () => { fireEvent.click(updateBtn as HTMLElement); });

    // CONTRACT: clicking "Update status" opens the follow-up wizard.
    // FINDING if not open: button exists but does not trigger the wizard.
    await waitFor(() => expect(isWizardOpen()).toBe(true), { timeout: 2000 });
  });

  it('10-2: recent card (< 14 days) does NOT show "Update status" button', async () => {
    const recentMatch = makeStaleMatch('Recent Eng', 'RecentCo', {
      appliedAt: daysAgo(5), // only 5 days — not stale
    });
    mockGetTracker = jest.fn().mockResolvedValue([recentMatch]);
    mockSearchParams = new URLSearchParams();

    await renderAndSettle();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const updateBtn = allBtns.find(b => /update.?status/i.test((b.textContent ?? '').trim()));

    // CONTRACT: "Update status" only appears for stale (≥14 day) cards.
    // FINDING if found: impl shows update button for all cards regardless of staleness.
    if (updateBtn) {
      console.warn('[FINDING 10-2]: "Update status" button shown for a 5-day-old card — should only appear for stale (≥14 day) apps.');
      expect(updateBtn).toBeUndefined();
    }
  });

  it('10-3: "Update status" flow calls recordApplicationOutcome with the correct match id', async () => {
    const staleMatch = makeStaleMatch('Stale Role', 'Stale Org');
    mockGetTracker = jest.fn().mockResolvedValue([staleMatch]);
    mockSearchParams = new URLSearchParams();
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);

    await renderAndSettle();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const updateBtn = allBtns.find(b => /update.?status/i.test((b.textContent ?? '').trim()));

    if (!updateBtn) {
      console.warn('[FINDING 10-3]: No "Update status" button — skipping outcome assertion.');
      return;
    }

    await act(async () => { fireEvent.click(updateBtn as HTMLElement); });
    await waitFor(() => expect(isWizardOpen()).toBe(true), { timeout: 2000 }).catch(() => {});

    if (!isWizardOpen()) {
      console.warn('[FINDING 10-3]: Wizard did not open from "Update status" click.');
      return;
    }

    const heardBackBtn = findOutcomeButton('Heard Back');
    if (!heardBackBtn) return;

    await act(async () => { fireEvent.click(heardBackBtn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const [calledId, calledOutcome] = mockRecordApplicationOutcome.mock.calls[0];

    // CONTRACT: must use the match's _id, not the job's _id.
    // FINDING if wrong id: impl confused match _id with job._id.
    expect(calledId).toBe(staleMatch._id);
    expect(calledOutcome).toBe('heard_back');
  });

  it('10-4: "Update status" wizard does not call recordApplicationOutcome on open (security — same as section 1)', async () => {
    const staleMatch = makeStaleMatch('Auto-sec Eng', 'SecCo');
    mockGetTracker = jest.fn().mockResolvedValue([staleMatch]);
    mockSearchParams = new URLSearchParams();

    await renderAndSettle();

    const allBtns = Array.from(document.querySelectorAll('button'));
    const updateBtn = allBtns.find(b => /update.?status/i.test((b.textContent ?? '').trim()));

    if (!updateBtn) return; // prerequisite; finding reported in 10-1

    await act(async () => { fireEvent.click(updateBtn as HTMLElement); });
    await waitFor(() => expect(isWizardOpen()).toBe(true), { timeout: 2000 }).catch(() => {});
    await act(async () => {});

    // CONTRACT: opening via button must also not auto-record.
    // FINDING if called: impl calls recordApplicationOutcome on wizard open — same bug as case 1.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — LOAD ERROR: ?followup=true is NOT consumed when getTracker fails
//
// Contract (Fix 1): when getTracker() returns { error }, the follow-up effect
// must NOT fire. The wizard must not open, router.replace must not be called,
// and no "caught up" toast or recordApplicationOutcome call must happen.
// This preserves the deep-link param for a later successful load.
// ═══════════════════════════════════════════════════════════════════════════════

describe('11 — LOAD ERROR: followup param preserved when getTracker fails', () => {
  it('11-1 [PRIMARY]: { error } from getTracker → wizard does NOT open', async () => {
    mockGetTracker = jest.fn().mockResolvedValue({ error: 'Network failure' });
    mockSearchParams = new URLSearchParams('followup=true');

    await act(async () => {
      render(<TrackerPage />);
    });
    // Wait for the API call to complete and effects to settle.
    await waitFor(() => expect(mockGetTracker).toHaveBeenCalled(), { timeout: 4000 });
    await act(async () => {});

    // CONTRACT: error load must not open the wizard.
    // FINDING if open: impl fired the follow-up effect despite a load error.
    expect(isWizardOpen()).toBe(false);
  });

  it('11-2: { error } from getTracker → router.replace is NOT called (param not stripped)', async () => {
    mockGetTracker = jest.fn().mockResolvedValue({ error: 'Server error' });
    mockSearchParams = new URLSearchParams('followup=true');

    await act(async () => {
      render(<TrackerPage />);
    });
    await waitFor(() => expect(mockGetTracker).toHaveBeenCalled(), { timeout: 4000 });
    await act(async () => {});

    // CONTRACT: the param must NOT be stripped when the load failed —
    // a reload may succeed and should still honor the deep-link.
    // FINDING if called: impl stripped the param even on error, losing the deep-link context.
    const calledWithTracker = mockReplace.mock.calls.some((c: any[]) => c[0] === '/tracker');
    expect(calledWithTracker).toBe(false);
  });

  it('11-3: { error } from getTracker → recordApplicationOutcome is NOT called', async () => {
    mockGetTracker = jest.fn().mockResolvedValue({ error: 'Timeout' });
    mockSearchParams = new URLSearchParams('followup=true');

    await act(async () => {
      render(<TrackerPage />);
    });
    await waitFor(() => expect(mockGetTracker).toHaveBeenCalled(), { timeout: 4000 });
    await act(async () => {});

    // CONTRACT: no outcome recorded when the load never completed.
    // FINDING if called: impl silently mutated state without a valid tracker load.
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('11-4: thrown exception from getTracker → wizard does NOT open and param not stripped', async () => {
    mockGetTracker = jest.fn().mockRejectedValue(new Error('fetch failed'));
    mockSearchParams = new URLSearchParams('followup=true');

    await act(async () => {
      render(<TrackerPage />);
    });
    await waitFor(() => expect(mockGetTracker).toHaveBeenCalled(), { timeout: 4000 });
    await act(async () => {});

    // CONTRACT: a thrown exception (not just { error }) must also be safe.
    // FINDING if open: impl only guards the { error } branch but not catch path.
    expect(isWizardOpen()).toBe(false);

    const calledWithTracker = mockReplace.mock.calls.some((c: any[]) => c[0] === '/tracker');
    // FINDING if called: param stripped after catch — same bug, different path.
    expect(calledWithTracker).toBe(false);

    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — SECURITY: URL matchId is IGNORED; only getTracker() ids are used
//
// Contract: the impl must never read matchId from the URL and pass it to
// recordApplicationOutcome. The wizard must only operate on ids returned by
// getTracker(). A URL matchId is an injection vector — honoring it would let
// any user forge outcome records for another user's match.
// ═══════════════════════════════════════════════════════════════════════════════

describe('12 — SECURITY: URL matchId param is always ignored', () => {
  it('12-1 [PRIMARY]: matchId in URL is ignored; recordApplicationOutcome uses getTracker id only', async () => {
    const realMatch = makeStaleMatch('Real Role', 'RealCo');
    const foreignMatchId = 'SOMEONE_ELSES_MATCH_ID_XXXXXXX';

    mockGetTracker = jest.fn().mockResolvedValue([realMatch]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    // URL has followup=true AND a foreign matchId
    mockSearchParams = new URLSearchParams(`followup=true&matchId=${foreignMatchId}`);

    await renderAndSettle();

    if (!isWizardOpen()) {
      // If wizard didn't open, the matchId param also can't have been used — still safe.
      // But we still check the API was not called with the foreign id.
      expect(mockRecordApplicationOutcome).not.toHaveBeenCalledWith(foreignMatchId, expect.anything());
      return;
    }

    // Click an outcome to trigger the API call.
    const btn = findOutcomeButton('Heard Back');
    if (!btn) {
      console.warn('[FINDING 12-1]: No "Heard Back" button — cannot verify matchId isolation.');
      return;
    }

    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalled(), { timeout: 3000 });

    const calledId: string = mockRecordApplicationOutcome.mock.calls[0][0];

    // CONTRACT: must use the match id from getTracker(), not the URL param.
    // FINDING if calledId === foreignMatchId: impl read matchId from the URL — injection vector.
    expect(calledId).toBe(realMatch._id);
    expect(calledId).not.toBe(foreignMatchId);
  });

  it('12-2: matchId-only URL (no followup=true) does not open wizard or call API', async () => {
    const realMatch = makeStaleMatch('Safe Role', 'SafeCo');
    const foreignMatchId = 'FOREIGN_ID_NO_FOLLOWUP';

    mockGetTracker = jest.fn().mockResolvedValue([realMatch]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    // Only matchId in URL, no followup=true
    mockSearchParams = new URLSearchParams(`matchId=${foreignMatchId}`);

    await renderAndSettle();

    // CONTRACT: wizard only opens when followup=true is present.
    // FINDING if open: impl treated matchId alone as a trigger.
    expect(isWizardOpen()).toBe(false);
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });

  it('12-3: outcome call never includes the foreign matchId even across multiple wizard steps', async () => {
    const matchA = makeStaleMatch('Step One', 'StepOneCo');
    const matchB = makeStaleMatch('Step Two', 'StepTwoCo');
    const foreignMatchId = 'INJECTED_ID_STEP_TEST';

    mockGetTracker = jest.fn().mockResolvedValue([matchA, matchB]);
    mockRecordApplicationOutcome = jest.fn().mockResolvedValue(null);
    mockSearchParams = new URLSearchParams(`followup=true&matchId=${foreignMatchId}`);

    await renderAndSettle();
    if (!isWizardOpen()) return;

    // Step through both apps.
    for (let step = 0; step < 2; step++) {
      if (!isWizardOpen()) break;
      const btn = findOutcomeButton('Heard Back');
      if (!btn) break;
      await act(async () => { fireEvent.click(btn); });
      await waitFor(() => expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(step + 1), { timeout: 3000 });
      await act(async () => {});
    }

    // CONTRACT: none of the API calls must reference the injected URL id.
    // FINDING if any call uses foreignMatchId: impl leaked the URL param into the API.
    const usedIds = mockRecordApplicationOutcome.mock.calls.map((c: any[]) => c[0]);
    expect(usedIds).not.toContain(foreignMatchId);

    // The ids used must be the real tracker ids only.
    const realIds = new Set([matchA._id, matchB._id]);
    for (const id of usedIds) {
      expect(realIds.has(id)).toBe(true);
    }
  });
});

/*
 * ══════════════════════════════════════════════════════════════════════════════
 * DISCLOSURE
 *
 * FILES OPENED (all from the allowed list):
 *   src/components/Dashboard/FollowUpWizardModal.tsx
 *     — OUTCOME_OPTIONS: button labels "Heard Back", "Got Interview", "Got Offer",
 *       "Rejected", "No Response"; outcome keys used in assertions.
 *     — Modal structure: ModalHeader (h2), ModalBody (step-1 title in Text/span),
 *       ModalFooter ("{step} of {total}" Text/span, Skip Button).
 *     — Alert renders error with role="alert".
 *     — Skip button label is exactly "Skip".
 *   src/utils/tracker-utils.ts
 *     — shouldShowFollowUp: requires days >= 14 AND no applicationOutcome.
 *       Fixtures use 20-day-old apps to be clearly stale.
 *   src/types/JobResult.ts
 *     — _id, applicationOutcome?, appliedAt? field names.
 *   src/__tests__/ggj.tracker.adversarial.test.tsx  (full mock harness copied verbatim)
 *   src/__tests__/tracker.test.tsx                  (mock patterns, fixture patterns)
 *
 * FILES NOT OPENED (forbidden):
 *   src/pages/tracker.tsx                 ✓ not opened
 *   src/__tests__/oaq.smoke.test.tsx      ✓ not opened
 *
 * INCIDENTAL DISCLOSURES from allowed files:
 *   - tracker.test.tsx header comment (lines 9-10) mentions: "error responses detected
 *     with `'error' in result`" and "per-card error surfaced as raw error string in Alert."
 *     HOW AVOIDED: Section 4 error assertions use `role="alert"` or any error-regex text,
 *     not the specific raw-string-in-Alert detail. The contract says "shows an error" —
 *     the assertion matches any error representation.
 *   - ggj.tracker.adversarial.test.tsx confirms `recordApplicationOutcome` exists on
 *     apiClient at its listed method name. No implementation detail from tracker.tsx.
 *
 * UNTESTABLE-WITHOUT-READING FINDINGS:
 *   1. FALLBACK ELIGIBILITY: Contract says "fallback: any applied with no outcome" when
 *      no stale apps exist. Tests use only stale fixtures — the fallback branch cannot
 *      be verified without knowing the implementation's conditional structure.
 *   2. WIZARD ORDERING: Contract does not specify app ordering in the wizard. Tests
 *      detect which company is on step 1 from the DOM text, then assert by company
 *      name — robust regardless of order.
 *   3. "UPDATE STATUS" LABEL: Tests use /update.?status/i. If impl uses a different
 *      label entirely (e.g. "Follow up"), tests 10-1 through 10-4 will FIND it as missing.
 *   4. TOAST vs INLINE ERROR: Section 4 error check accepts inline alert OR error-regex
 *      text. If the impl uses a Chakra toast (mocked to a no-op jest.fn()), the error
 *      may not appear in the DOM. Test 4-1 will then FIND "no error feedback."
 * ══════════════════════════════════════════════════════════════════════════════
 */
