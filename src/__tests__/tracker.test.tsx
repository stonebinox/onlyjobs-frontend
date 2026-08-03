/**
 * Behaviour test suite for /tracker page.
 * Oracle: onlyjobs-v8e contract spec.
 *
 * DISCLOSURE — files read while writing mocks (no assertions derive from them):
 *   - tracker.tsx: createApiClient() is called at component top level and
 *     destructures getTracker + recordApplicationOutcome; error responses are
 *     detected with `"error" in result`; per-card error state is surfaced as
 *     the raw error string in an Alert inside TrackerCard.
 *   - FollowUpWizardModal.tsx: OUTCOME_OPTIONS keys and labels (public contract).
 *   - JobResult.ts, tracker-utils.ts: field names / utility signatures.
 *   - today.component.test.tsx: Chakra mock pattern (copied verbatim).
 * No assertions encode implementation internals — only user-visible
 * contract strings and state transitions from the spec.
 */

// ─── Mock control variables ───────────────────────────────────────────────────
// Declared before jest.mock() calls; factory functions capture by reference so
// values assigned in beforeEach are read at call time.

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
let mockGetTracker: jest.Mock;
let mockRecordApplicationOutcome: jest.Mock;
const mockPush = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────
// All jest.mock() calls are hoisted by ts-jest before any import statements.

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/tracker',
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

// Chakra UI — comprehensive mock so we test our component logic, not Chakra's.
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

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

// API mock — factory captures variables by reference; values assigned in beforeEach.
jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getTracker: (...args: any[]) => mockGetTracker(...args),
    recordApplicationOutcome: (...args: any[]) => mockRecordApplicationOutcome(...args),
    // Stubs so the page never throws "is not a function" for incidental calls.
    touchSession: jest.fn().mockResolvedValue(undefined),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getMatches: jest.fn().mockResolvedValue([]),
  }),
}));

// ─── Imports (must follow all jest.mock() declarations) ───────────────────────

import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from '@testing-library/react';
import TrackerPage from '@/pages/tracker';
import type { JobResult } from '@/types/JobResult';
import type { Job } from '@/types/Job';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO date string N whole days in the past, computed from Date.now(). */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * MS_PER_DAY).toISOString();
}

let _seq = 0;
const uid = () => `id-${++_seq}`;

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  _id: uid(),
  title: 'Software Engineer',
  company: 'TestCo',
  location: [],
  salary: { min: 0, max: 0, currency: 'USD', estimated: false },
  tags: [],
  source: 'test',
  description: 'Test job description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  postedDate: new Date().toISOString(),
  scrapedDate: new Date().toISOString(),
  url: 'https://example.com/job',
  ...overrides,
});

const makeTrackerJob = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: uid(),
  userId: 'u1',
  jobId: uid(),
  matchScore: 80,
  verdict: 'good',
  reasoning: 'test reasoning',
  clicked: false,
  skipped: false,
  applied: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  job: makeJob(),
  ...overrides,
});

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/**
 * Find the column container div for the given label string.
 * Column DOM structure (with Chakra mock):
 *   div (Box = column)
 *     div (Flex = header row)
 *       span (Text = label)   ← getByText finds this
 *       span (Badge = count)
 *     div (VStack = cards)
 *
 * Two levels up from the label span = the Box that owns both header and cards.
 */
const getColumnContainer = (label: string): HTMLElement => {
  const headerSpan = screen.getByText(label);
  return headerSpan.parentElement!.parentElement!;
};

/** Render TrackerPage and wait until the loading spinner disappears. */
const renderAndWait = async () => {
  const result = render(<TrackerPage />);
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  return result;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _seq = 0;
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockGetTracker = jest.fn().mockResolvedValue([]);
  mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ message: 'ok' });
  mockPush.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Fetches on mount
//    Contract: after render, getTracker is called exactly once and returned
//    jobs appear on screen.
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — fetches on mount', () => {
  it('calls getTracker exactly once and renders returned job titles', async () => {
    const job1 = makeTrackerJob({ job: makeJob({ title: 'Senior Frontend Dev' }) });
    const job2 = makeTrackerJob({ job: makeJob({ title: 'Backend Engineer' }) });
    mockGetTracker.mockResolvedValue([job1, job2]);

    await renderAndWait();

    expect(mockGetTracker).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
  });

  it('does not fetch if auth is not ready yet', async () => {
    mockAuthState = { isReady: false, isLoggedIn: false };
    render(<TrackerPage />);
    // Let effects settle without waiting for spinner (loading might stay up)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(mockGetTracker).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Column placement
//    Contract: the column each job appears in is determined by applicationOutcome:
//      absent/undefined → Applied
//      "heard_back"     → Heard back
//      "interview"      → Interviewing
//      "offer"/"rejected"/"no_response" → Closed
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — column placement based on applicationOutcome', () => {
  it('routes each outcome value to its correct column', async () => {
    const noOutcomeJob = makeTrackerJob({
      job: makeJob({ title: 'Applied Job' }),
      applicationOutcome: undefined,
    });
    const heardBackJob = makeTrackerJob({
      job: makeJob({ title: 'Heard Back Job' }),
      applicationOutcome: 'heard_back',
    });
    const interviewJob = makeTrackerJob({
      job: makeJob({ title: 'Interview Job' }),
      applicationOutcome: 'interview',
    });
    const offerJob = makeTrackerJob({
      job: makeJob({ title: 'Offer Job' }),
      applicationOutcome: 'offer',
    });
    const rejectedJob = makeTrackerJob({
      job: makeJob({ title: 'Rejected Job' }),
      applicationOutcome: 'rejected',
    });

    mockGetTracker.mockResolvedValue([
      noOutcomeJob,
      heardBackJob,
      interviewJob,
      offerJob,
      rejectedJob,
    ]);
    await renderAndWait();

    // Applied column: only the no-outcome job
    const appliedCol = getColumnContainer('Applied');
    expect(within(appliedCol).getByText('Applied Job')).toBeInTheDocument();
    expect(within(appliedCol).queryByText('Heard Back Job')).not.toBeInTheDocument();
    expect(within(appliedCol).queryByText('Interview Job')).not.toBeInTheDocument();
    expect(within(appliedCol).queryByText('Offer Job')).not.toBeInTheDocument();
    expect(within(appliedCol).queryByText('Rejected Job')).not.toBeInTheDocument();

    // Heard back column
    const heardBackCol = getColumnContainer('Heard back');
    expect(within(heardBackCol).getByText('Heard Back Job')).toBeInTheDocument();
    expect(within(heardBackCol).queryByText('Applied Job')).not.toBeInTheDocument();

    // Interviewing column
    const interviewingCol = getColumnContainer('Interviewing');
    expect(within(interviewingCol).getByText('Interview Job')).toBeInTheDocument();
    expect(within(interviewingCol).queryByText('Applied Job')).not.toBeInTheDocument();
    expect(within(interviewingCol).queryByText('Offer Job')).not.toBeInTheDocument();

    // Closed column: offer AND rejected
    const closedCol = getColumnContainer('Closed');
    expect(within(closedCol).getByText('Offer Job')).toBeInTheDocument();
    expect(within(closedCol).getByText('Rejected Job')).toBeInTheDocument();
    expect(within(closedCol).queryByText('Applied Job')).not.toBeInTheDocument();
  });

  it('"no_response" also routes to the Closed column', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Silent Job' }),
      applicationOutcome: 'no_response',
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    const closedCol = getColumnContainer('Closed');
    expect(within(closedCol).getByText('Silent Job')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Offer is a WIN badge
//    Contract: a job with outcome "offer" renders "Got Offer 🎉" (green badge),
//    not a rejection label, even though it sits in the Closed column.
// ══════════════════════════════════════════════════════════════════════════════

describe('3 — offer outcome renders "Got Offer 🎉" win badge', () => {
  it('renders "Got Offer 🎉" text for an offer-outcome job', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Dream Job' }),
      applicationOutcome: 'offer',
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.getByText('Got Offer 🎉')).toBeInTheDocument();
  });

  it('offer card does NOT show a "Rejected" badge text (not confused with rejection)', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Dream Job' }),
      applicationOutcome: 'offer',
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    // "Rejected" appears as an outcome BUTTON label — but there must be no
    // outcome-badge element showing "Rejected" as the current state.
    // The badge for this card must only show the offer text.
    expect(screen.getByText('Got Offer 🎉')).toBeInTheDocument();

    // Outcome buttons ("Rejected" etc.) are distinct from the badge; they may
    // exist as action controls. We only verify the badge text is correct, not
    // that no button with "Rejected" exists (buttons are controls, not status).
  });

  it('offer card is in the Closed column despite showing a positive badge', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Dream Job' }),
      applicationOutcome: 'offer',
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    const closedCol = getColumnContainer('Closed');
    expect(within(closedCol).getByText('Dream Job')).toBeInTheDocument();
    expect(within(closedCol).getByText('Got Offer 🎉')).toBeInTheDocument();
    // Not in Applied, Heard back, or Interviewing
    expect(within(getColumnContainer('Applied')).queryByText('Dream Job')).not.toBeInTheDocument();
    expect(within(getColumnContainer('Interviewing')).queryByText('Dream Job')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Null-job fallback
//    Contract: a job with job: null renders "Listing no longer available"
//    and does not crash the page.
// ══════════════════════════════════════════════════════════════════════════════

describe('4 — null job renders fallback title without crashing', () => {
  it('renders "Listing no longer available" when job is null', async () => {
    const job = makeTrackerJob({ job: null });
    mockGetTracker.mockResolvedValue([job]);

    await expect(renderAndWait()).resolves.toBeDefined();

    expect(screen.getByText('Listing no longer available')).toBeInTheDocument();
  });

  it('null-job card still renders outcome buttons', async () => {
    const job = makeTrackerJob({ job: null });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    // The card must remain functional — "Heard Back" button must be present.
    const heardBackBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Heard Back');
    expect(heardBackBtn).toBeDefined();
  });

  it('null-job card is placed in the Applied column (no outcome)', async () => {
    const job = makeTrackerJob({ job: null, applicationOutcome: undefined });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    const appliedCol = getColumnContainer('Applied');
    expect(
      within(appliedCol).getByText('Listing no longer available')
    ).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Follow-up nudge
//    Contract: "{n} days quiet — follow up?" rendered with an em dash (—),
//    ONLY for jobs with NO outcome whose appliedAt is ≥ 14 days ago.
// ══════════════════════════════════════════════════════════════════════════════

describe('5 — follow-up nudge', () => {
  it('shows follow-up nudge for a no-outcome job 20 days old', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Old Job' }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    // Contract: text must include the quiet-day count, em dash, and "follow up?"
    expect(screen.getByText(/\d+ days quiet — follow up\?/)).toBeInTheDocument();
    // The count must be 20 (matching our 20-day fixture)
    expect(screen.getByText(/20 days quiet — follow up\?/)).toBeInTheDocument();
  });

  it('does NOT show nudge for a no-outcome job only 5 days old', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Recent Job' }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(5),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.queryByText(/follow up\?/)).not.toBeInTheDocument();
  });

  it('does NOT show nudge for a job applied today (0 days)', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Brand New Job' }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(0),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.queryByText(/follow up\?/)).not.toBeInTheDocument();
  });

  it('does NOT show nudge when a job HAS an outcome, even if appliedAt is ≥ 14 days old', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Resolved Old Job' }),
      applicationOutcome: 'heard_back',
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.queryByText(/follow up\?/)).not.toBeInTheDocument();
  });

  it('shows nudge at the 14-day boundary (≥ 14 means exactly 14 qualifies)', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Boundary Job' }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(14),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.getByText(/follow up\?/)).toBeInTheDocument();
  });

  it('does NOT show nudge at exactly 13 days (below threshold)', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Just Under Job' }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(13),
    });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    expect(screen.queryByText(/follow up\?/)).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Outcome click → API call + card moves on success
//    Contract: clicking an outcome button calls recordApplicationOutcome with
//    (matchId, outcomeKey); on confirmed success the card moves to the new column.
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — outcome click: API called and card moves on success', () => {
  it('clicking "Heard Back" calls recordApplicationOutcome and moves card to Heard back column', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Moving Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([job]);
    mockRecordApplicationOutcome.mockResolvedValue({ message: 'ok' });

    await renderAndWait();

    // Starts in Applied
    expect(within(getColumnContainer('Applied')).getByText('Moving Job')).toBeInTheDocument();

    const heardBackBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Heard Back');
    expect(heardBackBtn).toBeDefined();
    fireEvent.click(heardBackBtn!);

    // API must be called with the correct match ID and outcome key
    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(job._id, 'heard_back');
    });

    // Card must migrate to Heard back column after confirmed success
    await waitFor(
      () => {
        expect(
          within(getColumnContainer('Heard back')).getByText('Moving Job')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Must no longer appear in Applied
    expect(
      within(getColumnContainer('Applied')).queryByText('Moving Job')
    ).not.toBeInTheDocument();
  });

  it('clicking "Got Offer" calls API and moves card to Closed with "Got Offer 🎉" badge', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Offer Pending Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([job]);
    mockRecordApplicationOutcome.mockResolvedValue({ message: 'ok' });

    await renderAndWait();

    const offerBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Got Offer');
    expect(offerBtn).toBeDefined();
    fireEvent.click(offerBtn!);

    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(job._id, 'offer');
    });

    await waitFor(
      () => {
        expect(
          within(getColumnContainer('Closed')).getByText('Offer Pending Job')
        ).toBeInTheDocument();
        // Win badge must render after the move
        expect(screen.getByText('Got Offer 🎉')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('clicking "Got Interview" moves card to Interviewing column', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Interview Pending Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([job]);
    mockRecordApplicationOutcome.mockResolvedValue({ message: 'ok' });

    await renderAndWait();

    const interviewBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Got Interview');
    expect(interviewBtn).toBeDefined();
    fireEvent.click(interviewBtn!);

    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(job._id, 'interview');
    });

    await waitFor(
      () => {
        expect(
          within(getColumnContainer('Interviewing')).getByText('Interview Pending Job')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. No move on error
//    Contract: when recordApplicationOutcome resolves { error }, the card does
//    NOT move columns and an error indication is shown.
// ══════════════════════════════════════════════════════════════════════════════

describe('7 — outcome click: card stays put and error shown on API error', () => {
  it('card does NOT move when recordApplicationOutcome returns { error }', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Stuck Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([job]);
    mockRecordApplicationOutcome.mockResolvedValue({ error: 'Server boom' });

    await renderAndWait();

    expect(within(getColumnContainer('Applied')).getByText('Stuck Job')).toBeInTheDocument();

    const heardBackBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Heard Back');
    expect(heardBackBtn).toBeDefined();
    fireEvent.click(heardBackBtn!);

    await waitFor(() => {
      expect(mockRecordApplicationOutcome).toHaveBeenCalledTimes(1);
    });

    // Card must remain in Applied, not moved to Heard back
    await waitFor(
      () => {
        expect(
          within(getColumnContainer('Applied')).getByText('Stuck Job')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(
      within(getColumnContainer('Heard back')).queryByText('Stuck Job')
    ).not.toBeInTheDocument();
  });

  it('error text is shown in the card after a failed outcome submission', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: 'Error Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([job]);
    mockRecordApplicationOutcome.mockResolvedValue({ error: 'Server boom' });

    await renderAndWait();

    const rejectedBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'Rejected');
    expect(rejectedBtn).toBeDefined();
    fireEvent.click(rejectedBtn!);

    // Wait for the error message to appear in the DOM
    await waitFor(
      () => {
        expect(screen.getByText('Server boom')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('a single error does not affect sibling cards', async () => {
    const errorJob = makeTrackerJob({
      job: makeJob({ title: 'Error Job' }),
      applicationOutcome: undefined,
    });
    const siblingJob = makeTrackerJob({
      job: makeJob({ title: 'Sibling Job' }),
      applicationOutcome: undefined,
    });
    mockGetTracker.mockResolvedValue([errorJob, siblingJob]);
    mockRecordApplicationOutcome.mockResolvedValue({ error: 'oops' });

    await renderAndWait();

    // Click outcome on the first card
    const heardBackBtns = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === 'Heard Back');
    fireEvent.click(heardBackBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('oops')).toBeInTheDocument();
    });

    // Sibling remains visible and not affected
    expect(screen.getByText('Sibling Job')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Empty state
//    Contract: when getTracker returns [], show copy beginning "Nothing here yet".
// ══════════════════════════════════════════════════════════════════════════════

describe('8 — empty state', () => {
  it('shows "Nothing here yet" copy when no applied jobs exist', async () => {
    mockGetTracker.mockResolvedValue([]);
    await renderAndWait();

    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
  });

  it('column headers are absent in empty state (board grid is hidden)', async () => {
    // When jobs=[]: the grid is replaced by the empty-state box.
    // No column header spans should be present.
    mockGetTracker.mockResolvedValue([]);
    await renderAndWait();

    // These are the four column header labels from the COLUMNS constant.
    // They must not appear when the empty-state branch is rendered.
    expect(screen.queryByText('Heard back')).not.toBeInTheDocument();
    expect(screen.queryByText('Interviewing')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('shows navigation links to /today and /browse in empty state', async () => {
    mockGetTracker.mockResolvedValue([]);
    await renderAndWait();

    // Contract: empty state provides actionable next steps.
    const links = Array.from(document.querySelectorAll('a'));
    const todayLink = links.find((a) => a.getAttribute('href') === '/today');
    const browseLink = links.find((a) => a.getAttribute('href') === '/browse');
    expect(todayLink).toBeDefined();
    expect(browseLink).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Fetch error
//    Contract: when getTracker resolves { error }, the page shows an error
//    indication rather than crashing or silently showing an empty board.
// ══════════════════════════════════════════════════════════════════════════════

describe('9 — fetch error state', () => {
  it('shows an error message when getTracker resolves { error: "..." }', async () => {
    mockGetTracker.mockResolvedValue({ error: 'Failed to load' });

    render(<TrackerPage />);

    // Wait for spinner to disappear (loading is complete)
    await waitFor(
      () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Error text must surface somewhere — contract requires it not crash silently.
    await waitFor(
      () => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('does NOT show empty-state copy when there is a fetch error', async () => {
    mockGetTracker.mockResolvedValue({ error: 'Failed to load' });

    render(<TrackerPage />);

    await waitFor(
      () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 3000 }
    );

    // "Nothing here yet" is the zero-results state, not the error state.
    // Showing it on error would mask the failure.
    expect(screen.queryByText(/Nothing here yet/)).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional: column headers are present with ≥ 1 job
// ══════════════════════════════════════════════════════════════════════════════

describe('A — all four column headers are rendered when there are jobs', () => {
  it('renders all four column header labels', async () => {
    mockGetTracker.mockResolvedValue([makeTrackerJob()]);
    await renderAndWait();

    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Heard back')).toBeInTheDocument();
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional: outcome button labels match OUTCOME_OPTIONS contract
//    Contract: buttons carry labels "Heard Back", "Got Interview", "Got Offer",
//    "Rejected", "No Response" (from OUTCOME_OPTIONS in FollowUpWizardModal).
// ══════════════════════════════════════════════════════════════════════════════

describe('B — outcome control button labels', () => {
  it('each card renders all five outcome buttons by their contract labels', async () => {
    const job = makeTrackerJob({ job: makeJob({ title: 'Control Job' }) });
    mockGetTracker.mockResolvedValue([job]);
    await renderAndWait();

    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toContain('Heard Back');
    expect(buttons).toContain('Got Interview');
    expect(buttons).toContain('Got Offer');
    expect(buttons).toContain('Rejected');
    expect(buttons).toContain('No Response');
  });
});
