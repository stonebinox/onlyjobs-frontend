/**
 * Smoke test — AllJobsTab safe-URL guard (Phase 2a).
 * Oracle: onlyjobs-q3y spec (kda-A).
 *
 * Contract: the external "View" link in AllJobsTab must not be an active,
 * navigable link when job.url contains an unsafe scheme (javascript:, data:).
 * It must be an active link for normal https:// URLs.
 *
 * Files read (allowed):
 *   src/components/AllJobsTab.tsx — to understand RawJob shape and getAllJobs
 *     response contract (NOT for assertion values — oracle is the spec).
 *   src/utils/brief-utils.ts — isSafeUrl signature (public utility, not impl).
 *   src/__tests__/tracker.test.tsx — Chakra mock pattern (copied verbatim).
 */

// ─── Mock control variables ────────────────────────────────────────────────────

let mockGetAllJobs: jest.Mock;

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/browse',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    // isDisabled mirrors Chakra's real behavior: maps to HTML disabled attribute.
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, isDisabled, 'aria-label': al, href, role, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled: disabled || isDisabled || undefined, 'aria-label': al, href, role }, children)
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
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: makeEl('button'),
    Badge: makeEl('span'),
    Skeleton: () => React.createElement('div', { 'aria-hidden': true }),
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    Tooltip: ({ children }: any) => children,
    useColorModeValue: (light: any) => light,
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') {
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      }
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

// Sub-components used when match !== null — not rendered in these tests (match: null).
jest.mock('@/components/Dashboard/MatchScoreRing', () => ({
  MatchScoreRing: () => null,
}));
jest.mock('@/components/Dashboard/JobListing', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getAllJobs: (...args: any[]) => mockGetAllJobs(...args),
    matchJobOnDemand: jest.fn().mockResolvedValue({ match: null }),
  }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AllJobsTab } from '@/components/AllJobsTab';
import type { User } from '@/types/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  currentLocation: null,
  createdAt: new Date('2024-01-01'),
  resume: null,
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
};

/** Build a RawJob with no match (triggers JobCard, not JobListing). */
const makeRawJob = (url: string) => ({
  _id: 'j1',
  title: 'Engineer',
  company: 'TestCo',
  location: [],
  source: 'test',
  description: 'description',
  url,
  postedDate: new Date().toISOString(),
  match: null,
});

const makeApiResponse = (url: string) => ({
  jobs: [makeRawJob(url)],
  total: 1,
  pages: 1,
  sources: ['test'],
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetAllJobs = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderTab = () =>
  render(
    <AllJobsTab
      user={mockUser}
      walletBalance={5}
      openJobQuestionsDrawer={jest.fn()}
      onApplyClick={jest.fn()}
      onBalanceChange={jest.fn()}
    />
  );

const waitForLoaded = () =>
  waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 3000 }
  );

// ══════════════════════════════════════════════════════════════════════════════
// 1. Unsafe URL — the View link must not be navigable
//    Contract: a javascript: URL in job.url must NOT produce an element
//    with a javascript: href in the DOM (XSS vector).
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — unsafe URL does not produce a navigable link', () => {
  const UNSAFE_URL = "javascript:alert(1)";

  beforeEach(() => {
    mockGetAllJobs.mockResolvedValue(makeApiResponse(UNSAFE_URL));
  });

  it('no element in the DOM has a javascript: href', async () => {
    renderTab();
    await waitForLoaded();

    // Contract: no href containing the unsafe scheme must reach the DOM.
    const elements = Array.from(
      document.querySelectorAll('[href]')
    ) as HTMLElement[];
    const unsafe = elements.filter((el) => {
      const href = el.getAttribute('href') ?? '';
      return href.toLowerCase().startsWith('javascript:');
    });
    expect(unsafe).toHaveLength(0);
  });

  it('the View button is disabled (not active) for an unsafe URL', async () => {
    renderTab();
    await waitForLoaded();

    // Contract: the View control must be disabled so it cannot be activated.
    const viewBtn = screen.queryAllByRole('button').find(
      (btn) => btn.textContent?.includes('View')
    );
    expect(viewBtn).toBeDefined();
    expect(viewBtn).toBeDisabled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Safe URL — the View link is active and carries the correct href
//    Contract: an https:// URL in job.url must produce an active link
//    with the exact URL as href.
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — safe URL produces an active navigable link', () => {
  const SAFE_URL = 'https://example.com/job-posting';

  beforeEach(() => {
    mockGetAllJobs.mockResolvedValue(makeApiResponse(SAFE_URL));
  });

  it('some element in the DOM carries the safe href', async () => {
    renderTab();
    await waitForLoaded();

    // Contract: the safe URL must be reachable in the DOM.
    const elements = Array.from(
      document.querySelectorAll('[href]')
    ) as HTMLElement[];
    const withSafeUrl = elements.filter(
      (el) => el.getAttribute('href') === SAFE_URL
    );
    expect(withSafeUrl.length).toBeGreaterThan(0);
  });

  it('the View button is not disabled for a safe URL', async () => {
    renderTab();
    await waitForLoaded();

    const viewBtn = screen.queryAllByRole('button').find(
      (btn) => btn.textContent?.includes('View')
    );
    expect(viewBtn).toBeDefined();
    expect(viewBtn).not.toBeDisabled();
  });
});
